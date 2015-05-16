# HTML5-Color-Picker v0.8

A scaleable color picker (color wheel). Attaches to "input" DOM element

- HTML5 canvas
- Scalable
- HSV color model
- Tested on mobile devices
- Don't require any addition libraries
- Correct turn off if browser not support HTML5
- Two styles for set saturation and volume (display as hsv quad block or as hsv triangle)

Example : 
    
    <canvas id="color-picker"></canvas>
    <input id="color"></input>
    <script> 
        new KellyColorPicker({
            place : 'color-picker', 
            size : 150, 
            input : 'color',  
        });
    </script>
    
See https://github.com/NC22/HTML5-Color-Picker/wiki/ for full documentation