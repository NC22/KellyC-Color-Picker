 /** 
 * @category  html5 widgets
 * @package   Kelly
 * @author    Rubchuk Vladimir <torrenttvi@gmail.com>
 * @copyright 2015 Rubchuk Vladimir
 * @license   GPLv3
 * @version   0.9b
 *   
 * Usage example :
 * 
 *   var colorPicker = new KellyColorPicker({place : 'color-picker'});
 * 
 * ToDo :
 * 
 *   - вывод точек градиента sv через лерп для триугольного селектора
 *   - оформлять ввиде всплывающего окна для инпута (если инпут видимый) 
 *   - для позиционирование относительно инпута сделать универсальной geteventdot - вынести ф-ю получения
 *   оффсета элемента
 *   - проверить ф-цию rotatePath
 *   - сохранять массив инициализационных настроек после валидации
 *   - удалять canvas при удалении input'a
 *   
 **/
 
 /**
  * Create color picker
  * @param {Array} cfg
  * @returns {KellyColorPicker}
  */
 
function KellyColorPicker(cfg) {
    var PI = Math.PI;
    
    var svFig;
    
    var svCursor = new Object;
        svCursor.radius = 4 ;
        
    var canvas = false;    
    var ctx = false;
    
    var method = 'quad';
    var alpha = false; // посмотреть где лучше определять доп пространство в canvaseSize или в canvas.width
    var drag = false;
    var cursorAnimReady = true; // fix FPS by requestAnimationFrame 
    
    var events = new Array();
    var userEvents = new Array();
    
    var canvasHelper = document.createElement("canvas");
    var canvasHelperCtx = false; // используется если нужно перекопировать изображение через drawImage для сохранения прозрачности
    var rendered = false;
    var canvasHelperData = null; // rendered interface without cursors and without alpha slider [wheelBlockSize x wheelBlockSize]
    
    var input = false;
    var inputColor = true;
    
    // container, or canvas element
    var place = false; 
    var handler = this;
    
    var basePadding = 2;
    
    var padding;
    var wheelBlockSize = 200;
    var center;
    
    // current color
    var hsv;
    var rgb;
    var hex = '#000000';
    var a = 1;
    
    var wheel = new Object;
        wheel.width = 18;
        wheel.imageData = null; // rendered wheel image data
        wheel.innerRadius;
        wheel.startAngle = 0; // 150
        wheel.outerRadius;   
        wheel.outerStrokeStyle = 'rgba(0,0,0,0.2)';
        wheel.innerStrokeStyle = 'rgba(0,0,0,0.2)';
        wheel.pos; // center point; wheel cursor \ hsv quad \ hsv triangle positioned relative that point
        wheel.draw = function() {
                
            if (this.imageData) {
                ctx.putImageData(this.imageData, 0, 0);
            } else {
                var hAngle = this.startAngle;
                for(var angle=0; angle<=360; angle++) {
                                   
                    var startAngle = toRadians(angle-2);
                    var endAngle = toRadians(angle);            

                    ctx.beginPath();
                    ctx.moveTo(center, center);
                    ctx.arc(center, center, this.outerRadius, startAngle, endAngle, false);
                    ctx.closePath();

                    var targetRgb = hsvToRgb(hAngle / 360, 1, 1);
                    ctx.fillStyle = 'rgb('+targetRgb.r+', '+targetRgb.g+', '+targetRgb.b+')';
                    //ctx.fillStyle = 'hsl('+hAngle+', 100%, 50%)';
                    ctx.fill();
                    
                    hAngle ++;
                    if (hAngle >= 360) hAngle = 0;
                }

                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                ctx.arc(center, center, this.innerRadius, 0, PI*2);

                ctx.fill();

                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = this.innerStrokeStyle; // 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();

                // wheel border
                ctx.beginPath();   
                ctx.arc(center, center, this.outerRadius, 0, PI*2);
                ctx.strokeStyle = this.outerStrokeStyle;
                ctx.lineWidth = 2;
                ctx.stroke();        
                ctx.closePath();          

                this.imageData = ctx.getImageData(0, 0, wheelBlockSize, wheelBlockSize);
            }
        
        };
        
        wheel.isDotIn = function(dot) {
            if (Math.pow(wheel.pos.x - dot.x, 2) + Math.pow(wheel.pos.y - dot.y, 2) < Math.pow(wheel.outerRadius, 2)) {
                if (Math.pow(wheel.pos.x - dot.x, 2) + Math.pow(wheel.pos.y - dot.y, 2) > Math.pow(wheel.innerRadius, 2)) {
                    return true;
                }
            }
            return false;
        };
    
    var wheelCursor = new Object;
        wheelCursor.lineWeight = 2;
        wheelCursor.height = 4;
        wheelCursor.paddingX = 2; // padding from sides of wheel
        wheelCursor.path; // rotatePath2 --- поворот по старой функции, в фигуре не приплюсован центр
        
    var alphaSlider = new Object;
        alphaSlider.width = 18;
        alphaSlider.padding = 4;
        alphaSlider.outerStrokeStyle = 'rgba(0,0,0,0.2)';
        alphaSlider.innerStrokeStyle = 'rgba(0,0,0,0.2)';
        alphaSlider.height;
        alphaSlider.pos; // left top corner position
        alphaSlider.updateSize = function() {
            this.pos = {x : wheelBlockSize + alphaSlider.padding, y : alphaSlider.padding}; 
            this.height = wheelBlockSize - alphaSlider.padding * 2;
        };
        
        alphaSlider.draw = function() {
            var alphaGrd = ctx.createLinearGradient(0,0,0, this.height);
                alphaGrd.addColorStop(0,'rgba('+ rgb.r +','+ rgb.g + ','+ rgb.b + ',1)');
                alphaGrd.addColorStop(1,'rgba('+ rgb.r +','+ rgb.g + ','+ rgb.b + ',0)');
                      
            ctx.beginPath();
            ctx.rect(this.pos.x, this.pos.y, this.width , this.height);
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.fillStyle = alphaGrd;   
            ctx.fill();
              
            ctx.strokeStyle='rgba(0,0,0, 0.2)';
            ctx.lineWidth = 2;
            
            ctx.stroke();    
            ctx.closePath(); 
        };
        
        alphaSlider.dotToAlpha = function(dot) {
            return 1 - Math.abs(this.pos.y - dot.y) / this.height;                      
        };
        
        alphaSlider.alphaToDot = function(alpha){
            return {    
                x : 0,
                y : this.height - (this.height * alpha)
            };
        };
        
        alphaSlider.limitDotPosition = function(dot) {
            var y = dot.y;
            
            if (y < this.pos.y) {
                y = this.pos.y;
            }
            
            if (y > this.pos.y + this.height) {
                y = this.pos.y + this.height;
            }
            
            return {x : this.pos.x, y : y};
        }; 
        
        alphaSlider.isDotIn = function(dot) {
            if (dot.x < this.pos.x || 
                dot.x > this.pos.x + alphaSlider.width || 
                dot.y < this.pos.y || 
                dot.y > this.pos.y + this.height) {
                return false;
            }            
            return true;
        };   

    // svCursorMouse - для устройств с мышкой, генератор указателя в зависимости от активной области
    var svCursorMouse = new Object;
    
        svCursorMouse.svCursorData = null;
        svCursorMouse.stCursor = null; // cursor before replace
        svCursorMouse.curType = 0; // if > 0 cursor switched by KellyColorPicker to custom
        svCursorMouse.size = 16;
        
        svCursorMouse.initSvCursor = function() {           
            if (!canvas) return false;
            var el = document.body;
            
            this.curType = 1;
            
            if (!this.stCursor) this.stCursor = el.style.cursor;
            if (!this.stCursor) this.stCursor = 'auto';
            
            if (this.svCursorData) {
                el.style.cursor = this.svCursorData; 
                return true;
            }
            
            if (!canvasHelper) return false;
            canvasHelper.width=this.size;
            canvasHelper.height=this.size;
            
            canvasHelperCtx.clearRect(0, 0, this.size, this.size);
            canvasHelperCtx.strokeStyle='rgba(255, 255, 255, 1)';

            canvasHelperCtx.beginPath();
            canvasHelperCtx.lineWidth = 2;
            canvasHelperCtx.arc(this.size / 2, this.size / 2, this.size / 2, 0, PI*2);

            canvasHelperCtx.stroke(); 
            canvasHelperCtx.closePath();  
            
            var offset = svCursorMouse.size; //if (input.value.indexOf(curImageData) !== -1)
            var curImageData = canvasHelper.toDataURL();
            
            this.svCursorData = 'url(' + curImageData + ') ' + offset / 2 + ' ' + offset / 2 + ', auto';
            
            if (!this.svCursorData) return false;
            
            el.style.cursor = this.svCursorData;
            if (el.style.cursor.indexOf(curImageData) === -1) { // for autist IE, that not support data-uri for cursor -_-
                this.svCursorData = 'crosshair';
                el.style.cursor = 'crosshair'; 
            } 
            return true;
        };
        
        svCursorMouse.initStandartCursor = function() {
            if (!this.stCursor) return;
            svCursorMouse.curType = 0;
            document.body.style.cursor = this.stCursor;
        };
        
        svCursorMouse.updateCursor = function(newDot) {
            if (KellyColorPicker.cursorLock) return;
            
            if (svFig.isDotIn(newDot)) {          
                svCursorMouse.initSvCursor();                
            } else {
                svCursorMouse.initStandartCursor();
            }
        };
     
    function getSvFigureQuad() {    
        var quad = new Object;
        quad.size;
        quad.padding = 2;
        quad.path; // крайние точки фигуры на координатной плоскости
        quad.imageData = null; // rendered quad image data
        // перезаписывается существующий, чтобы не вызывать утечек памяти, обнуляя прошлый
        // тк UInt8ClampedArray генерируемый createImageData стандартными способами не 
        // во всех браузерах выгружается сразу
        
        quad.dotToSv = function(dot) {            
            return {
                s : Math.abs(this.path[3].x - dot.x) / this.size,
                v : Math.abs(this.path[3].y - dot.y) / this.size
            };
        };
        
        quad.svToDot = function(sv) {
            var quadX = this.path[0].x;
            var quadY = this.path[0].y;
            
            var svError = 0.02;
            if (wheelBlockSize < 100) svError = 0.07;
            
            for (var y=0; y < this.size; y++) { 
                for (var x=0; x < this.size; x++) {
                    var dot = {x : x + quadX, y : y + quadY};                    
                    var targetSv = this.dotToSv(dot);
                    var es = Math.abs(targetSv.s-sv.s), ev = Math.abs(targetSv.v-sv.v);
                    
                    if (es < svError && ev < svError) {
                        return dot;
                    }
                }
            }
            
            return {x : 0,  y :0};
        };
        
        quad.limitDotPosition = function(dot) {
            var x = dot.x;
            var y = dot.y;
            
            if (x < this.path[0].x) {
                x = this.path[0].x;
            }
            
            if (x > this.path[0].x + this.size) {
                x = this.path[0].x + this.size;
            }
            
            if (y < this.path[0].y) {
                y = this.path[0].y;
            }
            
            if (y > this.path[0].y + this.size) {
                y = this.path[0].y + this.size;
            }
            
            return {x : x, y : y};
        }; 
        
        quad.draw = function() {            
            if (!this.imageData) this.imageData = ctx.createImageData(this.size, this.size);
            var i = 0;
            
            var quadX = this.path[0].x;
            var quadY = this.path[0].y; 
            
            for (var y=0; y < this.size; y++) { 
                for (var x=0; x < this.size; x++) { 
                    var dot = {x : x + quadX, y : y + quadY};
                    
                    var sv = this.dotToSv(dot);                
                    var targetRgb = hsvToRgb(hsv.h, sv.s, sv.v);
                    this.imageData.data[i+0] = targetRgb.r;
                    this.imageData.data[i+1] = targetRgb.g;
                    this.imageData.data[i+2] = targetRgb.b;
                    this.imageData.data[i+3] = 255;
                    i += 4;
                }
            }            
            
            ctx.putImageData(this.imageData, quadX, quadY);         
            
            ctx.beginPath();  
            ctx.strokeStyle='rgba(0,0,0, 0.2)';
            ctx.lineWidth = 2;
            for (var i=0; i <= this.path.length-1; ++i)
            {         
                if (i == 0) ctx.moveTo(this.path[i].x, this.path[i].y);            
                else ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            
            ctx.stroke();        
           
            ctx.closePath();
        };
        
        quad.updateSize = function() {        
            var workD = (wheel.innerRadius * 2) - wheelCursor.paddingX*2 - this.padding*2;
            
            // исходя из формулы диагонали квадрата, узнаем длинну стороны на основании доступного диаметра
            this.size = Math.floor(workD / Math.sqrt(2));

            this.path = new Array();
            
            // находим верхнюю левую точку и от нее задаем остальные координаты
            this.path[0] = {x : -1 * (this.size / 2), y : -1 * (this.size / 2)};
            this.path[1] = {x : this.path[0].x + this.size, y :  this.path[0].y};
            this.path[2] = {x : this.path[1].x, y :  this.path[1].y + this.size};
            this.path[3] = {x : this.path[2].x - this.size, y : this.path[2].y};
            this.path[4] = {x : this.path[0].x, y : this.path[0].y};
            
            for (var i=0; i <= this.path.length-1; ++i) {
                this.path[i].x += wheel.pos.x; 
                this.path[i].y += wheel.pos.y;
            }
        }
        
        quad.isDotIn = function(dot) {
            if (dot.x < this.path[0].x || 
                dot.x > this.path[0].x + this.size || 
                dot.y < this.path[0].y || 
                dot.y > this.path[0].y + this.size) {
                return false;
            }            
            return true;
        };
        
        return quad;
    }
       
    function getSvFigureTriangle() {
        var triangle = new Object;
        triangle.size; // сторона равностороннего треугольника
        triangle.padding = 2;
        triangle.path;
        triangle.imageData = null; // rendered triangle image data
        triangle.followWheel = true;
        triangle.s;
        triangle.sOnTop = false;
        triangle.outerRadius;
        
        triangle.limitDotPosition = function(dot){
            var x = dot.x;
            var y = dot.y;
            
            var slopeToCtr;
            var maxX = this.path[0].x;
            var minX = this.path[2].x;
            var finalX = x;
            var finalY = y;
            
            finalX = Math.min(Math.max(minX, finalX), maxX);
            var slope = ((this.path[0].y - this.path[1].y) / (this.path[0].x - this.path[1].x));
            var minY  = Math.ceil((this.path[1].y + (slope * (finalX - this.path[1].x))));
            slope = ((this.path[0].y - this.path[2].y) / (this.path[0].x - this.path[2].x));
            var maxY = Math.floor((this.path[2].y + (slope * (finalX - this.path[2].x))));
            
            if (x < minX) {
                slopeToCtr = ((wheel.pos.y - y) / (wheel.pos.x - x));
                finalY = y;
            }
            
            finalY = Math.min(Math.max(minY, finalY), maxY);
            return {x : finalX, y : finalY};
        };
        
        triangle.svToDot = function(sv) {
            var svError = 0.02;
            if (wheelBlockSize < 100) svError = 0.07;
            
            for (var y=0; y < this.size; y++) {
                for (var x=0; x < this.size; x++) { 
                    var dot = {x : this.path[1].x + x, y : this.path[1].y + y};             
                    if (svFig.isDotIn(dot)) {  
                        var targetSv = this.dotToSv(dot);
                        var es = Math.abs(targetSv.s-sv.s), ev = Math.abs(targetSv.v-sv.v);
                    
                        if (es < svError && ev < svError) {
                            return dot;
                        }
                    } 
                }
            } 
            
            return {    
                x : 0,
                y : 0
            };
        };
        
        triangle.draw = function() {              
            if (!this.imageData) this.imageData = canvasHelperCtx.createImageData(this.size, this.size);
            
            canvasHelper.width=this.size;
            canvasHelper.height=this.size;
            
            var trX = this.path[1].x;
            var trY = this.path[1].y;
            var i = 0;
            for (var y=0; y < this.size; y++) {
                for (var x=0; x < this.size; x++) { 
                    var dot = {x : this.path[1].x + x, y : this.path[1].y + y};             
                    if (!svFig.isDotIn(dot)) {                        
                        this.imageData.data[i+0] = 0;
                        this.imageData.data[i+1] = 0;
                        this.imageData.data[i+2] = 0;
                        this.imageData.data[i+3] = 0;    
                    } else {   
                        var sv = this.dotToSv(dot);
                        var targetRgb = hsvToRgb(hsv.h, sv.s, sv.v);
                        
                        this.imageData.data[i+0] = targetRgb.r;
                        this.imageData.data[i+1] = targetRgb.g;
                        this.imageData.data[i+2] = targetRgb.b;
                        this.imageData.data[i+3] = 255;
                    }
                    
                    i += 4;  
                }
            } 
            
            canvasHelperCtx.putImageData(this.imageData, 0, 0); 
            ctx.drawImage(canvasHelper, trX, trY);
           
            ctx.beginPath();  
            ctx.strokeStyle='rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            var trianglePath = this.path; //rotatePath(triangle.path, hsv.h * 360);
            for (var i=0; i <= trianglePath.length-1; ++i)
            {       
                if (i == 0) ctx.moveTo(trianglePath[i].x, trianglePath[i].y);            
                else ctx.lineTo(trianglePath[i].x, trianglePath[i].y);
            }
            
            ctx.stroke();       
            ctx.closePath();
        };
        
        triangle.calcS = function(p) {
            return Math.abs((p[1].x-p[0].x)*(p[2].y-p[0].y)-(p[2].x-p[0].x)*(p[1].y-p[0].y))/2;
        };
        
        triangle.dotToSv = function(dot) {
            var p = getP({x : dot.x, y : dot.y}, this.vol);                               
            var len = getLen(p, this.vol[0]); 
            
            // dirty tricks? replace output to interpolation and lerp in future
            if (len < 1) len = Math.floor(len);
            if (len > this.h - 1) len = this.h;
            
            var vol = len / (this.h); 
            
            var angle = Math.abs(getAngle(dot, this.sSide));            
            if (angle < 30) angle = 30;
                angle -= 30;                
                angle = 60 - angle;              
                angle = angle / 60; // - saturation from one angle
                       
            return {s : angle, v : vol};     
        };
        
        triangle.isDotIn = function(dot) {     
            var t = [
                {x : this.path[0].x, y : this.path[0].y}, 
                {x : this.path[1].x, y : this.path[1].y}, 
                {x : dot.x, y : dot.y}
            ];
            
            var s = this.calcS(t);
            t[1] = {x : this.path[2].x, y : this.path[2].y};
            s += this.calcS(t);
            t[0] = {x : this.path[1].x, y : this.path[1].y};
            s += this.calcS(t);
            
            if (Math.ceil(s) == Math.ceil(this.s)) return true;
            else return false;        
        };
        
        triangle.updateSize = function() {            
            // из формулы высоты равностороннего треугольника            
            this.outerRadius = wheel.innerRadius - wheelCursor.paddingX - this.padding;            
            // из теоремы синусов треугольника
            this.size = Math.floor((2 * this.outerRadius) * Math.sin(toRadians(60))); 
            
            var h = ((Math.sqrt(3) / 2) * this.size);        
            this.h = ((Math.sqrt(3) / 2) * this.size);
            
            this.path = new Array();
            this.path[0] = {x : this.outerRadius, y : 0}; // middle point - h
            this.path[1] = {x : this.path[0].x - h, y : -1 * (this.size / 2)}; // upper - s
            this.path[2] = {x : this.path[1].x, y : this.size / 2}; // bottom - v
            this.path[3] = {x : this.path[0].x, y : this.path[0].y}; // to begin
            
            for (var i=0; i <= this.path.length-1; ++i) {
                this.path[i].x += wheel.pos.x; 
                this.path[i].y += wheel.pos.y;
            }
                    
            this.vol = new Array();

            
            this.s = this.calcS(this.path); 
            if (this.sOnTop) {
                var middle = getMiddlePoint(this.path[0], this.path[2]);
            
                this.vol[0] = {x : this.path[1].x, y : this.path[1].y};
                this.vol[1] = {x : middle.x, y : middle.y};
            
                this.sSide = this.path[1];
            } else {
                var middle = getMiddlePoint(this.path[0], this.path[1]);
            
                this.vol[0] = {x : this.path[2].x, y : this.path[2].y};
                this.vol[1] = {x : middle.x, y : middle.y};
                
                this.sSide = this.path[2];                 
            }
        };
        
        return triangle;
    }
 
    function addEventListner(object, event, callback) {
        if (typeof object !== 'object') {
            object = document.getElementById(object);
        }
        if (!object) return false; 
        
        events[event] = callback;
        
        if (!object.addEventListener) {
            object.attachEvent('on' + event, events[event]);
        } else {
            object.addEventListener(event, events[event]);
        }
        
        return true;
    }

    function removeEventListener(object, event) {
        if (typeof object !== 'object') {
            object = document.getElementById(object);
        }
        
        if (!object) return false; 
        
        if (!events[event]) return false;
        
        if (!object.removeEventListener) {
            object.detachEvent('on' + event, events[event]);
        } else {
            object.removeEventListener(event, events[event]);
        }
        events[event] = null;
        return true;
    }
    
    // [converters]
    
    // https://ru.wikipedia.org/wiki/HSV_%28%F6%E2%E5%F2%EE%E2%E0%FF_%EC%EE%E4%E5%EB%FC%29
    // http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
    
    function hsvToRgb(h, s, v) {
        var r, g, b, i, f, p, q, t;
        
        if (h && s === undefined && v === undefined) {
            s = h.s, v = h.v, h = h.h;
        }
        
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        
        return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
        };
    }

    function rgbToHsv(r, g, b) {
        if (r && g === undefined && b === undefined) {
            g = r.g, b = r.b, r = r.r;
        }
        
        r = r/255, g = g/255, b = b/255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max == 0 ? 0 : d / max;

        if(max == min){
            h = 0; // achromatic
        }else{
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {h : h, s : s, v : v};
    }

    function hexToRgb(hex) {    
        var dec = parseInt(hex.charAt(0) == '#' ? hex.slice(1) : hex, 16);
        return {r: dec >> 16, g: dec >> 8 & 255, b: dec & 255};
    }
    
    function rgbToHex(color) {    
        var componentToHex = function(c) {
            var hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        
        return "#" + componentToHex(color.r) + componentToHex(color.g) + componentToHex(color.b);
    }
    
    function toRadians(i) { 
        return i * (PI/180);
    }
    
    // [converters - end]
    
    function getLen(point1, point2) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }
    
    function getMiddlePoint(point1, point2) {
        return { x : (point1.x + point2.x) / 2, y : (point1.y + point2.y) / 2};
    }
    
    // перпендикуляр от точки
    
    function getP(point1, line1) {
        var l=(line1[0].x-line1[1].x)*(line1[0].x-line1[1].x)+(line1[0].y-line1[1].y)*(line1[0].y-line1[1].y);
        var pr =(point1.x-line1[0].x)*(line1[1].x-line1[0].x)+(point1.y-line1[0].y)*(line1[1].y-line1[0].y);
        var pt = true;
        var cf=pr/l;
        
        if(cf < 0) { cf=0; pt = false; }
        if(cf > 1) { cf=1; pt = false; }
        
        return {
            x : line1[0].x + cf *(line1[1].x-line1[0].x),
            y : line1[0].y + cf * (line1[1].y-line1[0].y),
            pt : pt
        };
    }
    
    // translate360 = true  270
    //            180 --- from.x.y --- 0
    //                      90
    
    function getAngle(point, from, translate360) {
        if (!from) from = {x : 0, y : 0};
        
        var distX = point.x - from.x;
        var distY = point.y - from.y;
        
        var a = Math.atan2(distY, distX) * 180/(PI);    
        if (translate360 && a < 0) a = 360 + a;
        
        return a;        
    }
       
    // поворот фигуры относительно точки
    function rotatePath2(points, angle) {   
        angle = toRadians(angle);
        var newPoints = new Array();
        
        for (var i=0; i <= points.length-1; ++i)
        {             
            newPoints[i] = {
                x : points[i].x * Math.cos(angle) - points[i].y * Math.sin(angle), 
                y : points[i].x * Math.sin(angle) + points[i].y * Math.cos(angle)
            };
        }
        
        return newPoints;
    }
    
    function rotatePath(points, angle, rotatePoint) {        
        if (!rotatePoint) rotatePoint = {x : 0, y : 0};
        
        angle = toRadians(angle);
        var newPoints = new Array();
        
        for (var i=0; i <= points.length-1; ++i)
        {   
            var y = points[i].y - rotatePoint.y;
            var x = points[i].x - rotatePoint.x;
            
                x = x * Math.cos(angle) - y * Math.sin(angle);
                y = x * Math.sin(angle) + y * Math.cos(angle);
                
                x += rotatePoint.x;
                y += rotatePoint.y;  
                
            newPoints[i] = {
                x : x, 
                y : y
            };
        }
        
        return newPoints;
    }
    
    function updateSize() {
        padding = basePadding + wheelCursor.paddingX;
        
        rendered = false;
        wheel.imageData = null;
        
        center = wheelBlockSize / 2;
        wheel.pos = {x : center, y : center};
        
        wheel.outerRadius = center - padding;
        wheel.innerRadius = wheel.outerRadius - wheel.width;   
        
        // объект относительно начала координат
        wheelCursor.path = [
            {x : wheel.innerRadius - wheelCursor.paddingX, y : wheelCursor.height * -1}, 
            {x : wheel.outerRadius + wheelCursor.paddingX, y : wheelCursor.height * -1},
            {x : wheel.outerRadius + wheelCursor.paddingX, y : wheelCursor.height}, 
            {x : wheel.innerRadius - wheelCursor.paddingX, y : wheelCursor.height},
            {x : wheel.innerRadius - wheelCursor.paddingX, y : wheelCursor.height * -1}
        ];
        
        //for (var i=0; i <= wheelCursor.path.length-1; ++i) {
        //  wheelCursor.path[i].x += wheel.pos.x; 
        //  wheelCursor.path[i].y += wheel.pos.y;
        //}
        
        var width = wheelBlockSize;
        if (alpha) width += alphaSlider.width + alphaSlider.padding * 2; 
        
        if (place.tagName != 'CANVAS') {
            place.style.width = width + 'px';
            place.style.height = wheelBlockSize + 'px';
        }
        
        canvas.width = width;
        canvas.height = wheelBlockSize;

        svFig.updateSize();
        if (alpha) alphaSlider.updateSize();
    }
    
    function updateInput(){
        if (!input) return;
        
        input.value = hex;
        
        if (inputColor) {
            if(hsv.v < 0.5){
                input.style.color = "#FFF";
            } else {
                input.style.color = "#000";
            }

            input.style.background = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + a + ')'; 
        }
    }
    
    function initCanvas() {
        if (!place) return false;
        if (place.tagName != 'CANVAS') {
            canvas = document.createElement('CANVAS');        
            place.appendChild(canvas);
        } else {
            canvas = place; 
        }
        
        // code for IE browsers
        if (typeof window.G_vmlCanvasManager != 'undefined') {
            canvas = window.G_vmlCanvasManager.initElement(canvas);
            canvasHelper = window.G_vmlCanvasManager.initElement(canvasHelper);
        }
                
        if (!!(canvas.getContext && canvas.getContext('2d'))) {
            ctx = canvas.getContext("2d");
            canvasHelperCtx = canvasHelper.getContext("2d");
            return true;
        } else return false;
    }
       
    function constructor(cfg) {
        var criticalError = '', placeName = '';
        
        if (cfg.input && typeof cfg.input !== 'object') {
            cfg.input = document.getElementById(cfg.input);
            
            // if (!cfg.input) log += '| "input" (' + inputName + ') not not found';  
        } 
        
        if (cfg.alpha !== undefined) {
            a = cfg.alpha;
        }
        
        if (cfg.alpha_slider !== undefined) {
            alpha = cfg.alpha_slider;
        }
        
        if (cfg.input_color !== undefined) {
            inputColor = cfg.input_color;
        }        
        
        if (cfg.input) {
            input = cfg.input;
            var inputEdit = function(e) {
                var e = e || window.event; 
                if (!e.target) {
                    e.target = e.srcElement;
                }
                handler.setColorByHex(e.target.value);
            };
            
            addEventListner(input, "click", inputEdit);
            addEventListner(input, "change", inputEdit);
            addEventListner(input, "keyup", inputEdit);
            addEventListner(input, "keypress", inputEdit);
        }
        
        if (cfg.userEvents) userEvents = cfg.userEvents;
        
        if (cfg.place && typeof cfg.place !== 'object') {
            placeName = cfg.place;
            cfg.place = document.getElementById(cfg.place);
        } 
        
        if (cfg.place) place = cfg.place;
        else criticalError += '| "place" (' + placeName + ') not not found';
        
        if (cfg.size && cfg.size > 0) {
            wheelBlockSize = cfg.size;            
        }
        
        if (cfg.color) hex = cfg.color;
        
        if (cfg.method && (cfg.method == 'triangle' || cfg.method == 'quad')) method = cfg.method;  
                        
        if (!initCanvas()) {
            criticalError += ' | cant init canvas context';
        }
        
        if (method == 'quad') svFig = getSvFigureQuad();
        if (method == 'triangle') svFig = getSvFigureTriangle();
        
        if (criticalError) {
            if (typeof console !== 'undefined') console.log('KellyColorPicker : ' + criticalError);
        } else {
            enableEvents();
        } 
        
        updateSize();       
        handler.setColorByHex(hex);
    }
    
    // temp events until wait mouse click or touch
    function enableEvents() {    
        addEventListner(canvas, "mousedown", function(e) {handler.mouseDownEvent(e);}); 
        addEventListner(canvas, "touchstart", function(e) {handler.mouseDownEvent(e);}); 
        addEventListner(canvas, "mouseout", function(e) {handler.mouseOutEvent(e);}); 
        addEventListner(window, "touchmove", function(e) {handler.touchMoveEvent(e);});    
        addEventListner(canvas, "mousemove", function(e) {handler.mouseMoveRest(e);});         
    }
    
    function disableEvents() {
        removeEventListener(canvas, "mousedown"); 
        removeEventListener(canvas, "touchstart");
        removeEventListener(canvas, "mouseout"); 
        removeEventListener(window, "touchmove"); 
        removeEventListener(canvas, "mousemove"); 
    }  
  
    function getEventDot(e) {    
        e = e || window.event;
        var x, y;
        var scrollX = document.body.scrollLeft + document.documentElement.scrollLeft;
        var scrollY = document.body.scrollTop + document.documentElement.scrollTop;
        
        if (e.touches) {
            x = e.touches[0].clientX + scrollX; 
            y = e.touches[0].clientY + scrollY;  
        } else {
            // e.pageX e.pageY e.x e.y bad for cross-browser
            x = e.clientX + scrollX;
            y = e.clientY + scrollY;
        }
        
        var rect = canvas.getBoundingClientRect();
        x -= rect.left + scrollX;
        y -= rect.top + scrollY;
          
        return {x : x, y : y};    
    }
    
    // вывод интерфейса без курсоров
    
    function drawColorPicker() {
        if (!ctx) return false;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (rendered) {        
            ctx.putImageData(canvasHelperData, 0, 0);
            
            if (alpha) alphaSlider.draw();            
            return true;
        }   
        
        // форма кольца может измениться только при изменении размеров виджета      
        wheel.draw(); 
        svFig.draw();   
        
        if (alpha) alphaSlider.draw();
        
        // поместить текущее отрисованное изображение в буфер
        // notice :
        // при перемещении курсора кольца сохранять буфер все изображение бессмысленно - sv блок постоянно обновляется, поэтому
        // сохраняем уже на событии выхода из процесса перемещения
        if (!drag) {
            canvasHelperData = ctx.getImageData(0, 0, wheelBlockSize, wheelBlockSize);
            rendered = true;
        }
        return true;     
    }        
    
    function draw() {
        if (!drawColorPicker()) { return false; }
        
        var curAngle = hsv.h * 360 - wheel.startAngle;
        
        // cursors
        
        if (alpha) {
            ctx.beginPath();
            var cursorHeight = 2;
            var cursorPaddingX = 2;
            var pointY = alphaSlider.height * (1 - a);
            ctx.rect(alphaSlider.pos.x - cursorPaddingX, alphaSlider.padding + pointY - cursorHeight / 2, alphaSlider.width + cursorPaddingX * 2, cursorHeight);
            ctx.strokeStyle='rgba(0,0,0, 0.8)';
            ctx.lineWidth = 2;
            
            ctx.stroke();
            ctx.closePath(); 
        }
        
        ctx.beginPath();
        
        var wheelCursorPath = rotatePath2(wheelCursor.path, curAngle, {x : wheel.pos.x, y : wheel.pos.y});
        for (var i=0; i <= wheelCursorPath.length-1; ++i)
        { 
            wheelCursorPath[i].x += wheel.pos.x;
            wheelCursorPath[i].y += wheel.pos.y;
            if (i == 0) ctx.moveTo(wheelCursorPath[i].x, wheelCursorPath[i].y);            
            else ctx.lineTo(wheelCursorPath[i].x, wheelCursorPath[i].y);
        }
        
        ctx.strokeStyle='rgba(0,0,0,0.8)';
        ctx.lineWidth = wheelCursor.lineWeight;
        ctx.stroke();
        ctx.closePath();     
        
        // sv cursor
        if (hsv.v > 0.5 && hsv.s < 0.5) ctx.strokeStyle='rgba(0, 0, 0, 1)';
        else ctx.strokeStyle='rgba(255, 255, 255, 1)';
        //ctx.strokeStyle='rgba(255,255, 255, 1)';
        
        //document.getElementById('test3').value = 'h' + hsv.h.toFixed(2) + ' s'  + hsv.s.toFixed(2) + ' v'  + hsv.v.toFixed(2)
        
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.arc(hsv.x, hsv.y, svCursor.radius, 0, PI*2);
        

        ctx.stroke(); 
        ctx.closePath();  
        
        return false;
    }
    
    this.setHueByDot = function(dot) {
        var angle = getAngle(dot, wheel.pos) + wheel.startAngle;
        if (angle < 0) angle = 360 + angle;

        hsv.h = angle / 360;
                
        rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        hex = rgbToHex(rgb);
        
        if (userEvents["change"]) {
            var callback = userEvents["change"]; 
                callback(handler);
        }
        
        updateInput();
        
        rendered = false;
        draw();
    };
    
    // update color with redraw canvas and update input hex value 
    
    this.setColorByHex = function(inputHex) {
        if (!inputHex || !inputHex.length) return;
        
        if (inputHex.charAt(0) != '#') inputHex = '#' + inputHex;
        
             if (inputHex.length != 7) return;  
        else if (!inputHex.match(/^#([0-9A-F]){3}$|^#([0-9A-F]){6}$/img)) return;
        
        if (hex && inputHex == hex && rendered) return;
        
        rgb = hexToRgb(inputHex);
        hex = inputHex;
        hsv = rgbToHsv(rgb);
        
        var dot = svFig.svToDot(hsv);
        hsv.x = dot.x;
        hsv.y = dot.y;
        
        rendered = false;
        draw();   
        
        if (userEvents["change"]) {
            var callback = userEvents["change"]; 
                callback(handler);
        }
        
        updateInput();
    };
    
    this.setAlphaByDot = function(dot) {
        a = alphaSlider.dotToAlpha(dot);
       
        if (userEvents["change"]) {
            var callback = userEvents["change"]; 
                callback(handler);
        }
        
        updateInput();        
        draw();
    };
    
    this.setAlpha = function(alpha) {
        a = alpha;
        updateInput();        
        draw();
    };
    
    this.setColorByDot = function(dot) {
        var sv = svFig.dotToSv(dot);
        
        hsv.s = sv.s;
        hsv.v = sv.v;  
        hsv.x = dot.x;
        hsv.y = dot.y;
        
        if (hsv.s > 1) hsv.s = 1;
        if (hsv.s < 0) hsv.s = 0;
        if (hsv.v > 1) hsv.v = 1;
        if (hsv.v < 0) hsv.v = 0;
        
        rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
        hex = rgbToHex(rgb); 
        
        if (userEvents["change"]) {
            var callback = userEvents["change"]; 
                callback(handler);
        }
        
        updateInput();        
        draw();
    };
    
    this.mouseOutEvent = function(e) { 
        if (svCursorMouse.curType > 0 && !KellyColorPicker.cursorLock) {
            svCursorMouse.initStandartCursor();
        }
    };
    
    // перемещение указателя по canvas в режиме покоя
    this.mouseMoveRest = function(e) {
        if (drag) return;        
        
        if (!cursorAnimReady) {
            return;
        }
        
        cursorAnimReady = false;
        var newDot = getEventDot(e);
        svCursorMouse.updateCursor(newDot);        
        requestAnimationFrame(function() {cursorAnimReady = true;});

        if (userEvents["mousemoverest"]) {
            var callback = userEvents["mousemoverest"]; 
                callback(e, handler, newDot);
        }        
    };
    
    // to prevent scroll by touches while change color
    // в FireFox под андройд есть "фича" которая скрывает или раскрывает тулбар адресной строки при движении пальцем
    // отключить её можно только через опцию about:config browser.chrome.dynamictoolbar
    
    this.touchMoveEvent = function(e) {
        if (drag) { // todo check number of touches to ignore zoom action
            event.preventDefault();
        }
    };
    
    // маршрутизатор событий нажатий на элементы    
    this.mouseDownEvent = function(event) {
        event.preventDefault();
        
        var move, up = false;
        var newDot = getEventDot(event);
        // console.log('mouseDownEvent : cur : ' + newDot.x + ' | ' + newDot.y);
        
        if (wheel.isDotIn(newDot)) {
            drag = 'wheel';            
            handler.setHueByDot(newDot);
        
            move =  function(e) {handler.wheelMouseMove(e, newDot); };
            up =  function(e) {KellyColorPicker.cursorLock = false; handler.wheelMouseUp(e, newDot); };
            
        } else if (svFig.isDotIn(newDot)) {
            drag = 'sv';            
            handler.setColorByDot(newDot);
        
            move =  function(e) {handler.SvMouseMove(e, newDot);};
            up =  function(e) {KellyColorPicker.cursorLock = false; handler.SvMouseUp(e, newDot); };
        } else if (alpha && alphaSlider.isDotIn(newDot)) {
            drag = 'alpha';            
            handler.setAlphaByDot(newDot);
        
            move =  function(e) {handler.AlphaMouseMove(e, newDot);};
            up =  function(e) {KellyColorPicker.cursorLock = false; handler.AlphaMouseUp(e, newDot); };            
        }
        
        if (move && up) { 
            disableEvents();  
            KellyColorPicker.cursorLock = true;
            addEventListner(document, "mouseup", up); 
            addEventListner(document, "mousemove", move); 
            addEventListner(document, "touchend", up); 
            addEventListner(document, "touchmove", move); 
        }
    };

    this.wheelMouseMove = function(event, dot) {        
        event.preventDefault();       
        
        if (!drag) return;
        
        if (!cursorAnimReady) {
            return;
        }
        cursorAnimReady = false;
        var newDot = getEventDot(event);
        
        // console.log('wheelMouseMove : start : ' + dot.x + ' | ' + dot.y + ' cur : ' + newDot.x + ' | ' + newDot.y);
         requestAnimationFrame(function() {cursorAnimReady = true;});
        //setTimeout(function() {cursorAnimReady = true;}, 1000/30);
        
        handler.setHueByDot(newDot);
        
        if (userEvents["mousemoveh"]) {
            var callback = userEvents["mousemoveh"]; 
                callback(event, handler, newDot);
        }
    };
        
    this.wheelMouseUp = function(event, dot) {
        event.preventDefault();    
        if (!drag) return;
        //console.log('wheelMouseUp : start : ' + dot.x + ' | ' + dot.y);
        
        removeEventListener(document, "mouseup"); 
        removeEventListener(document, "mousemove"); 
        removeEventListener(document, "touchend"); 
        removeEventListener(document, "touchmove");
        
        enableEvents();
        drag = false;
        
        rendered = false;
        draw();
        
        var newDot = getEventDot(event);
        svCursorMouse.updateCursor(newDot); 

        if (userEvents["mouseuph"]) {
            var callback = userEvents["mouseuph"]; 
                callback(event, handler, newDot);
        }
    };

    this.AlphaMouseMove = function(event, dot) {
        event.preventDefault();       
        if (!drag) return;
        
        if (!cursorAnimReady) {
            return;
        }
        
        cursorAnimReady = false;
        var newDot = getEventDot(event);
        
        // console.log('SvMouseMove : start : ' + dot.x + ' | ' + dot.y + ' cur : ' + newDot.x + ' | ' + newDot.y);
        
        newDot = alphaSlider.limitDotPosition(newDot);
 
        requestAnimationFrame(function() {cursorAnimReady = true;});
        //setTimeout(function() {cursorAnimReady = true;}, 1000/30);
        
        handler.setAlphaByDot(newDot);
        
        if (userEvents["mousemovealpha"]) {
            var callback = userEvents["mousemovealpha"]; 
                callback(event, handler, newDot);
        }
    };
        
    this.AlphaMouseUp = function(event, dot) {
        event.preventDefault();   
        if (!drag) return;

        removeEventListener(document, "mouseup"); 
        removeEventListener(document, "mousemove"); 
        removeEventListener(document, "touchend"); 
        removeEventListener(document, "touchmove");
        
        enableEvents();
        drag = false;
        
        var newDot = getEventDot(event);
        svCursorMouse.updateCursor(newDot); 
        
        if (userEvents["mouseupalpha"]) {
            var callback = userEvents["mouseupalpha"]; 
                callback(event, handler, newDot);
        }
    };     
    
    this.SvMouseMove = function(event, dot) {
        event.preventDefault();       
        if (!drag) return;
        
        if (!cursorAnimReady) {
            return;
        }
        
        cursorAnimReady = false;
        var newDot = getEventDot(event);
        
        // console.log('SvMouseMove : start : ' + dot.x + ' | ' + dot.y + ' cur : ' + newDot.x + ' | ' + newDot.y);
        
        newDot = svFig.limitDotPosition(newDot);
 
        requestAnimationFrame(function() {cursorAnimReady = true;});
        //setTimeout(function() {cursorAnimReady = true;}, 1000/30);
        
        handler.setColorByDot(newDot);
        
        if (userEvents["mousemovesv"]) {
            var callback = userEvents["mousemovesv"]; 
                callback(event, handler, newDot);
        }
    };
        
    this.SvMouseUp = function(event, dot) {
        event.preventDefault();   
        if (!drag) return;
        
        // console.log('SvMouseUp : start : ' + dot.x + ' | ' + dot.y);
        
        removeEventListener(document, "mouseup"); 
        removeEventListener(document, "mousemove"); 
        removeEventListener(document, "touchend"); 
        removeEventListener(document, "touchmove");
        
        enableEvents();
        drag = false;
        
        var newDot = getEventDot(event);
        svCursorMouse.updateCursor(newDot); 
        
        if (userEvents["mouseupsv"]) {
            var callback = userEvents["mouseupsv"]; 
                callback(event, handler, newDot);
        }
    }; 

    this.addUserEvent = function(event, callback) {
        userEvents[event] = callback;
        return true;
    };

    this.removeUserEvent = function(event) {
        if (!userEvents[event]) return false;
        userEvents[event] = null;
        return true;
    };
        
    // для кастомизации отображения элементов виджета
    
    this.getCanvas = function() { 
        if (!ctx) return false;        
        return canvas;         
    };
    this.getCtx = function() { 
        if (!ctx) return false;        
        return ctx;         
    };    
    this.getInput = function() { return input; };
    this.getSvFig = function() { return svFig;};
    this.getSvFigCursor = function() { return svCursor; };
    
    this.getWheel = function() { return wheel;};
    this.getWheelCursor = function() { return wheelCursor; };
    
    this.getCurColorHsv = function() { return hsv; };
    this.getCurColorRgb = function() { return rgb; };
    this.getCurColorHex = function() { return hex; };
    this.getCurColorRgba = function() { return {r : rgb.r, g : rgb.g, b : rgb.b, a : a}; };
    this.getCurAlpha = function() { return a; };
    
    this.updateView = function(dropBuffer) { 
        if (!ctx) return false;
        
        if (dropBuffer) {
            wheel.imageData = null;
            svFig.imageData = null;
            canvasHelperData = null;
        } 
        
        rendered = false;
        updateSize();        
        draw(); 
        return true;
    };
    
    this.resize = function(size) {
        if (!ctx) return false;
        if (size == wheelBlockSize) return true;
        rendered = false;
        wheel.imageData = null;
        svFig.imageData = null;
        canvasHelperData = null;
        wheelBlockSize = size;
        updateSize();
        
        handler.setColorByHex(hex);       
        return false;
    };

    this.destroy = function() {
        if (svCursorMouse.curType > 0) {
            KellyColorPicker.cursorLock = false; 
            svCursorMouse.initStandartCursor();
        }
        
        if (drag) {
            removeEventListener(document, "mouseup"); 
            removeEventListener(document, "mousemove"); 
            removeEventListener(document, "touchend"); 
            removeEventListener(document, "touchmove");
            
            drag = false;
        }
        
        wheel.imageData = null;
        svFig.imageData = null;
        canvasHelperData = null;
        canvasHelper = null;
        
        if (place && place.parentNode) {
            place.parentNode.removeChild(place);
        }        
        
        disableEvents();          
        handler = null;
    };
    
    constructor(cfg);
}

// static methods

/**
 * Тригер для объектов KellyColorPicker, чтобы не сбрасывали стиль курсора при наведении если уже идет выбор цвета 
 * Notice : при выходе курсора за границы текущего canvas, событие неизвестного объекта всегда может сбросить изображение курсора
 */

KellyColorPicker.cursorLock = false; // можно указывать handler объекта
