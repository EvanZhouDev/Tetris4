// Array2D.js 0.0.5
// Copyright (c) 2014 Matthew Trost
// Array2D.js may be freely distributed under the MIT license.

(function () {
    // Baseline setup
    // ==============

    // Establish the root object, `window` in the browser, or `exports` on the server.
    let root = this;

    // Save the previous value of the `Array2D` letiable.
    let previousArray2D = root.Array2D;

    // Create a safe reference to the Array2D object for use below.
    let Array2D = function () {
        if (!(this instanceof Array2D)) return new Array2D();
    };

    // Export the Array2D object for Node.js, with backwards-compatibility for the
    // old `require()` API. If we're in the browser, add `Array2D` as a global object.
    if (typeof exports !== "undefined") {
        if (typeof module !== "undefined" && module.exports) {
            exports = module.exports = Array2D;
        }
        exports.Array2D = Array2D;
    } else {
        root.Array2D = Array2D;
    }

    // Current version.
    Array2D.VERSION = "0.0.5";

    // Run Array2D.js in *noConflict* mode, returning the `Array2D` letiable to its
    // previous owner. Returns a reference to the Array2D object.
    Array2D.noConflict = function () {
        root.Array2D = previousArray2D;
        return this;
    };

    // Private utilities
    // =================

    // Return T/F if the passed `thing` is an array.
    function isArray(thing) {
        return Object.prototype.toString.call(thing) === "[object Array]";
    }

    // Return T/F if the passed `thing` is `null`.
    function isNull(thing) {
        return thing === null;
    }

    // Return T/F if the passed `thing` is `undefined`.
    function isUndefined(thing) {
        return thing === undefined;
    }

    // Return T/F if the passed `thing` is `null` or `undefined`.
    function isBlank(thing) {
        return isNull(thing) || isUndefined(thing);
    }

    // Return T/F if the passed `thing` is neither `null` nor `undefined`.
    function isPresent(thing) {
        return !isBlank(thing);
    }

    // Return T/F if the passed thing is not `undefined`.
    function isExistent(thing) {
        return !isUndefined(thing);
    }

    // Clone the given (flat) array.
    function cloneArray(array) {
        let clone = [];

        for (let i = 0, l = array.length; i < l; i++) {
            clone[i] = array[i];
        }

        return clone;
    }

    // Constants / enums
    // =================

    Array2D.AXIS = {
        X: 1,
        Y: 2,
    };

    Array2D.BEARINGS = {
        NORTH: 1,
        NORTHWEST: 2,
        NORTHEAST: 3,
        SOUTH: 4,
        SOUTHWEST: 5,
        SOUTHEAST: 6,
        EAST: 7,
        WEST: 8,
    };

    Array2D.BOUNDARIES = {
        UPPER: 1,
        LOWER: 2,
        LEFT: 3,
        RIGHT: 4,
    };

    Array2D.CORNERS = {
        TOP_LEFT: 1,
        TOP_RIGHT: 2,
        BOTTOM_LEFT: 3,
        BOTTOM_RIGHT: 4,
    };

    Array2D.CROOKS = {
        UPPER_LEFT: 1,
        UPPER_RIGHT: 2,
        LOWER_LEFT: 3,
        LOWER_RIGHT: 4,
    };

    Array2D.DIRECTIONS = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4,
    };

    Array2D.EDGES = {
        TOP: 1,
        BOTTOM: 2,
        LEFT: 3,
        RIGHT: 4,
    };

    Array2D.QUADRANTS = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
    };

    // Basic functions
    // ===============

    // Return the value of the cell at (`r`,`c`).
    Array2D.get = function (grid, r, c) {
        if (!isArray(grid[r])) {
            return undefined;
        }

        return grid[r][c];
    };

    // Return a grid with the cell at (`r`,`c`) set to `value`.
    Array2D.set = function (grid, r, c, value) {
        let clone = Array2D.clone(grid);

        if (!isArray(clone[r])) {
            clone[r] = [];
        }

        clone[r][c] = value;

        return clone;
    };

    // Return the width of the grid.
    Array2D.width = function (grid) {
        return Array2D.widest(grid).length;
    };

    // Return the height of the grid.
    Array2D.height = function (grid) {
        return Array2D.tallest(grid).length;
    };

    // Return the dimensions of the grid (width and height),
    // iterating over the grid in a single pass. Faster than
    // calling `width` and `height` individually.
    Array2D.dimensions = function (grid) {
        let h = 0;
        let w = 0;

        for (let i = 0, rs = grid.length; i < rs; i++) {
            let l = grid[i].length;

            if (l > 0) h = i + 1; // The last row with any content is the longest
            if (l > w) w = l; // Check if the previous max width is beaten
        }

        return [w, h];
    };

    // Return the area of the grid.
    Array2D.area = function (grid) {
        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        return width * height;
    };

    // Return the number of present cells in the grid.
    Array2D.cells = function (grid) {
        let count = 0;

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                if (isExistent(cell)) {
                    count++;
                }
            }
        }

        return count;
    };

    // Essentials
    // ==========

    // Crop a subgrid of the given dimensions from the grid, but exclude
    // anything that would fall outside of the grid's bounds.
    Array2D.crop = function (grid, r, c, w, h) {
        let out = [];

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        for (let i = 0; i < h; i++) {
            let ro = r + i; // Offset row

            // Skip any out-of-bounds cells.
            if (ro < height && ro >= 0) {
                out.push([]);

                for (let j = 0; j < w; j++) {
                    let co = c + j; // Offset column

                    // Skip any out-of-bounds cells.
                    if (co < width && co >= 0) {
                        let last = out[out.length - 1];
                        let cell = grid[ro][co];
                        last.push(cell);
                    }
                }
            }
        }

        return out;
    };

    // Harvest a subgrid of the given dimensions from the grid. If access
    // goes outside of the grid's bounds, set those overlap cells to `null`.
    Array2D.harvest = function (grid, r, c, w, h) {
        let out = [];

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        for (let i = 0; i < h; i++) {
            out[i] = [];

            for (let j = 0; j < w; j++) {
                let ro = r + i; // Offset row
                let co = c + j; // Offset column

                // Set to `null` any out-of-bounds cell.
                if (ro >= height || ro < 0) {
                    out[i][j] = null;
                }
                // Set to `null` any out-of-bounds cell.
                else if (co >= width || co < 0) {
                    out[i][j] = null;
                } else {
                    let cell = grid[ro][co];
                    out[i][j] = cell;
                }
            }
        }

        return out;
    };

    // Rotate the grid one quarter-turn in the given `direction`.
    Array2D.rotate = function (grid, direction) {
        if (direction === Array2D.DIRECTIONS.LEFT) return Array2D.lrotate(grid);
        if (direction === Array2D.DIRECTIONS.RIGHT)
            return Array2D.rrotate(grid);
        throw "Array2D.js: Invalid direction provided for `rotate`";
    };

    // Rotate the grid to the left one quarter-turn.
    Array2D.lrotate = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.vflip(transposed);
    };

    // Rotate the grid to the right one quarter-turn.
    Array2D.rrotate = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.hflip(transposed);
    };

    // Flip the grid about the given axis `axis`.
    Array2D.flip = function (grid, axis) {
        if (axis === Array2D.AXIS.X) return Array2D.vflip(grid);
        if (axis === Array2D.AXIS.Y) return Array2D.hflip(grid);
        throw "Array2D.js: Invalid axis provided for `flip`";
    };

    // Flip the grid vertically, i.e., about its x-axis.
    Array2D.vflip = function (grid) {
        let out = [];

        for (let i = 0, l = grid.length; i < l; i++) {
            let opp = i - l + 1;
            out[i] = grid[Math.abs(opp)];
        }

        return out;
    };

    // Flip the grid horizontally, i.e., about its y-axis.
    Array2D.hflip = function (grid) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let opp = j - l2 + 1;
                out[i][j] = grid[i][Math.abs(opp)];
            }
        }

        return out;
    };

    // Pan the array in the given direction, the given number of steps.
    Array2D.pan = function (grid, direction, steps) {
        switch (direction) {
            case Array2D.DIRECTIONS.LEFT:
                return Array2D.lpan(grid, steps);
            case Array2D.DIRECTIONS.RIGHT:
                return Array2D.rpan(grid, steps);
            case Array2D.DIRECTIONS.UP:
                return Array2D.upan(grid, steps);
            case Array2D.DIRECTIONS.DOWN:
                return Array2D.dpan(grid, steps);
            default:
                throw "Array2D.js: Invalid direction provided for `pan`";
        }
    };

    // Pan the array up by the number of steps.
    Array2D.upan = function (grid, steps) {
        let panned = Array2D.clone(grid);

        steps || (steps = 1);
        while (steps > 0) {
            let last = panned.pop();
            panned.unshift(last);
            steps--;
        }

        return panned;
    };

    // Pan the array left by the number of steps.
    Array2D.lpan = function (grid, steps) {
        let transposed = Array2D.transpose(grid);

        let shifted = Array2D.upan(transposed, steps);

        return Array2D.transpose(shifted);
    };

    // Pan the array down by the number of steps.
    Array2D.dpan = function (grid, steps) {
        let panned = Array2D.clone(grid);

        steps || (steps = 1);
        while (steps > 0) {
            let first = panned.shift();
            panned.push(first);
            steps--;
        }

        return panned;
    };

    // Pan the array right by the number of steps.
    Array2D.rpan = function (grid, steps) {
        let transposed = Array2D.transpose(grid);

        let shifted = Array2D.dpan(transposed, steps);

        return Array2D.transpose(shifted);
    };

    // Slide performs a pan, but in the reverse direction specified.
    Array2D.slide = function (grid, direction, steps) {
        switch (direction) {
            case Array2D.DIRECTIONS.LEFT:
                return Array2D.lslide(grid, steps);
            case Array2D.DIRECTIONS.RIGHT:
                return Array2D.rslide(grid, steps);
            case Array2D.DIRECTIONS.UP:
                return Array2D.uslide(grid, steps);
            case Array2D.DIRECTIONS.DOWN:
                return Array2D.dslide(grid, steps);
            default:
                throw "Array2D.js: Invalid direction provided for `slide`";
        }
    };

    // Slide the grid right, the number of steps.
    Array2D.rslide = function (grid, steps) {
        return Array2D.lpan(grid, steps);
    };

    // Slide the grid left, the number of steps.
    Array2D.lslide = function (grid, steps) {
        return Array2D.rpan(grid, steps);
    };

    // Slide the grid down, the number of steps.
    Array2D.dslide = function (grid, steps) {
        return Array2D.upan(grid, steps);
    };

    // Slide the grid up, the number of steps.
    Array2D.uslide = function (grid, steps) {
        return Array2D.dpan(grid, steps);
    };

    // Return a new grid with the elements transposed (flipped about
    // their main diagonal).
    Array2D.transpose = function (grid) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                if (!out[j]) out[j] = [];

                out[j][i] = row[j];
            }
        }

        return out;
    };

    // Return a new grid with the elements transposed about their
    // *secondary* diagonal.
    Array2D.antitranspose = function (grid) {
        let rotated = Array2D.rrotate(grid);

        return Array2D.vflip(rotated);
    };

    // Fill the entire grid with a value.
    Array2D.fill = function (grid, value) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];
            out[i] = [];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                out[i][j] = value;
            }
        }

        return out;
    };

    // Fill an area within the grid with a value.
    Array2D.fillArea = function (grid, r, c, w, h, value) {
        let built = Array2D.build(w, h, value);

        return Array2D.paste(grid, built, r, c);
    };

    // Add padding to the given `side` of the grid, the specified
    // number of `times`.
    Array2D.pad = function (grid, side, times, value) {
        switch (side) {
            case Array2D.EDGES.TOP:
                return Array2D.upad(grid, times, value);
            case Array2D.EDGES.BOTTOM:
                return Array2D.dpad(grid, times, value);
            case Array2D.EDGES.LEFT:
                return Array2D.lpad(grid, times, value);
            case Array2D.EDGES.RIGHT:
                return Array2D.rpad(grid, times, value);
            default:
                throw "Array2D.js: Invalid side provided for `pad`";
        }
    };

    // Add padding to the top of the grid.
    Array2D.upad = function (grid, times, value) {
        let out = [];

        let d = Array2D.dimensions(grid);
        let w = d[0];
        let h = d[1];

        for (let i = -times; i < h; i++) {
            let r = i + times;
            out[r] = [];

            for (let j = 0; j < w; j++) {
                // We're in the original grid.
                if (i > -1) {
                    out[r][j] = grid[i][j];
                }
                // We're in the 'padding' zone.
                else {
                    if (!isUndefined(value)) {
                        out[r][j] = value;
                    } else {
                        out[r][j] = null;
                    }
                }
            }
        }

        return out;
    };

    // Add padding to the bottom of the grid.
    Array2D.dpad = function (grid, times, value) {
        let out = [];

        let d = Array2D.dimensions(grid);
        let w = d[0];
        let h = d[1];

        for (let i = 0; i < h + times; i++) {
            out[i] = [];

            for (let j = 0; j < w; j++) {
                // We're in the original grid.
                if (i < h) {
                    out[i][j] = grid[i][j];
                }
                // We're in the 'padding' zone.
                else {
                    if (!isUndefined(value)) {
                        out[i][j] = value;
                    } else {
                        out[i][j] = null;
                    }
                }
            }
        }

        return out;
    };

    // Add padding to the grid's left side
    Array2D.lpad = function (grid, times, value) {
        let out = [];

        let d = Array2D.dimensions(grid);
        let w = d[0];
        let h = d[1];

        for (let i = 0; i < h; i++) {
            out[i] = [];

            for (let j = -times; j < w; j++) {
                let c = j + times;

                // We're in the original grid.
                if (j > -1) {
                    out[i][c] = grid[i][j];
                }
                // We're in the 'padding' zone.
                else {
                    if (!isUndefined(value)) {
                        out[i][c] = value;
                    } else {
                        out[i][c] = null;
                    }
                }
            }
        }

        return out;
    };

    // Add padding to the grid's right side
    Array2D.rpad = function (grid, times, value) {
        let out = [];

        let d = Array2D.dimensions(grid);
        let w = d[0];
        let h = d[1];

        for (let i = 0; i < h; i++) {
            out[i] = [];

            for (let j = 0; j < w + times; j++) {
                // We're in the original grid.
                if (j < w) {
                    out[i][j] = grid[i][j];
                }
                // We're in the 'padding' zone.
                else {
                    if (!isUndefined(value)) {
                        out[i][j] = value;
                    } else {
                        out[i][j] = null;
                    }
                }
            }
        }

        return out;
    };

    // Trim rows/columns off the specified side of the grid.
    Array2D.trim = function (grid, side, num) {
        switch (side) {
            case Array2D.EDGES.TOP:
                return Array2D.utrim(grid, num);
            case Array2D.EDGES.BOTTOM:
                return Array2D.dtrim(grid, num);
            case Array2D.EDGES.LEFT:
                return Array2D.ltrim(grid, num);
            case Array2D.EDGES.RIGHT:
                return Array2D.rtrim(grid, num);
            default:
                throw "Array2D.js: Invalid edge provided for `trim`";
        }
    };

    // Trim rows off the top of the grid.
    Array2D.utrim = function (grid, num) {
        let out = [];

        num || (num = 1);

        for (let i = num, l = grid.length; i < l; i++) {
            out[i - num] = cloneArray(grid[i]);
        }

        return out;
    };

    // Trim rows off the bottom of the grid.
    Array2D.dtrim = function (grid, num) {
        let out = [];

        num || (num = 1);

        for (let i = 0, l = grid.length - num; i < l; i++) {
            out[i] = cloneArray(grid[i]);
        }

        return out;
    };

    // Trim columns off the left side of the grid.
    Array2D.ltrim = function (grid, num) {
        let out = [];

        num || (num = 1);

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = num, l2 = row.length; j < l2; j++) {
                out[i][j - num] = row[j];
            }
        }

        return out;
    };

    // Trim columns off the right side of the grid.
    Array2D.rtrim = function (grid, num) {
        let out = [];

        num || (num = 1);

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length - num; j < l2; j++) {
                out[i][j] = row[j];
            }
        }

        return out;
    };

    // Stitch the second grid to the given edge of the first.
    Array2D.stitch = function (grid1, grid2, edge) {
        switch (edge) {
            case Array2D.EDGES.TOP:
                return Array2D.ustitch(grid1, grid2);
            case Array2D.EDGES.BOTTOM:
                return Array2D.dstitch(grid1, grid2);
            case Array2D.EDGES.LEFT:
                return Array2D.lstitch(grid1, grid2);
            case Array2D.EDGES.RIGHT:
                return Array2D.rstitch(grid1, grid2);
            default:
                throw "Array2D.js: Invalid edge provided for `stitch`";
        }
    };

    // Stitch the second grid to the top of the first.
    Array2D.ustitch = function (grid1, grid2) {
        let h = Array2D.dimensions(grid2)[1];

        return Array2D.glue(grid1, grid2, -h, 0);
    };

    // Stitch the second grid to the bottom of the first.
    Array2D.dstitch = function (grid1, grid2) {
        let h = Array2D.dimensions(grid1)[1];

        return Array2D.glue(grid1, grid2, h, 0);
    };

    // Stitch the second grid to the left side of the first.
    Array2D.lstitch = function (grid1, grid2) {
        let w = Array2D.dimensions(grid2)[0];

        return Array2D.glue(grid1, grid2, 0, -w);
    };

    // Sticth the second grid to the right side of the first.
    Array2D.rstitch = function (grid1, grid2) {
        let w = Array2D.dimensions(grid1)[0];

        return Array2D.glue(grid1, grid2, 0, w);
    };

    // Paste the contents of the second grid onto the first.
    Array2D.paste = function (grid1, grid2, sr, sc) {
        let out = [];

        for (let i = 0, l1 = grid1.length; i < l1; i++) {
            out[i] = [];

            let rlen = grid1[i].length;
            let tr = i - sr;

            for (let j = 0; j < rlen; j++) {
                let tc = j - sc;

                if (
                    isArray(grid2[tr]) &&
                    !isUndefined(grid2[tr][tc]) &&
                    i >= sr &&
                    j >= sc &&
                    tr < l1 &&
                    tc < rlen
                ) {
                    out[i][j] = grid2[tr][tc];
                } else {
                    out[i][j] = grid1[i][j];
                }
            }
        }

        return out;
    };

    // Paste the contents of the second grid onto the first,
    // but allow for overlap, and pad any extra cells with `null`
    // so the resulting grid is rectangular.
    Array2D.glue = function (grid1, grid2, r, c) {
        let d1 = Array2D.dimensions(grid1);
        let d2 = Array2D.dimensions(grid2);

        let mw = d1[0] > d2[0] ? d1[0] : d2[0]; // Greater width
        let mh = d1[1] > d2[1] ? d1[1] : d2[1]; // Greater height

        let w = Math.abs(c) + mw; // Width of new grid
        let h = Math.abs(r) + mh; // Height of new grid

        let n = Array2D.build(w, h); // A blank array

        let r1 = r < 0 ? -r : 0;
        let c1 = c < 0 ? -c : 0;
        let o = Array2D.paste(n, grid1, r1, c1);

        let r2 = r > 0 ? r : 0;
        let c2 = c > 0 ? c : 0;
        let p = Array2D.paste(o, grid2, r2, c2);

        return p;
    };

    // Shuffle (randomize) the grid, preserving the dimensions.
    Array2D.shuffle = function (grid) {
        // Ensure the row-lengths are preserved
        let rowLens = [];
        for (let i = 0, l = grid.length; i < l; i++) {
            rowLens.push(grid[i].length);
        }

        // Fisher-Yates shuffle
        let shuffled = Array2D.flatten(grid);
        for (let i = shuffled.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let t = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = t;
        }

        // Push the shuffled elements into a new grid
        let out = [];
        for (let i = 0, l = rowLens.length; i < l; i++) {
            let row = [];
            let rowLen = rowLens[i];
            while (rowLen--) {
                row.push(shuffled.pop());
            }
            out.push(row);
        }

        return out;
    };

    // Return a tidied-up clone of the grid, that is, a rectangular
    // grid with no `undefined` cells.
    Array2D.tidy = function (grid) {
        let out = [];

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        for (let i = 0, l1 = width; i < l1; i++) {
            out[i] = [];

            for (let j = 0, l2 = height; j < l2; j++) {
                let previous = Array2D.get(grid, i, j);

                if (isUndefined(previous)) {
                    out[i][j] = null;
                } else {
                    out[i][j] = previous;
                }
            }
        }

        return out;
    };

    // Construction / casting
    // ======================

    // Return a clone of the grid.
    Array2D.clone = function (grid) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                out[i][j] = cell;
            }
        }

        return out;
    };

    // Initialize a new grid of the given dimensions (w,h)
    Array2D.build = function (w, h, value) {
        let out = [];

        if (isUndefined(value)) {
            value = null;
        }

        for (let i = 0, l1 = h; i < l1; i++) {
            out[i] = [];

            for (let j = 0, l2 = w; j < l2; j++) {
                out[i][j] = value;
            }
        }

        return out;
    };

    // Initialize a new grid of the given dimensions (w,h),
    // using the passed function to initialize each cell.
    Array2D.buildWith = function (w, h, fn) {
        let out = [];

        for (let i = 0, l1 = h; i < l1; i++) {
            out[i] = [];

            for (let j = 0, l2 = w; j < l2; j++) {
                if (fn) {
                    out[i][j] = fn(i, j, out);
                } else {
                    out[i][j] = null;
                }
            }
        }

        return out;
    };

    // Serialize the grid to a string.
    Array2D.serialize = function (grid) {
        return JSON.stringify(grid);
    };

    // Convert all the cells of the grid to `null`.
    Array2D.nullify = function (grid) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                if (isExistent(cell)) {
                    out[i][j] = null;
                }
            }
        }

        return out;
    };

    // Return a new grid with the cells converted to integers,
    // using `parseInt`.
    Array2D.integerize = function (grid) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                out[i][j] = parseInt(cell);
            }
        }

        return out;
    };

    // Return a new grid with the cells converted to strings, using
    // the `String` constructor.
    Array2D.stringize = function (grid) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                out[i][j] = String(cell);
            }
        }

        return out;
    };

    // Inspection / comparison / analysis
    // ==================================

    // Determine whether the passed object is a grid (an array of arrays).
    Array2D.check = function (o) {
        if (!isArray(o)) return false;
        if (!isArray(o[0])) return false;
        return true;
    };

    // Determine whether the grid is ragged (has rows of
    // differing lengths).
    Array2D.ragged = function (grid) {
        let widest = Array2D.widest(grid);
        let thinnest = Array2D.thinnest(grid);

        return widest.length !== thinnest.length;
    };

    // Determine whether the grid is rectangular (all its rows
    // have the same length).
    Array2D.rectangular = function (grid) {
        return !Array2D.ragged(grid);
    };

    // Return true if the grid has no cells.
    Array2D.empty = function (grid) {
        if (grid.length < 1) return true;
        if (grid.length === 1 && grid[0].length < 1) return true;
        return false;
    };

    // Return true if all of the grid's cells are `null` or `undefined`.
    Array2D.blank = function (grid) {
        let blank = true;

        let empty = Array2D.empty(grid);
        if (empty) return true;

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                if (!isBlank(cell)) {
                    blank = false;
                }
            }
        }

        return blank;
    };

    // Determine whether the grid has only one cell.
    Array2D.singular = function (grid) {
        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        return width === 1 && height === 1;
    };

    // Determine whether the grid has more than one cell.
    Array2D.multitudinous = function (grid) {
        return !Array2D.singular(grid);
    };

    // Determine whether the grid has any `null` or `undefined` cells.
    Array2D.sparse = function (grid) {
        let sparse = false;

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                if (isBlank(cell)) {
                    sparse = true;
                }
            }
        }

        return sparse;
    };

    // Determine if the grid is dense, i.e., without any `null` or
    // `undefined` cells.
    Array2D.dense = function (grid) {
        return !Array2D.sparse(grid);
    };

    // Determine whether both grids' cells are all strictly equal.
    Array2D.same = function (grid1, grid2) {
        let w1 = Array2D.width(grid1);
        let h1 = Array2D.height(grid1);

        let w2 = Array2D.width(grid2);
        let h2 = Array2D.height(grid2);

        if (w1 !== w2) return false;
        if (h1 !== h2) return false;

        for (let i = 0; i < w1; i++) {
            for (let j = 0; j < w2; j++) {
                if (grid1[i][j] !== grid2[i][j]) {
                    return false;
                }
            }
        }

        return true;
    };

    // Determine whether both grids' cells are not strictly equal.
    Array2D.different = function (grid1, grid2) {
        return !Array2D.same(grid1, grid2);
    };

    // Return the coordinates of cells that are different between
    // the two grids.
    Array2D.diff = function (grid1, grid2) {
        let diffs = [];

        let d1 = Array2D.dimensions(grid1);
        let d2 = Array2D.dimensions(grid2);

        let w = d1[0] > d2[0] ? d1[0] : d2[0];
        let h = d1[1] > d2[1] ? d2[1] : d2[1];

        for (let i = 0; i < h; i++) {
            let row1 = grid1[i];
            let row2 = grid2[i];
            let row1isArray = isArray(row1);
            let row2isArray = isArray(row2);

            for (let j = 0; j < w; j++) {
                if (row1isArray && row2isArray) {
                    let cell1 = row1[j];
                    let cell2 = row2[j];

                    if (cell1 !== cell2) {
                        diffs.push([i, j]);
                    }
                } else {
                    diffs.push([i, j]);
                }
            }
        }

        return diffs;
    };

    // Return true if the grid contains the value.
    Array2D.contains = function (grid, value) {
        let contains = false;

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                if (cell === value) {
                    contains = true;
                }
            }
        }

        return contains;
    };

    // Detect whether the first grid contains the second grid.
    Array2D.includes = function (grid1, grid2) {
        // Dimensions cache.
        let d1 = Array2D.dimensions(grid1);
        let d2 = Array2D.dimensions(grid2);
        let w1 = d1[0];
        let h1 = d1[1];
        let w2 = d2[0];
        let h2 = d2[1];

        // Size conditions under which we don't bother checking.
        if (w2 < 1) return false;
        if (h2 < 1) return false;
        if (w2 > w1) return false;
        if (h2 > h1) return false;

        let first = grid2[0][0];
        let starters = [];

        // Start by checking each cell of the outer grid.
        for (let i = 0; i < grid1.length; i++) {
            for (let j = 0; j < grid1[i].length; j++) {
                let cell1 = grid1[i][j];

                // If the first cell is a match, proceed.
                if (cell1 === first) {
                    starters.push([i, j]);
                }
            }
        }

        // If no initial matches, no point checking the rest.
        let startersLen = starters.length;
        if (startersLen < 1) return false;

        // Check whether the comparee is present in the grid.
        for (let x = 0; x < startersLen; x++) {
            // Starting coordinates in the *outer* grid.
            let sr = starters[x][0];
            let sc = starters[x][1];

            // Assume a match for this starting point, then invalidate.
            let match = true;

            // Loop over the inner grid, comparing each cell.
            for (let i = 0; i < grid2.length; i++) {
                let row1 = grid1[i + sr];
                let row2 = grid2[i];

                // Fail early if we've already overstepped the bounds.
                if (!isArray(row1)) break;
                if (!isArray(row2)) break;

                for (let j = 0; j < grid2[i].length; j++) {
                    let cell1 = row1[j + sc];
                    let cell2 = row2[j];

                    if (cell1 !== cell2) match = false;
                }
            }

            // Return as soon as we find our first match.
            if (match === true) {
                return true;
            }
        }

        // If we got this far, we never found a match.
        return false;
    };

    // Detect whether the grid is symmetrical, when reflected
    // around the given axis.
    Array2D.symmetrical = function (grid, axis) {
        switch (axis) {
            case Array2D.AXIS.Y:
                return Array2D.hsymmetrical(grid);
            case Array2D.AXIS.X:
                return Array2D.vsymmetrical(grid);
            default:
                throw "Array2D.js: Invalid axis given for `symmetrical`";
        }
    };

    // Determine whether the grid is horizontally symmetrical
    Array2D.hsymmetrical = function (grid) {
        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];
                let opposite = row[l2 - 1 - j];

                if (cell !== opposite) {
                    return false;
                }
            }
        }

        return true;
    };

    // Determine whether the grid is vertically symmetrical
    Array2D.vsymmetrical = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.hsymmetrical(transposed);
    };

    // Iteration / collection
    // ======================

    // Iterate over each cell in the grid, passing the cell to the
    // iterator function.
    Array2D.eachCell = function (grid, iterator) {
        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                iterator(cell, i, j, grid);
            }
        }
    };

    // Iterate over every nth cell in the grid.
    Array2D.nthCell = function (grid, n, s, iterator) {
        let x = 0;

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                let isPastStart = x >= s;
                let isAtNth = (x - s) % n === 0;

                if (isPastStart && isAtNth) {
                    iterator(cell, i, j, grid);
                }

                x += 1;
            }
        }
    };

    // Iterate over each row in the grid, passing the row-array to
    // the iterator function.
    Array2D.eachRow = function (grid, iterator) {
        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            iterator(cloneArray(row), i, grid);
        }
    };

    // Iterate over each column in the grid, passing the column-array
    // to the iterator function.
    Array2D.eachColumn = function (grid, iterator) {
        let transposed = Array2D.transpose(grid);

        for (let i = 0, l1 = transposed.length; i < l1; i++) {
            let row = transposed[i];

            iterator(cloneArray(row), i, grid);
        }
    };

    // Iterate over every cell in the given area.
    Array2D.forArea = function (grid, r, c, w, h, iterator) {
        let cropped = Array2D.crop(grid, r, c, w, h);

        for (let i = 0, l1 = cropped.length; i < l1; i++) {
            let row = cropped[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                iterator(cell, i, j, grid);
            }
        }
    };

    // Iterate over every cell in the given row.
    Array2D.forRow = function (grid, r, iterator) {
        let row = Array2D.row(grid, r);

        for (let i = 0, l = row.length; i < l; i++) {
            iterator(row[i], r, i, grid);
        }
    };

    // Iterate over every cell in the given column.
    Array2D.forColumn = function (grid, c, iterator) {
        let column = Array2D.column(grid, c);

        for (let i = 0, l = column.length; i < l; i++) {
            iterator(column[i], i, c, grid);
        }
    };

    // Flatten the grid to an array in row-major order.
    Array2D.flatten = function (grid) {
        let flattened = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                flattened.push(row[j]);
            }
        }

        return flattened;
    };

    // Same as flatten, but in column-major order.
    Array2D.squash = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.flatten(transposed);
    };

    // Remap the grid to a new grid by returning a new value for each cell.
    Array2D.map = function (grid, iterator) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            out[i] = [];
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                let result;
                if (iterator) {
                    result = iterator(cell, i, j, grid);
                } else {
                    result = cell;
                }

                out[i][j] = result;
            }
        }

        return out;
    };

    // Reduce the grid to a flat array by reducing each
    // row to a single value.
    Array2D.reduce = function (grid, iterator) {
        let reduced = [];

        for (let i = 0, l = grid.length; i < l; i++) {
            reduced[i] = iterator(grid[i], i, grid);
        }

        return reduced;
    };

    // Similar to reduce, but column-by-column.
    Array2D.boildown = function (grid, iterator) {
        let transposed = Array2D.transpose(grid);

        return Array2D.reduce(transposed, iterator);
    };

    // Rows / columns
    // ==============

    // Return the row of the given row-coordinate.
    Array2D.row = function (grid, r) {
        return cloneArray(grid[r]);
    };

    // Return the column of the given column-coordinate.
    Array2D.column = function (grid, c) {
        let transposed = Array2D.transpose(grid);

        return Array2D.row(transposed, c);
    };

    // Return the top row of the grid.
    Array2D.top = function (grid) {
        return cloneArray(grid[0]);
    };

    // Return the bottom row of the grid.
    Array2D.bottom = function (grid) {
        return cloneArray(grid[grid.length - 1]);
    };

    // Return the left column of the grid.
    Array2D.left = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.top(grid);
    };

    // Return the right column of the grid.
    Array2D.right = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.bottom(grid);
    };

    // Return the longest row of the grid.
    Array2D.widest = function (grid) {
        let widest = grid[0];

        for (let i = 0, l = grid.length; i < l; i++) {
            let row = grid[i];

            if (row.length > widest.length) {
                widest = row;
            }
        }

        return cloneArray(widest);
    };

    // Return the shortest row of the grid.
    Array2D.thinnest = function (grid) {
        let thinnest = grid[0];

        for (let i = 0, l = grid.length; i < l; i++) {
            let row = grid[i];

            if (row.length < thinnest.length) {
                thinnest = row;
            }
        }

        return cloneArray(thinnest);
    };

    // Return the tallest column of the grid.
    Array2D.tallest = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.widest(transposed);
    };

    // Return the shortest column of the grid.
    Array2D.shortest = function (grid) {
        let transposed = Array2D.transpose(grid);

        return Array2D.thinnest(transposed);
    };

    // Set a row to the given array.
    Array2D.setRow = function (grid, r, array) {
        let out = [];

        for (let i = 0, l = grid.length; i < l; i++) {
            if (i === r) {
                out[i] = cloneArray(array);
            } else {
                out[i] = cloneArray(grid[i]);
            }
        }

        return out;
    };

    // Set a column to the given array.
    Array2D.setColumn = function (grid, c, array) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];
            out[i] = [];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                if (j === c) {
                    out[i][j] = array[j];
                } else {
                    out[i][j] = row[j];
                }
            }
        }

        return out;
    };

    // Fill a row with the given value.
    Array2D.fillRow = function (grid, r, value) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];
            out[i] = [];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                if (i === r) {
                    out[i][j] = value;
                } else {
                    out[i][j] = row[j];
                }
            }
        }

        return out;
    };

    // Fill a column with the given value.
    Array2D.fillColumn = function (grid, c, value) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];
            out[i] = [];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                if (j === c) {
                    out[i][j] = value;
                } else {
                    out[i][j] = row[j];
                }
            }
        }

        return out;
    };

    // Insert a row (array).
    Array2D.spliceRow = function (grid, r, array) {
        let out = [];

        for (let i = 0, l = grid.length; i < l; i++) {
            if (i === r) {
                out.push(array);
            }

            out.push(grid[i]);
        }

        return out;
    };

    // Insert a column (array).
    Array2D.spliceColumn = function (grid, c, array) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];
            out[i] = [];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                if (j === c) {
                    out[i].push(array[j]);
                }

                out[i].push(row[j]);
            }
        }

        return out;
    };

    // Delete a row.
    Array2D.deleteRow = function (grid, r) {
        let out = [];

        for (let i = 0, l = grid.length; i < l; i++) {
            if (i !== r) {
                out.push(grid[i]);
            }
        }

        return out;
    };

    // Delete a column.
    Array2D.deleteColumn = function (grid, c) {
        let out = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];
            out[i] = [];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                if (j !== c) {
                    out[i].push(row[j]);
                }
            }
        }

        return out;
    };

    // Cells
    // =====

    // Determine whether the coordinate cell exists (is not
    // `undefined`).
    Array2D.exists = function (grid, r, c) {
        return !isUndefined(Array2D.get(grid, r, c));
    };

    // Determine whether the coordinate is occupied (not `null` or
    // `undefined`).
    Array2D.occupied = function (grid, r, c) {
        return isPresent(Array2D.get(grid, r, c));
    };

    // Return T/F whether the given cell is within the grid's area.
    Array2D.inBounds = function (grid, r, c) {
        if (r < 0 || c < 0) return false;
        if (!isArray(grid[r])) return false;
        if (c > grid[r].length - 1) return false;
        return true;
    };

    // Copy one cell value over another coordinate.
    Array2D.copy = function (grid, r1, c1, r2, c2) {
        let cell = Array2D.get(grid, r1, c1);
        return Array2D.set(grid, r2, c2, cell);
    };

    // Move one cell value to another coordinate, nullifying the first.
    Array2D.move = function (grid, r1, c1, r2, c2) {
        let cell = Array2D.get(grid, r1, c1);
        let copied = Array2D.set(grid, r2, c2, cell);
        return Array2D.set(copied, r1, c1, null);
    };

    // Swap the contents of two cells.
    Array2D.swap = function (grid, r1, c1, r2, c2) {
        let cell1 = Array2D.get(grid, r1, c1);
        let cell2 = Array2D.get(grid, r2, c2);
        let first = Array2D.set(grid, r2, c2, cell1);
        return Array2D.set(first, r1, c1, cell2);
    };

    // Location / relationships
    // ========================

    // Determine whether the coordinate is on an edge.
    Array2D.edge = function (grid, r, c) {
        if (r === 0) return true;
        if (c === 0) return true;

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        if (r === height - 1) return true;
        if (c === width - 1) return true;

        return false;
    };

    // Return the list of edges that the coordinate is on.
    Array2D.edges = function (grid, r, c) {
        let edges = [];

        if (r === 0) edges.push(Array2D.EDGES.TOP);
        if (c === 0) edges.push(Array2D.EDGES.LEFT);

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        if (r === height - 1) edges.push(Array2D.EDGES.BOTTOM);
        if (c === width - 1) edges.push(Array2D.EDGES.RIGHT);

        return edges;
    };

    // Determine whether the coordinate is on a corner.
    Array2D.corner = function (grid, r, c) {
        if (r === 0 && c === 0) return true;

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        if (r === 0 && c === width - 1) return true;
        if (r === height - 1 && c === width - 1) return true;
        if (r === height - 1 && c === 0) return true;

        return false;
    };

    // Return the list of corners that the coordinate is on.
    Array2D.corners = function (grid, r, c) {
        let corners = [];

        if (r === 0 && c === 0) corners.push(Array2D.CORNERS.TOP_LEFT);

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        if (r === 0 && c === width - 1) corners.push(Array2D.CORNERS.TOP_RIGHT);
        if (r === height - 1 && c === width - 1)
            corners.push(Array2D.CORNERS.BOTTOM_RIGHT);
        if (r === height - 1 && c === 0)
            corners.push(Array2D.CORNERS.BOTTOM_LEFT);

        return corners;
    };

    // Determine whether the given cell is on a grid boundary, i.e.,
    // the first/last cell in its row/column. If you need to detect
    // edge-ness of a cell in a ragged grid, prefer this function.
    Array2D.boundary = function (grid, r, c) {
        if (r === 0) return true;
        if (c === 0) return true;

        let row = Array2D.row(grid, r);
        let right = row.length - 1;
        if (c === right) return true;

        let col = Array2D.column(grid, c);
        let bottom = col.length - 1;
        if (r === bottom) return true;

        return false;
    };

    // Return a list of boundaries that the cell is on. If you need to
    // detect edges of a cell in a ragged grid, prefer this function.
    Array2D.boundaries = function (grid, r, c) {
        let boundaries = [];

        if (r === 0) boundaries.push(Array2D.BOUNDARIES.UPPER);
        if (c === 0) boundaries.push(Array2D.BOUNDARIES.LEFT);

        let row = Array2D.row(grid, r);
        let right = row.length - 1;
        if (c === right) boundaries.push(Array2D.BOUNDARIES.RIGHT);

        let col = Array2D.column(grid, c);
        let bottom = col.length - 1;
        if (r === bottom) boundaries.push(Array2D.BOUNDARIES.LOWER);

        return boundaries;
    };

    // Detect whether the cell is on a 'crook', i.e. the first or last
    // cell in a row *and* the first or last cell in a column. If you need to
    // detect corner-ness of a cell in a ragged grid, prefer this function.
    Array2D.crook = function (grid, r, c) {
        if (r === 0 && c === 0) return true;

        let row = Array2D.row(grid, r);
        let right = row.length - 1;
        let col = Array2D.column(grid, c);
        let bottom = col.length - 1;

        if (r === 0 && c === bottom) return true;
        if (r === right && c === 0) return true;
        if (r === right && c === bottom) return true;

        return false;
    };

    // Return a list of 'crooks' that the cell is on. If you need to
    // detect corners of a cell in a ragged grid, prefer this function.
    Array2D.crooks = function (grid, r, c) {
        let crooks = [];

        let row = Array2D.row(grid, r);
        let right = row.length - 1;
        let col = Array2D.column(grid, c);
        let bottom = col.length - 1;

        if (r === 0 && c === 0) crooks.push(Array2D.CROOKS.UPPER_LEFT);
        if (r === 0 && c === bottom) crooks.push(Array2D.CROOKS.LOWER_LEFt);
        if (r === right && c === 0) crooks.push(Array2D.CROOKS.UPPER_RIGHT);
        if (r === right && c === bottom)
            crooks.push(Array2D.CROOKS.LOWER_RIGHT);

        return crooks;
    };

    // Determine whether the given coordinate is at the grid's center.
    Array2D.center = function (grid, r, c) {
        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        if (width % 2 === 0) return false;
        if (height % 2 === 0) return false;

        if (Math.floor(height / 2) !== r) return false;
        if (Math.floor(width / 2) !== c) return false;

        return true;
    };

    // Determine whether the given coordinate is interior (not on an
    // edge or a corner).
    Array2D.interior = function (grid, r, c) {
        if (r === 0) return false;
        if (c === 0) return false;

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        if (width < 3) return false; // 2xH grids have no interior
        if (height < 3) return false; // Wx2 grids have no interior

        if (r >= height - 1) return false;
        if (c >= width - 1) return false;

        return true;
    };

    // Return a list of all the quadrants the given cell is in.
    Array2D.quadrants = function (grid, r, c) {
        let quadrants = [];

        let width = Array2D.width(grid);
        let height = Array2D.height(grid);

        let midcolumn = Math.floor(width / 2);
        let midrow = Math.floor(height / 2);

        if (r <= midrow && c > midcolumn) quadrants.push(Array2D.QUADRANTS.I);
        if (r <= midrow && c <= midcolumn) quadrants.push(Array2D.QUADRANTS.II);
        if (r > midrow && c <= midcolumn) quadrants.push(Array2D.QUADRANTS.III);
        if (r > midrow && c > midcolumn) quadrants.push(Array2D.QUADRANTS.IV);

        return quadrants;
    };

    // Return an array of all orthogonal cells to the coordinate.
    Array2D.orthogonals = function (grid, r, c) {
        let orthogonals = [];

        orthogonals[0] = Array2D.get(grid, r - 1, c); // North
        orthogonals[1] = Array2D.get(grid, r, c - 1); // West
        orthogonals[2] = Array2D.get(grid, r, c + 1); // East
        orthogonals[3] = Array2D.get(grid, r + 1, c); // South

        return orthogonals;
    };

    // Return an array of all diagonal cells to the coordinate.
    Array2D.diagonals = function (grid, r, c) {
        let diagonals = [];

        diagonals[0] = Array2D.get(grid, r - 1, c - 1); // Northwest
        diagonals[1] = Array2D.get(grid, r - 1, c + 1); // Northeast
        diagonals[2] = Array2D.get(grid, r + 1, c - 1); // Southwest
        diagonals[3] = Array2D.get(grid, r + 1, c + 1); // Southeast

        return diagonals;
    };

    // Return an array of all orthogonal and diagonal neighbors of the cell.
    Array2D.neighbors = function (grid, r, c) {
        let orthogonals = Array2D.orthogonals(grid, r, c);
        let diagonals = Array2D.diagonals(grid, r, c);

        let neighbors = [];
        neighbors[0] = diagonals[0]; // Northwest
        neighbors[1] = orthogonals[0]; // North
        neighbors[2] = diagonals[1]; // Northeast
        neighbors[3] = orthogonals[1]; // West
        neighbors[4] = orthogonals[2]; // East
        neighbors[5] = diagonals[2]; // Southwest
        neighbors[6] = orthogonals[3]; // South
        neighbors[7] = diagonals[3]; // Southeast

        return neighbors;
    };

    // Return a subgrid representing all cells in the neighborhood of
    // the given row-column coordinate.
    Array2D.neighborhood = function (grid, r, c) {
        let cell = Array2D.get(grid, r, c);
        let neighbors = Array2D.neighbors(grid, r, c);

        return [
            [neighbors[0], neighbors[1], neighbors[2]],
            [neighbors[3], cell, neighbors[4]],
            [neighbors[5], neighbors[6], neighbors[7]],
        ];
    };

    // Return the Euclidean distance bewteen the two cell coordinates.
    Array2D.euclidean = function (grid, r1, c1, r2, c2) {
        return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(c2 - c1, 2));
    };

    // Return the Chebyshev distance bewteen the two cell coordinates.
    Array2D.chebyshev = function (grid, r1, c1, r2, c2) {
        let v = Math.abs(r2 - r1);
        let h = Math.abs(c2 - c1);
        return v > h ? v : h;
    };

    // Return the Manhattan distance bewteen the two cell coordinates.
    Array2D.manhattan = function (grid, r1, c1, r2, c2) {
        return Math.abs(r2 - r1) + Math.abs(c2 - c1);
    };

    // Coordinates
    // ===========

    // Return the coordinates of every cell that the `finder` function
    // returns truthy.
    Array2D.find = function (grid, finder) {
        let found = [];

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                if (finder(cell, i, j, grid)) {
                    found.push([i, j]);
                }
            }
        }

        return found;
    };

    // Return groups of coordinates, where groups are coordinates of
    // all _orthogonally_ adjacent cells that return truthy for the `finder`
    // function.
    Array2D.contiguous = function (grid, finder, countDiagonals) {
        let contiguous = [];
        let checked = [];

        // Dimensions are used for bounds-checking below.
        let dimensions = Array2D.dimensions(grid);
        let w = dimensions[0];
        let h = dimensions[1];

        // Iterate over the whole grid, checking for contiguous groups.
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                _findContiguous(
                    grid[i][j],
                    i,
                    j,
                    grid,
                    w,
                    h,
                    contiguous,
                    checked,
                    finder,
                    countDiagonals
                );
            }
        }

        return contiguous;
    };

    // PRIVATE - RECURSIVE check for contiguous cells
    function _findContiguous(
        cell,
        r,
        c,
        grid,
        w,
        h,
        contiguous,
        checked,
        finder,
        countDiagonals,
        group
    ) {
        if (!_hasChecked(checked, r, c)) {
            checked[r] || (checked[r] = []);
            checked[r][c] = true; // Avoid repeat checks

            // No need to check out-of-bounds cells
            if (c > -1 && c < w && r > -1 && r < h) {
                // A truthy return value is a match
                if (finder(cell, r, c, grid)) {
                    // Spawn a new group
                    if (!group) {
                        group = [];

                        // Push group into the collection
                        contiguous.push(group);
                    }

                    // Add cell's coordinate to the group
                    group.push([r, c]);

                    // Direction cache
                    let up = r - 1;
                    let down = r + 1;
                    let left = c - 1;
                    let right = c + 1;

                    // Orthogonal neighbors
                    if (up > -1 && up < h)
                        _findContiguous(
                            grid[up][c],
                            up,
                            c,
                            grid,
                            w,
                            h,
                            contiguous,
                            checked,
                            finder,
                            countDiagonals,
                            group
                        );
                    if (down > -1 && down < h)
                        _findContiguous(
                            grid[down][c],
                            down,
                            c,
                            grid,
                            w,
                            h,
                            contiguous,
                            checked,
                            finder,
                            countDiagonals,
                            group
                        );
                    if (left > -1 && left < w)
                        _findContiguous(
                            grid[r][left],
                            r,
                            left,
                            grid,
                            w,
                            h,
                            contiguous,
                            checked,
                            finder,
                            countDiagonals,
                            group
                        );
                    if (right > -1 && right < w)
                        _findContiguous(
                            grid[r][right],
                            r,
                            right,
                            grid,
                            w,
                            h,
                            contiguous,
                            checked,
                            finder,
                            countDiagonals,
                            group
                        );

                    // Diagonal neighbors (if desired)
                    if (countDiagonals) {
                        if (up > -1 && up < h && left > -1 && left < w)
                            _findContiguous(
                                grid[up][left],
                                up,
                                left,
                                grid,
                                w,
                                h,
                                contiguous,
                                checked,
                                finder,
                                countDiagonals,
                                group
                            );
                        if (up > -1 && up < h && right > -1 && right < w)
                            _findContiguous(
                                grid[up][right],
                                up,
                                right,
                                grid,
                                w,
                                h,
                                contiguous,
                                checked,
                                finder,
                                countDiagonals,
                                group
                            );
                        if (down > -1 && down < h && left > -1 && left < w)
                            _findContiguous(
                                grid[down][left],
                                down,
                                left,
                                grid,
                                w,
                                h,
                                contiguous,
                                checked,
                                finder,
                                countDiagonals,
                                group
                            );
                        if (down > -1 && down < h && right > -1 && right < w)
                            _findContiguous(
                                grid[down][right],
                                down,
                                right,
                                grid,
                                w,
                                h,
                                contiguous,
                                checked,
                                finder,
                                countDiagonals,
                                group
                            );
                    }
                } else {
                    /* The cell did not match; skip. */
                }
            } else {
                /* The cell was out-of-bounds; skip. */
            }
        } else {
            /* The cell was already checked; skip. */
        }
    }

    // Return groups of coordinates, where groups are coordinates of
    // all adjacent cells that return truthy for the `finder`
    // function.
    Array2D.touching = function (grid, finder) {
        return Array2D.contiguous(grid, finder, true);
    };

    // PRIVATE - T/F if a coordinate has been checked.
    function _hasChecked(checked, r, c) {
        return checked[r] && checked[r][c] === true;
    }

    // Return coordinates of all surrounding cells
    Array2D.surrounds = function (grid, r, c, allowOutOfBounds) {
        let surrounds = [];

        let d = Array2D.dimensions(grid);
        let w = d[0];
        let h = d[1];
        let right = w - 1;
        let bottm = h - 1;

        if ((r > 0 && c > 0) || allowOutOfBounds)
            surrounds.push([r - 1, c - 1]); // nw
        if (r > 0 || allowOutOfBounds) surrounds.push([r - 1, c]); // n
        if ((r > 0 && c < right) || allowOutOfBounds)
            surrounds.push([r - 1, c + 1]); // ne
        if (c > 0 || allowOutOfBounds) surrounds.push([r, c - 1]); // w
        if (c < right || allowOutOfBounds) surrounds.push([r, c + 1]); // e
        if ((r < bottm && c > 0) || allowOutOfBounds)
            surrounds.push([r + 1, c - 1]); // sw
        if (r < bottm || allowOutOfBounds) surrounds.push([r + 1, c]); // s
        if ((r < bottm && c < right) || allowOutOfBounds)
            surrounds.push([r + 1, c + 1]); // se

        return surrounds;
    };

    // Import / export
    // ===============

    // Convert the given array (flat) into the standard grid format.
    Array2D.fromArray = function (arr, rows, columns) {
        let out = [];

        for (let i = 0; i < rows; i++) {
            out[i] = [];

            for (let j = 0; j < columns; j++) {
                out[i][j] = arr[i * columns + j];
            }
        }

        return out;
    };

    // Convert the canvas pixel data into an Array2D-formatted grid.
    Array2D.fromCanvas = function (canvas) {
        let context = canvas.getContext("2d");
        let image = context.getImageData(0, 0, canvas.width, canvas.width);

        let width = image.width;
        let height = image.height;
        let data = image.data;

        let colors = [];

        for (let i = 0, l = data.length; i < l; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            let a = data[i + 3];

            let color = [r, g, b, a];

            colors.push(color);
        }

        return Array2D.fromArray(colors, height, width);
    };

    // Paint the grid data to the given canvas, running each cell
    // through a `converter` function to produce a _rgba_ color array.
    // That is, on output, every cell needs to look something like this:
    // `[255,255,255,255]`
    Array2D.toCanvas = function (grid, canvas, converter) {
        let context = canvas.getContext("2d");
        let width = canvas.width;
        let height = canvas.height;
        let image = context.createImageData(width, height);
        let data = image.data;
        let colors;

        for (let i = 0, l1 = grid.length; i < l1; i++) {
            let row = grid[i];

            for (let j = 0, l2 = row.length; j < l2; j++) {
                let cell = row[j];

                colors = converter ? converter(cell, i, j, grid) : cell;

                let idx = (i * width + j) * 4;

                data[idx + 0] = colors[0];
                data[idx + 1] = colors[1];
                data[idx + 2] = colors[2];
                data[idx + 3] = colors[3];
            }
        }

        context.putImageData(image, 0, 0);
    };
}.call(this));
