/**
 * TabRemote : Youtube_com module
 *
 * version: 0.1
 * author: Spacexion
 *
 * @param {object} $ - JQuery instance (narrowed context to this view)
 * @param {string} tabId - The remote userscript id
 * @param {object} view - The loaded div view attributed
 * @param {string} serverPassword - The server password
 */
function youtube_com($, tabId, view, serverPassword) {
    var self = this;
    var module = "youtube_com";

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

    // ==== View Items ====
    client.addViewItem("title", "[data-id=dataTitle]");
    client.addViewItem("views", "[data-id=dataViews]");
    client.addViewItem("date", "[data-id=dataDate]");
    client.addViewItem("likes", "[data-id=dataLikes]");
    client.addViewItem("dislikes", "[data-id=dataDislikes]");
    client.addViewItem("authorAvatar", "[data-id=dataAuthorAvatar]");
    client.addViewItem("authorName", "[data-id=dataAuthorName]");
    client.addViewItem("authorSubscribers", "[data-id=dataAuthorSubscribers]");
    client.addViewItem("description", "[data-id=dataDescription]");
    client.addViewItem("subscribed", "[data-id=dataSubscribed]");
    client.addViewItem("followingVideos", ".followingVideosList");
    client.addViewItem("followingVideosContainer", ".followingVideosContainer");
    client.addViewItem("buttonSubscribe", "[data-id=buttonSubscribe]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "subscribe"})
        }
    });
    client.addViewItem("descriptionCollapse", "[data-id=descriptionCollapse]");
    client.addViewItem("buttonDescription", "[data-id=buttonDescription]", {
        "click": function () {
            client.getViewItem("descriptionCollapse").element.toggle("slow");
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
    client.addViewItem("buttonLike", "[data-id=buttonLike]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "like"})
        }
    });
    client.addViewItem("buttonDislike", "[data-id=buttonDislike]", {
        "click": function () {
            client.socketEmit("tabCommand", {name: "dislike"})
        }
    });
    client.addViewItem("progressTimeCurrent", "[data-id=progressTimeCurrent]");
    client.addViewItem("progressBar", "[data-id=progressBar]");
    client.addViewItem("progressTimeMax", "[data-id=progressTimeMax]");
    client.addViewItem("thumbnail", "[data-id=dataThumbnail]");

    // ==== TabData Entries ====
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
    client.addTabDataEntryCallback("title", function (name, value) {
        client.getViewItem("title").element.val(value);
    });
    client.addTabDataEntryCallback("description", function (name, value) {
        client.getViewItem("description").element.html(value);
    });
    client.addTabDataEntryCallback("thumbnail", function (name, value) {
        client.getViewItem("thumbnail").element.attr("src", value);
    });
    client.addTabDataEntryCallback("likes", function (name, value) {
        client.getViewItem("likes").element.text(value);
    });
    client.addTabDataEntryCallback("dislikes", function (name, value) {
        client.getViewItem("dislikes").element.text(value);
    });
    client.addTabDataEntryCallback("liked", function (name, value) {
        var elem = client.getViewItem("buttonLike").element;
        if(value) {
            elem.attr("class", "btn btn-lg btn-warning");
        } else {
            elem.attr("class", "btn btn-lg btn-secondary");
        }
    });
    client.addTabDataEntryCallback("disliked", function (name, value) {
        var elem = client.getViewItem("buttonDislike").element;
        if(value) {
            elem.attr("class", "btn btn-lg btn-warning");
        } else {
            elem.attr("class", "btn btn-lg btn-secondary");
        }
    });
    client.addTabDataEntryCallback("date", function (name, value) {
        client.getViewItem("date").element.val(value);
    });
    client.addTabDataEntryCallback("views", function (name, value) {
        client.getViewItem("views").element.val(value);
    });
    client.addTabDataEntryCallback("author", function (name, value) {
        if(value) {
            if(value.hasOwnProperty("name"))
                client.getViewItem("authorName").element.val(value.name);
            if(value.hasOwnProperty("avatar"))
                client.getViewItem("authorAvatar").element.attr("src", value.avatar);
            if(value.hasOwnProperty("subscribers"))
                client.getViewItem("authorSubscribers").element.val(value.subscribers);
        }
    });
    client.addTabDataEntryCallback("subscribed", function (name, value) {
        if(value) {
            client.getViewItem("subscribed").element.attr("class", "fas fa-check-circle text-warning");
        } else {
            client.getViewItem("subscribed").element.attr("class", "far fa-check-circle text-secondary");
        }
    });
    client.addTabDataEntryCallback("progressTimeCurrent", function (name, value) {
        var hms = XUtils.secondsToHHMMSS(value);
        client.getViewItem("progressTimeCurrent").element.text(hms);
    });
    client.addTabDataEntryCallback("progressTimeMax", function (name, value) {
        var hms = XUtils.secondsToHHMMSS(value);
        client.getViewItem("progressTimeMax").element.text(hms);
    });
    client.addTabDataEntryCallback("progressTimePercent", function (name, value) {
        client.getViewItem("progressBar").element.css("width", value+"%");
    });
    client.addTabDataEntryCallback("playlist", function (name, value) {

    });
    client.addTabDataEntryCallback("followingVideos", function (name, value) {
        var container = client.getViewItem("followingVideosContainer");
        var view = client.getViewItem(name);
        view.element.empty();
        for(var i in Object.keys(value)) {
            var key = Object.keys(value)[i];
            var e = value[key];

            var card = $("<div />").attr("class", "card");
            var img = $("<img />").attr({"class": "card-img-top h-30", "src": e.thumbnail});
            var body = $("<div />").attr("class", "card-body p-2");

            var progress = $("<div />").attr({"class": "w-100 p-0"}).css({"height":"4px"});
            var progressBar = $("<div />").attr({"class": "h-100 p-0"}).css({"width": 0, "background-color":"red"});
            if(e.progressPercent && e.progressPercent.length) {
                progressBar.css("width", e.progressPercent);
            }
            progress.append(progressBar);


            body.append($("<h6 />").attr("class", "card-title").text(e.title));
            body.append($("<p />").attr("class", "card-text mb-2").text(e.authorName));
            body.append($("<p />").attr("class", "card-text mb-2").text(e.views));
            body.append($("<p />").attr("class", "card-text mb-2").text(e.duration));

            var a = $("<a />").attr({"href": "#", "data-uri": key, "class": "stretched-link"});
            a.click(function() {
                client.socketEmit("tabCommand", {name: "clickFollowingVideo", uri: $(this).attr("data-uri")});
            });

            body.append(a);

            card.append(img);
            card.append(progress);
            card.append(body);

            view.element.append(card);
        }
        if(Object.keys(value).length) {
            container.element.show();
        } else {
            container.element.hide();
        }
    });

    client.init();

    this.exitView = function() {
        client.exitView();
    }
}