/*
 * A simple sprite that can be moved in the four orthogonal directions.
 * Instead of a simple rectangle, our player is now an animated sprite.
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


FOUR.Player = function(pos, speed, direction){
    /**
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), speed (per second), and a starting direction.
     * If a direction is not passed it will default to 'right'.
     */
    this.rect = new RECT.Rect(pos[0], pos[1], 50, 50);
    this.speed = speed;
    this.sheet = new Image();
    this.sheet.src = "skelly.png";
    this.directionStack = [];
    this.direction = direction || 'right';
    this.prepareFrames();
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

FOUR.Player.prototype.prepareFrames = function(){
    /*
     * Creates the necessary attributes for animating our sprite.
     */
    this.frameFPS = 7;
    this.lastFrameTime = 0;
    this.frame = 0;
    this.frames = {left: [[0,false], [50,false]], 
                   right: [[0,true], [50,true]],
                   up: [[100,false], [100,true]],
                   down: [[150,false], [150,true]]};
};

FOUR.Player.prototype.updateFrame = function(time){
    /*
     * Changes the animation frame when enough time has elapsed.
     */
    if(!this.lastFrameTime)
        this.lastFrameTime = time;
    if(time-this.lastFrameTime > 1000/this.frameFPS){
        this.frame = (this.frame+1)%2;
        this.lastFrameTime = time;
    }
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
    this.direction = key;
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

FOUR.Player.prototype.update = function(time, delta, contextRect){
    /**
     * The player's update function to be run every frame.
     * If there is a direction on the directionStack, update the player's
     * rect accordingly. The player position is clamped inside the contextRect.
     */
    if(this.directionStack.length){
        this.updateFrame(time);
        var vector = FOUR.DIRECT_DICT[this.direction];
        this.rect.x += delta*this.speed*vector.x;
        this.rect.y += delta*this.speed*vector.y;
        this.rect.clampIP(contextRect);
    }
};

FOUR.Player.prototype.draw = function(context){
    /*
     * Draws our player to the screen.
     * Pass the desired context.
     * The context must be flipped to draw the sprites mirrored frames.
     * This may be too slow in more complex programs.
     */
    var frame_data = this.frames[this.direction][this.frame];
    var x = frame_data[0];
    var flip = frame_data[1];
    var sw = this.rect.w;
    var sh = this.rect.h;
    var dw = this.rect.w;
    var dh = this.rect.h;
    var dx = this.rect.x;
    var dy = this.rect.y; 
    if(flip){
        context.save();
        context.scale(-1,1);
        context.drawImage(this.sheet, x, 0, sw, sh, -dx-dw, dy, dw, dh);
        context.restore();
    }
    else
        context.drawImage(this.sheet, x, 0, sw, sh, dx, dy, dw, dh);    
};
     
      
FOUR.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.fps = 60;
    this.lastTime = 0;
    this.player = new FOUR.Player([50,50], 180, "down");
    this.mainLoop = this.mainLoop.bind(this);
};

FOUR.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
     */
    this.player.update(time, delta, this.contextRect);
};

FOUR.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
};

FOUR.GameLoop.prototype.mainLoop = function(time){
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


FOUR.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new FOUR.GameLoop(context);
    requestAnimationFrame(loop.mainLoop);
};


window.onload = FOUR.run;
