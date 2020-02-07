/**
 * XUtils is a wrapper for various function helpers
 *
 * @type {{hasOwnNestedProperties: XUtils.hasOwnNestedProperties, hasOwnNestedProperty: XUtils.hasOwnNestedProperty}}
 */

var XUtils = {
    hasOwnNestedProperties: function(obj, properties) {
        if(obj && properties && Array.isArray(properties) && properties.length > 0) {
            for(var i=0; i<properties.length; i++) {
                if(!XUtils.hasOwnNestedProperty(obj, properties[i])) {
                    return false;
                }
            }
            return true;
        }
    },
    hasOwnNestedProperty: function(obj, path) {
        if(!obj || !path) {
            return;
        }

        var properties = path.split('.');
        var current = obj;
        for (var i = 0; i < properties.length; i++) {
            if(current.hasOwnProperty(properties[i])) {
                current = current[properties[i]];
            } else {
                return false;
            }
        }
        return true;
    },
    hmsToSeconds: function(str) {
        var s = 0;
        if(str && str.length) {
            var p = str.split(':');
            var m = 1;

            while (p.length > 0) {
                s += m * parseInt(p.pop(), 10);
                m *= 60;
            }
        }
        return s;
    },
    secondsToHHMMSS: function(secs) {
        var sec_num = parseInt(secs, 10);
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor(sec_num / 60) % 60;
        var seconds = sec_num % 60;

        return [hours,minutes,seconds]
            .map(function(v) { return (v < 10 ? "0" + v : v)})
            .filter(function(v,i) { return (v !== "00" || i > 0)})
            .join(":");
    }
};

// Export for NodeJS if on server
if(typeof window === "undefined" && typeof process !== "undefined") {
    module.exports = XUtils;
}