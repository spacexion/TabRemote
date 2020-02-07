/**
 * TabRemote : Deezer_com module
 *
 * version: 0.4
 * author: Spacexion
 *
 * @param {object} $ - JQuery instance (narrowed context to this view)
 * @param {string} tabId - The remote userscript id
 * @param {object} view - The loaded div view attributed
 * @param {string} serverPassword - The server password
 */
function deezer_com($, tabId, view, serverPassword) {
    var self = this;
    var module = "deezer_com";

    if (!window.hasOwnProperty("XLog")) {
        console.error("XLog not found, must be imported first.");
        return;
    }
    if (!window.hasOwnProperty("TabRemoteWebClient")) {
        console.error("TabRemoteWebClient not found, must be imported first.");
        return;
    }
    var Log = new XLog('e', module, tabId, true, true, true, true);

    var client = new TabRemoteWebClient($, module, tabId, view, serverPassword, Log);

    client.addViewItem("trackTitle", "[data-id=dataTrackTitle]");
    client.addViewItem("trackArtist", "[data-id=dataTrackArtist]");
    client.addViewItem("buttonPlayFlow", "[data-id=buttonPlayFlow]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "playFlow"})
        }
    });
    client.addViewItem("buttonLike", "[data-id=buttonLike]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "like"})
        }
    });
    client.addViewItem("buttonDontLike", "[data-id=buttonDontLike]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "dontlike"})
        }
    });
    client.addViewItem("buttonPrev", "[data-id=buttonPrev]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "prev"})
        }
    });
    client.addViewItem("buttonPlay", "[data-id=buttonPlay]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "play"})
        }
    });
    client.addViewItem("buttonPause", "[data-id=buttonPause]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "play"})
        }
    });
    client.addViewItem("buttonNext", "[data-id=buttonNext]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "next"})
        }
    });
    client.addViewItem("buttonMute", "[data-id=buttonMute]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "mute"})
        }
    });
    client.addViewItem("buttonRepeat", "[data-id=buttonRepeat]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "repeat"})
        }
    });
    client.addViewItem("buttonShuffle", "[data-id=buttonShuffle]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "shuffle"})
        }
    });
    client.addViewItem("buttonQueueList", "[data-id=buttonQueueList]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "queueList"})
        }
    });
    client.addViewItem("buttonLyrics", "[data-id=buttonLyrics]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "lyrics"})
        }
    });
    client.addViewItem("progressTimeCurrent", "[data-id=progressTimeCurrent]");
    client.addViewItem("progressBar", "[data-id=progressBar]");
    client.addViewItem("progressTimeMax", "[data-id=progressTimeMax]");
    client.addViewItem("trackThumbnail", "[data-id=dataTrackThumbnail]");

    client.addTabDataEntryCallback("title", function (name, value) {
        client.getViewItem("trackTitle").element.val(value);
    });
    client.addTabDataEntryCallback("artist", function (name, value) {
        client.getViewItem("trackArtist").element.val(value);
    });
    client.addTabDataEntryCallback("thumbnail", function (name, value) {
        client.getViewItem("trackThumbnail").element.attr("src", value);
    });
    client.addTabDataEntryCallback("playing", function (name, value) {
        if (value) {
            client.getViewItem("buttonPause").element.show();
            client.getViewItem("buttonPlay").element.hide();
        } else {
            client.getViewItem("buttonPlay").element.show();
            client.getViewItem("buttonPause").element.hide();
        }
    });
    client.addTabDataEntryCallback("muted", function (name, value) {
        var elem = client.getViewItem("buttonMute").element;
        var i = elem.find("i");
        if (value) {
            elem.attr("class", "btn btn-lg btn-warning");
            i.attr("class", "fas fa-volume-mute");
        } else {
            elem.attr("class", "btn btn-lg btn-secondary");
            i.attr("class", "fas fa-volume-up");
        }
    });
    client.addTabDataEntryCallback("repeat", function (name, value) {
        var elem = client.getViewItem("buttonRepeat").element;
        var i = elem.find("i");
        if (value === "disabled") {
            elem.attr("disabled", true);
        } else {
            elem.attr("disabled", false);

            if (value === "no-repeat") {
                elem.attr("class", "btn btn-lg btn-secondary");
                i.attr("class", "fas fa-sync");
            } else if (value === "repeat") {
                elem.attr("class", "btn btn-lg btn-warning");
                i.attr("class", "fas fa-redo");
            } else if (value === "repeat-one") {
                elem.attr("class", "btn btn-lg btn-success");
                i.attr("class", "fas fa-redo");
            }
        }
    });
    client.addTabDataEntryCallback("shuffle", function (name, value) {
        var elem = client.getViewItem("buttonShuffle").element;
        if (value === "disabled") {
            elem.attr("disabled", true);
        } else {
            elem.attr("disabled", false);

            if (value) {
                elem.attr("class", "btn btn-lg btn-warning");
            } else {
                elem.attr("class", "btn btn-lg btn-secondary");
            }
        }
    });
    client.addTabDataEntryCallback("progressTimeCurrent", function (name, value) {
        client.getViewItem("progressTimeCurrent").element.text(value);
    });
    client.addTabDataEntryCallback("progressTimeMax", function (name, value) {
        client.getViewItem("progressTimeMax").element.text(value);
    });
    client.addTabDataEntryCallback("progressTimePercent", function (name, value) {
        client.getViewItem("progressBar").element.css("width", value);
    });
    client.addTabDataEntryCallback("liked", function (name, value) {
        client.getViewItem("buttonLike").element.attr("class", "btn btn-lg "+(value ? "btn-warning" : "btn-secondary"));
    });
    client.addTabDataEntryCallback("lyricsPage", function (name, value) {
        var elem = client.getViewItem("buttonLyrics").element;
        if (value === "disabled") {
            elem.attr("disabled", true);
        } else {
            elem.attr("disabled", false);

            if (value) {
                elem.attr("class", "btn btn-lg btn-warning");
            } else {
                elem.attr("class", "btn btn-lg btn-secondary");
            }
        }
    });
    client.addTabDataEntryCallback("queueListPage", function (name, value) {
        client.getViewItem("buttonQueueList").element.attr("class", "btn btn-lg "+(value ? "btn-warning" : "btn-secondary"));
    });

    client.init();

    this.exitView = function() {
        client.exitView();
    }
}