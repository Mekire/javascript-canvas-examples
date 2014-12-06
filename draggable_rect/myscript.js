/*
 * This program demonstrates clicking and dragging a rectangle.
 * Rather than dragging by a specified handle, the object is moved
 * according to the mouse's relative movement between frames.
 */


//Namespace
var DRAG = {};


DRAG.Player = function(pos, color){
    /**
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), and a color string.
     */
    this.rect = new RECT.Rect(pos[0], pos[1], 100, 100);
    this.color = color;
    this.hover = false;
    this.click = false;
    this.text_center = {x: null, y: null};
    document.addEventListener('mousedown',this.onClick.bind(this,true), false);
    document.addEventListener('mouseup', this.onClick.bind(this,false), false);
};

DRAG.Player.prototype.onClick = function(val, event){
    /* 
     * If the user left clicks on the rectangle set click to true.
     * If the left mouse button is released at anytime, set click to false.
     */
    if(event.which === 1){
        if(!val)
            this.click = false;
        else if(this.hover)
            this.click = true;
    }
};

DRAG.Player.prototype.update = function(mouse, contextRect){
    /*
     * Set hover based on collision with the mouse position.
     * If the player is currently clicked, update position based on the
     * relative mouse movement between the current frame and the last.
     */
    this.hover = this.rect.collidePoint(mouse.x, mouse.y);
    if(this.click){
        this.rect.moveIP(mouse.rel.x, mouse.rel.y);
        this.rect.clampIP(contextRect);
    }
    this.text_center.x = this.rect.x+Math.floor(this.rect.w/2);
    this.text_center.y = this.rect.y+this.rect.h+30;
};

DRAG.Player.prototype.renderText = function(message, context){
    /*
     * Render a simple message beneath the square.
     */
    context.font = '25pt Helvetica';
    context.textAlign = 'center';
    context.fillStyle = 'black';
    context.fillText(message, this.text_center.x, this.text_center.y);
};

DRAG.Player.prototype.draw = function(context){
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
    this.renderText("I'm a red square.", context);
};


DRAG.Mouse = function(canvas) {
    /*
     * A class to keep track of mouse state.
     * Pass the bounding rect of relevant canvas on construction.
     */
    this.canvas = canvas;
    this.boundingRect = this.canvas.getBoundingClientRect();
    this.clientX = null;
    this.clientY = null;
    this.x = null; 
    this.y = null; 
    this.oldX = null;
    this.oldY = null;
    this.rel = {x: 0, y: 0};
    document.addEventListener('mousemove', this.onMove.bind(this), false);
    document.addEventListener('scroll', this.onChange.bind(this), false);
    window.addEventListener('resize', this.onChange.bind(this), false);
};

DRAG.Mouse.prototype.onChange = function(){
    /*
     * Update the client bounding rect on resize or scroll events.
     */
    this.boundingRect = this.canvas.getBoundingClientRect();
};

DRAG.Mouse.prototype.update = function(){
    /* 
     * This function calculates the relative mouse position offset between
     * the current and previous frame.  Must be called each frame from the
     * main loop.
     */
    if(this.x !== null && this.y !== null){
        if(this.oldX !== null && this.oldY !== null){
            this.rel.x = this.x-this.oldX;
            this.rel.y = this.y-this.oldY;
        }
        this.oldX = this.x;
        this.oldY = this.y;
    }
};

DRAG.Mouse.prototype.onMove = function(event){
    /*
     * Set the mouse position relative to the canvas.
     */
    this.clientX = event.clientX;
    this.clientY = event.clientY;
    this.x = event.clientX-this.boundingRect.left;
    this.y = event.clientY-this.boundingRect.top;
};
      
      
DRAG.GameLoop = function(){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.canvas = document.getElementById("topCanvas");
    this.context = this.canvas.getContext('2d');
    var size = [this.context.canvas.width, this.context.canvas.height];
    this.contextRect = new RECT.Rect(0, 0, size[0], size[1]);
    this.fps = 60;
    this.mouse = new DRAG.Mouse(this.canvas);
    this.player = new DRAG.Player([200,100], "red");
    this.mainLoop = this.mainLoop.bind(this);
};

DRAG.GameLoop.prototype.update = function(){
    /*
     * Update the mouse and any actors; called every frame.
     */
    this.mouse.update();
    this.player.update(this.mouse, this.contextRect);
};

DRAG.GameLoop.prototype.render = function(){
    /*
     * Render entire scene; called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
};

DRAG.GameLoop.prototype.mainLoop = function(){
    /*
     * Update and render the scene.  This function is called by setInterval
     * and must be bound to 'this' (see constructor).
     */
    this.update();
    this.render();
};

DRAG.GameLoop.prototype.start = function(){
    /*
     * Sets the mainLoop to be called every interval.
     */
    setInterval(this.mainLoop, 1000/this.fps);
};


DRAG.run = function(){
    var loop = new DRAG.GameLoop();
    loop.start();
};


window.onload = DRAG.run;
