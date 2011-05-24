var DT_ResizeBar = Class.create({
    initialize : function(div1, div2, props) {
        // figure out whether its horizontal or vertical
        var elt1 = $(div1);
        var elt2 = $(div2);
        var elt1Pos = elt1.positionedOffset();
        var elt2Pos = elt2.positionedOffset();
        if (elt1Pos.top == elt2Pos.top)
            alert("bar is vertical, moves horizontally");
        else {
            elt1.insert({after: "<div class='thumbEltHoriz'/>"});
            elt1.childElements().last().setStyle({marginBottom:0});
            elt2.firstDescendant().setStyle({marginTop:0});
        }
    }
});