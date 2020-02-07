// ==UserScript==
// @name         TabRemote : Youtube
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  TabRemote Youtube module, control Youtube tab from TabRemote interface.
// @author       Spacexion
// @include      https://www.youtube.com/*
// @grant        GM_log
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js
// @require      http://127.0.0.1:3000/libs/xlog.js
// @require      http://127.0.0.1:3000/libs/tabremote-userscript.js
// ==/UserScript==


var module_name = "youtube_com";

var Log = new XLog('e', "TabRemote", module_name, true, true, true, true);
var tab = null;
var $ = null;

/**
 * UserScript loader
 */
(function(jquery) {

    Log.m("Script starting...");
    $ = jquery;

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
    tab.addViewItem("player", "ytd-player  video.html5-main-video", false, -1);

    tab.addViewItem("play", "ytd-player .ytp-play-button", false, -1);
    tab.addViewItem("prev", "ytd-player .ytp-prev-button", false, -1);
    tab.addViewItem("next", "ytd-player .ytp-next-button", false, -1);
    tab.addViewItem("mute", "ytd-player .ytp-mute-button", false, -1);

    tab.addViewItem("like", "ytd-video-primary-info-renderer #menu ytd-toggle-button-renderer:eq(0) button", false, -1);
    tab.addViewItem("dislike", "ytd-video-primary-info-renderer #menu ytd-toggle-button-renderer:eq(1) button", false, -1);

    tab.addViewItem("title", "ytd-video-primary-info-renderer .title yt-formatted-string", false, 500);
    tab.addViewItem("description", "ytd-video-secondary-info-renderer #description yt-formatted-string", false, -1);
    tab.addViewItem("views", "ytd-video-primary-info-renderer #count .view-count", false, -1);
    tab.addViewItem("date", "ytd-video-primary-info-renderer #date yt-formatted-string", false, -1);
    tab.addViewItem("likes", "ytd-video-primary-info-renderer #menu ytd-toggle-button-renderer:eq(0) yt-formatted-string", false, -1);
    tab.addViewItem("dislikes", "ytd-video-primary-info-renderer #menu ytd-toggle-button-renderer:eq(1) yt-formatted-string", false, -1);
    tab.addViewItem("authorUrl", "ytd-video-secondary-info-renderer ytd-video-owner-renderer > a", false, -1);
    tab.addViewItem("authorName", "ytd-video-secondary-info-renderer ytd-video-owner-renderer ytd-channel-name yt-formatted-string", false, -1);
    tab.addViewItem("authorAvatar", "ytd-video-secondary-info-renderer ytd-video-owner-renderer #avatar img", false, -1);
    tab.addViewItem("authorSubscribers", "ytd-video-secondary-info-renderer ytd-video-owner-renderer #owner-sub-count", false, -1);
    tab.addViewItem("subscribe", "ytd-video-secondary-info-renderer #subscribe-button paper-button", false, -1);

    tab.addViewItem("progressTimeCurrent", "ytd-player .ytp-time-current", false, -1);
    tab.addViewItem("progressTimeMax", "ytd-player .ytp-time-duration", false, -1);

    tab.addViewItem("playlist", "ytd-playlist-panel-renderer", false, -1);
    tab.addViewItem("followingVideos", "ytd-watch-next-secondary-results-renderer #items", false, -1);

    tab.addViewItem("searchInput", "ytd-searchbox input#search", false, -1);
    tab.addViewItem("searchButton", "ytd-searchbox button#search-icon-legacy", false, -1);

    Log.d("init commands");
    tab.addTabCommandListener("play", function() {
        var view = tab.getViewItem("player");
        if(view.found) {
            tab.viewItemClickHelper("play", true);
            if(view.element[0].playbackRate>0) {
                view.element[0].playbackRate = 0;
            } else {
                view.element[0].playbackRate = 1;
            }
        }
    });
    tab.addTabCommandListener("prev", function() {
        tab.viewItemClickHelper("prev", true);
    });
    tab.addTabCommandListener("next", function() {
        tab.viewItemClickHelper("next", true);
    });
    tab.addTabCommandListener("mute", function() {
        tab.viewItemClickHelper("mute", true);
    });
    tab.addTabCommandListener("like", function() {
        tab.viewItemClickHelper("like");
    });
    tab.addTabCommandListener("dislike", function() {
        tab.viewItemClickHelper("dislike");
    });
    tab.addTabCommandListener("subscribe", function() {
        tab.viewItemClickHelper("subscribe");
        setTimeout(function() {
            tab.findViewItem("subscribe");
        }, 1000);
    });
    tab.addTabCommandListener("search", function(data) {
        if(data && data.hasOwnProperty("input")) {
            var view = tab.getViewItem("searchInput");
            view.element.val(data.input);
            tab.viewItemClickHelper("searchButton");
        }
    });
    tab.addTabCommandListener("clickFollowingVideo", function(data) {
        if(data && data.hasOwnProperty("uri")) {
            var view = tab.getViewItem("followingVideos");
            var a = view.element.find("a#thumbnail[href='"+data.uri+"']");
            if(a.length) {
                a[0].click();
                Log.d("clicked Following Video: "+data.uri);
            }
        }
    });

    Log.d("init items data");
    tab.addTabDataEntry("playing", false, 500, function(name) {
        var view = tab.getViewItem("player");
        if(view.found) {
            var playing = false;
            if(!view.element[0].paused && view.element[0].playbackRate>0) {
                playing = true;
            }
            tab.setTabDataEntryValue(name, playing);

            tab.execTabDataCallback("muted");
            tab.execTabDataCallback("liked");
            tab.execTabDataCallback("disliked");
            tab.execTabDataCallback("subscribed");
        }
    });
    tab.addTabDataEntry("muted", false, -1, function(name) {
        var view = tab.getViewItem("player");
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element[0].muted);
        }
    });
    tab.addTabDataEntry("title", "", 500, function(name) {
        var view = tab.getViewItem("title");
        //title changed
        if(view.found && view.element.text() !== tab.getTabDataEntry("title").value) {
            tab.findViewItems();

            tab.setTabDataEntryValue(name, (view.found ? view.element.text() : ""));

            tab.execTabDataCallback("thumbnail");
            tab.execTabDataCallback("views");
            tab.execTabDataCallback("date");
            tab.execTabDataCallback("likes");
            tab.execTabDataCallback("dislikes");
            tab.execTabDataCallback("liked");
            tab.execTabDataCallback("disliked");
            tab.execTabDataCallback("subscribed");
            tab.execTabDataCallback("muted");
            tab.execTabDataCallback("progressTimeMax");
            tab.execTabDataCallback("playlist");
            tab.execTabDataCallback("followingVideos");
        }
    });
    tab.addTabDataEntry("description", "", -1, function(name) {
        var view = tab.getViewItem(name);
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element.html());
        }
    });
    tab.addTabDataEntry("thumbnail", "", -1, function(name) {
        var urlParams = new URLSearchParams(window.location.search);
        var videoId = urlParams.get('v');
        var path = "http://img.youtube.com/vi/"+videoId+"/0.jpg";
        tab.setTabDataEntryValue(name, path);
    });
    tab.addTabDataEntry("views", "", -1, function(name) {
        var view = tab.getViewItem(name);
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element.text());
        }
    });
    tab.addTabDataEntry("date", "", -1, function(name) {
        var view = tab.getViewItem(name);
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element.text());
        }
    });
    tab.addTabDataEntry("likes", "", -1, function(name) {
        var view = tab.getViewItem(name);
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element.text());
        }
    });
    tab.addTabDataEntry("dislikes", "", -1, function(name) {
        var view = tab.getViewItem(name);
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element.text());
        }
    });
    tab.addTabDataEntry("liked", "", -1, function(name) {
        var view = tab.getViewItem("like");
        if(view.found) {
            tab.setTabDataEntryValue(name, (view.element.attr("aria-pressed")==="true"));
        }
    });
    tab.addTabDataEntry("disliked", "", -1, function(name) {
        var view = tab.getViewItem("dislike");
        if(view.found) {
            tab.setTabDataEntryValue(name, (view.element.attr("aria-pressed")==="true"));
        }
    });
    tab.addTabDataEntry("author", {avatar:null, name:null, subscribers:null, url:null}, 1000, function(name) {
        var authorData = tab.getTabDataEntry("author");
        var authorAvatar = tab.getViewItem("authorAvatar");
        var authorName = tab.getViewItem("authorName");
        var authorUrl = tab.getViewItem("authorUrl");
        var authorSubscribers = tab.getViewItem("authorSubscribers");
        if(authorName.found && authorUrl.found && authorAvatar.found && authorSubscribers.found) {
            if(authorData.value.avatar !== authorAvatar.element.attr("src")
            || authorData.value.name !== authorName.element.text()) {
                var author = {
                    name: authorName.element.text(),
                    url: "https://www.youtube.com/"+authorUrl.element.attr("href"),
                    avatar: authorAvatar.element.attr("src"),
                    subscribers: authorSubscribers.element.text()
                };

                tab.setTabDataEntryValue(name, author);

                tab.execTabDataCallback("progressTimeMax");
                tab.execTabDataCallback("playlist");
                tab.execTabDataCallback("followingVideos");
            }
        }
    });
    tab.addTabDataEntry("subscribed", false, -1, function(name) {
        var view = tab.getViewItem("subscribe");
        if(view.found) {
            tab.setTabDataEntryValue(name, (view.element.attr("subscribed")==="" ? true : false));
        }
    });
    tab.addTabDataEntry("progressTimeCurrent", "0", 500, function(name) {
        var view = tab.getViewItem("player");
        if(view.found) {
            if(view.element[0].currentTime !== tab.getTabDataEntry("progressTimeCurrent").value) {
                tab.setTabDataEntryValue(name, view.element[0].currentTime);

                tab.execTabDataCallback("progressTimePercent");
            }
        }
    });
    tab.addTabDataEntry("progressTimeMax", "0", -1, function(name) {
        var view = tab.getViewItem("player");
        if(view.found) {
            tab.setTabDataEntryValue(name, view.element[0].duration);
        }
    });
    tab.addTabDataEntry("progressTimePercent", "0", -1, function(name) {
        var current = parseInt(tab.getTabDataEntry("progressTimeCurrent").value);
        var max = parseInt(tab.getTabDataEntry("progressTimeMax").value);
        var percent = 0;
        if(max>0) {
            percent = current/max * 100;
        }
        tab.setTabDataEntryValue(name, percent.toFixed(2));
    });
    tab.addTabDataEntry("playlist", {}, -1, function(name) {

    });
    tab.addTabDataEntry("followingVideos", {}, -1, function(name) {
        var view = tab.getViewItem("followingVideos");
        if(view.found) {
            var list = {};
            var items = view.element.children();
            items.each(function(index) {
                var titleElem =  $(this).find("#video-title");
                var urlElem =  $(this).find("a#thumbnail");
                var authorNameElem = $(this).find("ytd-channel-name #text");
                var viewsElem = $(this).find("#metadata-line > span");
                var durationElem = $(this).find("ytd-thumbnail-overlay-time-status-renderer > span");
                var progressPercentElem = $(this).find("ytd-thumbnail-overlay-resume-playback-renderer #progress");

                var uri = (urlElem.length ? urlElem.attr("href") : null);
                if(uri) {
                    var videoId = uri.substring(9, 20);
                    var item = {
                        uri: uri,
                        title: (titleElem.length ? titleElem.attr("title") : ""),
                        thumbnail: "https://i.ytimg.com/vi/"+videoId+"/hqdefault.jpg",
                        authorName: (authorNameElem.length ? authorNameElem.text() : ""),
                        views: (viewsElem.length ? viewsElem.text() : ""),
                        duration: (durationElem.length ? durationElem.text() : ""),
                        progressPercent:(progressPercentElem.length ? progressPercentElem[0].style.width : "")
                    };
                    list[uri] = item;
                } else {
                    Log.w("tabData [followingVideos] cannot add video item, url not found!");
                }
            });
            tab.setTabDataEntryValue(name, list);
        }
    });
}
