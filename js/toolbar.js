// Dependencies:
//    data files
//    util.js
//    prototype.js
//    squadrons.js
//    activeUnits.js

// {{{ Utility functions
function adjustDate(numDays) {
    var d = $F("dateSelect");
    var m = $F("monthSelect");
    var y = $F("yearSelect");

    // Javascript doesn't allow dates before 1970.  But it turns out that 1972 and 1916 have the same
    // "shape", so we'll map 1916 <=> 1972, 1917 <=> 1973, etc.
    y = y - 1916 + 1972;

    var msec = new Date(y, m - 1, d).getTime();
    msec += (numDays * (1000 * 60 * 60 * 24)); // # msec per day
    var prevDate = new Date();
    prevDate.setTime(msec);

    if (prevDate.getFullYear() <= 1971) {
        alert("No data available for years before 1916");
    // TODO: better range checking
    } else {
        setDate(prevDate.getFullYear() - 1972 + 1916, prevDate.getMonth() + 1, prevDate.getDate());
    }
}

// Gets list of units the user cares about into activeUnits.
// Updates the units dropdown list as it does so.
function makeActiveUnits() {
    // Out with the old...
    activeUnits.length = 0;

    var selElt = $("squadronSelect");
    while (selElt.length > 0) {
        selElt.remove(0);
    }
    // Prototype's selElt.add() was failing with a "type mismatch" error, so I'm doing it manually
    var opt = selElt.options;
    opt[opt.length] = new Option("-- Select Squadron --", ""); // leave an option even if everything is turned off

    // ...in with the new.
    for (var i = 0; i < squadrons.length; ++i) {
        if (nationInfo[squadrons[i].nation].show) {
            var curUnit = squadrons[i];
            var curUnitName = UnitCollection.formatShort(curUnit.type, [ curUnit.n ]);

            activeUnits.push(curUnit);

            opt[opt.length] = new Option(curUnitName, i); // Prototype's selElt.add() was failing with a "type mismatch"
        }
    }
}

// 1916 <= y <= 1918, 1 <= m <= 12, 1 <= d <= 31
function setDate(y, m, d) {
    y = parseInt(y, 10);
    m = parseInt(m, 10);
    d = parseInt(d, 10);
    document.f.yearSelect.selectedIndex  = y - 1916;
    document.f.monthSelect.selectedIndex = m - 1;
    document.f.dateSelect.selectedIndex  = d - 1;
    curMapState.changeDate(y * 10000 + m * 100 + d);
}
// }}}
// {{{ Callbacks
function toggleAerodromes(newState) {
    curMapState.toggleUnselectedAerodromes(newState);
    return true;
}

function toggleBelgianInfo(newState) {
    nationInfo.BE.show = !nationInfo.BE.show;
    makeActiveUnits();
    curMapState.initialize();
    return true;
}

function toggleBritishInfo(newState) {
    nationInfo.BR.show = !nationInfo.BR.show;
    nationInfo.AU.show = !nationInfo.AU.show; // handle the other Commonwealth country, too
    makeActiveUnits();
    curMapState.initialize();
    return true;
}

function toggleCityNames(newState) {
    newState == "off" ? $("cityNamesDiv").hide() : $("cityNamesDiv").show();
    return true;
}

function toggleGermanInfo(newState) {
    nationInfo.GE.show = !nationInfo.GE.show;
    makeActiveUnits();
    curMapState.initialize();
    return true;
}

function toggleUSInfo(newState) {
    nationInfo.US.show = !nationInfo.US.show;
    makeActiveUnits();
    curMapState.initialize();
    return true;
}

function toggleRivers(newState) {
    newState == "off" ? $("riversDiv").hide() : $("riversDiv").show();
    return true;
}

function changedType()
{
    displayType = $F("displayType");

    curMapState.cleanup();

    setToolBarForMode(displayType);

    switch (displayType) {
    case "byAerodrome":  curMapState = mapStateByAerodrome;  break;
    case "byDate":       curMapState = mapStateByDate;       break;
    case "bySquadron":   curMapState = mapStateBySquadron;   break;
    default:
    }
    curMapState.initialize();
}

function changedDate()
{
    adjustDate(0);
}

function changedYear()
{
    adjustDate(0);
}

function changedMonth()
{
    adjustDate(0);
}

function prevDay() {
    var d = $F("dateSelect");
    var m = $F("monthSelect");
    var y = $F("yearSelect");
    var i = endChangeDates.binarySearch(formatDateAsInt(y, m, d));
    var dateStr;
    if (i < 0) {  // current date falls between known dates
        dateStr = "" + endChangeDates[Math.abs(i) - 2];  // -1 for binarySearch return handling + -1 to back up to prev entry
    } else if (i === 0) { // current date is before any of the known dates -- nothing to do
        // TODO: error handling
    } else { // exact match for current date was found in list
        dateStr = "" + endChangeDates[i - 1];
    }
    var dateInfo = splitDate(dateStr);
    setDate(dateInfo[0], dateInfo[1], dateInfo[2]);
}

function nextDay() {
    var dateStr;
    var d = $F("dateSelect");
    var m = $F("monthSelect");
    var y = $F("yearSelect");
    var i = startChangeDates.binarySearch(formatDateAsInt(y, m, d));
    if (i < 0) {  // current date falls between known dates
        dateStr = "" + startChangeDates[Math.abs(i)];
    } else if (i === 0) { // current date is before any of the known dates -- nothing to do
        // TODO: error handling
    } else { // exact match for current date was found in list
        dateStr = "" + startChangeDates[i + 1];
    }
    var dateInfo = splitDate(dateStr);
    setDate(dateInfo[0], dateInfo[1], dateInfo[2]);
}

function choseAerodrome() {
    var newAerodrome = $F("aerodromeSelect");
    if (newAerodrome) {
        curMapState.selectAerodrome(gazetteer[newAerodrome].id);
    }
}

function choseSquadron() {
    var squadronId = $F("squadronSelect");
    if (squadronId) {
        curMapState.selectSquadron(squadronId);
    }
}
// }}}
// {{{ Toolbar setup
// Dropdown data arrays
var displayType = "init";
var daysArray = [];  for (var i = 1; i <= 31; ++i) { daysArray.push("" + i); }
var monthsArray = ["Jan=1", "Feb=2", "Mar=3", "Apr=4",  "May=5",  "Jun=6",
                   "Jul=7", "Aug=8", "Sep=9", "Oct=10", "Nov=11", "Dec=12"];
var displayTypeOptionsArray = ["-- Display type --=init",
                               "By Aerodrome=byAerodrome",
                               "By Date=byDate",
                               "By Squadron=bySquadron"];
var aerodromeNamesArray = [ "-- Select Aerodrome --=" ];
for (var name in gazetteer) {
    if (gazetteer[name] && typeof(gazetteer[name]) != "string" && gazetteer[name].loc) {
        aerodromeNamesArray.push(name);
    }
}
var squadronNamesArray = [ "-- Select Squadron --=" ];

var allModesClassName = "init byAerodrome byDate bySquadron";
var toolBar = new DT_Toolbar("#D60121", "#E0E0E0");

// All toolbars have the display type dropdown
toolBar.add(new DT_Spacer(4, allModesClassName));
toolBar.add(new DT_Select("displayType", displayTypeOptionsArray, displayType, changedType, allModesClassName));
toolBar.add(new DT_Spacer(12, allModesClassName));

// byAerodrome controls
toolBar.add(new DT_Select("aerodromeSelect", aerodromeNamesArray, "", choseAerodrome, "byAerodrome"));
toolBar.add(new DT_Spacer(4, "byAerodrome"));
toolBar.add(new DT_ToggleButton("showAerodromes", "images/aerodromes_on.png", "images/aerodromes_off.png",
                                toggleAerodromes, "Toggle Unselected Aerodromes", "byAerodrome"));

// byDate controls
toolBar.add(new DT_PushButton("prevday", "images/prevday_on.png", "prevDay", "Previous Day with Changes", "byDate"));
toolBar.add(new DT_Select("dateSelect", daysArray, "2", changedDate, "byDate"));
toolBar.add(new DT_Select("monthSelect", monthsArray, "4", changedMonth, "byDate"));
toolBar.add(new DT_Select("yearSelect", ["1916", "1917", "1918"], "1917", changedYear, "byDate"));
toolBar.add(new DT_PushButton("nextday", "images/nextday_on.png", "nextDay", "Next Day with Changes", "byDate"));

// bySquadron controls
toolBar.add(new DT_Select("squadronSelect", squadronNamesArray, "", choseSquadron, "bySquadron"));

// Nationality controls
toolBar.add(new DT_Spacer(12, allModesClassName));
toolBar.add(new DT_ToggleButton("be", "images/be_on.png", "images/be_off.png", toggleBelgianInfo, "Toggle Belgian Info", allModesClassName));
toolBar.add(new DT_ToggleButton("br", "images/br_on.png", "images/br_off.png", toggleBritishInfo, "Toggle British Info", allModesClassName));
toolBar.add(new DT_ToggleButton("ge", "images/ge_on.png", "images/ge_off.png", toggleGermanInfo, "Toggle German Info", allModesClassName));
//toolBar.add(new DT_ToggleButton("us", "images/us_on.png", "images/us_off.png", toggleUSInfo, "Toggle U.S. Info", allModesClassName));

// map controls
toolBar.add(new DT_Spacer(12, allModesClassName));
toolBar.add(new DT_ToggleButton("names",   "images/citynames_on.png", "images/citynames_off.png", toggleCityNames, "Toggle Cities", allModesClassName));
toolBar.add(new DT_ToggleButton("rivers",  "images/rivers_on.png", "images/rivers_off.png", toggleRivers, "Toggle Rivers", allModesClassName));

toolBar.add(new DT_Spacer(12, allModesClassName));
toolBar.add(new DT_Link("Help", "help.html", allModesClassName + " help"));

DT_ToggleButton.preloadImages();
// }}}
// {{{ setToolBarForMode
function setToolBarForMode(modeName) {
    $("toolBarDiv")
        .getElementsBySelector("img", "select")
        .each( function(item) { item.classNames().include(modeName) ? item.show() : item.hide(); } );
}
// }}}

