var $util = require("util");


module.exports = function customUtil(){

    Array.prototype.remove = Array.prototype.remove || function(item){
        var index = this.indexOf(item);

        if (index >= 0) {
            return this.splice(index, 1);
        }

        return null;
    }

    return {
        merge:merge,
    }

    function merge(dst){
        var objs = Array.prototype.slice.call(arguments, 1);

        for(var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            if (!$util.isObject(obj) && !$util.isFunction(obj)) continue;
            var keys = Object.keys(obj);
            for (var j = 0; j < keys.length; j++) {
                var key = keys[j];
                var src = obj[key];

                dst[key] = src;
            }
        }
    }
};
