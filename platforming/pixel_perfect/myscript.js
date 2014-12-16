/*
 * A very basic platformer.
 */


var PF = {};

PF.NUMBER_OF_GRAPHICS = 2;
PF.KEY_CODES = {37: 'left', 38: 'up', 39: 'right', 40: 'down', 32: 'jump'};


PF.getRandomColor = function(){
    /*
     * Returns a random rgb color string.
     */
    var color = [];
    for(var i=0; i<3; i++){
        color.push(Math.floor(Math.random()*256));
    }
    return 'rgb('+color.join(',')+')';
};


PF.spriteCollide = function(sprite, group){
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


PF.spriteCollideAny = function(sprite, group){
    /*
     * Check collision of sprite against an array of sprites.
     * If a collision isdetected, instantly return the colliding sprite;
     * return false if no collisions are found.
     */
    for(var i=0; i<group.length; i++){
        if(sprite.rect.collideRect(group[i].rect))
            return group[i];
    }
    return false;
};


PF.spriteCollideMaskAny = function(sprite, group, threshold){
    var tolerance = threshold || 0;
    var context = sprite.mask.getContext('2d');
    var w = sprite.mask.width;
    var h = sprite.mask.height;
    for(var i=0; i<group.length; i++){
        context.globalCompositeOperation = 'copy';
        context.drawImage(sprite.image, 0, 0);
        context.globalCompositeOperation = 'destination-in';
        var dx = group[i].rect.x-sprite.rect.x;
        var dy = group[i].rect.y-sprite.rect.y;
        context.drawImage(group[i].image, dx, dy);
        var data = context.getImageData(0, 0, w, h).data;
        for(var pixel=0; pixel<data.length; pixel+= 4)
            if(!(data[pixel+3] <= tolerance)){
                return group[i];
            }
    }
    return false;
};


PF.Block = function(x, y){
    /*
     * A very basic obstacle for the player to collide with.
     */
    this.shade = PF.SHADE_IMAGE;
    this.color = PF.getRandomColor();
    this.rect = new RECT.Rect(x, y, 50, 50);
    this.image = this.makeImage();
};

PF.Block.prototype.makeImage = function(){
    var image = document.createElement('canvas');
    var context = image.getContext('2d');
    context.fillStyle = this.color;
    context.fillRect(0, 0, this.rect.w, this.rect.h);
    context.drawImage(this.shade, 0, 0);
    return image;
};

PF.Block.prototype.draw = function(context){
    /*
     * Fill the rect with this.color and then blit the shade image on top.
     */
    context.drawImage(this.image, this.rect.x, this.rect.y);
};


PF._Physics = function(){
    /*
     * A simple physics class that the player will inherit from.
     */
    this.xVel = 0;
    this.yVel = 0;
    this.grav = 600;
    this.fall = false;
};

PF._Physics.prototype.physicsUpdate = function(delta){
    /*
     * If the player is falling, apply gravity; else make sure vertical
     * velocity is set to zero.
     */
    this.fall ? this.yVel += this.grav*delta : this.yVel = 0;
};


PF.Player = function(pos, speed){
    /*
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), and speed in pixels per second.
     */
    PF._Physics.call(this); //Call Physics constructor.
    this.image = PF.FACE_IMAGE;
    var w = this.image.width;
    var h = this.image.height;
    this.rect = new RECT.Rect(pos[0], pos[1], w, h);
    this.mask = document.createElement('canvas'); //Used for collision tests.
    this.mask.width = w;
    this.mask.height = h;
    this.speed = speed;
    this.jumpPower = -400;
    this.canJump = undefined;
    this.doJump = false;
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

// Inherit from _Physics.
PF.Player.prototype = new PF._Physics();
PF.Player.constructor = PF.Player;

PF.Player.prototype.onKey = function(val, event){
    /*
     * On jump key down set the variable doJump so that the player will attempt
     * to jump the next update cycle.
     * On jump key up set the variable canJump.
     * The canJump attribute is used to prevent jumping via key repeat. 
     */
    if(PF.KEY_CODES[event.keyCode] === 'jump')
        val ? this.doJump = true : this.canJump = true;
};

PF.Player.prototype.getPosition = function(obstacles, delta){
    /*
     * Check if the player is falling; then check for obstacles in the x and y
     * directions.  The player's actual position is changed in the 
     * checkCollisions method.
     */
    if(!this.fall)
        this.checkFalling(obstacles);
    else
        this.fall = this.checkCollisions([0,this.yVel*delta], 1, obstacles);
    if(this.xVel)
        this.checkCollisions([this.xVel*delta,0], 0, obstacles);
};

PF.Player.prototype.checkFalling = function(obstacles){
    /*
     * Check if the player is falling by doing a collision test 1 pixel below
     * the current position.
     */
    this.rect.moveIP(0, 1);
    var rectCollides = PF.spriteCollide(this, obstacles);
    if(!rectCollides.length || !PF.spriteCollideMaskAny(this, rectCollides))
        this.fall = true;
    else if(typeof this.canJump === 'undefined')
        this.canJump = true;
    this.rect.moveIP(0, -1);
};

PF.Player.prototype.checkCollisions = function(offset, index, obstacles){
    /*
     * Check for collision afteer moving the player by offset.
     * If a collision is detected the player's position is decremented
     * until clear.  Only one axis should be checked at a time, denoted by
     * index. 
     */
    var unaltered = true;
    this.rect.moveIP(offset[0], offset[1]);
    var rectCollides = PF.spriteCollide(this, obstacles);
    if(rectCollides.length && PF.spriteCollideMaskAny(this, rectCollides)){
        unaltered = false;
        this.rect[index] = Math.floor(this.rect[index]);
        while(PF.spriteCollideMaskAny(this, rectCollides))
            this.rect[index] += offset[index]<0 ? 1 : -1;
    }
    return unaltered;
};

PF.Player.prototype.checkKeys = function(keyState){
    /*
     * Change x velocity based on input from MainLoop.controls.
     */
    this.xVel = 0;
    if(keyState["left"])
        this.xVel -= this.speed;
    if(keyState["right"])
        this.xVel += this.speed;
};

PF.Player.prototype.jump = function(){
    /*
     * If the player is not currently falling and canJump is set,
     * execute a jump.  doJump and canJump are set to false regardless to 
     * prevent double jumping and jumping via keyboard repeat.
     */
    if(this.canJump && !(this.fall)){
        this.yVel = this.jumpPower;
        this.fall = true;
    }
    this.doJump = false;
    this.canJump = false;
};

PF.Player.prototype.update = function(keyState, obstacles, delta){
    /*
     * Process input; move the player; and update physics.
     */
    this.checkKeys(keyState);
    if(this.doJump)
        this.jump();
    this.getPosition(obstacles, delta);
    this.physicsUpdate(delta);
};

PF.Player.prototype.draw = function(context){
    /*
     * Draw the player after flooring both x and y coordinates.
     * Flooring prevents image distortion from subpixel rendering.
     */
    var x = Math.floor(this.rect.x);
    var y = Math.floor(this.rect.y);
    context.drawImage(this.image, x, y);
};


PF.Controls = function() {
    /*
     * This class manages user input.
     */
    this.states = {'left': false, 'right': false};
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

PF.Controls.prototype.onKey = function(val, event){
    /*
     * Function called on both keyup and keydown events.
     * If the keyCode is found in the objects Controls.codes object then
     * the pertinent state will be set in the Controls.states object.
     */
    var state = PF.KEY_CODES[event.keyCode];
    if (typeof state === 'undefined')
        return;
    this.states[state] = val;
    event.preventDefault && event.preventDefault();
};


PF.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.lastTime = 0;
    this.controls = new PF.Controls();
    this.player = new PF.Player([50,-25], 240);
    this.blocks = this.makeBlocks();
    this.mainLoop = this.mainLoop.bind(this);
};

PF.GameLoop.prototype.makeBlocks = function(){
    /*
     * Create some blocks for our player to run in to.
     */
    var blocks = [new PF.Block(400,350), 
                  new PF.Block(300,250), 
                  new PF.Block(150,150)];
    for(var i=0; i<this.contextRect.w; i+=50){
        if(i !== 50)
            blocks.push(new PF.Block(i,0));
        if(i >= 500)
            blocks.push(new PF.Block(i,175));
        blocks.push(new PF.Block(i,this.contextRect.bottom-50));
    }
    for(var j=50; j<this.contextRect.h-50; j+=50){
        blocks.push(new PF.Block(0,j));
        blocks.push(new PF.Block(this.contextRect.right-50,j));
    }
    return blocks;
};

PF.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
     */
    this.player.update(this.controls.states, this.blocks, delta);
};

PF.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
    for(var i=0; i<this.blocks.length; i++)
        this.blocks[i].draw(this.context);
};

PF.GameLoop.prototype.mainLoop = function(time){
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

PF.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new PF.GameLoop(context);
    requestAnimationFrame(loop.mainLoop);
};


PF.makeImage = function(loadCheckArray){
    /*
     * Create a new image and set crossOrigin.  This allows us to examine
     * pixels in the loaded image if it is from a CDN which allows this.
     * We also set the image.onload so that the program is started only
     * after all images have definitely loaded.
     */
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function(){
        loadCheckArray.push(true);
        if(loadCheckArray.length === PF.NUMBER_OF_GRAPHICS)
            PF.run();
    };
    return image;
};


PF.prepare = function(){
    /*
     * Create images and set their src attributes.  The run function itself
     * is run by image.onload once the number of images loaded is equal
     * to NUMBER_OF_GRAPHICS.
     */
    var graphicsLoaded = [];
    PF.FACE_IMAGE = PF.makeImage(graphicsLoaded);
    PF.FACE_IMAGE.src = "smallface.png";
    PF.SHADE_IMAGE = PF.makeImage(graphicsLoaded);
    PF.SHADE_IMAGE.src = "shader.png";
};


PF.prepare();
