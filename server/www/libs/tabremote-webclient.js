/**
 * TabRemote WebClient Helper
 *
 * version: 0.3
 * author: Spacexion
 *
 * @param {function} $ - JQuery instance
 * @param {string} moduleName - The unique TabRemote userScript module name shared with web client module
 * @param {string} tabId - The tab id to connect to
 * @param {object} view - The associated view
 * @param {string} serverPassword - The server password
 * @param {object} logger - An xlog-js instance
 * @constructor
 */
function TabRemoteWebClient($, moduleName, tabId, view, serverPassword, logger) {
    var self = this;

    // XLog instance
    var Log = logger;

    // WSS Socket
    var socket = null;

    // Wrapped DOM items
    // { itemName: {name: itemName, selector: "", element: null}, events: {eventName: eventCallback, ...} }, ...
    var ViewItems = {};

    // Cached data received from server
    // { entryName: entryValue, ... }
    var TabDataCache = {};

    // Callbacks for each entry in data cache
    // { entryName: callback, ... }
    var TabDataEntryCallbacks = {};

    this.init = function() {
        Log.d("["+moduleName+"]", "Initializing view ["+tabId+"]...");
        findViewItems();
        connectToWebSocketServer();
    };

    // ==== GETTERS / SETTERS ====

    /**
     * Add a view item to cache
     * @param {string} name - The name of the added item
     * @param {string} selector - The dom selector string
     * @param {object} events - Event callback pairs list
     */
    this.addViewItem = function(name, selector, events) {
        if(name && name!=="" && selector && selector!=="") {
            ViewItems[name] = {
                name: name,
                element: null,
                selector: selector,
                events: {}
            };
            if(events) {
                for(var i in Object.keys(events)) {
                    var key = Object.keys(events)[i];
                    var cb = events[key];
                    self.addViewItemEventCallback(name, key, cb);
                }
            }
        } else {
            Log.e("addViewItem Bad parameters!");
        }
    };
    /**
     * Get ViewItem entry
     * @param {string} name - The name of the item
     * @returns {object|null}
     */
    this.getViewItem = function(name) {
        return (ViewItems.hasOwnProperty(name) ? ViewItems[name] : null);
    };
    /**
     * Remove ViewItem entry
     * @param {string} name - The name of the item
     */
    this.removeViewItem = function(name) {
        if(ViewItems.hasOwnProperty(name)) {
            delete ViewItems[name];
        } else {
            Log.e("removeViewItem Unknown '"+name+"' viewItem !");
        }
    };
    /**
     * Add events callbacks to a ViewItem entry
     * @param {string} name - The name of the item
     * @param {object} events - Event callback pairs list
     */
    this.addViewItemEventsCallbacks = function(name, events) {
        if(name && name!=="" && events && events.length > 0) {
            if(ViewItems.hasOwnProperty(name)) {
                for(var i in Object.keys(events)) {
                    var key = Object.keys(events)[i];
                    var cb = events[key];
                    self.addViewItemEventCallback(name, key, cb);
                }
            } else {
                Log.e("addViewItemEventCallback Unknown '"+name+"' viewItem !");
            }
        } else {
            Log.e("addViewItemEventCallback Bad parameters!");
        }
    };
    /**
     * Add an event callback to a ViewItem entry
     * @param {string} name
     * @param {string} eventName
     * @param {function} eventCallback
     */
    this.addViewItemEventCallback = function(name, eventName, eventCallback) {
        if(name && name!=="" && eventName && eventName!=="" && eventCallback) {
            if(ViewItems.hasOwnProperty(name)) {
                if(typeof eventCallback === "function") {
                    ViewItems[name].events[eventName] = eventCallback;
                } else {
                    Log.e("addViewItemEventsCallbacks ["+name+"]["+eventName+"] Bad callback!");
                }
            } else {
                Log.e("addViewItemEventCallback Unknown '"+name+"' viewItem !");
            }
        } else {
            Log.e("addViewItemEventCallback Bad parameters!");
        }
    };
    /**
     * Remove an event callback to a ViewItem
     * @param {string} name
     * @param {string} eventName
     */
    this.removeViewItemEventCallback = function(name, eventName) {
        if(ViewItems.hasOwnProperty(name)) {
            if(ViewItems[name].events.hasOwnProperty(eventName)) {
                ViewItems[name].element.off(eventName, ViewItems[name].events[eventName]);
                delete ViewItems[name].events[eventName];
            } else {
                Log.e("removeViewItemEventCallback Unknown '"+eventName+"' viewItem callback !");
            }
        } else {
            Log.e("removeViewItemEventCallback Unknown '"+name+"' viewItem !");
        }
    };

    /**
     * Add a callback to a TabData entry
     * @param {string} entryName
     * @param {function} callback
     */
    this.addTabDataEntryCallback = function(entryName, callback) {
        if(entryName && callback && typeof callback === "function") {
            TabDataEntryCallbacks[entryName] = callback;
        } else {
            Log.e("["+moduleName+"]", "addTabDataEntryCb malformed!");
        }
    };
    /**
     * Remove a callback from TabData entry
     * @param {string} name
     */
    this.removeTabDataEntryCallback = function(name) {
        if(TabDataEntryCallbacks.hasOwnProperty(name)) {
            delete TabDataEntryCallbacks[name];
        } else {
            Log.e("removeTabDataEntryCb Unknown '"+name+"' entry !");
        }
    };

    /**
     * Called when a TabData event is received in web socket
     * @param {string} tabData
     */
    function onTabData(tabData) {
        for(var i in Object.keys(tabData)) {
            var key = Object.keys(tabData)[i];
            var value = tabData[key];

            var entry = {};
            entry[key] = value;
            onTabDataEntry(entry);
        }
    }

    /**
     * Called when a TabDataEntry is received in web socket
     * @param {string} tabDataEntry
     */
    function onTabDataEntry(tabDataEntry) {
        if(Object.keys(tabDataEntry).length>0) {
            var name = Object.keys(tabDataEntry)[0];
            var value = tabDataEntry[name];

            Log.d("["+moduleName+"]", name, value);

            if(name && value!==null && TabDataEntryCallbacks.hasOwnProperty(name)) {
                Log.v("["+moduleName+"]", "onTabDataEntry ["+name+"] callback()!");
                TabDataEntryCallbacks[name](name, value);
            }
        }
    }

    /**
     * Called once at init to search and select view items
     */
    function findViewItems() {
        for(var i in Object.keys(ViewItems)) {
            var key = Object.keys(ViewItems)[i];
            var item = ViewItems[key];
            item.element = $(item.selector);

            //call events callbacks
            if(item.events) {
                for(var j in Object.keys(item.events)) {
                    var name = Object.keys(item.events)[j];
                    var cb = item.events[name];
                    if(cb && typeof cb === "function") {
                        item.element.on(name, cb);
                    }
                }
            }
        }
    }

    /**
     * Web Socket emit helper
     * @param name
     * @param data
     */
    this.socketEmit = function(name, data) {
        if(name && data) {
            Log.d("["+moduleName+"]", "Socket emit ["+name+"]", data);
            socket.emit(name, data);
        } else {
            Log.e("["+moduleName+"]", "Socket emit event malformed!");
        }
    };

    /**
     * Called once in init to connect to the web socket server
     */
    function connectToWebSocketServer() {
        var url = window.location.protocol+"//"+window.location.host;
        socket = window.io(url);

        socket.on("connect", function () {
            Log.m("["+moduleName+"]", "Connected to Server ["+url+"] !");

            self.socketEmit("identify", {type: "WebClient", tabId: tabId, module: moduleName, password: serverPassword});
        });
        socket.on("disconnect", function () {
            Log.m("["+moduleName+"]", "Disconnected from Server!");
            self.exitView();
        });
        socket.on("connect_error", function () {
            Log.m("["+moduleName+"]", "Error connecting to Server!");
        });
        socket.on("connect_timeout", function () {
            Log.m("["+moduleName+"]", "Server Timeout!");
        });
        socket.on("error", function () {
            Log.m("["+moduleName+"]", "Server Error");
        });
        socket.on("identified", function (data) {
            if(data.hasOwnProperty("name")) {
                Log.m("["+moduleName+"]", "Identified as ["+data.name+"]!");
                self.socketEmit("tabCommand", {name: "getTabData"});
            }
        });
        socket.on("tabData", function (data) {
            if(data.hasOwnProperty("data")) {
                Log.v("["+moduleName+"]", "tabData", data);
                onTabData(data.data);
            } else {
                Log.e("["+moduleName+"]", "TabData malformed!");
            }
        });
        socket.on("tabDataEntry", function (data) {
            if(data.hasOwnProperty("data")) {
                Log.v("["+moduleName+"]["+tabId+"]", "tabDataEntry", data);
                onTabDataEntry(data.data);

            } else {
                Log.e("["+moduleName+"]", "TabDataEntry malformed!");
            }
        });
    }

    /**
     * Remove the view and children and close web socket
     */
    this.exitView = function() {
        Log.m("["+moduleName+"]", "Exiting ["+tabId+"] !");

        // remove socket
        if(socket) {
            socket.close();
        }

        // remove view children listeners
        view.children().off();

        // remove view
        view.remove();
    };
}