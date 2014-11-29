function App(){
    /*
     * Create our canvas and context and add an event listener.  
     */
    var canvas = document.getElementById("topCanvas");
    this.context = canvas.getContext('2d');
    document.addEventListener('mousedown', this.onClick.bind(this), false);
}

App.prototype.onClick = function(event){
    /*
     * If the event is a left mouse click, randomly generate a new color
     * and call the fill() method.
     */
    if(event.which === 1){
        var color = [];
        for(var i=0; i<3; i++){
            color.push(Math.floor(Math.random()*256));
        }
        this.fill('rgb('+color.join(',')+')');
    }
};

App.prototype.fill = function(color){
    /*
     * Fill the canvas with the new color.
     */
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.context.canvas.width,
                          this.context.canvas.height);
};


function run(){
    new App();
}

window.onload = run;
