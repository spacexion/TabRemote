/**
 * TabRemote UserScript Helper
 *
 * version: 0.3
 * author: Spacexion
 *
 * @param {function} $ - JQuery instance
 * @param {string} moduleName - The unique TabRemote userScript module name shared with web client module
 * @param {string} serverAddress - The server address
 * @param {number} serverPort - The server port
 * @param {string} serverPassword - The server password
 * @param {object} logger - An xlog-js instance
 * @constructor
 */
function TabRemoteUserScript($, moduleName, serverAddress, serverPort, serverPassword, logger) {
    var self = this;

    // XLog instance
    var Log = logger;

    // WSS Socket
    var socket = null;

    // The mutation observers
    var MutationObservers = {};

    // Wrapped DOM items
    // { #uniqueName: { name: #uniqueName, element: #JQueryDOMElement, selector: #selector, selectParent: boolean,
    //                  found: false, refreshInterval: interval, refreshTime: int, events: {}}, ...}
    var ViewItems = {};

    // Listeners for Commands from server
    // { #commandName: callback, ... }
    var TabCommands = {};

    // Data synchronized with server
    // { #dataEntryName: { name: #dataEntryName, value: null, updateCallback: #updateCallback, updateTime: int, updateInterval: interval}}
    var TabData = {};

    // Script init check boolean
    var initialized = false;

    this.init = function() {
        if(!initialized) {
            Log.m(" ---- TabRemote : "+moduleName+" UserScript extension initializing...");

            connectToWebSocketServer();
            self.findViewItems();
            self.execTabDataCallbacks();
            startViewItemRefreshIntervals();
            startTabDataUpdateIntervals();

            Log.m(" ---- TabRemote : "+moduleName+" UserScript extension initialized!");
        } else {
            Log.e(" ---- TabRemote : "+moduleName+" UserScript already initialized!");
        }
    };

    // ==== GETTERS / SETTERS ====

    /**
     * Add a ViewItem to cache (Wrapped element of interest in DOM)
     * @param {string} name - The name of the added item
     * @param {string} selector - The dom selector string
     * @param {boolean} [selectParent=false] - Toggle to true if you want to select the parent of result rather than result itself
     * @param {int} [refreshTime=-1] - Time between each select refresh in milliseconds. Let undefined or set to -1 to disable refresh.
     * @param {object} [events={}] - Event callback pairs list
     */
    this.addViewItem = function(name, selector, selectParent, refreshTime, events) {
        if(name && name!=="" && selector && selector!=="") {
            ViewItems[name] = {
                name: name,
                element: null,
                selector: selector,
                selectParent: (!!selectParent),
                found: false,
                refreshInterval: null,
                refreshTime: ((refreshTime && refreshTime>0) ? refreshTime : -1),
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
     * Get a ViewItem
     * @param name
     * @returns {null}
     */
    this.getViewItem = function(name) {
        return (ViewItems.hasOwnProperty(name) ? ViewItems[name] : null);
    };

    /**
     * Remove ViewItem from cache
     * @param name string
     */
    this.removeViewItem = function(name) {
        if(ViewItems.hasOwnProperty(name)) {
            if(ViewItems[name]["refreshInterval"]) {
                clearInterval(ViewItems[name]["refreshInterval"]);
            }
            delete ViewItems[name];
        } else {
            Log.e("removeViewItem Unknown '"+name+"' viewItem !");
        }
    };

    /**
     * Add events callbacks to a ViewItem entry
     * @param {string} name
     * @param {object} events
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
     * Add a TabCommand Listener to cache (socket.io request from server/webclient)
     * @param {string} name - The name of the command
     * @param {function} callback - The callback called when websocket receives a tabcommand
     */
    this.addTabCommandListener = function(name, callback) {
        if(name && name!=="" && callback && typeof callback === "function") {
            TabCommands[name] = callback;
        } else {
            Log.e("addTabCommandListener Bad parameters!");
        }
    };


    /**
     * Remove TabCommand Listener from cache
     * @param {string} name - The name of the tabCommand to remove
     */
    this.removeTabCommandListener = function(name) {
        if(TabCommands.hasOwnProperty(name)) {
            delete TabCommands[name];
        } else {
            Log.e("removeTabCommands Unknown '"+name+"' tabCommand !");
        }
    };

    /**
     * Add a TabData to cache (data entry sync with server when changed through setTabDataEntry)
     * @param {string} name - The entry name
     * @param {(number|string|boolean)} defaultValue - The default value
     * @param {number} [updateTime=-1] - The time between each update interval. Define to null or -1 to disable interval.
     * @param {function} [updateCallback] - The callback called when update is executed
     */
    this.addTabDataEntry = function(name, defaultValue, updateTime, updateCallback) {
        if(name && name!=="") {
            if(!TabData.hasOwnProperty(name)) {
                TabData[name] = {
                    name: name,
                    value: defaultValue,
                    updateTime: updateTime,
                    updateCallback: updateCallback,
                    updateInterval: null
                };
            } else {
                Log.e("addTabData Entry ["+name+"] already added!");
            }
        } else {
            Log.e("addTabData Bad parameters!");
        }
    };

    /**
     * Get a TabDataEntry
     * @param {string} name
     * @returns {null}
     */
    this.getTabDataEntry = function(name) {
        return (TabData.hasOwnProperty(name) ? TabData[name] : null);
    };

    /**
     * Remove TabDataEntry from cache
     * @param {string} name
     */
    this.removeTabDataEntry = function(name) {
        if(TabData.hasOwnProperty(name)) {
            if(TabData[name]["updateInterval"]) {
                clearInterval(TabData[name]["updateInterval"]);
            }
            delete TabData[name];
        } else {
            Log.e("removeTabDataEntry Unknown '"+name+"' tabDataEntry !");
        }
    };

    /**
     * Set TabDataEntry value and send to server if changed
     * @param {string} name
     * @param {string|number|boolean} value
     */
    this.setTabDataEntryValue = function(name, value) {
        if(TabData.hasOwnProperty(name)) {
            var oldValue = TabData[name].value;
            if(oldValue !== value) {
                Log.d("TabData entry ["+name+"] update ! (", oldValue, "->", value, ")!");
                TabData[name].value = value;

                // tell server value changed !
                if(socket && socket.connected) {
                    var response = {data: {}};
                    response.data[name] = value;
                    socket.emit("tabDataEntry", response);
                }
            }
        } else {
            Log.e("TabData entry name ["+name+"] is not found!");
        }
    };

    /**
     * Add a MutationObserver in cache
     * @param {string} name
     * @param {string} selector
     * @param {boolean} checkChildElements
     * @param {boolean} checkDescendants
     * @param {boolean} checkAttributes
     * @param {boolean} checkValue
     * @param {function} changedCallback
     */
    this.addMutationObserver = function(name, selector, checkChildElements, checkDescendants, checkAttributes, checkValue, changedCallback) {
        if(name && name.length && selector && selector.length) {
            if(!MutationObservers.hasOwnProperty(name)) {

                var jelement = $(selector);
                if(jelement && jelement.length>0) {
                    if(changedCallback && typeof changedCallback === "function") {

                        MutationObservers[name] = new MutationObserver(function(mutations) {
                            mutations.forEach(function(mutation) {
                                //Log.v(mutation);
                                changedCallback(mutation);

                                //const removedNodes = mutation.removedNodes;
                                //if (Array.from(removedNodes).includes(title[0])) {
                                //    console.log('title removed');
                                //}
                            });
                        });
                        MutationObservers[name].observe(jelement[0], {
                            childList: (!!checkChildElements),
                            subtree: (!!checkDescendants),
                            attributes: (!!checkAttributes),
                            characterData: (!!checkValue)
                        });
                    } else {
                        Log.e("addMutationObserver Bad callback !");
                    }
                } else {
                    Log.e("addMutationObserver Element selected by ["+selector+"] is not found !");
                }
            } else {
                Log.e("addMutationObserver Observer ["+name+"] already exists !");
            }
        } else {
            Log.e("addMutationObserver Bad Parameters");
        }
    };

    /**
     * Remove a MutationObserver from cache
     * @param {string} name
     */
    this.removeMutationObserver = function(name) {
        if(MutationObservers.hasOwnProperty(name)) {
            delete MutationObservers[name];
        } else {
            Log.e("removeMutationObserver Unknown '"+name+"' observer !");
        }
    };


    // ==== SCRIPT HELPERS ====

    /**
     * Find the view item using its defined selector
     * @param {string} name
     * @param callback
     */
    this.findViewItem = function(name, callback) {
        if(name) {
            var item = ViewItems[name];
            if(item) {
                var element = $(item.selector);
                if(element.length) {
                    if(item.selectParent) {
                        item.element = element.parent();
                    } else {
                        item.element = element;
                    }
                    item.found = true;

                    //call events callbacks
                    if(Object.keys(item.events).length) {
                        Log.v("Loading ViewItem Events for "+name+"...");
                        item.element.off();
                        for(var j in Object.keys(item.events)) {
                            var key = Object.keys(item.events)[j];
                            var cb = item.events[key];
                            if(cb && typeof cb === "function") {
                                Log.v("ViewItem Event ["+name+"]["+key+"] loaded!");
                                item.element.on(key, cb);
                            }
                        }
                    }

                    Log.v("Found ViewItem ["+name+"]["+item.selector+"]");
                    Log.v(item.element);
                } else {
                    item.element = null;
                    item.found = false;

                    Log.v("Can't find ViewItem ["+name+"]["+item.selector+"]");
                }
                if(callback && typeof callback === "function") {
                    callback(item);
                }
            } else {
                Log.v("ViewItem ["+name+"] is unknown !");
            }
        } else {
            Log.v("ViewItem Name is undefined!");
        }
    };
    /**
     * Find the view items using their defined selector
     * @param {string} [notName=null] - exception name
     */
    this.findViewItems = function(notName) {
        for(var i in Object.keys(ViewItems)) {
            var name = Object.keys(ViewItems)[i];
            if(!notName || (notName === name)) {
                self.findViewItem(name);
            }
        }
    };

    /**
     * Connect to the WebSocket Server
     */
    function connectToWebSocketServer() {
        if(socket===null || !socket.connected) {
            var serverUrl = "ws://"+serverAddress+":"+serverPort;
            socket = window.io(serverUrl);
            socket.on("connect", function () {
                Log.m("WS", "Connected to Server ["+serverUrl+"]");
                socket.emit("identify", {type: "UserScript", module: moduleName, password: serverPassword});
            });
            socket.on("disconnect", function () {
                Log.m("WS", "Disconnected from Server!");
            });

            socket.on("message", function (data) {
                Log.m("WS", "message", data);
            });
            socket.on("tabCommand", function (data) {
                if(data && data.hasOwnProperty("name")) {
                    Log.m("WS", "tabCommand", data);
                    onTabCommand(data);
                }
            });
        } else {
            Log.e("WebSocket is not null!");
        }
    }

    /**
     * Event fired when WS Socket receives a "tabCommand"
     * If a name is found in TabCommands cache, it executes the defined callback
     */
    function onTabCommand(data) {
        if(data && data.hasOwnProperty("name")) {
            if(data.name === "getTabData") {
                var tabData = {};
                for(var i in Object.keys(TabData)) {
                    var entry = TabData[Object.keys(TabData)[i]];
                    tabData[entry.name] = entry.value;
                }
                socket.emit("tabData", {data: tabData});
                //socket.emit("tabData", {data: tabData, module: data["module"]});

            } else {
                var found = false;
                for(var j in Object.keys(TabCommands)) {
                    var name = Object.keys(TabCommands)[j];
                    var callback = TabCommands[name];
                    if(name === data.name) {
                        found = true;
                        callback(data);
                        break;
                    }
                }
                if(!found) {
                    Log.e("tabCommand ["+data.name+"] not found!");
                }
            }
        } else {
            Log.e("tabCommand malformed!", data);
        }
    }

    /**
     * Start each refresh interval of ViewItems
     */
    function startViewItemRefreshIntervals() {
        for(var i in Object.keys(ViewItems)) {
            var name = Object.keys(ViewItems)[i];
            var viewItem = ViewItems[name];
            if(viewItem.refreshTime>0) {
                if(viewItem.refreshInterval === null) {
                    viewItem.refreshInterval = setInterval(function(name) {
                        self.findViewItem(name);
                    }, viewItem.refreshTime, name);
                } else {
                    Log.e("startViewItemRefreshIntervals RefreshInterval already started for ViewItem ["+name+"]!");
                }
            } else {
                Log.v("startViewItemRefreshIntervals ViewItem ["+name+"] interval is disabled");
            }
        }
    }

    /**
     * Start each refresh interval of ViewItems
     */
    function startTabDataUpdateIntervals() {
        for(var i in Object.keys(TabData)) {
            var name = Object.keys(TabData)[i];
            var entry = TabData[name];
            if(entry.updateTime>0) {
                if(entry.updateInterval === null) {
                    entry.updateInterval = setInterval(function(name) {
                        self.execTabDataCallback(name);
                    }, entry.updateTime, name);
                } else {
                    Log.e("startTabDataUpdateIntervals UpdateInterval already started for TabDataEntry ["+name+"]!");
                }
            } else {
                Log.v("startTabDataUpdateIntervals TabDataEntry ["+name+"] interval is disabled");
            }
        }
    }

    /**
     * Execute the callback of TabData entry
     */
    this.execTabDataCallback = function(name) {
        if(name) {
            if(TabData[name]) {
                var callback = TabData[name].updateCallback;
                if(callback && typeof callback === "function") {
                    callback(name);
                } else {
                    Log.v("execTabDataCallback TabDataEntry ["+name+"] callback is not a callback!");
                }
            } else {
                Log.e("execTabDataCallback TabDataEntry ["+name+"] is unknown!");
            }
        } else {
            Log.e("execTabDataCallback Name argument is undefined !");
        }
    };
    /**
     * Execute the callback of each TabData entries
     * @param {string} [notName=null] - exception name
     */
    this.execTabDataCallbacks = function(notName) {
        for(var i in Object.keys(TabData)) {
            var name = Object.keys(TabData)[i];
            if(!notName || (notName === name)) {
                self.execTabDataCallback(name);
            }
        }
    };

    /**
     * Helper for checking if element exists then dom click on it then call the callback
     * @param {string} itemName - The item name
     * @param {boolean} domClick - If normal click or JQuery click
     * @param {function} callback - Callback called after the click
     */
    this.viewItemClickHelper = function(itemName, domClick, callback) {
        if(ViewItems.hasOwnProperty(itemName)) {
            var item = ViewItems[itemName];
            if(item.found) {
                Log.d("tabItemClick", item.element);
                if(domClick) {
                    item.element[0].click();
                } else {
                    item.element.click();
                }

                if(callback && typeof callback === "function") {
                    callback();
                }
            } else {
                Log.e("tabItemClick Not found tabItem yet!");
            }
        } else {
            Log.e("tabItemClick Unknown/Bad tabItem!");
        }
    }

}