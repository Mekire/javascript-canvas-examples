/*
 * A simple sprite that can be moved in the four orthogonal directions.
 * Instead of a simple rectangle, our player is now an animated sprite.
 * Obstacles have also been added with which the player can collide.
 */


// Namespace
var FOUR = {};


FOUR.DIRECT_DICT = {left: [-1,0], right: [1,0],
                    up: [0,-1], down: [0,1]};


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


FOUR.getRandomColor = function(){
    /*
     * Returns a random rgb color string.
     */
    var color = [];
    for(var i=0; i<3; i++){
        color.push(Math.floor(Math.random()*256));
    }
    return 'rgb('+color.join(',')+')';
};


FOUR.spriteCollide = function(sprite, group){
    /*
     * Check collision of sprite against an array of sprites.
     * All sprites must have a rect attribute.
     * The return value is an array containing the sprites with which
     * sprite collided.
     */
    var collide = [];
    for(var i=0; i<group.length; i++){
        if(sprite.rect.collideRect(group[i].rect))
            collide.push(group[i]);
    }
    return collide;
};

        
FOUR.Block = function(x, y){
    /*
     * A very basic obstacle for the player to collide with.
     */
    this.shade = new Image();
    this.shade.src = "shader.png";
    this.color = FOUR.getRandomColor();
    this.rect = new RECT.Rect(x, y, 50, 50); 
};

FOUR.Block.prototype.draw = function(context){
    /*
     * Fill the rect with this.color and then blit the shade image on top.
     */
    context.fillStyle = this.color;
    context.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    context.drawImage(this.shade, this.rect.x, this.rect.y);
};


FOUR.Player = function(pos, speed, direction){
    /*
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

FOUR.Player.prototype.update = function(time, delta, obstacles, contextRect){
    /*
     * The player's update function to be run every frame.
     * If there is a direction on the directionStack, update the player's
     * animation and attempt to move the player.
     */
    if(this.directionStack.length){
        this.updateFrame(time);
        this.moveCheck(delta, obstacles, 0);
        this.moveCheck(delta, obstacles, 1);
    }
};

FOUR.Player.prototype.moveCheck = function(delta, obstacles, axis){
    /*
     * Update the player's position in one axis; then check collision with
     * any obstacles. 
     */
    var vector = FOUR.DIRECT_DICT[this.direction];
    this.rect[axis] += delta*this.speed*vector[axis];
    var collisions = FOUR.spriteCollide(this, obstacles);
    while(collisions && collisions.length){
        var collision = collisions.pop();
        this.adjustCollision(collision, axis);
    }
};

FOUR.Player.prototype.adjustCollision = function(collide, axis){
    /*
     * When the player collides with an obstacle, set the side on which the 
     * player collided to the opposite side of that obstacle.
     */
    if(this.rect[axis] < collide.rect[axis])
        this.rect[axis] = collide.rect[axis]-this.rect.size[axis];
    else
        this.rect[axis] = collide.rect[axis]+collide.rect.size[axis];
};

FOUR.Player.prototype.draw = function(context){
    /*
     * Draws our player to the screen.
     * Pass the desired context.
     * The context must be flipped to draw the sprite's mirrored frames.
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
    this.player = new FOUR.Player((0,0), 180, "down");
    this.player.rect.center = [100, 100];
    this.mainLoop = this.mainLoop.bind(this);
    this.blocks = this.makeBlocks();
};

FOUR.GameLoop.prototype.makeBlocks = function(){
    /*
     * Create some blocks for our player to run in to.
     */
    var blocks = [new FOUR.Block(400,350), 
                  new FOUR.Block(300,250), 
                  new FOUR.Block(150,150)];
    for(var i=0; i<this.contextRect.w; i+=50){
        blocks.push(new FOUR.Block(i,0));
        blocks.push(new FOUR.Block(i,this.contextRect.bottom-50));
    }
    for(var j=50; j<this.contextRect.h-50; j+=50){
        blocks.push(new FOUR.Block(0,j));
        blocks.push(new FOUR.Block(this.contextRect.right-50,j));
    }
    return blocks;
};

FOUR.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
     */
    this.player.update(time, delta, this.blocks, this.contextRect);
};

FOUR.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
    for(var i=0; i<this.blocks.length; i++)
        this.blocks[i].draw(this.context);
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
