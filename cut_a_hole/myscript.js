/*
 * A simple sprite that can be moved in the four orthogonal directions.
 * Instead of a simple rectangle, our player is now an animated sprite.
 * Obstacles have also been added with which the player can collide.
 */


// Namespace
var HOLE = {};






        
HOLE.OverLay = function(w, h, radius){
    /*
     * A very basic obstacle for the player to collide with.
     */
    this.radius = radius;
    this.image = this.makeImage(w, h);
};

HOLE.OverLay.prototype.makeImage = function(w, h){
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
};

HOLE.OverLay.prototype.update = function(mouse){
    var context = this.image.getContext('2d');
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = "rgba(0,0,0,0.9)";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    if(mouse.x !== null && mouse.y !== null){
        context.beginPath();
        context.globalCompositeOperation = 'destination-out';
        context.arc(mouse.x, mouse.y, this.radius, 0, Math.PI*2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
    var data = context.getImageData(50, 50, 1, 1).data;
    console.log("("+data[0]+", "+data[1]+", "+data[2]+", "+data[3]+")");
};

HOLE.OverLay.prototype.draw = function(context){
    context.drawImage(this.image, 0, 0);  
};


HOLE.Mouse = function(canvas) {
    /*
     * A class to keep track of mouse state.
     * Pass the bounding rect of relevant canvas on construction.
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
     * Update the client bounding rect on resize or scroll events.
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
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.fps = 60;
    this.lastTime = 0;
    this.background = new Image();
    this.background.src = "frac.png";
    this.mouse = new HOLE.Mouse(this.context.canvas);
    this.overLay = new HOLE.OverLay(size[0], size[1], 100);
    this.mainLoop = this.mainLoop.bind(this);
};

HOLE.GameLoop.prototype.update = function(time, delta){
    /*
     * Update all actors, called every frame.
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

HOLE.GameLoop.prototype.mainLoop = function(time){
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
