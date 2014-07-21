// {{{ wordWrap
/*
 * Function: wordWrap
 *
 * Breaks string into lines at whitespace.  The resulting lines will be no longer than 'approxLen'
 * characters.
 *
 * Parameters:
 *     str - the string to break up
 *     approxLen - the maximum line length
 *     breakStr - the string to use to break up the lines, e.g. "\n" or "<br>"
 *
 * Returns:
 *     A new wordwrapped version of str
 *
 */
function wordWrap(str, approxLen, breakStr) {
    if (str.length <= approxLen) { // then nothing to do
        return str;
    }

    var lines = [];
    var start = 0;
    var end = start + approxLen;
    while (end < str.length) {
        // find previous space closest to approxLen characters out
        while (end > start && str.charAt(end) != ' ') {
            --end;
        }

        if (end > start) {
            lines.push(str.substring(start, end));
            start = end + 1;
            end = start + approxLen;

        } else { // text contains word longer than approxLen ... punt
            //alert("wordWrap: string contains word longer than line length " + approxLen + "\n" + str);
            return str;
        }
    }
    lines.push(str.substring(start)); // remember the remnant!

    return lines.join(breakStr);
}
// }}}
// {{{ getFunctionName
/*
 * Function: getFunctionName
 *
 * Gets the name of a function.  Firefox supports a .name attribute on Function objects,
 * but IE doesn't.
 *
 * Parameters:
 *     funcObj - the function to get the name of
 *
 * Returns:
 *     The name of the function.
 */
function getFunctionName(funcObj) {
    if (funcObj.name) {
        return funcObj.name;
    } else {
        /^function (\S+)\(/.exec(funcObj.toString());
        return RegExp.$1;
    }
}
// }}}
// {{{ setOpacity
/*
 * Function: setOpacity
 *
 * Browser-independent way to set opacity on an element.
 *
 * Parameters:
 *      elt - element to set opacity on
 *      opacity - floating point number in range (0.0, 100.0)
 */
function setOpacity(elt, opacity) {
    $(elt).css({ "opacity": opacity });
}
// }}}
// {{{ makeOverlibCompatibleStr
/*
 * Function: makeOverlibCompatibleStr
 *
 * Makes string save to use as an overlib callback.
 *
 * Parameters:
 *      str - str to make compatible
 *
 * Returns:
 *      The string escaped so as to be usable by overlib
 */
function makeOverlibCompatibleStr(str) {
    return str.replace(/"/g, "&quot;");  // "); // Help Emacs; Overlib says not to use single quotes, but...
}
// }}}
// {{{ splitDate
/*
 * Function: splitDate
 *
 * Splits an eight-digit integer format date into an array of its year, month, and day components, e.g.
 * 19180307 => [1918, 3, 7].
 *
 * Parameters:
 *      d - the date to split
 *
 * Returns:
 *      An array in [yyyy, m, d] format.
 */
function splitDate(d)
{
    d = parseInt(d, 10);

    // Doing this mathematically is better than string manipulation to avoid problems with 19160209 (e.g.)
    // causing parse problems because of octal.
    return [
            Math.floor(d / 10000),
            Math.floor(d % 10000 / 100),
            d % 100
           ];
}
// }}}
// {{{ formatDateAsInt
/*
 * Function: formatDateAsInt
 *
 * Concatenates a year, month, and day into a standard eight-digit integer-format date, e.g. (1918, 3, 7) => 19180307.
 * The zero-padding of months and days less than 10 is guaranteed.
 *
 * Parameters:
 *      y - the year, all four digits
 *      m - the month, 1-12
 *      d - the day of the month, 1-31
 *
 * Returns:
 *      The integer date
 */
function formatDateAsInt(y, m, d) {
    if (m < 10) {
        m = "0" + m;
    }
    if (d < 10) {
        d = "0" + d;
    }
    return parseInt("" + y + m + d, 10);
}
// }}}
// {{{ formatDate
/*
 * Function: formatDate
 *
 * Converts and integer-style date to a human-readable string, e.g. 19180302 => "1918-03-02"
 *
 * Parameters:
 *      dateAsInt - the date to convert
 *
 * Returns:
 *      The string representation of the date
 */
function formatDate(dateAsInt) {
    var dateAsStr = "" + dateAsInt;
    return dateAsStr.substr(0, 4) + "-" + dateAsStr.substr(4, 2) + "-" + dateAsStr.substr(6, 2);
}
// }}}
// {{{ Resizer
function Resizer(scroller)
{
    this.map          = $("#mapContainerDiv")[0];
    this.resizeHandle = $("#resizeHandle")[0];
    this.empty        = $("#emptyDiv")[0];

    // Ordering seems to be very important here
    this.empty.absolutize();
    this.resizeHandle.absolutize();
    this.map.absolutize();

    this.resize = function() {
                      var handlePos = parseInt(this.resizeHandle.getStyle("top"));
                      this.empty.setStyle({top : handlePos + 3});
                      this.map.setStyle({height: handlePos - parseInt(this.map.getStyle("top"))});
                      scroller.recomputeBounds();
                  };

    new Draggable(this.resizeHandle, {constraint : "vertical",
                                      onDrag     : this.resize.bind(this),
                                      onEnd      : this.resize.bind(this)});

}
// }}}
