function keys(hash) {
    var a = new Array();
    for (var key in hash)
        a.push(key);
    return a;
}

function dump(o) {
    switch (typeof o) {
    case "undefined":
        return "undefined";

    case "number":
        return "" + o;

    case "string":
        return '"' + o + '"';

    default: // it's "object", could be array, hash or null
        if (o == null)
            return "null";

        var s            = "";
        var hasNestedObj = false;

        if (typeof(o.splice) == "function") {
            for (var i = 0; i < o.length; ++i) {
                if (o[i] != null && typeof(o[i]) == "object") {
                    hasNestedObj = true;
                    break;
                }
            }

            s += "["; 
            for (var i = 0; i < o.length; ++i) {
                s += dump(o[i]);
                if (i != o.length - 1)
                    s += ",";
                if (hasNestedObj)
                    s += '' ; //"<br>";
            }
            s += "]";

        } else { // it's a hash
            var oKeys = new Array();
            for (var key in o) {
                oKeys.push(key);
                if (o[key] && typeof(o[key] == "object"))
                    hasNestedObj = true;
            }
            s += "{"; 
            for (var i = 0; i < oKeys.length; ++i) {
                s += oKeys[i] + ":" + dump(o[oKeys[i]]);
                if (i != oKeys.length - 1)
                    s += ",";
                if (hasNestedObj)
                    s += "<br>";
            }
            s += "}";
        }
        
        return s;
    }
}
