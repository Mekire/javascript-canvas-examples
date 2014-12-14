/*
 * This sample demonstrates topdown scrolling.  The viewport is constrained
 * so that the player only moves off center near the edges of the map.
 * Pixel perfect collision is implemented via surface compositing.
 * More experimentation is needed to determine whether this approach can
 * be used in more complex programs.
 */


var TOP = {};

TOP.NUMBER_OF_GRAPHICS = 2;

TOP.DIRECT_DICT = {left: [-1,0], right: [1,0],
                   up: [0,-1], down: [0,1]};

TOP.ANGLE_UNIT_SPEED = Math.sqrt(2)/2;


TOP.Player = function(pos, speed){
    /*
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), and speed in pixels per second.
     */
    this.image = TOP.FACE_IMAGE;
    var w = this.image.width;
    var h = this.image.height;
    this.rect = new RECT.Rect(pos[0], pos[1], w, h);
    this.mask = document.createElement('canvas'); //Used for collision tests.
    this.mask.width = w;
    this.mask.height = h;
    this.speed = speed;
};

TOP.Player.prototype.update = function(key_states, delta, level){
    /*
     * The players update function to be run every frame.
     * Should be passed a TOP.Controls.state object, the time delta and a
     * Level instance. The key states will be looped through and the pertinent 
     * position of the players rect will be adjusted.
     * After adjustment the new rect position is tested for collisions with 
     * the level.
     */
    var vector = {x: 0, y: 0};
    for(var state in key_states){
        if(key_states[state]){
            vector.x += TOP.DIRECT_DICT[state][0];
            vector.y += TOP.DIRECT_DICT[state][1];   
        }
    }
    var unit_speed = (vector.x && vector.y) ? TOP.ANGLE_UNIT_SPEED : 1;
    this.rect.x += unit_speed*this.speed*vector.x*delta;
    while(this.checkMask(level, 100))
        this.rect.x -= vector.x;
    this.rect.y += unit_speed*this.speed*vector.y*delta;
    while(this.checkMask(level, 100))
        this.rect.y -= vector.y;
};

TOP.Player.prototype.checkMask = function(level, threshold){
    /*
     * This function uses image compositing to determine if a pixel perfect
     * collision takes place.  First the player is drawn to their mask
     * canvas.  Next we draw the portion of the level occupied by the player's
     * rect on the same image using 'destination-in' mode.
     * If any pixels remain on the canvas with transparency greater than
     * threshold (0-255) a collision has occured.
     * 
     * Function returns true for collision and false for no collision.
     * 
     */
    var tolerance = threshold || 0;
    var context = this.mask.getContext('2d');
    context.globalCompositeOperation = 'copy';
    context.drawImage(this.image, 0, 0);
    context.globalCompositeOperation = 'destination-in';
    var sx = Math.floor(this.rect.x);
    var sy = Math.floor(this.rect.y);
    var w = this.rect.w;
    var h = this.rect.h;
    context.drawImage(level.image, sx, sy, w, h, 0, 0, w, h);
    var data = context.getImageData(0, 0, w, h).data;
    for(var i=0;i<data.length; i+= 4)
        if(!(data[i+3] <= tolerance)){
            return true;
        }
    return false;
};


TOP.Controls = function() {
    /*
     * This class manages user input.
     */
    this.codes  = {37: 'left', 39: 'right', 38: 'up', 40: 'down'};
    this.states = {'left': false, 'right': false, 'up': false, 'down': false};
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
};

TOP.Controls.prototype.onKey = function(val, event){
    /*
     * Function called on both keyup and keydown events.
     * If the keyCode is found in the objects Controls.codes object then
     * the pertinent state will be set in the Controls.states object.
     */
    var state = this.codes[event.keyCode];
    if (typeof state === 'undefined')
        return;
    this.states[state] = val;
    event.preventDefault && event.preventDefault();
    event.stopPropagation && event.stopPropagation();
};
      

TOP.Level = function(viewport, player){
    this.image = TOP.POND_IMAGE;
    var w = this.image.width;
    var h = this.image.height;
    this.rect = new RECT.Rect(0, 0, w, h);
    this.player = player;
    this.player.rect.center = this.rect.center;
    this.viewport = viewport;
};

TOP.Level.prototype.update = function(key_states, delta){
    this.player.update(key_states, delta, this);
    this.updateViewport();
};

TOP.Level.prototype.updateViewport = function(){
    this.viewport.center = this.player.rect.center;
    this.viewport.clampIP(this.rect);
};

TOP.Level.prototype.draw = function(context){
    var w = this.viewport.w;
    var h = this.viewport.h;
    var sx = Math.floor(this.viewport.x);
    var sy = Math.floor(this.viewport.y);
    var playerX = Math.floor(this.player.rect.x-sx);
    var playerY = Math.floor(this.player.rect.y-sy);
    context.fillStyle = "#6EFF30";
    context.fillRect(0, 0, w, h);
    context.drawImage(this.image, sx, sy, w, h, 0, 0, w, h);
    context.drawImage(this.player.image, playerX, playerY);
};


TOP.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.lastTime = 0;
    this.controls = new TOP.Controls();
    this.player = new TOP.Player([50,50], 420);
    this.level = new TOP.Level(this.contextRect.copy(), this.player);
    this.mainLoop = this.mainLoop.bind(this);
};

TOP.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
     */
    this.level.update(this.controls.states, delta);
};

TOP.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.level.draw(this.context);
};

TOP.GameLoop.prototype.mainLoop = function(time){
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

TOP.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new TOP.GameLoop(context);
    requestAnimationFrame(loop.mainLoop);
};


TOP.makeImage = function(loadCheckArray){
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
        if(loadCheckArray.length === TOP.NUMBER_OF_GRAPHICS)
            TOP.run();
    };
    return image;
};


TOP.prepare = function(){
    /*
     * Create images and set their src attributes.  The run function itself
     * is run by image.onload once the number of images loaded is equal
     * to NUMBER_OF_GRAPHICS.
     */
    var graphicsLoaded = [];
    TOP.FACE_IMAGE = TOP.makeImage(graphicsLoaded);
    TOP.FACE_IMAGE.src = "smallface.png";
    TOP.POND_IMAGE = TOP.makeImage(graphicsLoaded);
    TOP.POND_IMAGE.src = "pond.png";
};


TOP.prepare();
