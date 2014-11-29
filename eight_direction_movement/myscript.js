var DIRECT_DICT = {left: {x: -1, y: 0}, right: {x: 1, y: 0},
                   up: {x: 0, y: -1}, down: {x:0, y: 1}};


function Rect(x, y, w, h) {
    /**
     * A basic object to keep track of a sprite's location and dimensions.
     * Accepts four integers for x-location, y-location, width, and height.
     */
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}


function Player(pos, color, speed){
    /**
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), a color string, and the speed per frame (an integer).
     */
    this.rect = new Rect(pos[0], pos[1], 30, 30);
    this.color = color;
    this.speed = speed;
}

Player.prototype.update = function(key_states, context){
    /**
     * The players update function to be run every frame.
     * Should be passed a Controls.state object and the valid context.
     * The key states will be looped through and the pertinent position
     * of the players rect will be adjusted.
     */
    for(var state in key_states){
        if(key_states[state]){
            var vector = DIRECT_DICT[state];
            this.rect.x += this.speed*vector.x;
            this.rect.y += this.speed*vector.y;
        }
    }
};

Player.prototype.draw = function(context){
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


function Controls() {
    /*
     * This class manages user input.
     */
    this.codes  = {37: 'left', 39: 'right', 38: 'up', 40: 'down'};
    this.states = {'left': false, 'right': false, 'up': false, 'down': false};
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
}

Controls.prototype.onKey = function(val, event){
    /*
     * Function called on both keyup and keydown events.
     * If the keyCode is found in the objects Controls.codes object then
     * the pertinent state will be set in the Controls.states object.
     */
    var state = this.codes[event.keyCode];
    if (typeof state === 'undefined'){
        return;
    }
    this.states[state] = val;
    event.preventDefault && event.preventDefault();
    event.stopPropagation && event.stopPropagation();
};
      
      
function GameLoop(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    this.fps = 60;
    this.interval = 1000/this.fps;
    this.controls = new Controls();
    this.player = new Player([50,50], "red", 3);
    this.mainLoop = this.mainLoop.bind(this);
}

GameLoop.prototype.update = function(){
    /*
     * Update all actors, called every frame.
     */
    this.player.update(this.controls.states, this.context);
};

GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
};

GameLoop.prototype.mainLoop = function(){
    /*
     * Update and render the scene.  This function is called by setInterval
     * and must be bound to 'this' (see constructor).
     */
    this.update();
    this.render();
};

GameLoop.prototype.start = function(){
    /*
     * Sets the mainLoop to be called every interval.
     */
    setInterval(this.mainLoop, this.interval);
};


function run(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new GameLoop(context);
    loop.start();
}


window.onload = run;
