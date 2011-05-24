/*global $, $$, Columnizer, JSGraphics, UnitCollection,
         aerodromeCalendar, createAerodromeDivs,
         activeUnits, curMapState, formatDate, gazetteer, jsGraphics,
         makeOverlibCompatibleStr, nationInfo,
         overlib, setOpacity, squadrons, unitList, wordWrap */
// Dependencies:
//      prototype.js
//      unitcollection.js
//      columnizer
//      ...probably others

var UNSELECTED_AERODROME_OPACITY = 0.3;

// {{{ tooltipClosure
//========================================================================
// For some reason I couldn't do this in-line -- all divs ended up with the same tooltip text!
//------------------------------------------------------------------------
function tooltipClosure(tip) {
    return function() { return overlib(tip); };
}
// }}}
// {{{ Highlighting Callbacks
function hideHighlightForDiv(locIdStr) {
    $("aerodromeHighlightDiv").hide();
}

function showHighlightForDiv(locIdStr) {
    var hiDiv = $("aerodromeHighlightDiv");
    var curDiv = $(locIdStr);
    if (hiDiv && curDiv) {
        hiDiv.onmouseover = curDiv.onmouseover; // make sure any underlying tooltip shows up
        hiDiv.onmouseout  = curDiv.onmouseout;  // ...and goes away
        hiDiv.style.top   = curDiv.posY - 1;
        hiDiv.style.left  = curDiv.posX - 1;
        hiDiv.posX        = curDiv.posX - 1;
        hiDiv.posY        = curDiv.posY - 1;
        hiDiv.show();
    }
}

function highlightAerodromeName(locIdStr) {
    $$("." + locIdStr + "Name").each(function(x) { x.setStyle({backgroundColor: '#eecc00'});});
    showHighlightForDiv(locIdStr);
}

function unhighlightAerodromeName(locIdStr) {
    $$("." + locIdStr + "Name").each(function(x) { x.setStyle({backgroundColor: '#b4ba76'});});
    hideHighlightForDiv(locIdStr);
}
// }}}
// {{{ MapState
function MapState() {
    // Called when user first sets map to given state
    this.initialize = function() { createAerodromeDivs(); this.setAllAerodromeDivVisibility("hidden"); };

    // Called when exiting state
    this.cleanup = function() { };

    // Called when user selects an aerodrome
    this.selectAerodrome = function(aerodromeName) { };

    // Called when user selects a squadron
    this.selectSquadron = function(squadronId) { };

    // Called when user turns unselected aerodromes on or off
    this.toggleUnselectedAerodromes = function(onOff) { };

    // Called when month/day/year change; dateAsInt in YYYYMMDD format
    this.changeDate = function(dateAsInt) { };

    this.setAllAerodromeDivVisibility = function(visibilityStr) {
        $$('div.aerodromeDiv').invoke(visibilityStr == "visible" ? "show" : "hide");
    };

}
var mapStateInit = new MapState();
curMapState = mapStateInit;
// }}}
// {{{ MapStateBySquadron
//========================================================================
function MapStateBySquadron() {
    this.initialize = function() {
        createAerodromeDivs();
        $$("div.aerodromeDiv").each( function(x) { x.hide(); setOpacity(x, 1.0); });
        if (!this.jsCanvas) {
            this.jsCanvas = new JSGraphics("drawCanvasDiv");
        }
    };

    this.cleanup = function() {
        this.jsCanvas.clear();
        this.jsCanvas = null;
    };

    this.selectSquadron = function(unitIdx) {
        var curNationInfo = nationInfo[squadrons[unitIdx].nation];

        this.jsCanvas.clear();
        this.jsCanvas.setColor(curNationInfo.color);
        this.setAllAerodromeDivVisibility("hidden");

        var seen = {};

        var s = "<table cellpadding='1' cellspacing='0' border='0'>";
        var places = squadrons[unitIdx].locs;
        if (places) {
            var prevX = null, prevY = null;
            for (var i = 0; i < places.length; ++i) {
                s += "<tr>";
                s += "<td class='squadronDate'>" + formatDate(places[i][1]) + " - " + formatDate(places[i][2]) + "</td>";
                s += "<td class='squadronLoc";
                var gazetteerName = gazetteer[places[i][0]];
                var id            = gazetteer[gazetteerName];
                if (gazetteerName && typeof(gazetteerName) != "string") {
                    id = gazetteerName.id;
                    s += " " + id + "Name'";
                    s += " onmouseover='highlightAerodromeName(  \"" + id + "\")'";
                    s += " onmouseout ='unhighlightAerodromeName(\"" + id + "\")";
                }
                s += "'>" + places[i][0];
                if (!gazetteerName) {
                    s += " (unknown location)";
                }
                else if (typeof(gazetteerName) == "string") {
                    s += " (" + gazetteerName + ")";
                }
                s += "</td>";
                s += "</tr>";

                var aerodromeDiv = $(id);
                if (aerodromeDiv) {
                    aerodromeDiv.down().src = curNationInfo.aerodrome_image;
                    aerodromeDiv.show();
                    var thisX = parseInt(aerodromeDiv.style.left, 10) + (aerodromeDiv.style.width / 2);
                    var thisY = parseInt(aerodromeDiv.style.top,  10) + (aerodromeDiv.style.height / 2);

                    // Need to account for the mapDiv's scroll offset
                    var mapDiv = $("mapDiv");
                    thisX -= mapDiv.offsetLeft;
                    thisY -= mapDiv.offsetTop;

                    if (prevX !== null && prevY !== null) {
                        this.jsCanvas.drawLine(prevX, prevY, thisX, thisY);
                    }

                    prevX = thisX;
                    prevY = thisY;

                    // Make tooltip for the aerodrome div
                    var toolTipHtml;
                    if (!seen[id]) {
                        toolTipHtml = "<center><b>" + places[i][0] + "</b></center>";
                        var locationObj = gazetteer[places[i][0]];
                        if (locationObj.notes) {
                            toolTipHtml += "<hr size='1'>";
                            toolTipHtml += "<center>" + wordWrap(locationObj.notes, 80, "<br>") + "</center>";
                        }
                        toolTipHtml += "<hr size='1'>";
                        toolTipHtml += formatDate(places[i][1]) + " -- " + formatDate(places[i][2]);
                        aerodromeDiv.onmouseover = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                    } else { // already processed this aerodrome once before
                        toolTipHtml = seen[id] + "<br>" + formatDate(places[i][1]) + " -- " + formatDate(places[i][2]);
                        aerodromeDiv.onmouseover = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                    }

                    seen[id] = toolTipHtml;

                } else {
                    prevX = null;
                    prevY = null;
                }
            }
        }

        this.jsCanvas.paint();

        s += "</table>";
        $("emptyDiv").update(s);
    };

    this.jsCanvas = null;
}
MapStateBySquadron.prototype = new MapState();
var mapStateBySquadron = new MapStateBySquadron();
// }}}
// {{{ MapStateByDate
//========================================================================
function MapStateByDate() {
    this.initialize = function() {
        createAerodromeDivs();
        $$("div.aerodromeDiv").each( function(x) { x.hide(); setOpacity(x, 1.0); });
        this.changeDate(19170402);
    };

    this.changeDate = function(newDate) {
        this.setAllAerodromeDivVisibility("hidden");

        var loc, i, curUnit;

        // Coagulate all squadrons into single list per location
        var unitLists = { };  // key: location name  value: array of units
        for (i = 0; i < activeUnits.length; ++i) {  // TODO: .each()?
            curUnit = activeUnits[i];
            loc = this.findLocationAtDate(curUnit.locs, newDate);
            if (loc && gazetteer[loc] && gazetteer[loc].id) {
                if (!unitLists[loc]) /*then*/ { unitLists[loc] = new UnitCollection(); }
                unitLists[loc].add(curUnit.nation, curUnit.type, curUnit.n);
            }
        }

        // Now set the tooltips and visibility for the used locations
        for (loc in unitLists) if (unitLists.hasOwnProperty(loc)) {
            var div;
            if ((div = $(gazetteer[loc].id)) !== null) {
                // Make location name safe to enclose in single quotes
                var toolTipHtml = "<center><b>" + loc + "</b></center>";

                var locationObj = gazetteer[loc];
                if (locationObj.notes) {
                    toolTipHtml += "<hr size='1'>";
                    toolTipHtml += "<center>" + wordWrap(locationObj.notes, 80, "<br>") + "</center>";
                }

                toolTipHtml += "<hr size='1'>";
                toolTipHtml += unitLists[loc].getListShort("; ");

                div.down().src = nationInfo[unitLists[loc].getNations()[0]].aerodrome_image;
                div.onmouseover = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                div.show();
            }
        }

        // Now create the text listing
        var columnizer = new Columnizer();
        for (i = 0; i < activeUnits.length; ++i) {
            curUnit = activeUnits[i];
            loc = this.findLocationAtDate(curUnit.locs, newDate);
            if (loc) {
                var locAsId = gazetteer[loc] ? gazetteer[loc].id : "_";
                var locClassName = locAsId + "Name";
                columnizer.add(UnitCollection.formatShort(curUnit.type, [ curUnit.n ]), "squadronName");
                columnizer.add(loc,
                               "squadronLoc " + locClassName + "'" +
                               " onmouseover='highlightAerodromeName(  \"" + locAsId + "\")'" +
                               " onmouseout ='unhighlightAerodromeName(\"" + locAsId + "\")");
            }
        }
        $("emptyDiv").update(columnizer.generate2(5, 2));
    };

    this.findLocationAtDate = function(locsArray, inDate) {
        if (locsArray[0][1] <= inDate) {
            for (var i = 0; i < locsArray.length; ++i) {
                if (locsArray[i][1] <= inDate) {
                    if (inDate <= locsArray[i][2]) { // then inDate is within range of this record
                        return locsArray[i][0];
                    }
                } else {   // then inDate is between this record and the previous record
                    return null;
                    //return new Array("en route to", locsArray[i][0]);
                }
            }
        }
        return null; // squadron not formed yet
    };
}
MapStateByDate.prototype = new MapState();
var mapStateByDate = new MapStateByDate();
// }}}
// {{{ MapStateByAerodrome
//========================================================================
function MapStateByAerodrome() {
    this.initialize = function() {
        createAerodromeDivs();
        this.curSelectedAerodromeDiv = null;

        var columnizer = new Columnizer();
        for (var locationName in gazetteer) if (gazetteer.hasOwnProperty(locationName)) {

            var locAsId = gazetteer[locationName].id;

            var div = $(locAsId);
            var locationObj = gazetteer[locationName];
            if (div) { // make sure we know about this aerodrome location
                div.hide(); // hide it until we've proved there's at least one active squadron there
                var allDatesUnitCollection = new UnitCollection(); // union of all units over all dates at this airfield

                var locCalendar = aerodromeCalendar[locationName];
                if (locCalendar) {
                    // Make location name safe to enclose in single quotes
                    var toolTipHtml = "<center><b>" + locationName + "</b></center>";

                    if (locationObj.notes) {
                        toolTipHtml += "<hr size=1>";
                        toolTipHtml += "<center>" + wordWrap(locationObj.notes, 80, "<br>") + "</center>";
                    }

                    toolTipHtml += "<hr size=1>";
                    var unitStr = "";
                    for (var i = 0; i < locCalendar.length; ++i) {
                        var unitCollection = new UnitCollection();  // unit collection local to current date range
                        for (var j = 0; j < locCalendar[i][2].length; ++j) {
                            var thisUnit = locCalendar[i][2][j];
                            if (nationInfo[thisUnit[0]].show) {
                                unitCollection.add(thisUnit[0], thisUnit[1], thisUnit[2]);
                                allDatesUnitCollection.add(thisUnit[0], thisUnit[1], thisUnit[2]);
                            }
                        }
                        toolTipHtml += formatDate(locCalendar[i][0])
                                    + " -- "
                                    + formatDate(locCalendar[i][1])
                                    + "&nbsp;&nbsp;&nbsp;&nbsp;"
                                    + unitCollection.getListShort("; ")
                                    + "<br>";
                    }
                    if (!allDatesUnitCollection.isEmpty()) {
                        setOpacity(div, UNSELECTED_AERODROME_OPACITY);
                        div.down().src  = nationInfo[allDatesUnitCollection.getPreferredNation("GE")].aerodrome_image;
                        div.onmouseover = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                        div.show();
                        columnizer.add(locationName,
                                       "squadronName " + locAsId + "Name'" +
                                       " onmouseover='highlightAerodromeName(  \"" + locAsId + "\")'" +
                                       " onmouseout ='unhighlightAerodromeName(\"" + locAsId + "\")");
                        columnizer.add(allDatesUnitCollection.getListShort("; "), "squadronLoc");
                    }
                    // otherwise do nothing -- no currently-active nationality's units at this location
                }
            }
        }
        $("emptyDiv").update(columnizer.generate2(3, 2));
    };

    this.cleanup = function() {
        $("aerodromeHighlightDiv").hide();
    };

    this.selectAerodrome = function(aerodromeName) {
        var hilightDiv = $("aerodromeHighlightDiv");

        // Unhighlight old selected aerodrome, if any
        if (this.curSelectedAerodromeDiv) {
            this.curSelectedAerodromeDiv.removeClassName("selectedAerodrome");
            setOpacity(this.curSelectedAerodromeDiv, UNSELECTED_AERODROME_OPACITY);
            this.curSelectedAerodromeDiv.style.visibility = this.curUnselectedAerodromeVisibilityStr;
            hideHighlightForDiv(aerodromeName);
        }

        // highlight selected aerodrome
        this.curSelectedAerodromeDiv = $(aerodromeName);
        if (hilightDiv && this.curSelectedAerodromeDiv) {
            setOpacity(this.curSelectedAerodromeDiv, 1.0);
            this.curSelectedAerodromeDiv.show();
            this.curSelectedAerodromeDiv.addClassName("selectedAerodrome");
            showHighlightForDiv(aerodromeName);
        }
    };

    this.toggleUnselectedAerodromes = function(onOff) {
        var isSelectedAerodrome = function(elt) { return elt.hasClassName("selectedAerodrome"); };
        $$("div.aerodromeDiv").reject(isSelectedAerodrome).invoke(onOff == "on" ? "show" : "hide");

        this.curUnselectedAerodromeVisibilityStr = onOff == "on" ? "visible" : "hidden";
    };

    this.curSelectedAerodromeDiv = null;
    this.curUnselectedAerodromeVisibilityStr = "visible";
}
MapStateByAerodrome.prototype = new MapState();
var mapStateByAerodrome = new MapStateByAerodrome();
// }}}
