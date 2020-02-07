/**
 * XLog - a simple js log manager
 *
 * version: 0.1
 * author: Spacexion
 *
 * @param {string} [logLevel=e] - The character corresponding to the limit level of logs (m,e,w,i,d,v)
 * @param {string}[msgPrefix=null] - Text put before any message log
 * @param {string} [msgTag=null] - Text put after prefixx
 * @param {boolean=false} [showDate=false] - If a date part is added to the message
 * @param {boolean=false} [showTime=false] - If a time part is added to the message
 * @param {boolean=false} [showMillitime=false] - If a milliseconds time part is added to the message
 * @param {boolean} [showMsgLevel=false] - If the log level character part is added to the message
 * @param {Object} [sides=['[','[']] - Array of two characters surrounding each part of the log message
 * @constructor
 */
var XLog = function(logLevel, msgPrefix, msgTag, showDate, showTime, showMillitime, showMsgLevel, sides) {

    const _levels = {m: 0, e: 1, w: 2, i: 3, d: 4, v: 5};

    if(!_levels.hasOwnProperty(logLevel)) {
        logLevel = 'e';
    }

    if(!sides || sides.length!==2) { sides = ['[',']']; }

    const _getParsedDate = function(date, separator, showDate, showTime, showMillitime) {
        var pad = function(n) { return (n<10 ? "0"+n : n); };
        var now = (date ? date : new Date());
        var text = "";
        if(showDate) {
            text = now.getFullYear()+separator+pad(now.getMonth()+1)+separator+pad(now.getDate());
        }
        if(showTime) {
            text += ""+pad(now.getHours())+separator+pad(now.getMinutes())+separator+pad(now.getSeconds())
        }
        if(showMillitime) {
            text += ""+pad(now.getMilliseconds())
        }
        return text;
    };

    var _log = function(level, args) {
        if(_levels.hasOwnProperty(level) && Array.isArray(args)) {
            if(_levels[level] <= _levels[logLevel]) {
                var argsOut = [];
                if(msgPrefix) { argsOut.push(sides[0]+msgPrefix+sides[1]); }
                if(showDate || showTime) { argsOut.push(sides[0]+_getParsedDate(null, '', showDate, showTime, showMillitime)+sides[1]); }
                if(showMsgLevel) { argsOut.push(sides[0]+level+sides[1]); }
                if(msgTag) { argsOut.push(sides[0]+msgTag+sides[1]); }
                args.forEach(function(a, index) {
                    argsOut.push(a);
                });
                console.log.apply(console, argsOut);
            }
        }
    };

    this.getLogLevel = function(level) {
        return logLevel;
    };
    this.setLogLevel = function(level) {
        if(_levels.hasOwnProperty(level)) {
            logLevel = level;
        }
    };
    this.levels = function() {
        return _levels;
    };
    this.m = function(msg) {
        _log("m", Array.prototype.slice.call(arguments));
    };
    this.e = function(msg) {
        _log("e", Array.prototype.slice.call(arguments));
    };
    this.w = function(msg) {
        _log("w", Array.prototype.slice.call(arguments));
    };
    this.i = function(msg) {
        _log("i", Array.prototype.slice.call(arguments));
    };
    this.d = function(msg) {
        _log("d", Array.prototype.slice.call(arguments));
    };
    this.v = function(msg) {
        _log("v", Array.prototype.slice.call(arguments));
    };
    this.raw = function(msg) {
        console.log.apply(console, Array.prototype.slice.call(arguments));
    };
};

if(typeof window === "undefined" && typeof process !== "undefined") {
    module.exports = XLog;
}