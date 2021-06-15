// Gets a piece from the list, removing it, then continues
// If there are no pieces left, resets
let getPiece = () => {
    // Pick random piece from available pieces
    let item = pieceBag[Math.floor(Math.random() * pieceBag.length)];

    // Removes that piece from the piecebag
    pieceBag.splice(pieceBag.indexOf(item), 1);

    // If there are no pieces left, then "refill" the piece bag
    if (pieceBag.length == 0) {
        pieceBag = ["i", "ml", "l", "o", "s", "t", "z"];
    }

    // Returns selected piece
    return item;
};

// Defines the Tetrimino class, used to refer to the moving piece
class Tetrimino {
    constructor(piece = queue[0]) {
        // If there is a specific piece defined, then use it. Otherwise, use whatever piece is up next queue-wise
        // Rotation state that piece is in (for wall kicks)
        this.rotStatus = 0;

        // Shape of piece
        this.name = piece;
        this.pattern = piecePatternList[this.name];

        // Position on board
        this.x = findPosition(this.name).x;
        this.y = findPosition(this.name).y;

        // Speed logic
        this.timeExists = 0;
        this.timeSimulated = 0;
    }

    // Used to check collision
    cellCollision = (
        arr,
        checkColl = false,
        x = this.x,
        y = this.y,
        pattern = this.pattern
    ) => {
        // Status, returned at end
        let status = {};

        // Using checkColl
        if (checkColl) {
            for (let [i, v] of pattern.entries()) {
                for (let [j, _v2] of v.entries()) {
                    if (pattern[i][j] !== 0) {
                        let boardX = x + j;
                        let boardY = y + i;

                        // Checks left border overlap
                        if (boardX < 0) {
                            status.overlap = true;
                        }

                        // Checks right border overlap
                        if (boardX + 1 > arr[0].length) {
                            status.overlap = true;
                        }

                        // Checks top border overlap
                        if (boardY < 0) {
                            status.overlap = true;
                        }

                        // Checks bottom border overlap
                        if (boardY + 1 > arr.length) {
                            status.overlap = true;
                        }

                        // Checks cell overlap if position is not illegal
                        if (
                            Array.isArray(arr[boardY]) &&
                            0 <= boardX <= arr[0].length
                        ) {
                            if (arr[boardY][boardX] !== 0) {
                                status.overlap = true;
                            }
                        }
                    }
                }
            }

            return status;
        }

        // Iterates over all of the cells
        // Nested for loop is necessary as using the Array2D.eachCell()
        // method does not allow use of continue
        for (let [i, v] of pattern.entries()) {
            for (let [j, v2] of v.entries()) {
                // Only do the following if the targeted cell is not a 0
                if (v2 !== 0) {
                    // Finds the position of the cell
                    let boardX = x + j;
                    let boardY = y + i;

                    // Checks left border overlap
                    if (boardX - 1 < 0) {
                        status.left = true;
                    }

                    // Checks right border overlap
                    if (boardX + 1 > arr[0].length - 1) {
                        status.right = true;
                    }

                    // Checks top border overlap
                    if (boardY - 1 < 0) {
                        status.top = true;
                    }

                    // Checks bottom border overlap
                    if (boardY + 1 > arr.length - 1) {
                        status.bottom = true;
                    }

                    // Only do the following checks if position is valid
                    // Checks left collision
                    if (!(boardX - 1 < 0)) {
                        if (arr[boardY][boardX - 1] !== 0) {
                            status.left = true;
                        }
                    }

                    // Checks right collision
                    if (!(boardX + 1 > arr[0].length - 1)) {
                        if (arr[boardY][boardX + 1] !== 0) {
                            status.right = true;
                        }
                    }

                    // Checks top collision
                    if (Array.isArray(arr[boardY - 1])) {
                        if (arr[boardY - 1][boardX] !== 0) {
                            status.top = true;
                        }
                    }

                    // Checks bottom collision
                    if (Array.isArray(arr[boardY + 1])) {
                        if (arr[boardY + 1][boardX] !== 0) {
                            status.bottom = true;
                        }
                    }
                }
            }
        }

        // Returns final status
        return status;
    };

    // Rotation of the piece
    rot = (lrotate = false) => {
        // Make sure to copy (and deep copy accordingly) variables in order to test

        // Makes sure to keep the rotation status before changing it as we need it later
        let rotStatusBefore = this.rotStatus;

        // Will change this variable later
        let rotStatusTest = this.rotStatus;

        // Deep copies this.pattern
        let previousPattern = Array2D.clone(this.pattern);

        // Rotate left or right?
        if (lrotate) {
            // First rotate the array
            previousPattern = Array2D.lrotate(previousPattern);

            // Change rotStatus
            rotStatusTest--;

            // If rotStatus is less than 0, set it to 3, as that is how the wallKick dict is defined
            if (rotStatusTest < 0) {
                rotStatusTest = 3;
            }
        } else {
            // First rotate the array
            previousPattern = Array2D.rrotate(previousPattern);

            // Change rotStatus
            rotStatusTest++;

            // If rotStatus is more than 3, set it to 0, as that is how the wallKick dict is defined
            if (rotStatusTest > 3) {
                rotStatusTest = 0;
            }
        }

        // The "o" piece does not need to worry about wall kicks
        if (this.name !== "o") {
            // Otherwise, execute wall kick if current condition is illegal
            // Make a rotKey variable, appending the current rotStatus to rotStatus before change
            let rotKey = "" + rotStatusBefore + rotStatusTest;

            // If the piece is an "i" piece, use a different set of data
            let wallKickDict =
                this.name == "i"
                    ? wallKick.iPiece[rotKey]
                    : wallKick.general[rotKey];

            // Repeat this for the all 5 checks
            for (let i = 1; i <= 5; i++) {
                // Checks collision in new position defined by the checks
                if (
                    Object.keys(
                        this.cellCollision(
                            stationary,
                            true,
                            this.x + wallKickDict[i][0],
                            this.y + wallKickDict[i][1],
                            previousPattern
                        )
                    ).length == 0
                ) {
                    // If the position works, then translate the piece to corresponding coordinates
                    this.x += wallKickDict[i][0];
                    this.y += wallKickDict[i][1];

                    // Actually rotates piece because position is valid
                    this.pattern = Array2D.clone(previousPattern);

                    // Sets rotStatus
                    this.rotStatus = rotStatusTest;

                    // If the position works, then there is no need to check further, as checks are designed that way
                    break;
                }
            }
        }
    };

    // Returns a copy of the array provided with the piece appended to it
    append = (arr, ghost = false) => {
        // Creates a new array to work with
        let newArr = arr;

        // For each cell of array
        this.pattern.forEach((v1, i1) => {
            v1.forEach((_v2, i2) => {
                // If ghost is true, and in legal position, then add 7 to each type of applicable cell, and set y to the ghost's y
                if (ghost) {
                    if (
                        this.ghost(stationary) + i1 < newArr.length &&
                        this.ghost(stationary) + i1 >= 0 &&
                        this.x + i2 < newArr[0].length
                    ) {
                        newArr[this.ghost(stationary) + i1][this.x + i2] =
                            this.pattern[i1][i2] !== 0
                                ? this.pattern[i1][i2] + 7
                                : newArr[this.ghost(stationary) + i1][
                                      this.x + i2
                                  ];
                    }
                } else {
                    // Otherwise, if legal position, then append
                    if (
                        this.y + i1 < newArr.length &&
                        this.y + i1 >= 0 &&
                        this.x + i2 < newArr[0].length
                    ) {
                        newArr[this.y + i1][this.x + i2] =
                            this.pattern[i1][i2] !== 0
                                ? this.pattern[i1][i2]
                                : newArr[this.y + i1][this.x + i2];
                    }
                }
            });
        });
        return newArr;
    };

    // Returns a coordinate y for the ghost piece to appear at.
    ghost = (arr) => {
        // Finds lowest place piece can go from current y
        let ghostY = this.y;
        while (!this.cellCollision(arr, true, this.x, ghostY).overlap) {
            ghostY++;
        }
        return ghostY - 1;
    };
}

// Canvas method to draw a rounded rectangle
// Thanks to @Grumdrig and @jhoff's Stackoverflow posts ;)
CanvasRenderingContext2D.prototype.roundRect = (x, y, w, h, r) => {
    if (w < 2 * r) r = w / 2; // If rectangle's border radius is more than half the width set it to half the width
    if (h < 2 * r) r = h / 2; // If rectangle's border radius is more than half the height set it to half the height
    ctx.beginPath(); // Begins drawing

    // Draws the rectangle
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);

    // Close the path
    ctx.closePath();

    // Returns the rounded rect
    return this;
};

// Renders everything
let render = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fills the background of the canvas white so nothing unexpected is peeking through
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Begins path
    ctx.beginPath();

    // Calculates x position of board
    let gameX = Math.floor(
        window.innerWidth / 2 - (blockWidth * 10 + 10 + 6) / 2
    );

    // Calculates a couple of variables
    let r = 10;
    let w = blockWidth * 10 + 10;
    let h = blockWidth * 21 + 10;
    let x = gameX - 5;
    let y = 0 - 5 + 20;

    // Creates outline for board
    ctx.moveTo(x + w, y + blockWidth);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.lineTo(x, y + blockWidth);

    // Colors outline for board
    ctx.strokeStyle = "#A3A3A3";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draws the actual baord
    drawArr(board.slice(19, 40), gameX, 20);

    // Draws the queue
    for (let i = 0; i < queue.length; i++) {
        drawArr(
            piecePatternList[queue[i]],
            gameX + blockWidth * 10 + 30,
            20 + 32 + i * 3 * blockWidth
        );
    }

    // Draws the hold
    if (hold !== undefined) {
        drawArr(
            piecePatternList[hold],
            gameX - blockWidth * piecePatternList[hold][0].length - 30,
            20 + 32
        );
    }

    // Draws the scores
    ctx.fillStyle = "#a3a3a3";

    // Time
    ctx.font = "400 50px Roboto";
    ctx.textAlign = "left";
    ctx.fillText("Time", gameX + blockWidth * 10 + 30, 450);
    ctx.font = "300 50px Roboto";

    // Pads strings to a certain length
    let str_pad_left = (string, pad, length) => {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    };

    // Formats the seconds into minutes and seconds (No hour because its not exactly necessary)
    stats.formattedTime =
        str_pad_left(Math.floor(stats.time / 60), "0", 2) +
        ":" +
        str_pad_left(stats.time % 60, "0", 2);

    // Draws the time
    ctx.fillText(stats.formattedTime, gameX + blockWidth * 10 + 30, 510);

    // Level
    ctx.font = "400 50px Roboto";
    ctx.textAlign = "left";
    ctx.fillText("Level", gameX + blockWidth * 10 + 30, 570);
    ctx.font = "300 50px Roboto";
    ctx.fillText(stats.level, gameX + blockWidth * 10 + 30, 630);

    // Score
    ctx.font = "400 50px Roboto";
    ctx.textAlign = "right";
    ctx.fillText("Score", gameX - 30, 570);
    ctx.font = "300 50px Roboto";
    ctx.fillText(stats.score, gameX - 30, 630);
};

// Draws an array
let drawArr = (arr, x, y) => {
    // Renders each cell with the corresponding Array2D method
    Array2D.eachCell(arr, (v, i, j) => {
        // beginPath to be able to switch colors
        ctx.beginPath();

        // Always draw a background of this color:
        ctx.fillStyle = "white";
        ctx.rect(
            j * blockWidth + x,
            i * blockWidth + y,
            blockWidth,
            blockWidth
        );
        ctx.fill();

        // If the value of the cell isn't 0:
        if (v !== 0) {
            ctx.lineWidth = 4;

            // If value is more than 7 (ghost cell), then set the color to value-7
            if (v > 7) {
                // Sets color
                ctx.fillStyle = color[v - 7][0];
                ctx.strokeStyle = color[v - 7][1] + "7D";
            } else {
                // Sets color
                ctx.fillStyle = color[v][0];
                ctx.strokeStyle = color[v][1];
            }

            // Draws the roundedRect of corresponding color
            ctx.roundRect(
                j * blockWidth + x,
                i * blockWidth + y,
                blockWidth,
                blockWidth,
                10
            );

            // Strokes and fills with clip and restore in order to have inner border
            ctx.save();
            ctx.clip();
            ctx.lineWidth *= 2;
            if (v <= 7) {
                ctx.fill();
            }
            ctx.stroke();
            ctx.restore();
        }
    });
};

// Clears rows
const clearRow = (arr) => {
    // Amount of lines cleared
    let linesCleared = 0;

    // Goes over array and if found target, then clear the row
    arr.forEach((y, i) => {
        if (!y.includes(0)) {
            // Splices row
            arr.splice(i, 1);

            // Adding a new row, giving the impression of a "row clear"
            arr.unshift(new Array(10).fill(0));

            // Adds amount of rows cleared
            linesCleared++;
        }
    });

    if (linesCleared > 0) {
        // Adds stats
        stats.linesCleared += linesCleared; // Adds linesCleared stat

        // Adds score stat
        if (linesCleared == 1) stats.score += 100;
        else if (linesCleared == 2) stats.score += 300;
        else if (linesCleared == 3) stats.score += 500;
        else if (linesCleared == 4) stats.score += 800;

        // Changes level stat based on lines cleared
        stats.level =
            Math.floor(stats.linesCleared / 10) + 1 <= 15
                ? Math.floor(stats.linesCleared / 10) + 1
                : 15;

        // Changes G based on level
        settings.G = levelG[stats.level];
    }
};

// Updates stuff that is not visible
let update = () => {
    // Appends stationary
    board = Array2D.paste(Array2D.build(10, 40, 0), stationary, 0, 0);

    // Tetrimino falling logic
    t.timeExists += 1;

    // Appends the ghost
    if (settings.ghost) {
        board = t.append(board, true);
    }

    // Appends the moving piece
    board = t.append(board);

    // Clears any rows necesssary
    clearRow(stationary);
};

// Finds position in which to spawn the tetrimino
let findPosition = (name) => {
    // Creates position object
    let position = {};

    // If shape is "i", then do the following
    if (name == "i") {
        // Sets x position
        position.x = 3;
        position.y = 17;
    } else if (name == "o") {
        // However, if shape is "o", then do the following
        // Sets x position
        position.x = 4;
        position.y = 18;
    } else {
        // Otherwise
        // Sets x position
        position.x = 3;
        position.y = 18;
    }

    // All y positions are the same (y position is one less because )

    // Returns the position
    return position;
};

// Running the game!
let gameLoop = () => {
    // If running
    if (settings.running) {
        while (t.timeExists > t.timeSimulated) {
            if (!t.cellCollision(stationary).bottom) {
                t.y++;
                t.timeSimulated += 1 / settings.G;
            } else {
                stationary = t.append(stationary);
                createPiece();
            }
        }

        // Checks if game is still running after creating new piece, game end detection is when you create a piece
        if (settings.running) {
            // Updates the important information
            update();

            // Actually renders that stuff updated
            render();
        }
    }



    // Calls a gameLoop
    window.requestAnimationFrame(gameLoop);
};

// Creates a new piece
let createPiece = (clearHold = true) => {
    // Resets t
    t = new Tetrimino();

    if (
        t.y == findPosition(t.name).y &&
        t.cellCollision(stationary, true).overlap == true
    ) {
        gameOver();
    }

    // Do not need to move one down because that system is taken care of by gameLoop already

    // If clearHold is true, then clear all uses
    if (clearHold) {
        holdUses = 0;
    }

    // Push a piece to the queue
    pushQueue(getPiece());
};

let pushQueue = (content) => {
    // Pushes content to the queue
    queue.push(content);

    // However, if the queue is longer than is supposed to be, remove first element
    if (queue.length > nextUpLength) {
        queue.shift();
    }
};

// Pause/unpause control
let pause = () => {
    // If settings menu is showing, hide it
    if (settingsMenu.style.visibility == "visible") {
        elementStatus("settings", "hide");
    }

    // Shows or hides the menu depending on what the current state is
    elementStatus("menu", "auto");

    // Pauses or unpauses game depending on what the current state is
    settings.running = settings.running ? false : true;
};

// Resets key variables
let init = () => {
    stationary = Array2D.build(10, 40, 0);
    board = Array2D.build(10, 40, 0);
    queue = [];
    hold = undefined;
    holdUses = 0;

    // What your statistics are
    stats = {
        score: 0,
        linesCleared: 0,
        level: 1,
        time: 0,
    };

    // Pushes sufficient amount of tetriminos into the queue
    for (let i = 0; i < nextUpLength; i++) {
        pushQueue(getPiece());
    }

    createPiece();

    // Updates the important information
    update();

    // Actually renders that stuff updated
    render();
};

window.requestAnimationFrame(gameLoop);

var pressedKeys = {};
window.onkeyup = function (e) {
    pressedKeys[e.key] = false;
};
window.onkeydown = function (e) {
    pressedKeys[e.key] = true;
};

let originalG = settings.G;
let speedIncreased = false;

// Takes input from event listeners to sense keypresses and such
document.addEventListener("keydown", function (e) {
    // Only allow key inputs for game when running
    if (settings.running) {
        // If ArrowLeft is pressed
        if (e.key == "ArrowLeft") {
            // Then move piece left if nothing is blocking it
            if (t.cellCollision(stationary).left !== true) {
                t.x--;
            }
        }

        // If ArrowRight is presed
        if (e.key == "ArrowRight") {
            // Then move piece right if nothing is blocking it
            if (t.cellCollision(stationary).right !== true) {
                t.x++;
            }
        }

        // If ArrowDown is pressed
        if (e.key == "ArrowDown") {
            // Then move piece downward if nothing is blocking it
            if (t.cellCollision(stationary).bottom !== true) {
                t.y++;
            }
        }

        // If ArrowUp or x is pressed
        if (e.key == "ArrowUp" || e.key == "x") {
            // Then rotate piece (collision logic is built-in to function)
            t.rot();
        }

        // If z or control is pressed
        if (e.key == "Control" || e.key == "z") {
            // Then rotate piece (collision logic is built-in to function)
            t.rot(true);
        }

        // If Space is pressed
        if (e.key == " ") {
            // Then teleport piece to corresponding ghost location
            t.y = t.ghost(stationary);

            // Lock piece as is standard in SRS
            stationary = t.append(stationary);
            createPiece();
        }

        // If Shift or c is pressed
        if (e.key == "Shift" || e.key == "c") {
            // If you can hold (times used hold in current piece set is not larger than none)
            if (holdUses == 0) {
                // If there is no current hold
                if (hold == undefined) {
                    // Set hold to current piece
                    hold = t.name;

                    // Create a new piece but DO NOT reset holdUses
                    createPiece(false);
                } else {
                    // Otherwise
                    // Save the piece name currently
                    let prevHold = t.name;

                    // The use of createPiece is not used as some of the procedures are changed

                    // Set tetrimino to current hold
                    t = new Tetrimino(hold);

                    // Set hold to the piece (before change)
                    hold = prevHold;

                    // If not cell collision, then move piece down one as tetris guidlines insist
                    if (t.cellCollision(stationary).bottom !== true) {
                        t.y++;
                    }
                }

                // Increase holdUses
                holdUses++;
            }
        }
    }

    // If Escape is pressed
    if (settings.running || menu.style.visibility == "visible") {
        if (e.key == "Escape" || e.key == "F1") {
            pause();

            // If the confirm quit menu is open and they want to continue the game, simply dismiss the menu
            if (menu.style.visibility == "hidden") {
                elementStatus("quitConfirmMenu", "hide");
            }
        }
    }
});

// Starts timer when window loads
window.onload = () => {
    setInterval(() => {
        // However, only add to time when game is running
        if (settings.running) {
            stats.time++;
        }
    }, 1000);
};

// When window is resized, resize canvas along with it so squished canvas doesn't occur
window.addEventListener("resize", () => {
    // Change canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Make sure to rerender to "reset"
    render();
});

// If the ghost switch (used to turn the Tetris ghost on and off) is changed
ghostSwitch.addEventListener("change", function () {
    // If ghost is checked
    if (ghostSwitch.checked) {
        // Turn on the ghost
        settings.ghost = true;
    } else if (!ghostSwitch.checked) {
        // Turn off the ghost
        settings.ghost = false;
    }

    // Write the change in global storage
    store.write("ghost", settings.ghost);
    if (settings.running) {
        // Updates so new updates are applied
        update();
    
        // Actually renders
        render();
    }
});

// If the music switch has been changed
musicSwitch.addEventListener("change", function () {
    // If music is checked
    if (musicSwitch.checked) {
        // Turn music on
        settings.music = true;

        // If canvas is currently visible (game is running) and the song is not currently playing then start the song
        if (
            canvas.style.visibility == "visible" &&
            tetrisTheme.playing() == false
        ) {
            tetrisTheme.play();
        } else if (canvas.style.visibility == "visible") {
            // Else (considering the canvas is still visible)
            // Unmute the song
            tetrisTheme.mute(false);
        }

        // Fade from 0 volume to 0.5 volume for a cool effect
        tetrisTheme.fade(0, 0.5, 3000);
    } else if (!musicSwitch.checked) {
        // Otherwise, if music switch got turned off
        // Turn music off
        settings.music = false;

        // Mute the music
        tetrisTheme.mute(true);
    }

    // Write the change in global storage
    store.write("music", settings.music);
});

// Creates a new game
let newGame = (deleteSavedGameParam) => {
    // If music is toggled,
    if (settings.music) {
        // Start the music if not already started
        if (tetrisTheme.playing() == false) {
            tetrisTheme.play();
        }
        // And fade to full volume if not already at full volume
        if (!(tetrisTheme.volume() == 0.5)) {
            tetrisTheme.fade(tetrisTheme.volume(), 0.5, 3000);
        }
    }

    // Whether or not to delete a saved game depends on the parameter
    deleteSavedGame = deleteSavedGameParam;

    // Initiallizes the variables
    init();

    // If game selector is visible, hide it
    if (gameSelector.style.visibility == "visible") {
        openGameSelector();
    }

    // Shows canvas
    elementStatus("gameCanvas", "show");

    // Hides main menu
    elementStatus("mainMenu", "hide");

    // Starts the game!
    settings.running = true;
};

// Saves the game to local storage, and returns to main menu
let quit = (save = false) => {
    // Hide the quit confirmation menu if it is visible
    elementStatus("quitConfirmMenu", "hide");

    // If save is true
    if (save) {
        // Say that the game is saved
        showBanner("Game saved. Thank you for playing");
    } else {
        // Otherwise, say that the game has been removed
        showBanner("Game removed. Thank you for playing");
    }

    // Fade the Tetris music
    tetrisTheme.fade(tetrisTheme.volume(), 0, 3000);

    // Set a timeout for 5 seconds (the amount of time it takes to fade the music)
    window.setTimeout(() => {
        // If the volume of the music is less than or equal to 0

        // This check is necessary in order to not stop the music in case the user starts it agian.
        if (tetrisTheme.volume() <= 0) {
            // Then stop the music
            tetrisTheme.stop();
        }
    }, 3000);

    // If deleteSavedGame (a flag to delete a game that is got from global storage quit without save is pressed in order to not allow time travel) is true
    if (deleteSavedGame) {
        // Delete the saved game
        store.write("savedGame", {});
    } else if (save) {
        // Otherwise, if the game IS saved
        // Write the savedGame in global storage
        store.write("savedGame", {
            stationary: stationary,
            t: JSON.stringify(t), // ! Make sure to parse this before using
            hold: hold,
            holdUses: holdUses,
            queue: queue,
            speed: settings.G,
            stats: JSON.stringify(stats),
        });
    }

    // Stops the game
    settings.running = false;

    // Hides the settings menu
    elementStatus("settings", "hide");

    // Hides the game menu
    elementStatus("menu", "hide");

    // Hides the canvas
    elementStatus("gameCanvas", "hide");

    // Hides game over menu
    elementStatus("gameOverMenu", "hide");

    // Shows the main menu
    elementStatus("mainMenu", "show");

    // Sets leaderboard logged (a flag to keep track of whether or not you have logged your stats to the leaderboard) to false
    leaderboardLogged = false;
};

// Opens or closes the game selector depending on status
let openGameSelector = () => {
    // If there is a stored game, then show the game selector
    if (Object.keys(store.savedGame).length !== 0) {
        elementStatus("gameSelector", "auto");
    } else {
        // Otherwise, create a new game and alert so
        showBanner(
            "There are no ongoing games. We automagically created a new one for you!"
        );
        newGame();
    }
};

// Restore a saved game
let restoreSavedGame = () => {
    showBanner("We have restored where you left off saving. Enjoy the game.");
    // If the game is restored, we want to delete the game after we quit.
    deleteSavedGame = true;

    // Initiallizes to clear everything
    init();

    // Sets all necessary variables to what the stored game had
    stationary = store.savedGame.stationary;
    parsedT = JSON.parse(store.savedGame.t);
    t.name = parsedT.name;
    t.pattern = parsedT.pattern;
    t.rotStatus = parsedT.rotStatus;
    t.timeExists = parsedT.timeExists;
    t.timeSimulated = parsedT.timeSimulated;
    t.x = parsedT.x;
    t.y = parsedT.y;
    hold = store.savedGame.hold;
    holdUses = store.savedGame.holdUses;
    queue = store.savedGame.queue;
    settings.G = store.savedGame.speed;
    stats = JSON.parse(store.savedGame.stats);

    // Hides game selector as it should be open
    openGameSelector();

    // Shows the game itself
    canvas.style.visibility = "visible";
    canvas.style.opacity = 1;

    // Runs the game
    settings.running = true;
};

// Shows a banner
let showBanner = (string) => {
    // If the banner is showing
    if (banner.style.transform == "translate(-50%, 0%)") {
        // Hide the banner
        banner.style.transform = "translate(-50%, -130%)";

        // Waits 0.4s
        window.setTimeout(() => {
            // Updates the banner
            bannerContent.innerText = string;

            // Shows it
            banner.style.transform = "translate(-50%, 0%)";
        }, 400);
    } else {
        // Otherwise if the banner is not showing
        // Updates the banner
        bannerContent.innerText = string;

        // Shows
        banner.style.transform = "translate(-50%, 0%)";
    }

    // Wait 0.5s
    window.setTimeout(() => {
        // If the current banner's text is equal to the text calling it
        if (bannerContent.innerText == string) {
            // Hide the banner
            banner.style.transform = "translate(-50%, -130%)";
        }
    }, 5000);
};

// What to do when game is over
let gameOver = () => {
    // Stops the game
    settings.running = false;

    // Opens the game over menu for people to choose what to do next
    elementStatus("gameOverMenu", "show");

    // Changes the score indicator
    gameOverMenuScore.innerText = stats.score;
};

// Restart the game
let restart = () => {
    // Initiallizes the variables
    init();

    // Alert
    showBanner(
        "We have created a new game for you. Restarting isn't always bad."
    );

    // Start the game
    settings.running = true;

    // Hide the game over menu
    elementStatus("gameOverMenu", "hide");
};

// Updates an element's hide/show status
let elementStatus = (modalID, action = "auto") => {
    // First get the modal
    let modal = document.getElementById(modalID);

    // Depending on the action,
    if (action == "show") {
        // Show the modal
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
    } else if (action == "hide") {
        // Hide the modal
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
    } else if (action == "auto") {
        // Depending on the state, set it to the opposite
        modal.style.visibility =
            modal.style.visibility == "visible" ? "hidden" : "visible";
        modal.style.opacity = modal.style.opacity == "1" ? "0" : "1";
    }
};

// Secret function
let easterEgg = () => {
    // trollololololololol
    showBanner("get rickrolled");
};

// Opens/Closes statistics
let openStats = () => {
    // Opens/Closes appropriate menues
    elementStatus("gameOverMenu", "auto");
    elementStatus("statViewer", "auto");

    // If stat viewer is visible, then update the scores.
    if (statViewer.style.visibility == "visible") {
        statViewerScore.innerText = "Score: " + stats.score;
        statViewerTime.innerText = "Time Elapsed: " + stats.formattedTime;
        statViewerLinesCleared.innerText =
            "Lines Cleared: " + stats.linesCleared;
        statViewerLevel.innerText = "Level Reached: " + stats.level;
    }
};

// Appends a row onto a HTML table
let tableAppendRow = (tableID, index, arr, tbodyID = "tbody") => {
    // Gets the table body
    let tbodyRef = document
        .getElementById(tableID)
        .getElementsByTagName(tbodyID)[0];

    // Insert a row at the end of table
    let newRow = tbodyRef.insertRow(index);

    for (let [i, x] of arr.entries()) {
        // Insert a cell at the end of the row
        let newCell = newRow.insertCell(i);

        // Append a text node to the cell
        let newText = document.createTextNode(x);
        newCell.appendChild(newText);
    }
};

// Opens the leaderboard
let openLeaderboard = () => {
    // If leaderboard is hidden (will be shown) then update
    if (leaderboard.style.visibility == "hidden") {
        // Updates the actual leaderboard
        updateLeaderboard(leaderboardArray);

        // If the array is empty
        if (leaderboardArray.length == 0) {
            // Set the footer to inform so
            leaderboardFooter.innerText =
                "There isn't anything in the leaderboard! To contribute, start a game.";
        } else {
            // Otherwise, say something else
            leaderboardFooter.innerText =
                "That was the end of the leaderboard! To contribute, start a game.";
        }
    }

    // Shows or hides the leaderboard
    elementStatus("leaderboard", "auto");
};

let updateLeaderboard = (arr) => {
    // First cleares the leaderboard table's body
    leaderboardBody.innerHTML = "";

    // If the leaderboardArray's length isn't 0 (leaderboard isn't empty)
    if (leaderboardArray.length !== 0) {
        // Then repeat through all of the array
        for (let [i, x] of arr.entries()) {
            // And append each elent to the table
            tableAppendRow("leaderboardTable", i, x);
        }
    }
};

// Logs to the leaderboard
let logLeaderboard = () => {
    // If the input name is nothing,
    if (leaderboardName.value == "") {
        // Alert accordingly
        showBanner(
            "You have not entered a name. Please enter a name to continue"
        );
    } else {
        // Otherwise
        // If the leaderboard has not yet been logged
        if (!leaderboardLogged) {
            // And the leaderboard says the score is already taken but user overrid it
            if (logLeaderboardError[0]) {
                // Then override existing score
                leaderboardArray[logLeaderboardError[1]] = [
                    leaderboardName.value,
                    stats.score,
                    stats.formattedTime,
                    stats.linesCleared,
                    stats.level,
                ];

                // Marks that the leaderboard has already been logged
                leaderboardLogged = true;

                // Shows a banner saying so
                showBanner("Score successfully overrid");

                // Updates local storage
                store.write(leaderboard, leaderboardArray);

                // Clears the error
                logLeaderboardError = [false, 0];
            } else {
                // Otherwise, if no error existed in the first place
                // First check for an error
                for (let [i, x] of leaderboardArray.entries()) {
                    // If error found, logs said error
                    if (leaderboardName.value == x[0]) {
                        // Alerts that it found an error
                        showBanner(
                            "We see that you are trying to log your score. However, there is already an entry by the same name. Press send again to confirm, and to override previous entry;"
                        );

                        // Saves the error, in case user wants to override
                        logLeaderboardError = [true, i];

                        // Returns
                        return;
                    }
                }

                // If we are getting to this point, then there is no error

                // Logs the score in the leaderboard
                leaderboardArray.push([
                    leaderboardName.value,
                    stats.score,
                    stats.formattedTime,
                    stats.linesCleared,
                    stats.level,
                ]);

                // Saves the new array
                store.write(leaderboard, leaderboardArray);

                // Flags that score has been logged
                leaderboardLogged = true;

                // Alerts that score has been added
                showBanner("Score added to leaderboard");
            }
        } else {
            // If we are here, it means that leaderboardLogged is checked

            // Do not do anything, and alert something
            showBanner(
                "Your score has already been added. To avoid clutter, please do not send again."
            );
        }
    }
};

// Deletes a score from the leaderboard
let deleteScore = () => {
    // If nothing has been inputted to delete, then do nothing alert
    if (leaderboardDeleteInputBox.value == "") {
        showBanner("No name has been inputted. Try again.");
    } else {
        // Otherwise
        // Loop through the leaderboard array to see if it can find a match to the delete name
        for (let [i, x] of leaderboardArray.entries()) {
            // If a match is found
            if (x[0] == leaderboardDeleteInputBox.value) {
                // Remove that name from the leaderboard
                leaderboardArray.splice(i, 1);

                // Updates global storage
                store.write(leaderboard, leaderboardArray);

                // Alert
                showBanner(
                    "Score sucessfully removed. Thank you for participating anyways."
                );

                // Update the leaderboard
                updateLeaderboard(leaderboardArray);

                // Break from loop
                return;
            }
        }

        // If we got here, that means that no match has been found, and we should alert that
        showBanner(
            "No match has been found to that name. Try again, or press the close button to exit."
        );
    }
};
