function Columnizer() {
    this._list = [];

    //========================================================================
    this.add = function(item, cellClassName) {
        this._list.push([item, cellClassName]);
    };

    //========================================================================
    // numCols is advisory - you might get fewer in degenerate cases (e.g. _list.length == 6 && numCols == 4)
    this.generate = function(numCols) {
        var lines = [];
        lines.push("<table>");

        var numRows = Math.ceil(this._list.length / numCols);
        for (var row = 0; row < numRows; ++row) {
            var i = row;
            var s = "<tr>";
            for (var col = 0; col < numCols; ++col) {
                var curCell = this._list[i];
                if (curCell && curCell[0]) {
                    s += "<td" + (curCell[1] ? " class='" + curCell[1] + "'" : "") + ">" + curCell[0] + "</td>";
                } else { // have run out of data
                    s += "<td>&nbsp;</td>";
                }
                i += numRows;
            }
            s += "</tr>";
            lines.push(s);
        }

        lines.push("</table>");

        return lines.join("\n");
    };

    /**
     * Generates a table from a list of data.  The data are arranged into 'numCols' column groups,
     * each of 'cellsPerColumn' cells.
     */
    this.generate2 = function(numCols, cellsPerColumn)
    {
        var i, TDs = [];
        for (i = 0; i < cellsPerColumn; ++i) {
            TDs.push("<td" + (arguments[i + 2] ? " class='" + arguments[i + 2] + "'" : "") + ">");
        }

        var lines = [];
        lines.push("<table>");

        var numRows = Math.ceil(Math.ceil(this._list.length / cellsPerColumn) / numCols);
        for (var row = 0; row < numRows; ++row) {
            var s = "<tr>";

            for (var colGroup = 0; colGroup < numCols; ++colGroup) {
                i = (row * cellsPerColumn) +               // account for column group stride
                    (numRows * colGroup * cellsPerColumn); // account for row stride
                for (var col = 0; col < cellsPerColumn; ++col) {
                    var curCell = this._list[i];
                    if (curCell && curCell[0]) {
                        s += "<td" + (curCell[1] ? " class='" + curCell[1] + "'" : "") + ">" + curCell[0] + "</td>";
                    } else { // have run out of data
                        s += "<td>&nbsp;</td>";
                    }
                    ++i;
                }
            }

            s += "</tr>";
            lines.push(s);
        }

        lines.push("</table>");

        return lines.join("\n");
    };
}
