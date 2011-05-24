/**
 * @file dt_toolbar.js
 * Classes for DHTML toolbars.
 */

/**
 * Changes the border color of an element.  Pseudo-private.
 *
 * @tparam DOMElt thing the element for which to change the border color
 * @tparam string color the new border color, in standard HTML/CSS specification
 */
function DT_borderIt(thing, color) {
    if (document.all || document.getElementById) {
        thing.style.borderColor = color;
    }
}

/**
 * Creates a DHTML toolbar.
 * Uses the given parameters as the highlight and normal color for
 * the buttons contained within the toolbar.
 *
 * @tparam string highlightColor the border color used when the cursor is over a toolbar button
 * @tparam string normalColor the border color used when the cursor leaves a toolbar button
 */
function DT_Toolbar(highlightColor, normalColor) {
    this._components     = [];
    this._highlightColor = highlightColor;
    this._normalColor    = normalColor;

    /**
     * Here's some documentation for add().
     */
    this.add = function(component) {
        this._components.push(component);
        component._highlightColor = this._highlightColor;
        component._normalColor    = this._normalColor;
    };

    /**
     * Here's some documentation for generate().
     */
    this.generate = function() {
        var str = "<table cellpadding='0' cellspacing='0' border='0' valign='center' height='100%'><tr>";
        for (var i = 0; i < this._components.length; ++i) {
            str += "<td>" + this._components[i].generate() + "</td>";
        }
        str += "</tr></table>";
        return str;
    };
}

function DT_Link(label, url, className) {
    this.generate = function() {
        return "<a href='" + url + (className ? "' class='" + className : "") + "'>" + label + "</a>";
    };
}

function DT_Spacer(pxWidth, className) {
    this._width = pxWidth;
    this.generate = function() {
        return "<img src='images/spacer.png' height='1' width='" + pxWidth + "' border='0'" +
               (className ? "class='" + className + "'" : "") +
               ">";
    };
}

/*
 * options: [ "text1=val1", "text2=val2", ... ]
 */
function DT_Select(eltId, options, selectedVal, callbackFn, className) {
    this.generate = function() {
        var s = "<select id='" + eltId + "' onchange='" + getFunctionName(callbackFn) + "()'";
        if (className) {
            s += " class='" + className + "'";
        }
        s += ">";
        for (var i = 0; i < options.length; ++i) {
            var ostr = options[i];
            var val = ostr;
            var str = ostr;
            var sel = "";
            if (ostr.indexOf('=') > 0) {
                var vals = ostr.split('=');
                str = vals[0];
                val = vals[1];
            }
            if (selectedVal == val) {
                sel = " selected";
            }
            s += "<option value=\"" + val + "\"" + sel + ">" + str + "</option>";
        }
        s += "</select>";
        return s;
    };
}

function DT_PushButton(eltId, imgUrlBase, callbackFnName, title, className) {
    this._title = title;

    this.generate = function() {
        var s = "<img id='" + eltId + "' src='" + imgUrlBase + "' height='32' width='32' border='0'" +
            " onmouseover='DT_borderIt(this, \"" + this._highlightColor + "\")'" +
            " onmouseout='DT_borderIt(this, \"" + this._normalColor + "\")'" +
            " onclick='" + callbackFnName + "(this)'";
        if (this._title) {
            s += " title='" + this._title + "'";
        }
        s += " class='borderedImage" + (className ? " " + className : "") + "'";
        s += ">";
        return s;
    };
}

function DT_ToggleButton(eltId, onStateImgUrl, offStateImgUrl, callBackFunction, title, className) {
    DT_ToggleButton._createdObjHash[eltId] = this;
    DT_ToggleButton._imageUrls.push(onStateImgUrl);
    DT_ToggleButton._imageUrls.push(offStateImgUrl);

    this._name              = eltId;
    this._onStateImgUrl     = onStateImgUrl;
    this._offStateImgUrl    = offStateImgUrl;
    this._callBackFunction  = callBackFunction;
    this._title             = title;
    this._className         = className;

    this.generate = function() {
        var s = "<img src='" + onStateImgUrl + "' height='32' width='32' border='0'" +
                " onmouseover='DT_borderIt(this, \"" + this._highlightColor + "\")'" +
                " onmouseout='DT_borderIt(this, \"" + this._normalColor + "\")'" +
                " onclick='DT_ToggleButton._callBackThunk(\"" + this._name + "\", this)'";
        if (this._title) {
            s += " title='" + this._title + "'";
        }
        s += " class='borderedImage" + (this._className ? (" " + this._className) : "") + "'";
        s += ">";
        return s;
    };
}

DT_ToggleButton._imageUrls      = [];    // list of all image names passed into ctor
DT_ToggleButton._createdObjHash = {};    // key=name, value=obj created w/that name

DT_ToggleButton._callBackThunk = function(eltId, imgObj) {
    var btnObj = DT_ToggleButton._createdObjHash[eltId];
    var newState = imgObj.src.indexOf(btnObj._onStateImgUrl) >= 0 ? "off" : "on";

    if (btnObj._callBackFunction(newState, imgObj)) {
        if (newState == "off") {
            imgObj.src = btnObj._offStateImgUrl;
        } else {
            imgObj.src = btnObj._onStateImgUrl;
        }
    }
};

DT_ToggleButton.generatePreloadScript = function() {  // todo: move to ToolBar
    var strs = [];
    for (var i = 0; i < DT_ToggleButton._imageUrls.length; ++i) {
        strs.push("var _ToggleButtonImg" + i + " = new Image(); _ToggleButtonImg" + i + ".src = \"" + DT_ToggleButton._imageUrls[i] + "\"");
    }
    return strs.join("\n");
};

DT_ToggleButton.preloadImages = function() {
    eval(DT_ToggleButton.generatePreloadScript());
};
