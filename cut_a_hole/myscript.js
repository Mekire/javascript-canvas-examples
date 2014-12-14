/*
 * This script experiments with cutting a transparent hole in an overlayed
 * surface.
 */


// Namespace
var HOLE = {};

HOLE.BACKGROUND_IMAGE = new Image();
HOLE.BACKGROUND_IMAGE.src = "frac.png";

  
HOLE.OverLay = function(w, h, radius){
    /*
     * An overlay image to draw on top of the current display canvas.
     * Arguments w and h are integer sizes of the entire overlayed area;
     * radius is the radius of the transparent hole drawn on top.
     */
    this.radius = radius;
    this.w = w;
    this.h = h;
    this.image = this.makeImage(w, h);
};

HOLE.OverLay.prototype.makeImage = function(w, h){
    /*
     * Creates a new canvas element that can be drawn to without effecting
     * the canvas displayed on the screen.
     */
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
};

HOLE.OverLay.prototype.update = function(mouse){
    /*
     * Fill the overlay image surface and then punch a hole in it using the
     * context.globalCompositeOperation attribute of 'destination-out'.
     */
    var context = this.image.getContext('2d');
    context.clearRect(0, 0, this.w, this.h);
    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.fillRect(0, 0, this.w, this.h);
    if(mouse.x !== null && mouse.y !== null){
        context.beginPath();
        context.fillStyle = "rgba(0, 0, 0, 1)";
        context.globalCompositeOperation = 'destination-out';
        context.arc(mouse.x, mouse.y, this.radius, 0, Math.PI*2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
};

HOLE.OverLay.prototype.draw = function(context){
    /*
     * Draw the overlay canvas on to another canvas context.
     */
    context.drawImage(this.image, 0, 0);  
};


HOLE.Mouse = function(canvas) {
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

HOLE.Mouse.prototype.onChange = function(){
    /*
     * Update the bounding client rect on resize or scroll events.
     */
    this.boundingRect = this.canvas.getBoundingClientRect();
};

HOLE.Mouse.prototype.onMove = function(event){
    /*
     * Set the mouse position relative to the canvas.
     */
    this.x = event.clientX-this.boundingRect.left;
    this.y = event.clientY-this.boundingRect.top;
};

      
HOLE.GameLoop = function(context){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.context = context;
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.background = HOLE.BACKGROUND_IMAGE;
    this.mouse = new HOLE.Mouse(this.context.canvas);
    this.overLay = new HOLE.OverLay(size[0], size[1], 100);
    this.mainLoop = this.mainLoop.bind(this);
};

HOLE.GameLoop.prototype.update = function(){
    /*
     * Update the overlay based on mouse position.
     */
    this.overLay.update(this.mouse);
};

HOLE.GameLoop.prototype.render = function(){
    /*
     * Render entire scene, called every frame.
     */
    this.context.drawImage(this.background, 0, 0);
    this.overLay.draw(this.context);
};

HOLE.GameLoop.prototype.mainLoop = function(){
    /*
     * Update and render the scene.  This function is called by 
     * requestAnimationFrame() and must be bound to 'this' (see constructor).
     */
    this.update();
    this.render();
    requestAnimationFrame(this.mainLoop);
};


HOLE.run = function(){
    /*
     * Grabs the canvas from the DOM; creates a context; creates a mainLoop;
     * and gets us started.
     */
    var canvas = document.getElementById("topCanvas");
    var context = canvas.getContext('2d');
    var loop = new HOLE.GameLoop(context);
    requestAnimationFrame(loop.mainLoop);
};


window.onload = HOLE.run;
