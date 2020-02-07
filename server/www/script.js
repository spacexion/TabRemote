/**
 * WebClient Loader
 *
 * - Start WebSocket connection with server
 * - Get userscript tabs list from server via WebSocket
 * - Load each tab module (load view, script, style)
 */

var Log = new XLog('e', "TabRemote", null, true, true, true, true);

// View items
var appServerStatus = null;
var appServerAuth = null;
var appServerAuthPassword = null;
var appServerAuthButton = null;
var viewLoaderHeader = null;
var viewLoader = null;

// Data cache
var cacheTabModules = {}; // { "my_awesome_module": "My awesome module", ... }
var cacheTabs = {}; // { tabId: { tabId: tabId, module: moduleName }, ... }

var loadedTabs = {}; // { tabId: { tabId: tabId, moduleName: moduleName, script: scriptInstance, viewNavItem:: elem{}, viewNavLink: elem{}, viewContainer: elem{} }, ... }
var loadedModules = {};  // { moduleName: {description: "My awesome module", html: "", script: function(), style: elem{}}, ... }

// Selected loaded tab
var selectedTab = null;

// ==== HELPERS ====

/**
 * Select and show a loaded tab instance
 *
 * @param tabId
 */
function selectTab(tabId) {
    Log.m("Selecting tab:", tabId);

    if(loadedTabs.hasOwnProperty(tabId)) {

        if(loadedTabs.hasOwnProperty(selectedTab)) {
            loadedTabs[selectedTab].viewNavLink.removeClass("active");
            loadedTabs[selectedTab].viewContainer.hide();
        }

        loadedTabs[tabId].viewNavLink.addClass("active");
        loadedTabs[tabId].viewContainer.show();

        selectedTab = tabId;
    } else {
        Log.e("Tab ["+tabId+"] is unknown!");
    }
}

/**
 * Refresh already loaded tabs (unload or load if updated)
 */
function refreshLoadedTabs() {
    // check if loaded tabs still exist in cacheTabs
    for(var i in Object.keys(loadedTabs)) {
        var loadedTabKey = Object.keys(loadedTabs)[i];
        if(!cacheTabs.hasOwnProperty(loadedTabKey)) {
            // unload tab
            unloadTab(loadedTabKey);
        }
    }

    // check if cacheTabs tabs are loaded
    for(var j in Object.keys(cacheTabs)) {
        var cacheTabKey = Object.keys(cacheTabs)[j];
        if(!loadedTabs.hasOwnProperty(cacheTabKey)) {
            // load tab
           loadTab(cacheTabKey);
        }
    }
}

/**
 * Load tab instance from module files
 *
 * @param cacheTabKey
 */
function loadTab(cacheTabKey) {
    var tab = cacheTabs[cacheTabKey];
    if(tab.hasOwnProperty("tabId") && tab.hasOwnProperty("module")) {
        if(!loadedTabs.hasOwnProperty(tab.tabId)) {

            // Add nav item to tabHeader
            var li = $("<li />", {"data-tabid":tab.tabId, "class":"nav-item"});
            var a = $("<a />", {"data-tabid":tab.tabId, "class":"nav-link", "href":"#", text:(tab.module), title: tab.tabId});
            a.on("click", function(event) {
                Log.d("Clicked ["+$(event.target).text()+"]["+$(event.target).data("tabid")+"]!");
                selectTab($(event.target).data("tabid"));
            });
            viewLoaderHeader.append(li.append(a));

            // Add view to loader
            var viewContainer = $("<div/>", {
                "class": "tabViewContainer",
                "data-tabid": tab.tabId
            });
            viewContainer.html(loadedModules[tab.module].html);
            viewContainer.hide();
            viewLoader.append(viewContainer);

            // Start script for this view
            Log.d("Executing ["+tab.module+"] script...");
            //Log.d(loadedModules[tab.module]["script"]);
            var instance = new loadedModules[tab.module]["script"](function(sel) { return $(sel, viewContainer); }, tab.tabId, viewContainer, appServerAuthPassword.val());
            var img = $("<img />", {"class": "tabIcon tabIcon-"+tab.module});
            a.prepend(img);

            // save loaded tab
            loadedTabs[tab.tabId] = {
                "tabId": tab.tabId,
                "moduleName": tab.module,
                "script": instance,
                "viewNavItem": li,
                "viewNavLink": a,
                "viewContainer": viewContainer };

            // if first tab select it
            if (selectedTab === null) {
                selectTab(Object.keys(loadedTabs)[0]);
            }
        } else {
            Log.e("Tab ["+tab.tabId+"] already loaded!");
        }
    } else {
        Log.e("No tab to load!");
    }
}

/**
 * Unload a tab instance
 * @param tabId
 */
function unloadTab(tabId) {
    if(loadedTabs.hasOwnProperty(tabId)) {
        var moduleName = loadedTabs[tabId].moduleName;

        if(loadedTabs[tabId].script.hasOwnProperty("exitView")) {
            Log.d("Exiting tab ["+moduleName+"]["+tabId+"]...");
            loadedTabs[tabId].script.exitView();
        } else {
            Log.e("Can't exit tab ["+moduleName+"]["+tabId+"] !");
        }

        loadedTabs[tabId].viewNavItem.remove();
        loadedTabs[tabId].viewContainer.remove();

        delete loadedTabs[tabId];

        if (selectedTab === tabId) {
            if (Object.keys(loadedTabs).length) {
                selectTab(Object.keys(loadedTabs)[0]);
            }
        }

    } else {
        Log.e("No loaded tab ["+tabId+"] to unload!");
    }
}

/**
 * Load module files
 */
function loadModuleFiles(moduleName, callback) {
    if(cacheTabModules.hasOwnProperty(moduleName)) {
        if(!loadedModules.hasOwnProperty(moduleName)) {
            loadedModules[moduleName] = {
                description: cacheTabModules[moduleName],
                loaded: false,
                html: null,
                style: null,
                script: null
            };
        }
        if(!loadedModules[moduleName].loaded) {

            // get view file
            $.ajax({ type: "GET",
                url: "tabmodules/"+moduleName+"/view.html",
                success : function(text) {
                    Log.d("getTabModule", "Success retrieving ["+moduleName+"] html file !");

                    // save html file text
                    loadedModules[moduleName].html = text;

                    // get style file and save element
                    loadedModules[moduleName].style = $("<link>")
                        .appendTo("head")
                        .attr({
                            type: "text/css",
                            rel: "stylesheet",
                            href: ("tabmodules/"+moduleName+"/view.css")
                        });

                    // get script file
                    $.ajax({
                        url: "tabmodules/" + moduleName + "/view.js",
                        dataType: "script",
                        success: function (text) {
                            if(window.hasOwnProperty(moduleName) && typeof window[moduleName] === "function") {
                                Log.d("getTabModule", "Success retrieving ["+moduleName+"] script file !");

                                // save script file function
                                loadedModules[moduleName].script = window[moduleName];
                                loadedModules[moduleName].loaded = true;

                                if(callback && typeof callback === "function") {
                                    callback(0);
                                }

                            } else {
                                Log.e("getTabModule", "Module ["+moduleName+"] script file is malformed!");
                            }
                        },
                        error: function (xhr, textStatus, error) {
                            Log.e("getTabModule", "Error retrieving ["+moduleName+"] script file !");
                            if(callback && typeof callback === "function") {
                                callback(1);
                            }
                        }
                    });
                },
                error: function(xhr, textStatus, error) {
                    Log.e("getTabModule", "Error retrieving ["+moduleName+"] html file !");
                    if(callback && typeof callback === "function") {
                        callback(1);
                    }
                }
            });
        } else {
            Log.w("Tab module ["+moduleName+"] already loaded !");
        }
    } else {
        Log.w("Tab module ["+moduleName+"] is unknown !");
    }
}

/**
 * Load modules files
 */
function loadModulesFiles(callback) {
    var cbNumber = 0;
    function cb() {
        cbNumber--;
        if(cbNumber <= 0) {
            if(callback && typeof callback === "function") {
                callback();
            }
        }
    }
    for(var i in Object.keys(cacheTabModules)) {
        var key = Object.keys(cacheTabModules)[i];

        loadModuleFiles(key, cb);
        cbNumber++;
    }
}

/**
 * Connect to the WebSocket Server
 */
function connectToWebSocketServer() {

    var url = window.location.protocol+"//"+window.location.host;
    socket = window.io(url);

    socket.on("connect", function () {
        Log.m("WS", "Connected to Server ["+url+"]!");
        appServerStatus.html("Connected to Server [<b>"+url+"</b>]");

        socket.emit("identify", {type: "WebClientLoader"});
    });
    socket.on("disconnect", function () {
        Log.m("WS", "Disconnected from Server!");
        appServerAuth.show();
        appServerStatus.text("Not connected to TabRemote Server yet.");
    });

    socket.on("identified", function (data) {
        appServerAuth.hide();
        Log.d("WS", "identified", data);
        socket.emit("getTabModules");
    });

    socket.on("message", function (data) {
        Log.d("WS", "message", data);
    });

    socket.on("tabModules", function (data) {
        if(data && data.hasOwnProperty("tabModules")) {
            Log.d("WS", "tabModules", data);
            cacheTabModules = data.tabModules;
            loadModulesFiles(function(){
                socket.emit("getTabs");
            });

        }
    });

    socket.on("tabs", function (data) {
        if(data && data.hasOwnProperty("tabs")) {
            Log.d("WS", "tabs", data);
            cacheTabs = data.tabs;
            refreshLoadedTabs();
        }
    });
}


 // script init
$(window).on("load",function() {
    Log.m("TabRemote WebClientLoader is loading...");

    $.ajaxSetup({
        cache: true
    });

    // select view items
    appServerStatus = $("#appServerStatus");
    viewLoaderHeader = $("#viewLoaderHeaderContent");
    viewLoader = $("#viewLoader");

    appServerAuth = $("#appServerAuth");
    appServerAuthPassword = $("#appServerAuthPassword");
    appServerAuthButton = $("#appServerAuthButton");
    appServerAuthButton.on("click", function() {
        socket.emit("identify", {type: "WebClientLoader", password: appServerAuthPassword.val()});
    });

    connectToWebSocketServer();
});