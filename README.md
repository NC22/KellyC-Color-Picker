# HTML5-Color-Picker


<img src="https://catface.ru/userfiles/media/udata_1544473330_tnsnqkrg.png" height="180"> <img src="https://catface.ru/userfiles/media/udata_1544473327_qbxojemn.png" height="180">


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
    
See [Wiki](//github.com/NC22/HTML5-Color-Picker/wiki/) for full documentation

## Demo | Examples 

 <a href="//nc22.github.io/HTML5-Color-Picker/examples/index.html">List of examples</a>

## License 

 [GNU General Public License v3](http://www.gnu.org/licenses/gpl.html) 
