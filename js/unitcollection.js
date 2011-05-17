// Requires prototype.js

function UnitCollection()
{
    this._map = $H(); // keys => nationality ID
                      // values => { keys unit type
                      //             values => { id1 => 1, id2 => 1, ... ] }

    //========================================================================
    this.add = function(nationalityID, unitType, id, mouseOverFn) {
        if (unitType == "RAF" || unitType == "RNAS") { // boy, this is an ugly hack...
            unitType = "RFC";
        }

        if (!this._map.get(nationalityID)) {
            this._map.set(nationalityID, $H());
        }

        if (!this._map.get(nationalityID).get(unitType)) {
            this._map.get(nationalityID).set(unitType, $H());
        }

        this._map.get(nationalityID).get(unitType).set(id, mouseOverFn);
    };

    //========================================================================
    this.getListShort = function(lineSeparator) {
        var nationIDs = this._map.keys();

        if (nationIDs.length === 0) {
            return "";
        }

        else if (nationIDs.length == 1) { // can omit nation ID
            return this._getNationListShort(nationIDs[0]);

        } else { // 2 or more nations in list
            var lines = [];
            var nationList = this._map.keys().sort();
            for (var i = 0; i < nationList.length; ++i) {
                var nationId = nationList[i];
                lines.push(nationId + ": " + this._getNationListShort(nationId));
            }
            return lines.join(lineSeparator);
        }
    };

    //========================================================================
    this.getNations = function() {
        return this._map.keys().sort();
    };

    //========================================================================
    // Returns the nation ID having the largest number of squadrons in the collection.
    // defaultValue if collection is empty
    //------------------------------------------------------------------------
    this.getPreferredNation = function(defaultVal) {
        var maxNation = defaultVal;
        var maxSize = -1;
        this._map.each(
                       function(nationTypesPair) {
                           var nationSum = 0;
                           nationTypesPair.value.each(
                                                      function(typeUnitPair) {
                                                          nationSum += typeUnitPair.value.keys().length;
                                                      });
                           if (nationSum > maxSize) {
                               maxNation = nationTypesPair.key;
                               maxSize = nationSum;
                           }
                       });
        return maxNation;
    };

    //========================================================================
    this.isEmpty = function() {
        return this._map.keys().length === 0;
    };

    //========================================================================
    this._getNationListShort = function(nationId) {
        var byTypeArray = [];

        var typeMap = this._map.get(nationId);
        var typeList = typeMap.keys().sort();
        for (var i = 0; i < typeList.length; ++i) {
            var curType = typeList[i];

            // beware squadron numbers like "5(N)" and "I"
            var idList = typeMap.get(curType).keys().sort(function(a,b){ 
                                                              a = "" + a;
                                                              b = "" + b;
                                                              if (a < b) return -1;
                                                              if (b < a) return 1;
                                                              return 0;
                                                           });
            
            byTypeArray.push(UnitCollection.formatShort(curType, idList));
        }
        return byTypeArray.join("; ");
    };
}

//========================================================================
UnitCollection.formatShort = function(type, idList)
{
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
