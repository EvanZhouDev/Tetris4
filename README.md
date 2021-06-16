# Tetris4
A JS Tetris Game

## What is Tetris?
View this link below if you do not know the basic rules of Tetris, or would like some history.  <br/><br/>
[What is Tetris?](https://tetris.com/about-us)<br/><br/>

## Scoring System of Tetris 4
*If you clear one line:* **You get 100 points** <br/>
*If you clear two lines:* **You get 300 points** <br/>
*If you clear three lines:* **You get 500 points** <br/>
*If you clear four lines (better known as a "Tetris line clear"):* **You get 800 points** <br/><br/>

## Starting a Game
Click the play button. It's as simple as that. If there is an active game that was previously saved, then there will be a choice to open a new game, or continue that game. Otherwise, it will create a new game for you and skip the popup.

## Controls
Use the keyboard to control where the falling Tetrimino lands.
<br/>
All of these are the standard Tetris keymaps
### Movement
**Left Arrow:** Move Tetrimino Left<br/><br/>
**Right Arrow:** Move Tetrimino Right<br/><br/>

### Dropping
**Down Arrow:** Soft Drop (*Move Tetrimino down faster than usual*)<br/><br/>
**Space Arrow:** Hard Drop (*Instantly move Tetrimino down to the bottom of the board, where the ghost is, if enabled*)<br/><br/>

### Rotation
**Up Arrow / X Key:** Rotates Tetrimino Clockwise<br/><br/>
**Control Key / Z Key:** Rotates Tetrimino Counterclockwise<br/><br/>

### Holding
In order to store a Tetrimino for later, use the hold feature. This will send a Tetrimino to the right side of the board if no Tetrimino is already 'held'. After holding a tetrimino, the game automatically sends out the next Tetrimino. However, if a Tetrimino is already in hold, it will replace the current falling tetrimino with the one in the hold box. After you've held a Tetrimino, you cannot send it back to the hold box without that piece falling to the bottom first. <br/>
**Shift Key/C Key:** Hold<br/><br/>

### Pausing
**Escape / F1:** Pauses the game, so you have access to menus.

## Settings
In settings, there are two toggle switches.<br/><br/>
**Ghost:** Turns ghost piece on and off(*A "ghost piece" in Tetris is a indicator of where the piece is going to land. This piece in Tetris4 is shown in a lighter version of the piece.*)<br/><br/>
**Music:** Turns music on and off. Music is only audible during the game.<br/><br/>

## Leaderboard
The leaderboard is a way to store your scores on localStorage. Whenever you finish a game, there will be a button that says <br/><br/> 'Full Statistics & Leaderboard' <br/><br/> Click on this in order to see your full score, as long as a way to send to the leaderboard.<br/><br/>
Contributing is as simple as typing in your name, and clicking 'Send to Leaderboard'. If a entry with the same name already exists, simply press the button two times to override the previous entry.<br/><br/>
In order to view the leaderboard, either click view leaderboard on that same screen, or return to the homescreen and click leaderboard.

## Saving a Game
Sometimes you want to finish a game, but don't have time. In this case, you would need to save a game. Pause the current game, using either escape or F1 on your keyboard and click save and quit. It's as easy as that.<br/>
Now, in order to load the game back in, you would simply click the Play Tetris button on the homescreen as usual, and then tap continue game. In order to remove the current game, pause the game again and click quit. Confirm so. Then, the game will automatically be deleted.
