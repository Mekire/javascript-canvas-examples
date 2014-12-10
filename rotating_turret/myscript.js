/*
 * A tank turrest that follows the mouse cursor and shoots with left click.
 */


// Namespace
var SHOOT = {};


SHOOT.INITIAL_IMAGE_ANGLE = 3*Math.PI/4;
SHOOT.TURRET_IMAGE = new Image();
SHOOT.TURRET_IMAGE.src = "turret.png";


SHOOT.Turret = function(pos, angle, initialImageAngle){
    /*
     * Our friendly turret.
     */
    this.rect = new RECT.Rect(pos[0], pos[1], 150, 150);
    this.sheet = SHOOT.TURRET_IMAGE;
    this.images = {base: 300, barrel: 0}; // x location on sheet.
    this.initialImageAngle = initialImageAngle || 0;
    if(typeof angle === 'undefined')
        angle = this.initialImageAngle;
    this.angle = angle-this.initialImageAngle;
};

SHOOT.Turret.prototype.update = function(mouse){
    /*
     * Recalculates the Turret angle every frame based on mouse position.
     */
    if(mouse.x !== null && mouse.y !== null){
        var y = mouse.y-this.rect.centery;
        var x = mouse.x-this.rect.centerx;
        this.angle = Math.atan2(y, x)-this.initialImageAngle;
    }
};

SHOOT.Turret.prototype.draw = function(context){
    /*
     * Draws the base of the turret; then rotates the context appropriately
     * and draws the barrel of the turret.
     */
    var sw = this.rect.w;
    var sh = this.rect.h;
    var dw = this.rect.w;
    var dh = this.rect.h;
    var dx = this.rect.x;
    var dy = this.rect.y; 
    
    var sx = this.images["base"];
    context.drawImage(this.sheet, sx, 0, sw, sh, dx, dy, dw, dh);
    
    context.save();
    context.translate(this.rect.centerx, this.rect.centery);
    context.rotate(this.angle);
    var sx = this.images["barrel"];
    var dx = -this.rect.w/2;
    var dy = -this.rect.h/2;
    context.drawImage(this.sheet, sx, 0, sw, sh, dx, dy, dw, dh);
    context.restore();   
};
     

SHOOT.Mouse = function(canvas) {
    /*
     * A class to keep track of mouse state.
     * Must be passed the canvas on which it is being used in order to keep
     * track of the bounding client rect.
     */
    this.canvas = canvas;
    this.boundingRect = this.canvas.getBoundingClientRect();
    this.x = null; 
    this.y = null; 
    document.addEventListener('mousemove', this.onMove.bind(this), false);
    document.addEventListener('scroll', this.onChange.bind(this), false);
    window.addEventListener('resize', this.onChange.bind(this), false);
};

SHOOT.Mouse.prototype.onChange = function(){
    /*
     * Update the bounding client rect on resize or scroll events.
     */
    this.boundingRect = this.canvas.getBoundingClientRect();
};

SHOOT.Mouse.prototype.onMove = function(event){
    /*
     * Set the mouse position relative to the canvas.
     */
    this.x = event.clientX-this.boundingRect.left;
    this.y = event.clientY-this.boundingRect.top;
};


SHOOT.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.lastTime = 0;
    this.mouse = new SHOOT.Mouse(this.context.canvas);
    this.turret = new SHOOT.Turret((0,0), 0, SHOOT.INITIAL_IMAGE_ANGLE);
    this.turret.rect.center = this.contextRect.center;
    this.mainLoop = this.mainLoop.bind(this);
};

SHOOT.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
     */
    this.turret.update(this.mouse);
};

SHOOT.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.turret.draw(this.context);
};

SHOOT.GameLoop.prototype.mainLoop = function(time){
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


SHOOT.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a GameLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new SHOOT.GameLoop(context);
    requestAnimationFrame(loop.mainLoop);
};


window.onload = SHOOT.run;
