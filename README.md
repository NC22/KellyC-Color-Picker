# HTML5-Color-Picker v1.03

[[http://catface.ru/colorpicker/1.png|alt=Kelly Color Picker]]

A scaleable color picker (color wheel). Attaches to "input" DOM element

- HTML5 canvas
- Scalable
- HSV color model
- Tested on mobile devices
- Don't require any addition libraries
- Correct turn off if browser not support HTML5
- Two styles for set saturation and volume (display as hsv quad block or as hsv triangle)
- Optional transparency slider (>= v0.9)
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

Demo :
[Base](http://catface.ru/colorpicker/examples/attach_to_input.html), [Multiple color pickers, resize](http://catface.ru/colorpicker/examples/test_resize_onchange_event.html), [Create color pickers with different proportions and style](http://catface.ru/colorpicker/examples/test_create_and_destroy.html)