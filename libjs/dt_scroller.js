// Dependencies: prototype.js, utils.js

function DT_Scroller(divId, propertyHash) {
    this.beginScroll = function(ev) {
        this.isScrolling = true;
        this.mx = ev.clientX;
        this.my = ev.clientY;

        preventDefault(ev);

        return false;
    };

    this.endScroll = function(ev) {
        if (this.isScrolling) {
            preventDefault(ev);

            this.isScrolling = false;
        }
        return false;
    };

    this.clip = function(xyObj) {
        if (xyObj.x > 0)           { xyObj.x = 0; }
        if (xyObj.y > 0)           { xyObj.y = 0; }
        if (xyObj.x < -this.diffX) { xyObj.x = -this.diffX; }
        if (xyObj.y < -this.diffY) { xyObj.y = -this.diffY; }
        return xyObj;
    };

    this.doScroll = function(ev) {
        if (this.isScrolling) {
            preventDefault(ev);

            var dx = ev.clientX - this.mx;
            var dy = ev.clientY - this.my;

            var xyObj = this.clip({ x : this.scrollPosX + dx, y : this.scrollPosY + dy });

            dx = xyObj.x - this.scrollPosX;
            dy = xyObj.y - this.scrollPosY;

            if (dx || dy) {
                // Repositioning the "position: relative" element apparently resets all contained 
                // "position: absolute" elements to zero.  How convenient!
                this.scrollDivAbsolutes.each(
                    function(absoluteDiv) {
                        absoluteDiv.posX += dx;
                        absoluteDiv.style.left = absoluteDiv.posX;
                        absoluteDiv.posY += dy;
                        absoluteDiv.style.top  = absoluteDiv.posY;
                    }
                );

                this.scrollPosX = xyObj.x;
                this.scrollPosY = xyObj.y;

                this.mx = ev.clientX;
                this.my = ev.clientY;
            }

        }
        return false;
    };

    this.recomputeBounds = function(ev) {
        var img = this.scrollDiv.getElementsBySelector("img")[0];
        var dimImg = img.getDimensions();
        var dimDiv = this.scrollDiv.getDimensions();

        this.diffX = dimImg.width  - dimDiv.width;
        this.diffY = dimImg.height - dimDiv.height;
        
        return true;
    };

    this.scrollTo = function(xy) {
        this.isScrolling = true;

        // We want xy in the center of the visible area, if possible.
        var target = { 
                       x : this.scrollDiv.width / 2,
                       y : this.scrollDiv.height / 2 
        };
        
        this.isScrolling = false;
    };

    this.isScrolling = false;
    this.mx = 0;
    this.my = 0;
    this.scrollPosX = 0;
    this.scrollPosY = 0;

    this.scrollDiv = $(divId);
    this.scrollDivAbsolutes = this.scrollDiv.getElementsBySelector("div");
    this.scrollDivAbsolutes.each(function(d) {
                                     if (d.getStyle("position") == "absolute") {
                                         d.addClassName("absolute"); 
                                         if (typeof(d.posX) == "undefined") {
                                             d.posX = 0; 
                                             d.posY = 0; 
                                         }
                                     }
                                 });

    // Compute the bounding image
    this.recomputeBounds();

    this.scrollDiv.makeClipping();

    Event.observe(this.scrollDiv, "mousedown", this.beginScroll.bindAsEventListener(this));
    Event.observe(this.scrollDiv, "mouseout",  this.endScroll.bindAsEventListener(this));
    Event.observe(this.scrollDiv, "mouseup",   this.endScroll.bindAsEventListener(this));
    Event.observe(this.scrollDiv, "mousemove", this.doScroll.bindAsEventListener(this));
    Event.observe(window,         "resize",    this.recomputeBounds.bindAsEventListener(this));
}
