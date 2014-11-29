/*
 * This program demonstrates clicking and dragging a rectangle.
 * Rather than dragging by a specified handle, the object is moved
 * according to the mouse's relative movement between frames.
 */


function Rect(x, y, w, h) {
    /**
     * A basic object to keep track of a sprite's location and dimensions.
     * Accepts four integers for x-location, y-location, width, and height.
     */
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

Rect.prototype.collidePoint = function(x,y){
    /* 
     * Check if a point (given by x and y) overlaps the rectangle.
     * The left and top edge are inclusive; the bottom and right edge are not.
     */
    return ((this.x <= x && x < this.x+this.w) &&
            (this.y <= y && y < this.y+this.h));
};


function Player(pos, color){
    /**
     * Our basic player object. Arguments are a two element array for position
     * (eg [0, 50]), and a color string.
     */
    this.rect = new Rect(pos[0], pos[1], 100, 100);
    this.color = color;
    this.hover = false;
    this.click = false;
    document.addEventListener('mousedown',this.onClick.bind(this,true), false);
    document.addEventListener('mouseup', this.onClick.bind(this,false), false);
}

Player.prototype.onClick = function(val, event){
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

Player.prototype.update = function(mouse, context){
    /*
     * Set hover based on collision with the mouse position.
     * If the player is currently clicked, update position based on the
     * relative mouse movement between the current frame and the last.
     */
    this.hover = this.rect.collidePoint(mouse.x, mouse.y);
    if(this.click){
        this.rect.x += mouse.rel.x;
        this.rect.y += mouse.rel.y;
    }
};

Player.prototype.draw = function(context){
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


function Mouse(boundingRect) {
    /*
     * A class to keep track of mouse state.
     * Pass the bounding rect of relevant canvas on construction.
     */
    this.boundingRect = boundingRect;
    this.x = null; 
    this.y = null; 
    this.oldX = null;
    this.oldY = null;
    this.rel = {x: 0, y: 0};
    document.addEventListener('mousemove', this.onMove.bind(this), false);
}

Mouse.prototype.update = function(){
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

Mouse.prototype.onMove = function(event){
    /*
     * Set the mouse position relative to the canvas.
     */
    this.x = event.clientX-this.boundingRect.left;
    this.y = event.clientY-this.boundingRect.top;
};
      
      
function GameLoop(){
    /*
     * The primary control flow for our program is managed by this object.
     */
    this.canvas = document.getElementById("topCanvas");
    this.context = this.canvas.getContext('2d');
    this.fps = 60;
    this.mouse = new Mouse(this.canvas.getBoundingClientRect());
    this.player = new Player([200,100], "red");
    this.mainLoop = this.mainLoop.bind(this);
}

GameLoop.prototype.update = function(){
    /*
     * Update the mouse and any actors; called every frame.
     */
    this.mouse.update();
    this.player.update(this.mouse, this.context);
};

GameLoop.prototype.render = function(){
    /*
     * Render entire scene; called every frame.
     */
    this.context.clearRect(0,0,this.context.canvas.width,
                           this.context.canvas.height);
    this.player.draw(this.context);
};

GameLoop.prototype.mainLoop = function(){
    /*
     * Update and render the scene.  This function is called by setInterval
     * and must be bound to 'this' (see constructor).
     */
    this.update();
    this.render();
};

GameLoop.prototype.start = function(){
    /*
     * Sets the mainLoop to be called every interval.
     */
    setInterval(this.mainLoop, 1000/this.fps);
};


function run(){
    var loop = new GameLoop();
    loop.start();
}


window.onload = run;
