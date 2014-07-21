// Requires jquery.js

function UnitCollection() {

    this._map = {}; // keys => nationality ID
                    // values => {
                    //     keys  => unit type
                    //     values => { id1 => 1, id2 => 1, ... }
                    // }

    //========================================================================
    this.add = function(nationalityID, unitType, id, mouseOverFn) {
        if (unitType == "RAF" || unitType == "RNAS") { // boy, this is an ugly hack...
            unitType = "RFC";
        }

        if (!this._map[nationalityID]) {
            this._map[nationalityID] = {};
        }

        if (!this._map[nationalityID][unitType]) {
            this._map[nationalityID][unitType] = {};
        }

        this._map[nationalityID][unitType][id] = mouseOverFn;
    };

    //========================================================================
    this.getListShort = function(lineSeparator) {
        var nationIDs = _.keys(this._map);

        if (nationIDs.length === 0) {
            return "";
        }

        else if (nationIDs.length == 1) { // can omit nation ID
            return this._getNationListShort(nationIDs[0]);

        } else { // 2 or more nations in list
            var lines = [];
            var nationList = _.keys(this._map).sort();
            for (var i = 0; i < nationList.length; ++i) {
                var nationId = nationList[i];
                lines.push(nationId + ": " + this._getNationListShort(nationId));
            }
            return lines.join(lineSeparator);
        }
    };

    //========================================================================
    this.getNations = function() {
        return _.keys(this._map).sort();
    };

    //========================================================================
    // Returns the nation ID having the largest number of squadrons in the collection.
    // defaultValue if collection is empty
    //------------------------------------------------------------------------
    this.getPreferredNation = function(defaultVal) {
        var maxNation = defaultVal;
        var maxSize = -1;
        $.each(this._map,
               function(nationId, nationTypes) {
                   var nationSum = 0;
                   $.each(nationTypes,
                          function(_type, unitIds) {
                              nationSum += _.keys(unitIds.keys).length;
                          });
                   if (nationSum > maxSize) {
                       maxNation = nationId;
                       maxSize = nationSum;
                   }
               });
        return maxNation;
    };

    //========================================================================
    this.isEmpty = function() {
        return _.keys(this._map).length === 0;
    };

    //========================================================================
    this._getNationListShort = function(nationId) {
        var byTypeArray = [];

        var typeMap = this._map[nationId];
        var typeList = _.keys(typeMap).sort();
        for (var i = 0; i < typeList.length; ++i) {
            var curType = typeList[i];

            var idList = _.keys(typeMap[curType]).sort(UnitCollection.sort);

            byTypeArray.push(UnitCollection.formatShort(curType, idList));
        }
        return byTypeArray.join("; ");
    };
}

//========================================================================
UnitCollection.formatShort = function(type, idList) {
    var typeStrPre  = "";
    var typeStrPost = "";
    switch (type)
    {
    case "Chasse": typeStrPost = " Esc de Chasse";                               break;
    case "Jasta" : typeStrPre  = idList.length > 1 ? "Jastas " : "Jasta ";       break;
    case "MFJ"   : typeStrPre  = "MFJ ";                                         break;  // Marine Feld-Jagdstaffel
    case "AFC"   : typeStrPost = idList.length > 1 ? " Squadrons AFC" : " Squadron AFC"; break;
    case "RAF"   : // fall through
    case "RNAS"  : // fall through
    case "RFC"   : typeStrPost = idList.length > 1 ? " Squadrons" : " Squadron"; break;
    case "SEE"   : typeStrPre  = "SEE ";                                         break;  // Seefrontstaffel
    case "Sqdn"  : typeStrPost = idList.length > 1 ? " Sqdns"  : " Sqdn";        break;  // not actually used
    default:      alert("UnitCollection: unrecognized type '" + type + "'");
    }
    return typeStrPre + idList.join(",") + typeStrPost;
};

//========================================================================
UnitCollection.sort = function(a, b) {
    var intA = parseInt(a, 10);
    var intB = parseInt(b, 10);

    if (isNaN(intA))
        intA = 0;
    if (isNaN(intB))
        intB = 0;

    if (intA !== intB)
        return intA - intB;

    a += "";
    b += "";

    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
