# HTML5-Color-Picker v1.03

A scaleable color picker (color wheel). Attaches to "input" DOM element

- HTML5 canvas
- Scalable
- HSV color model
- Tested on mobile devices
- Don't require any addition libraries
- Correct turn off if browser not support HTML5
- Two styles for set saturation and volume (display as hsv quad block or as hsv triangle)
- Optional transparency slider (> v0.8)
- Optional popup window if attach color picker to an input (>= v1.02) 

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
    
See [Wiki](https://github.com/NC22/HTML5-Color-Picker/wiki/) for full documentation

[demo](http://catface.ru/colorpicker/examples/1.html), [demo 2](http://catface.ru/colorpicker/examples/2.html), [demo 3](http://catface.ru/colorpicker/examples/3.html)