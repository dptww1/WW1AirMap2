var refPts = {
    Amiens     : [ 220, 398 ],
    Antwerp    : [ 550,  72 ],
    Arras      : [ 295, 301 ],
    Brugge     : [ 372,  76 ],
    Brussels   : [ 539, 169 ],
    Cambrai    : [ 365, 331 ],
    Charleroi  : [ 556, 275 ],
    "Compi�gne": [ 299, 518 ],
    Gent       : [ 455, 115 ],
    Laon       : [ 423, 484 ],
    Lille      : [ 343, 217 ],
    Luxembourg : [ 810, 476 ],
    Metz       : [ 818, 598 ],
    Mulhouse   : [1006, 933 ],
    Paris      : [ 216, 654 ],
    Reims      : [ 486, 562 ],
    Soissons   : [ 374, 528 ],
    Strasbourg : [1068, 725 ],
    Verdun     : [ 690, 588 ]
};
var horizMilesPerPixel = 0.2857;
var vertMilesPerPixel  = 0.2857;

var createdDivs = false;
function createAerodromeDivs() {
    if (createdDivs) {
        return;
    }
    createdDivs = true;

    // Find mapContainerDiv, parent for all map-related divs
    var mapContainerDiv = $("mapContainerDiv");
    for (var locationName in gazetteer) {
        if (typeof(gazetteer[locationName]) == "object") {  // Non-western front locations have strings
            // Have coords for ref pt?
            var locationObj = gazetteer[locationName];
            var gazetteerData = locationObj.loc;

            if (!gazetteerData) {  // some aerodromes are in unknown locations
                continue;
            }

            var locationX = refPts[gazetteerData[0]][0] + Math.round(gazetteerData[1] / horizMilesPerPixel);
            var locationY = refPts[gazetteerData[0]][1] + Math.round(gazetteerData[2] / vertMilesPerPixel);
            if (refPts[gazetteerData[0]] && refPts[gazetteerData[0]].length > 0 && locationX > 0 && locationY > 0) {
                var newDiv = document.createElement("div");
                Element.extend(newDiv);
                newDiv.className = "aerodromeDiv absolute";
                newDiv.style.top      = locationY;
                newDiv.style.left     = locationX;
                newDiv.innerHTML      = "<img src='images/reddot.png' border='0' width='3' height='3'>";
                newDiv.onmouseout     = function() { return nd(); };
                newDiv.posX           = locationX; // internal housekeeping to avoid parseInt()s
                newDiv.posY           = locationY;

                // Make sure non-chars are squeezed out of location name for the id
                newDiv.id = strToLegalId(locationName);
                mapContainerDiv.appendChild(newDiv);
            }
        }
    }

    // create the highlight div, too
    var hiDiv = document.createElement("div");
    Element.extend(hiDiv);
    hiDiv.id        = "aerodromeHighlightDiv";
    hiDiv.className = "mapLayer";
    hiDiv.innerHTML = '<img src="images/dothilite.png" height="5" width="5" border="0">';
    hiDiv.posX      = 0;
    hiDiv.posY      = 0;
    mapContainerDiv.appendChild(hiDiv);
}
