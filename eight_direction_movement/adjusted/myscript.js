/*
 * A simple sprite that can be moved in all eight directions.
 * This example is identical to the example in the 
 * "eight_direction_movement/simple/" directory with one difference.
 * When travelling at an angle, speed is adjusted so that it has the same
 * magnitude as orthogonal movement.  In the previous example, speed
 * was 1.41x when travelling diagonally.
 */


var EIGHT = {};


EIGHT.DIRECT_DICT = {left: {x: -1, y: 0}, right: {x: 1, y: 0},
                     up: {x: 0, y: -1}, down: {x:0, y: 1}};


EIGHT.ANGLE_UNIT_SPEED = Math.sqrt(2)/2;


EIGHT.Player = function(pos, color, speed){
    /*
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), a color string, and the speed per frame (an integer).
     */
    this.rect = new RECT.Rect(pos[0], pos[1], 30, 30);
    this.color = color;
    this.speed = speed;
};

EIGHT.Player.prototype.update = function(key_states, delta, contextRect){
    /*
     * The players update function to be run every frame.
     * Should be passed a EIGHT.Controls.state object and the valid context.
     * The key states will be looped through and the pertinent position
     * of the players rect will be adjusted.
     */
    var vector = {x: 0, y: 0};
    for(var state in key_states){
        if(key_states[state]){
            vector.x += EIGHT.DIRECT_DICT[state].x;
            vector.y += EIGHT.DIRECT_DICT[state].y;   
        }
    }
    var unit_speed = (vector.x && vector.y) ? EIGHT.ANGLE_UNIT_SPEED : 1;
    this.rect.x += unit_speed*this.speed*vector.x*delta;
    this.rect.y += unit_speed*this.speed*vector.y*delta;
    this.rect.clampIP(contextRect);
};

EIGHT.Player.prototype.draw = function(context){
    /*
     * Draws our player to the screen (a lovable rectangle).
     * Pass the desired context.
     */
    context.beginPath();
    context.rect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    context.fillStyle = this.color;
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = 'black';
    context.stroke();
};


EIGHT.Controls = function() {
    /*
     * This class manages user input.
     */
    this.codes  = {37: 'left', 39: 'right', 38: 'up', 40: 'down'};
    this.states = {'left': false, 'right': false, 'up': false, 'down': false};
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

EIGHT.Controls.prototype.onKey = function(val, event){
    /*
     * Function called on both keyup and keydown events.
     * If the keyCode is found in the objects EIGHT.Controls.codes object then
     * the pertinent state will be set in the EIGHT.Controls.states object.
     */
    var state = this.codes[event.keyCode];
    if (typeof state === 'undefined')
        return;
    this.states[state] = val;
    event.preventDefault && event.preventDefault();
    event.stopPropagation && event.stopPropagation();
};
      
      
EIGHT.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.lastTime = 0;
    this.controls = new EIGHT.Controls();
    this.player = new EIGHT.Player([50,50], "red", 180);
    this.mainLoop = this.mainLoop.bind(this);
};

EIGHT.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
     */
    this.player.update(this.controls.states, delta, this.contextRect);
};

EIGHT.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
};

EIGHT.GameLoop.prototype.mainLoop = function(time){
    /*
     * Update and render the scene.  This function is called by 
     * requestAnimationFrame() and must be bound to 'this' (see constructor).
     */
    if(!this.lastTime)
        this.lastTime = time;
    var delta = (time-this.lastTime)/1000;
    this.lastTime = time;
    this.update(time, delta);
    this.render();
    requestAnimationFrame(this.mainLoop);
};

EIGHT.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new EIGHT.GameLoop(context);
    requestAnimationFrame(loop.mainLoop);
};


window.onload = EIGHT.run;
