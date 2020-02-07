// ==UserScript==
// @name         TabRemote : Deezer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  TabRemote Deezer module, control Deezer tab from TabRemote interface.
// @author       Spacexion
// @include      https://www.deezer.com/*
// @grant        GM_log
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js
// @require      http://127.0.0.1:3000/libs/xlog.js
// @require      http://127.0.0.1:3000/libs/tabremote-userscript.js
// ==/UserScript==

var module_name = "deezer_com";

var Log = new XLog('e', "TabRemote", module_name, true, true, true, true);
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
        setTimeout(function() {
            tab.init();
        }, 3000);
    });


})(window.jQuery.noConflict(true));

/**
 * Event fired when script initializing
 */
function onInit() {

    // ========================================================
    Log.d("init items");
    tab.addViewItem("homeBtn", ".sidebar-nav-list .sidebar-nav-item:eq(0) a", false, -1);

    tab.addViewItem("prevBtn", ".player-controls button:eq(0)", false, -1);
    tab.addViewItem("playBtn", ".player-controls button:eq(1)", false, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("playing");},100);
        }});
    tab.addViewItem("nextBtn", ".player-controls button:eq(2)", false, -1);

    tab.addViewItem("titleElem", ".track-title a.track-link:eq(0)", false, -1);
    tab.addViewItem("artistElem", ".track-title a.track-link:eq(1)", false, -1);

    tab.addViewItem("lyricsBtn", ".track-actions .svg-icon-lyrics", true, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("lyricsPage");
                tab.execTabDataCallback("queueListPage");},1000);
        }});
    tab.addViewItem("likeBtn", ".track-actions .svg-icon-love-outline", true, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("liked");},100);
        }});
    tab.addViewItem("dislikeBtn", ".track-actions .svg-icon-angry-face", true, -1);

    tab.addViewItem("progressTimeCurrentElem", ".track-seekbar .slider-counter-current", false, -1);
    tab.addViewItem("progressTimeMaxElem", ".track-seekbar .slider-counter-max", false, -1);
    tab.addViewItem("progressTimePercentElem", ".track-seekbar .slider-track-active", false, -1);

    tab.addViewItem("repeatBtn", ".player-options button:eq(0)", false, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("repeat");},100);
        }});
    tab.addViewItem("shuffleBtn", ".player-options button:eq(1)", false, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("shuffle");},100);
        }});
    tab.addViewItem("muteBtn", ".player-options button:eq(2)", false, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("muted");},100);
        }});
    tab.addViewItem("queueListBtn", ".player-options button:eq(4)", false, -1, {
        "click": function() {
            setTimeout(function() {
                tab.findViewItem("lyricsBtn");
                tab.findViewItem("likeBtn");
                tab.findViewItem("dislikeBtn");
                tab.findViewItem("titleElem");
                tab.findViewItem("artistElem");
                tab.findViewItem("lyricsBtn2");
                tab.findViewItem("likeBtn2");
                tab.findViewItem("dislikeBtn2");
                tab.findViewItem("titleElem2");
                tab.findViewItem("artistElem2");
                tab.execTabDataCallback("queueListPage");
                tab.execTabDataCallback("lyricsPage");
            },1000);
        }});

    tab.addViewItem("titleElem2", ".queuelist-cover-title a.queuelist-cover-link", false, -1);
    tab.addViewItem("artistElem2", ".queuelist-cover-subtitle a.queuelist-cover-link", false, -1);
    tab.addViewItem("lyricsBtn2", ".queuelist-cover-actions .svg-icon-lyrics", true, -1, {
        "click": function() {
            setTimeout(function() {
                tab.findViewItem("lyricsBtn");
                tab.findViewItem("lyricsBtn2");
                tab.execTabDataCallback("lyricsPage");
                tab.execTabDataCallback("queueListPage");},1000);
        }});
    tab.addViewItem("likeBtn2", ".queuelist-cover-actions .svg-icon-love-outline", true, -1, {
        "click": function() {
            setTimeout(function() {
                tab.execTabDataCallback("liked");},100);
        }});
    tab.addViewItem("dislikeBtn2", ".queuelist-cover-actions .svg-icon-angry-face", true, -1);

    tab.addViewItem("pageLyricsElem", ".player-full .player-lyrics", false, -1);
    tab.addViewItem("pageQueueListElem", ".play-full .player-queuelist", false, -1);

    tab.addViewItem("playFlowBtn", ".page-main .channel-section:eq(0) button:eq(2)", false, -1);

    // ========================================================
    Log.d("init commands");
    tab.addTabCommandListener("home", function() {
        tab.viewItemClickHelper("homeBtn");
    });
    tab.addTabCommandListener("play", function() {
        tab.viewItemClickHelper("playBtn");
    });
    tab.addTabCommandListener("prev", function() {
        tab.viewItemClickHelper("prevBtn");
    });
    tab.addTabCommandListener("next", function() {
        tab.viewItemClickHelper("nextBtn");
    });
    tab.addTabCommandListener("repeat", function() {
        tab.viewItemClickHelper("repeatBtn");
    });
    tab.addTabCommandListener("shuffle", function() {
        tab.viewItemClickHelper("shuffleBtn");
    });
    tab.addTabCommandListener("playFlow", function() {
        tab.viewItemClickHelper("homeBtn", true, function() {
            var i = 0;
            var finder = setInterval(function() {
                tab.findViewItem("playFlowBtn", function(item) {
                    if(item && item.found) {
                        clearInterval(finder);
                        tab.viewItemClickHelper("playFlowBtn");
                    }
                });
                i++;
                if(i>30) {
                    clearInterval(finder);
                    Log.e("playFlow not found!");
                }
            }, 100);
        });
    });
    tab.addTabCommandListener("like", function() {
        if(tab.getViewItem("likeBtn").found) {
            tab.viewItemClickHelper("likeBtn");
        } else if(tab.getViewItem("likeBtn2").found) {
            tab.viewItemClickHelper("likeBtn2");
        }
    });
    tab.addTabCommandListener("dislike", function() {
        tab.viewItemClickHelper("dislikeBtn");
    });
    tab.addTabCommandListener("mute", function() {
        tab.viewItemClickHelper("muteBtn");
    });
    tab.addTabCommandListener("lyrics", function() {
        if(tab.getViewItem("lyricsBtn").found) {
            tab.viewItemClickHelper("lyricsBtn");
        } else if(tab.getViewItem("lyricsBtn2").found) {
            tab.viewItemClickHelper("lyricsBtn2");
        }
    });
    tab.addTabCommandListener("queueList", function() {
        tab.viewItemClickHelper("queueListBtn");
    });

    // ========================================================
    Log.d("init items data");
    tab.addTabDataEntry("title", "", 500, function(name) {
        var viewItem = tab.getViewItem("titleElem");
        var viewItem2 = tab.getViewItem("titleElem2");
        var title = tab.getTabDataEntry("title");
        var item = null;
        if(viewItem.found) {
            item = viewItem;
        } else if(viewItem2.found) {
            item = viewItem2;
        }
        if(item && title.value !== item.element.text()) {
            tab.setTabDataEntryValue(name, item.element.text());
            var href = item.element.attr("href");
            var album = href.match(/[0-9]+/);
            //https://api.deezer.com/album/302127/image?size=big
            var url = "https://api.deezer.com/album/"+album[0]+"/image?size=big";
            tab.setTabDataEntryValue("thumbnail", url);

            setTimeout(function() {
                tab.findViewItems();
                tab.findViewItem("lyricsBtn");
                tab.findViewItem("lyricsBtn2");

                tab.execTabDataCallback("lyricsPage");
                tab.execTabDataCallback("artist");
                tab.execTabDataCallback("liked");
                tab.execTabDataCallback("progressTimeCurrent");
                tab.execTabDataCallback("progressTimeMax");
                tab.execTabDataCallback("progressTimePercent");
            }, 500);
        }
    });
    tab.addTabDataEntry("artist", "", -1, function(name) {
        var viewItem = tab.getViewItem("artistElem");
        var viewItem2 = tab.getViewItem("artistElem2");
        if(viewItem.found) {
            tab.setTabDataEntryValue(name, viewItem.element.text());
        } else if(viewItem2.found) {
            tab.setTabDataEntryValue(name, viewItem2.element.text());
        }
    });
    tab.addTabDataEntry("thumbnail", null, null, null);

    tab.addTabDataEntry("playing", false, 500, function(name) {
        var viewItem = tab.getViewItem("playBtn");
        if(viewItem.found) {
            var result = viewItem.element.find(".svg-icon-pause");
            if((result.length>0)!==tab.getTabDataEntry("playing").value) {
                tab.setTabDataEntryValue(name, (result.length>0));

                tab.execTabDataCallback("repeat");
                tab.execTabDataCallback("shuffle");
            }
        }
    });
    tab.addTabDataEntry("muted", false, -1, function(name) {
        var viewItem = tab.getViewItem("muteBtn");
        if(viewItem.found) {
            var result = viewItem.element.find(".svg-icon-volume-off");
            tab.setTabDataEntryValue(name, (result.length>0));
        }
    });
    tab.addTabDataEntry("repeat", "disabled", -1, function(name) {
        var viewItem = tab.getViewItem("repeatBtn");
        if(viewItem.found) {
            var value = "no-repeat";
            if(viewItem.element.prop("disabled")) {
                value = "disabled";
            } else {
                if(viewItem.element.find(".svg-icon-repeat.is-active").length>0) {
                    value = "repeat";
                } else if(viewItem.element.find(".svg-icon-repeat-one.is-active").length>0) {
                    value = "repeat-one";
                }
            }
            tab.setTabDataEntryValue(name, value);
        }
    });
    tab.addTabDataEntry("shuffle", false, -1, function(name) {
        var viewItem = tab.getViewItem("shuffleBtn");
        if(viewItem.found) {
            var value = false;
            if(viewItem.element.prop("disabled")) {
                value = "disabled";
            } else {
                if(viewItem.element.find(".svg-icon-shuffle.is-active").length>0) {
                    value = true;
                }
            }
            tab.setTabDataEntryValue(name, value);
        }
    });
    tab.addTabDataEntry("progressTimeCurrent", "", 500, function(name) {
        var viewItem = tab.getViewItem("progressTimeCurrentElem");
        if(viewItem.found) {
            tab.setTabDataEntryValue(name, viewItem.element.text());
            tab.execTabDataCallback("progressTimePercent");
        }
    });
    tab.addTabDataEntry("progressTimeMax", "", -1, function(name) {
        var viewItem = tab.getViewItem("progressTimeMaxElem");
        if(viewItem.found) {
            tab.setTabDataEntryValue(name, viewItem.element.text());
        }
    });
    tab.addTabDataEntry("progressTimePercent", "0%", -1, function(name) {
        var viewItem = tab.getViewItem("progressTimePercentElem");
        if(viewItem.found) {
            tab.setTabDataEntryValue(name, viewItem.element[0].style.width);
        }
    });
    tab.addTabDataEntry("liked", false, -1, function(name) {
        var viewItem = tab.getViewItem("likeBtn");
        var viewItem2 = tab.getViewItem("likeBtn2");
        if(viewItem.found) {
            tab.setTabDataEntryValue(name, (viewItem.element.find(".svg-icon-love-outline.is-active").length>0));
        } else if(viewItem2.found) {
            tab.setTabDataEntryValue(name, (viewItem2.element.find(".svg-icon-love-outline.is-active").length>0));
        }
    });
    tab.addTabDataEntry("lyricsPage", false, -1, function(name) {
        tab.findViewItem("pageLyricsElem");
        var viewItem = tab.getViewItem("lyricsBtn");
        var viewItem2 = tab.getViewItem("lyricsBtn2");
        var viewItem3 = tab.getViewItem("pageLyricsElem");
        if(viewItem.found || viewItem2.found) {
            tab.setTabDataEntryValue(name, viewItem3.found);
        } else {
            tab.setTabDataEntryValue(name, "disabled");
        }
    });
    tab.addTabDataEntry("queueListPage", false, -1, function(name) {
        var viewItem = tab.getViewItem("queueListBtn");
        if(viewItem.found) {
            var value = false;
            if(viewItem.element.hasClass("is-active")) {
                value = true;
            }
            tab.setTabDataEntryValue(name, value);
        }
    });
}
