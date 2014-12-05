/*
 * A simple sprite that can be moved in the four orthogonal directions.
 */


// Namespace
var FOUR = {};


FOUR.DIRECT_DICT = {left: {x: -1, y: 0}, right: {x: 1, y: 0},
                    up: {x: 0, y: -1}, down: {x:0, y: 1}};

FOUR.KEY_CODES = {37: 'left', 39: 'right', 38: 'up', 40: 'down'};


FOUR.removeItem = function(array, value){
    /*
     * Remove the first occurence of value from an array.
     * Array is modified inplace.
     */
    for(var i=0; i<array.length; i++){
        if(array[i] === value){
            array.splice(i, 1);
            return;
        }
    }
};


FOUR.Player = function(pos, color, speed, direction){
    /**
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), a color string, and the speed per frame (an integer).
     */
    this.rect = new RECT.Rect(pos[0], pos[1], 30, 30);
    this.color = color;
    this.speed = speed;
    this.directionStack = [];
    this.direction = direction || 'right';
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

FOUR.Player.prototype.onKey = function(val, event){
    /*
     * Function called on both keyup and keydown events.
     * If the keyCode is found in FOUR.KEY_CODES then
     * the direction is passed to addDirection or popDirection.
     */
    var direction = FOUR.KEY_CODES[event.keyCode];
    if (typeof direction === 'undefined')
        return;
    if(val)
        this.addDirection(direction);
    else
        this.popDirection(direction);
    event.preventDefault && event.preventDefault();
    event.stopPropagation && event.stopPropagation();
};

FOUR.Player.prototype.addDirection = function(key){
    /*
     * Add a direction to the top of the directionStack.
     * If the direction is already at the top, immediately return;
     * else, remove the key from the stack if present and add it to the top.
     */
    if(this.directionStack[this.directionStack.length-1] === key)
        return;
    FOUR.removeItem(this.directionStack, key);
    this.directionStack.push(key);
    this.direction = this.directionStack[this.directionStack.length-1];
};

FOUR.Player.prototype.popDirection = function(key){
    /*
     * Remove a direction from the stack.
     * If the stack is non-empty; set the player's direction to the top.
     */
    FOUR.removeItem(this.directionStack, key);
    if(this.directionStack.length)
        this.direction = this.directionStack[this.directionStack.length-1];
};

FOUR.Player.prototype.update = function(contextRect){
    /**
     * The player's update function to be run every frame.
     * If there is a direction on the directionStack, update the player's
     * rect accordingly. The player position is clamped inside the contextRect.
     */
    if(this.directionStack.length){
        var vector = FOUR.DIRECT_DICT[this.direction];
        this.rect.x += this.speed*vector.x;
        this.rect.y += this.speed*vector.y;
        this.rect.clampIP(contextRect);
    }
};

FOUR.Player.prototype.draw = function(context){
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
     
      
FOUR.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.fps = 60;
    this.interval = 1000/this.fps;
    this.player = new FOUR.Player([50,50], "red", 3);
    this.mainLoop = this.mainLoop.bind(this);
};

FOUR.GameLoop.prototype.update = function(){
    /*
     * Update all actors, called every frame.
     */
    this.player.update(this.contextRect);
};

FOUR.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
};

FOUR.GameLoop.prototype.mainLoop = function(){
    /*
     * Update and render the scene.  This function is called by setInterval
     * and must be bound to 'this' (see constructor).
     */
    this.update();
    this.render();
};

FOUR.GameLoop.prototype.start = function(){
    /*
     * Sets the mainLoop to be called every interval.
     */
    setInterval(this.mainLoop, this.interval);
};


FOUR.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new FOUR.GameLoop(context);
    loop.start();
};


window.onload = FOUR.run;
