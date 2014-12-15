/*
 * This sample demonstrates topdown scrolling.  The viewport is constrained
 * so that the player only moves off center near the edges of the map.
 * Pixel perfect collision is implemented via surface compositing.
 * More experimentation is needed to determine whether this approach can
 * be used in more complex programs.
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


PF.Block = function(x, y){
    /*
     * A very basic obstacle for the player to collide with.
     */
    this.shade = PF.SHADE_IMAGE;
    this.color = PF.getRandomColor();
    this.rect = new RECT.Rect(x, y, 50, 50); 
};

PF.Block.prototype.draw = function(context){
    /*
     * Fill the rect with this.color and then blit the shade image on top.
     */
    context.fillStyle = this.color;
    context.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    context.drawImage(this.shade, this.rect.x, this.rect.y);
};


PF._Physics = function(){
    this.xVel = 0;
    this.yVel = 0;
    this.grav = 13.2;
    this.fall = false;
};

PF._Physics.prototype.physicsUpdate = function(delta){
    this.fall ? this.yVel += this.grav : this.yVel = 0;
};


PF.Player = function(pos, speed){
    /*
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), and speed in pixels per second.
     */
    PF._Physics.call(this);
    this.image = PF.FACE_IMAGE;
    var w = this.image.width;
    var h = this.image.height;
    this.rect = new RECT.Rect(pos[0], pos[1], w, h);
    this.speed = speed;
    this.jumpPower = -510;
    this.canJump = undefined;
    this.doJump = false;
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

PF.Player.prototype = new PF._Physics();
PF.Player.constructor = PF.Player;

PF.Player.prototype.onKey = function(val, event){
    if(PF.KEY_CODES[event.keyCode] === 'jump'){
        if(val){
            this.doJump = true;
        }
        else 
            this.canJump = true;
    }
};

PF.Player.prototype.getPosition = function(obstacles, delta){
    if(!this.fall)
        this.checkFalling(obstacles);
    else
        this.fall = this.checkCollisions([0,this.yVel*delta], 1, obstacles);
    if(this.xVel)
        this.checkCollisions([this.xVel*delta,0], 0, obstacles);
};

PF.Player.prototype.checkFalling = function(obstacles){
    this.rect.moveIP(0, 1);
    if(!PF.spriteCollideAny(this, obstacles))
        this.fall = true;
    else if(typeof this.canJump === 'undefined')
        this.canJump = true;
    this.rect.moveIP(0, -1);
};

PF.Player.prototype.checkCollisions = function(offset, index, obstacles){
    var unaltered = true;
    this.rect.moveIP(offset[0], offset[1]);
    if(PF.spriteCollideAny(this, obstacles)){
        unaltered = false;
        this.rect[index] = Math.floor(this.rect[index]);
        while(PF.spriteCollideAny(this, obstacles))
            this.rect[index] += offset[index]<0 ? 1 : -1;
    }
    return unaltered;
};

PF.Player.prototype.checkKeys = function(keyState){
    this.xVel = 0;
    if(keyState["left"])
        this.xVel -= this.speed;
    if(keyState["right"])
        this.xVel += this.speed;
};

PF.Player.prototype.jump = function(){
    if(this.canJump && !(this.fall)){
        this.yVel = this.jumpPower;
        this.fall = true;
    }
    this.doJump = false;
    this.canJump = false;
};

PF.Player.prototype.update = function(keyState, obstacles, delta){
    this.checkKeys(keyState);
    if(this.doJump)
        this.jump();
    this.getPosition(obstacles, delta);
    this.physicsUpdate(delta);
};

PF.Player.prototype.draw = function(context){
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
     * pixels in the loaded imaage if it is from a CDN which allows this.
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
