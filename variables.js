// Defines the canvas
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

// Hides canvas to start with
canvas.style.visibility = "hidden";
canvas.style.opacity = "0";

let store = Rhaboo.persistent("TetrisV4"); //localStorage

// Makes sure all localStorage variables are defined
if (!store.ghost) {
    store.write("ghost", true);
}

if (!store.music) {
    store.write("music", true);
}

if (!store.leaderboard) {
    store.write("leaderboard", []);
}

if (!store.savedGame) {
    store.write("savedGame", {});
}

// Defines key variables
let settings = { G: 0.01667, ghost: store.ghost, running: false, music: store.music }; // Setttings
let blockWidth = 30; // How wide each block is
let nextUpLength = 3; // How many tetriminos are shown in the next-up bar

let stationary; // This is where the pieces go after they have fallen and are stuck
let board; // This is where everything comes together, moving piece and stationary and all
let queue = []; // This is where all of the future pieces will be stored
let hold; // What block you are holding
let holdUses = 0; // How many times the hold button is used

// Creates t, short for tetrimino
let t;

// What your statistics are
let stats = {
    score: 0,
    linesCleared: 0,
    level: 1,
    time: 0,
    formattedTime: "00:00",
};

// What each game level's G is
let levelG = {
    test: 0,
    1: 0.01667,
    2: 0.021017,
    3: 0.026977,
    4: 0.035256,
    5: 0.04693,
    6: 0.06361,
    7: 0.0879,
    8: 0.1236,
    9: 0.1775,
    10: 0.2598,
    11: 0.388,
    12: 0.59,
    13: 0.92,
    14: 1.46,
    15: 2.36,
};

// Sets up canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Wall kick info
const wallKick = {
    general: {
        "01": { 1: [0, 0], 2: [-1, 0], 3: [-1, 1], 4: [0, -2], 5: [-1, -2] },
        10: { 1: [0, 0], 2: [1, 0], 3: [1, -1], 4: [0, 2], 5: [1, 2] },
        12: { 1: [0, 0], 2: [1, 0], 3: [1, -1], 4: [0, 2], 5: [1, 2] },
        21: { 1: [0, 0], 2: [-1, 0], 3: [-1, 1], 4: [0, -2], 5: [-1, -2] },
        23: { 1: [0, 0], 2: [1, 0], 3: [1, 1], 4: [0, -2], 5: [1, -2] },
        32: { 1: [0, 0], 2: [-1, 0], 3: [-1, -1], 4: [0, 2], 5: [-1, 2] },
        30: { 1: [0, 0], 2: [-1, 0], 3: [-1, -1], 4: [0, 2], 5: [-1, 2] },
        "03": { 1: [0, 0], 2: [1, 0], 3: [1, 1], 4: [0, -2], 5: [1, -2] },
    },
    iPiece: {
        "01": { 1: [0, 0], 2: [-2, 0], 3: [1, 0], 4: [-2, -1], 5: [1, 2] },
        10: { 1: [0, 0], 2: [2, 0], 3: [-1, 0], 4: [2, 1], 5: [-1, -2] },
        12: { 1: [0, 0], 2: [-1, 0], 3: [2, 0], 4: [-1, 2], 5: [2, -1] },
        21: { 1: [0, 0], 2: [1, 0], 3: [-2, 0], 4: [1, -2], 5: [-2, 1] },
        23: { 1: [0, 0], 2: [2, 0], 3: [-1, 0], 4: [2, 1], 5: [-1, -2] },
        32: { 1: [0, 0], 2: [-2, 0], 3: [1, 0], 4: [-2, -1], 5: [1, 2] },
        30: { 1: [0, 0], 2: [1, 0], 3: [-2, 0], 4: [1, -2], 5: [-2, 1] },
        "03": { 1: [0, 0], 2: [-1, 0], 3: [2, 0], 4: [-1, 2], 5: [2, -1] },
    },
};

// Piece shapes are listed here
let piecePatternList = {
    i: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    ml: [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
    ],
    l: [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
    ],
    o: [
        [4, 4],
        [4, 4],
    ],
    s: [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
    ],
    t: [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
    ],
    z: [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
};

// Get the menu
var menu = document.getElementById("menu");

// Sets menu properties
menu.style.visibility = "hidden";
menu.style.opacity = "0";

// Get the settings menu
var settingsMenu = document.getElementById("settings");

// Sets menu properties
settingsMenu.style.visibility = "hidden";
settingsMenu.style.opacity = "0";

// Get the starting settings menu
var gameSelector = document.getElementById("gameSelector");

// Sets starting settings properties
gameSelector.style.visibility = "hidden";
gameSelector.style.opacity = "0";

// Get the quit confirm menu
var quitConfirmMenu = document.getElementById("quitConfirmMenu");

// Sets starting settings properties
quitConfirmMenu.style.visibility = "hidden";
quitConfirmMenu.style.opacity = "0";

// Get the game over menu
var gameOverMenu = document.getElementById("gameOverMenu");

// Sets starting settings properties
gameOverMenu.style.visibility = "hidden";
gameOverMenu.style.opacity = "0";

// Get the stat viewer menu (Access available after game is over)
var statViewer = document.getElementById("statViewer");

// Sets stat viewer properties
statViewer.style.visibility = "hidden";
statViewer.style.opacity = "0";

// Get the stat viewer menu (Access available after game is over)
var leaderboardDeleteMenu = document.getElementById("leaderboardDelete");

// Sets stat viewer properties
leaderboardDeleteMenu.style.visibility = "hidden";
leaderboardDeleteMenu.style.opacity = "0";
leaderboardDeleteMenu.style.visibility = "hidden";
leaderboardDeleteMenu.style.opacity = "0";

// Get the stat viewer menu (Access available after game is over)
var leaderboard = document.getElementById("leaderboard");
var leaderboardBody = document.getElementById("leaderboardTableBody");

// Get the input box for the user's name
var leaderboardName = document.getElementById("leaderboardName");

// Where the leaderboard is stored so there is easy manipulation
let leaderboardArray = store.leaderboard;

// Get the leaderboard footer
var leaderboardFooter = document.getElementById("leaderboardFooter")

// Sets leaderboard properties
leaderboard.style.visibility = "hidden";
leaderboard.style.opacity = "0";

// Get the main menu
var mainMenu = document.getElementById("mainMenu");

// Sets menu properties
mainMenu.style.visibility = "visible";

// Get the banner and it's span
var banner = document.getElementById("banner");
var bannerContent = document.getElementById("bannerContent");

// Sets banner properties
banner.style.transform = "translate(-50%, -130%)";

// Get the ghost input box
var ghostSwitch = document.getElementById("ghost");
ghostSwitch.checked = store.ghost;

// Get the music input box
var musicSwitch = document.getElementById("music");
musicSwitch.checked = store.music;

// Get the score text at the game over menu
var gameOverMenuScore = document.getElementById("gameOverMenuScore");

// Get stat viewer texts
var statViewerScore = document.getElementById("statViewerScore");
var statViewerTime = document.getElementById("statViewerTime");
var statViewerLinesCleared = document.getElementById("statViewerLinesCleared");
var statViewerLevel = document.getElementById("statViewerLevel");

// Get the leaderboard delete inout box
var leaderboardDeleteInputBox = document.getElementById("leaderboardDeleteInputBox");

// What color each number (each tetrimino has it's own number) stands for
let color = {
    1: ["#20FFF2", "#9CFFF9"], // i shape
    2: ["#4E5FFF", "#A5ADFF"], // ml shape
    3: ["#FCBF24", "#FECE54"], // l shape
    4: ["#F0FE53", "#EAEDC6"], // o shape
    5: ["#4EFF75", "#98FEAF"], // s shape
    6: ["#9C4EFF", "#C99EFF"], // t shape
    7: ["#FF4E4E", "#FFA8A8"], // z shape
};

// The piece "bag" where the randomizer takes from
let pieceBag = ["i", "ml", "l", "o", "s", "t", "z"];

// Flag to see whether or not to delete the saved game after quitting
// Default to false as we usually do not want to delete the SAVED game
let deleteSavedGame = false;

// The Tetris song, extracted from Tetris 99.
var tetrisTheme = new Howl({
    src: ["Source/Sounds/tetrisTheme.mp3"],
    volume: 0.5,
    loop: true
});

// Some statistics that make sure you want to override your score before you actually do it
let logLeaderboardError = [false, 0];

// Keeping track of whether or not you already logged your score
let leaderboardLogged = false;