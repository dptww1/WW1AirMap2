/*global $, $$, Columnizer, JSGraphics, UnitCollection,
         aerodromeCalendar, createAerodromeDivs,
         activeUnits, curMapState, formatDate, gazetteer, jsGraphics,
         makeOverlibCompatibleStr, nationInfo,
         overlib, setOpacity, squadrons, unitList, wordWrap */
// Dependencies:
//      jquery.js
//      unitcollection.js
//      columnizer.js
//      ...probably others

var UNSELECTED_AERODROME_OPACITY = 0.3;

//========================================================================
// For some reason I couldn't do this in-line -- all divs ended up with the same tooltip text!
//------------------------------------------------------------------------
function tooltipClosure(tip) {
    return function() { return overlib(tip); };
}

function hideHighlightForDiv(locIdStr) {
    $("#aerodromeHighlightDiv").hide();
}

function showHighlightForDiv(locIdStr) {
    var hiDiv = $("#aerodromeHighlightDiv");
    var curDiv = $("#" + locIdStr);
    if (hiDiv.size() && curDiv.size()) {
        hiDiv[0].onmouseenter = curDiv[0].onmouseenter; // make sure any underlying tooltip shows up

        hiDiv.show();

        var curDivPos = curDiv.position();
        curDivPos.top += $("#mapContainerDiv").scrollTop() - 1;
        curDivPos.left += $("#mapContainerDiv").scrollLeft() - 1;
        hiDiv.css(curDivPos);
    }
}

function highlightAerodromeName(locIdStr) {
    $("." + locIdStr + "Name").each(function() { $(this).css('backgroundColor', '#eecc00'); });
    showHighlightForDiv(locIdStr);
}

function unhighlightAerodromeName(locIdStr) {
    $("." + locIdStr + "Name").each(function() { $(this).css('backgroundColor', '#b4ba76'); });
    hideHighlightForDiv(locIdStr);
}

//========================================================================
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
        visibilityStr == "visible" ? $('div.aerodromeDiv').show() : $('div.aerodromeDiv').hide();
    };
}
var mapStateInit = new MapState();
curMapState = mapStateInit;

//========================================================================
function MapStateBySquadron() {
    this.initialize = function() {
        createAerodromeDivs();
        $("div.aerodromeDiv").each(function(idx, elt) { $(elt).hide(); setOpacity($(elt), 1.0); });
        if (!this.ctx) {
            this.canvas = $("#drawCanvas")[0];
            this.ctx = this.canvas.getContext("2d");
        }
    };

    this.clearCanvas = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.cleanup = function() {
        this.clearCanvas();
        this.canvas = null;
        this.ctx = null;
    };

    this.selectSquadron = function(unitIdx) {
        var curNationInfo = nationInfo[squadrons[unitIdx].nation];

        this.clearCanvas();
        this.ctx.beginPath();
        this.ctx.fillStyle = curNationInfo.color;
        this.setAllAerodromeDivVisibility("hidden");

        var mapContainerDiv = $("#mapContainerDiv")[0];

        var seen = {};

        var s = "<table cellpadding='1' cellspacing='0' border='0'>";
        var places = squadrons[unitIdx].locs;
        if (places) {
            var prevX = null, prevY = null;
            for (var i = 0; i < places.length; ++i) {
                s += "<tr>";
                s += "<td class='squadronDate'>" + formatDate(places[i][1]) + " - " + formatDate(places[i][2]) + "</td>";
                s += "<td class='squadronLoc";
                var id            = null;
                var gazetteerName = gazetteer[places[i][0]];
                if (gazetteerName && typeof(gazetteerName) != "string") {
                    id = gazetteerName.id;
                    s += " " + id + "Name'";
                    s += " onmouseenter='highlightAerodromeName(  \"" + id + "\")'";
                    s += " onmouseleave ='unhighlightAerodromeName(\"" + id + "\")";
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

                var aerodromeDiv = $("#" + id)[0];
                if (aerodromeDiv) {
                    $(aerodromeDiv).find("img").attr("src", curNationInfo.aerodrome_image);
                    $(aerodromeDiv).show();
                    var thisX = parseInt($(aerodromeDiv).position().left, 10) + ($(aerodromeDiv).width() / 2);
                    var thisY = parseInt($(aerodromeDiv).position().top,  10) + ($(aerodromeDiv).height() / 2);

                    // Need to account for the mapDiv's scroll offset
                    thisX += mapContainerDiv.scrollLeft;
                    thisY += mapContainerDiv.scrollTop;

                    if (prevX === null || prevY === null) {
                        this.ctx.moveTo(thisX, thisY);
                    } else {
                        this.ctx.lineTo(thisX, thisY);
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
                        aerodromeDiv.onmouseenter = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                    } else { // already processed this aerodrome once before
                        toolTipHtml = seen[id] + "<br>" + formatDate(places[i][1]) + " -- " + formatDate(places[i][2]);
                        aerodromeDiv.onmouseenter = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                    }

                    seen[id] = toolTipHtml;

                } else {
                    prevX = null;
                    prevY = null;
                }
            }
        }

        this.ctx.stroke();

        s += "</table>";
        $("#emptyDiv").html(s);
    };
}
MapStateBySquadron.prototype = new MapState();
var mapStateBySquadron = new MapStateBySquadron();

//========================================================================
function MapStateByDate() {
    this.initialize = function() {
        createAerodromeDivs();
        $("div.aerodromeDiv").each( function(idx, elt) { $(elt).hide(); setOpacity($(elt), 1.0); });
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
                if (!unitLists[loc]) {
                    unitLists[loc] = new UnitCollection();
                }
                unitLists[loc].add(curUnit.nation, curUnit.type, curUnit.n);
            }
        }

        // Now set the tooltips and visibility for the used locations
        for (loc in unitLists) if (unitLists.hasOwnProperty(loc)) {
            var div;
            if ((div = $('#' + gazetteer[loc].id)[0]) !== null) {
                // Make location name safe to enclose in single quotes
                var toolTipHtml = "<center><b>" + loc + "</b></center>";

                var locationObj = gazetteer[loc];
                if (locationObj.notes) {
                    toolTipHtml += "<hr size='1'>";
                    toolTipHtml += "<center>" + wordWrap(locationObj.notes, 80, "<br>") + "</center>";
                }

                toolTipHtml += "<hr size='1'>";
                toolTipHtml += unitLists[loc].getListShort("; ");

                $(div).find("img")[0].src = nationInfo[unitLists[loc].getNations()[0]].aerodrome_image;
                $(div).on("mouseenter", tooltipClosure(makeOverlibCompatibleStr(toolTipHtml)));
                $(div).show();
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
                               " onmouseenter='highlightAerodromeName(  \"" + locAsId + "\")'" +
                               " onmouseleave ='unhighlightAerodromeName(\"" + locAsId + "\")");
            }
        }
        $("#emptyDiv").html(columnizer.generate2(5, 2));
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

//========================================================================
function MapStateByAerodrome() {
    this.initialize = function() {
        createAerodromeDivs();
        this.curSelectedAerodromeDiv = null;

        var columnizer = new Columnizer();
        for (var locationName in gazetteer) if (gazetteer.hasOwnProperty(locationName)) {

            var locAsId = gazetteer[locationName].id;

            var div = $("#" + locAsId)[0];
            var locationObj = gazetteer[locationName];
            if (div) { // make sure we know about this aerodrome location
                $(div).hide(); // hide it until we've proved there's at least one active squadron there
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
                        $(div).find("img")[0].src = nationInfo[allDatesUnitCollection.getPreferredNation("GE")].aerodrome_image;
                        div.onmouseenter = tooltipClosure(makeOverlibCompatibleStr(toolTipHtml));
                        $(div).show();
                        columnizer.add(locationName,
                                       "squadronName " + locAsId + "Name'" +
                                       " onmouseenter='highlightAerodromeName(  \"" + locAsId + "\")'" +
                                       " onmouseleave ='unhighlightAerodromeName(\"" + locAsId + "\")");
                        columnizer.add(allDatesUnitCollection.getListShort("; "), "squadronLoc");
                    }
                    // otherwise do nothing -- no currently-active nationality's units at this location
                }
            }
        }
        $("#emptyDiv").html(columnizer.generate2(3, 2));
    };

    this.cleanup = function() {
        $("#aerodromeHighlightDiv").hide();
    };

    this.selectAerodrome = function(aerodromeName) {
        var hilightDiv = $("#aerodromeHighlightDiv")[0];

        // Unhighlight old selected aerodrome, if any
        if (this.curSelectedAerodromeDiv) {
            $(this.curSelectedAerodromeDiv).removeClass("selectedAerodrome");
            setOpacity(this.curSelectedAerodromeDiv, UNSELECTED_AERODROME_OPACITY);
            $(this.curSelectedAerodromeDiv).css("visibility", this.curUnselectedAerodromeVisibilityStr);
            hideHighlightForDiv(aerodromeName);
        }

        // highlight selected aerodrome
        this.curSelectedAerodromeDiv = $("#" + aerodromeName)[0];
        if (hilightDiv && this.curSelectedAerodromeDiv) {
            setOpacity(this.curSelectedAerodromeDiv, 1.0);
            $(this.curSelectedAerodromeDiv).show();
            $(this.curSelectedAerodromeDiv).addClass("selectedAerodrome");
            showHighlightForDiv(aerodromeName);
        }
    };

    this.toggleUnselectedAerodromes = function(onOff) {
        $("div.aerodromeDiv").each(
            function(idx, elt) {
                if (!$(elt).hasClass("selectedAerodrome")) {
                    onOff === "on" ? $(elt).show() : $(elt).hide();
                }
            }
        );

        this.curUnselectedAerodromeVisibilityStr = onOff === "on" ? "visible" : "hidden";
    };

    this.curSelectedAerodromeDiv = null;
    this.curUnselectedAerodromeVisibilityStr = "visible";
}
MapStateByAerodrome.prototype = new MapState();
var mapStateByAerodrome = new MapStateByAerodrome();
