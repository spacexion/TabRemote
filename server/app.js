/**
 * TabRemote Node.js Server
 *
 * @author: Spacexion
 */

var crypto = require('crypto');
var fs = require('fs');

var pack = require("./package.json");
var XUtils = require("./www/libs/xutils.js");
var XLog = require("./www/libs/xlog.js");
var Log = new XLog('i', "App", null, true, true, true, true);

var config = require("./config.json");

// Greeting
Log.raw(" ***************************************");
Log.raw(" *                                     *");
Log.raw(" *      TabRemote Server v"+pack.version+"        *");
Log.raw(" *                                     *");
Log.raw(" ***************************************\n");

// ==== CHECKS ====

// Config Check
if(!XUtils.hasOwnNestedProperties(config, ["password", "passwordHash", "port", "showKeyData", "keystrokeListener", "keyBindings"])) {
    Log.e("Config malformed !");
    process.exit(1);
}

// Config password check
if(config.password !== "") {
    config.passwordHash = crypto.createHash('sha256').update(config.password).digest('hex');
    config.password = "";

    fs.writeFile("config.json", JSON.stringify(config, null, 4), function(err) {
        if(err) {
            Log.e("<Config> File save error !");
        }
        Log.m("<Config> New password hashed and saved!");
    });
}


// ==== SERVER ====

var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var readline = require("readline");

// Start the keystroke listener
var ioHook = null;
if(config["keystrokeListener"]) {
    ioHook = require("iohook");
}

// Web Server config
app.use("/", express.static(__dirname + "/www"));
app.get("/", function(req, res){
	res.sendFile(__dirname + "/www/index.html");
});

// Start WebServer
http.listen(config.port, function(){
	Log.m("HTTP Server listening at port", config.port);
});

// Web Socket config
io.on("connection", function (socket) {
    var address = socket.request.connection.remoteAddress;
    Log.i("<WS>", "Client Connection! '"+socket.id+"'", address);

    function getTabs() {
        var tabs = {};
        var room = io.sockets.adapter.rooms["UserScript"];
        if(room) {
            var tabSockets = room.sockets;
            for(var i in Object.keys(tabSockets)) {
                var id = Object.keys(tabSockets)[i];
                var tabModule = io.sockets.sockets[id].tabModule;

                tabs[id] = { tabId: id, module: tabModule };
            }
        } else {
            Log.d("<WS>", "No userscript yet !");
        }
        return tabs;
    }
	
	socket.on("disconnect", function(reason) {
        io.sockets.in("WebClientLoader").emit("tabs", {tabs: getTabs()});
		Log.i("<WS>", "Client '"+socket.id+"' Disconnected!", reason);
	});
	
	socket.on("message", function (data) {
		Log.i("<WS>", data);
	});

    socket.on("identify", function(data) {
        if(data && data.hasOwnProperty("type")) {
            socket.join(data.type);
            socket["authenticated"] = false;

            // type check
            if(data.type === "WebClientLoader" || data.type === "UserScript" || data.type === "WebClient") {
                // password check needed
                if(config.passwordHash !== "") {
                    if(data.hasOwnProperty("password")) {
                        var hash = crypto.createHash('sha256').update(data.password).digest('hex');
                        if(config.passwordHash === hash) {
                            socket["authenticated"] = true;
                        } else {
                            Log.i("<WS>", "Client '"+socket.id+"' not authenticated, password mismatch!");
                        }
                    } else {
                        Log.i("<WS>", "Client '"+socket.id+"' not authenticated, it needs a password!");
                    }
                // password check NOT needed
                } else {
                    socket["authenticated"] = true;
                }

                if(socket.authenticated) {
                    // If type is a WebClientLoader, identified
                    if(data.type === "WebClientLoader") {
                        socket.join(data.type);
                        socket["identified"] = true;
                        io.sockets.to(socket.id).emit("identified", {name: data.type});
                    } else {
                        // If type is a userscript or a webclient, check the module
                        if(data.hasOwnProperty("module")) {
                            if(config.tabModules.hasOwnProperty(data.module)) {
                                var name = data.type+"-"+data.module;
                                socket.join(data.module);
                                socket.join(name);

                                socket["tabModule"] = data.module;
                                socket["clientType"] = data.type;
                                socket["tabId"] = null;
                                socket["identified"] = true;

                                // Tell webclientloader a new userscript has connected
                                if(data.type === "UserScript") {
                                    socket["tabId"] = socket.id;
                                    io.sockets.to("WebClientLoader").emit("tabs", {tabs: getTabs()});

                                } else if(data.type === "WebClient") {
                                    // Join the webclient socket to a room named with given userscript tabId
                                    if(data.hasOwnProperty("tabId")) {
                                        socket["tabId"] = data.tabId;
                                        name = data.tabId+"-"+data.type+"-"+data.module;
                                        socket.join(name);
                                    }
                                }

                                io.sockets.to(socket.id).emit("identified", {name: name});
                                Log.i("<WS>", "Client '"+socket.id+"' identified as ["+name+"]");
                            } else {
                                Log.i("<WS>", "Client '"+socket.id+"' not identified, module ["+data.module+"] is unknown!");
                            }
                        } else {
                            Log.e("<WS>", "Client '"+socket.id+"' identify malformed !");
                        }
                    }
                }

            } else {
                Log.i("<WS>", "Client '"+socket.id+"' not identified, type ["+data.type+"] is unknown!");
            }
        } else {
            Log.e("<WS>", "Client '"+socket.id+"' identify malformed !");
        }
    });

    // web_client_loader->web_client_loader
    socket.on("getTabs", function () {
        if(socket["identified"]) {
            Log.d("<WS>", "getTabs");
            io.sockets.to(socket.id).emit("tabs", {tabs: getTabs()});
        } else {
            Log.w("getTabs Not identified yet!");
        }
    });

    // web_client_loader->web_client_loader
    socket.on("getTabModules", function () {
        if(socket["identified"]) {
            Log.d("<WS>", "getTabModules");
            io.sockets.to(socket.id).emit("tabModules", {tabModules: JSON.parse(JSON.stringify(config.tabModules))});
        } else {
            Log.w("getTabModules Not identified yet!");
        }
    });

    // web_client->user_script
    socket.on("tabCommand", function (data) {
        if(socket["identified"]) {
            if(data && data.hasOwnProperty("name")) {
                Log.d("<WS>", "tabCommand ["+data.name+"]["+socket.tabModule+"]["+socket.tabId+"]");
                io.sockets.to(socket.tabId).emit("tabCommand", data);
            } else {
                Log.e("<WS>", "tabCommand malformed !", data);
            }
        } else {
            Log.w("tabCommand Not identified yet!");
        }
    });

    // user_script->web_client
    socket.on("tabData", function (data) {
        if(socket["identified"]) {
            if(data && data.hasOwnProperty("data")) {
                Log.d("<WS>", "tabData ["+socket.tabModule+"]["+socket.tabId+"]");
                io.sockets.to(socket.tabId+"-WebClient-"+socket.tabModule).emit("tabData", data);
            } else {
                Log.e("<WS>", "tabData malformed !", data);
            }
        } else {
            Log.w("tabData Not identified yet!");
        }
    });

    // user_script->web_client
    socket.on("tabDataEntry", function (data) {
        if(socket["identified"]) {
            if(data && data.hasOwnProperty("data")) {
                Log.d("<WS>", "tabDataEntry>", socket.tabModule+": ("+Object.keys(data.data)[0]+"="+data.data[Object.keys(data.data)[0]]+")");
                io.sockets.to(socket.tabId+"-WebClient-"+socket.tabModule).emit("tabDataEntry", data);
            } else {
                Log.e("<WS>", "tabDataEntry malformed !", data);
            }
        } else {
            Log.w("tabDataEntry Not identified yet!");
        }
    });
});

// OS I/O binding
if(ioHook) {
    ioHook.on("keydown", function(event) {
        if(config.showKeyData) {
            Log.i("ioHook", event);
        }
        for(var moduleId in Object.keys(config.keyBindings)) {
            var moduleKey = Object.keys(config.keyBindings)[moduleId];
            for(var bindId in Object.keys(config.keyBindings[moduleKey])) {
                var bindKey = Object.keys(config.keyBindings[moduleKey])[bindId];

                var bind = config.keyBindings[moduleKey][bindKey];
                if(bind && bind.hasOwnProperty("code")
                    && bind.code === event.rawcode) {

                    if(!bind.hasOwnProperty("ctrl")) {
                        bind.ctrl = false;
                    }
                    if(!bind.hasOwnProperty("shift")) {
                        bind.shift = false;
                    }
                    if(!bind.hasOwnProperty("alt")) {
                        bind.alt = false;
                    }
                    if(!bind.hasOwnProperty("target")) {
                        bind.target = "first";
                    }
                    if(bind.ctrl === event.ctrlKey
                        && bind.shift === event.shiftKey
                        && bind.alt === event.altKey) {


                        var room = io.of('/').adapter.rooms["UserScript-"+moduleKey];
                        if(room) {
                            var clients = Object.keys(room.sockets);

                            if(bind.target === "first") {
                                io.sockets.to(clients[0]).emit("tabCommand", { name: bindKey });
                            } else if(bind.target === "last") {
                                io.sockets.to(clients[clients.length-1]).emit("tabCommand", { name: bindKey });
                            } else if(bind.target === "all") {
                                io.sockets.to("UserScript-"+moduleKey).emit("tabCommand", { name: bindKey });
                            }

                            Log.d("ioHook", bindKey+" ("+(bind.ctrl ? "Ctrl+" : "")+(bind.alt ? "Alt+" : "")+(bind.shift ? "Shift+" : "")+bind.code+")");
                        } else {
                            Log.e("ioHook", "No userscript yet!");
                        }
                    }
                }
            }
        }
    });
    ioHook.start();
}


// CLI
var cmd = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: ''
});
cmd.prompt();

cmd.on("line", function(line) {
	if(line === "exit") {
		cmd.close();
	}

	cmd.prompt();
}).on('close', function(){
	process.exit(0);
});

process.on("exit", function(code) {
	switch(code) {
		case 0:
			Log.i("App", "Closed");
			break;
		default:
			Log.e("App", "Closed with error!");
	}
});