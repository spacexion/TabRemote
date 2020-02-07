// ==UserScript==
// @name         TabRemote : Module
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  TabRemote module, boilerplate userscript for TabRemote.
// @author       Spacexion
// @include      https://www.thewebsitewiththetab.com/tabpath
// @grant        GM_log
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js
// @require      http://127.0.0.1:3000/libs/xlog.js
// @require      http://127.0.0.1:3000/libs/tabremote-userscript.js
// ==/UserScript==


/**
 * TabRemote UserScript Boilerplate
 *
 * - Copy this file to a renamed one and edit the new file
 * - Change the @include url to the tab or website url
 * - Change the 'module_name' variable to the desired module name (no space, lowercase, no special characters except '_')
 * - Change onInit() content and add the desired items, commands and callbacks via helper functions
 * - Create the corresponding tab module directory and files in server/tabmodules path
 */

var module_name = "my_awesome_module";

var Log = new XLog('d', "TabRemote", module_name, true, true, true, true);
var tab = null;

/**
 * UserScript loader
 */
(function(jquery) {

    Log.m("Script starting...");
    var $ = jquery;

    tab = new TabRemoteUserScript($, module_name, "127.0.0.1", 3000, "", Log);

    onInit();

    $(window).on("load",function() {
        Log.m("Window is loaded");
        tab.init();
    });


})(window.jQuery.noConflict(true));

/**
 * Event fired when script initializing
 */
function onInit() {

    Log.d("init items");
    // tab.addViewItem("home", "a.logo-deezer-black", false, -1);

    Log.d("init commands");
    // tab.addTabCommandListener("home", function() {
    //    tab.viewItemClickHelper("home");
    // });

    Log.d("init items data");
    // tab.addTabDataEntry("artist", null, 500, function(name) {
    //     var viewItem = tab.getViewItem("artist");
    //     tab.setTabDataEntryValue(name, (viewItem.found ? viewItem.element.text() : ""));
    // });
}
