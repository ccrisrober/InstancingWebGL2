/// <reference path="shaderProgram.ts" />
/// <reference path="gl-matrix.d.ts" />

function getContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
    var contexts : string[] = "webgl2,experimental-webgl2".split(",");
    var gl: WebGLRenderingContext;
    var ctx;
    for (var i = 0; i < contexts.length; i++) {
        ctx = contexts[i];
        gl = <WebGLRenderingContext>canvas.getContext(contexts[i]);
        if (gl) {
            return gl;
        }
    }
    return null;
}
function getVendors() {
    var vendors: string[] = "ms,moz,webkit,o".split(",");
    if (!window.requestAnimationFrame) {
        var vendor;
        for (var i = 0; i < vendors.length; i++) {
            vendor = vendors[i];
            window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
            if (window.requestAnimationFrame) {
                break;
            }
        }
    }
}

var program: ShaderProgram;
var gl: WebGLRenderingContext;

window.onload = () => {
    var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("mycanvas");
    gl = getContext(canvas);
    getVendors();

    program = new ShaderProgram();
    program.addShader("shaders/shader.vert", gl.VERTEX_SHADER, mode.read_file);
    program.addShader("shaders/shader.frag", gl.FRAGMENT_SHADER, mode.read_file);
    program.compile_and_link();

    program.addAttributes(["position", "color"]);
    console.log(program.attribLocations);
    var unifs = [];
    for (var i = 0; i < 100; i++) {
        unifs.push("offsets[" + i + "]");
    }
    program.addUniforms(unifs);
    console.log(program.uniformLocations);

    gl.enable(gl.DEPTH_TEST);

    // Create VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var translations: Float32Array[] = [];
    var offset = 0.1;

    for (var y = -10; y < 10; y += 2) {
        for (var x = -10; x < 10; x += 2) {
            var translation: Float32Array = vec2.create();
            translation[0] = x / 10.0 + offset;
            translation[1] = y / 10.0 + offset;
            translations.push(translation);
        }
    }
    console.log(translations);

    // Create VBO
    var vbo: WebGLBuffer = gl.createBuffer();
    var quadVertices: Float32Array = new Float32Array([
        // Positions     // Colors
        -0.05,  0.05,  1.0, 0.0, 0.0,
         0.05, -0.05,  0.0, 1.0, 0.0,
        -0.05, -0.05,  0.0, 0.0, 1.0,

        -0.05,  0.05,  1.0, 0.0, 0.0,
         0.05, -0.05,  0.0, 1.0, 0.0,
         0.05,  0.05,  0.0, 1.0, 1.0	
    ]); 

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    
    // Specify the layout of the vertex data
    // -Position
    gl.enableVertexAttribArray(program.attribLocations["position"]);
    gl.vertexAttribPointer(program.attribLocations["position"], 2, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    // -Color
    gl.enableVertexAttribArray(program.attribLocations["color"]);
    gl.vertexAttribPointer(program.attribLocations["color"], 3, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

    program.use();

    var proj: Float32Array = mat4.create();
    proj = mat4.perspective(proj, 45.0, 800.0 / 600.0, 0.01, 10.0);
    gl.uniformMatrix4fv(program.uniformLocations["proj"], gl.FALSE, proj);

    var view: Float32Array = mat4.create();
    view = mat4.lookAt(view,
        vec3.fromValues(2.5, 2.5, 2.0),
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(0.0, 0.0, 1.0)
    );
    gl.uniformMatrix4fv(program.uniformLocations["view"], gl.FALSE, view);
    var model: Float32Array = mat4.create();
    
    function loadTexture(src) {
        //console.log("Load texture " + src)
        var texture = gl.createTexture();
        // Create a DOM image object.
        var image = new Image();
        // Set up the onload handler for the image, which will be called by
        // the browser at some point in the future once the image has
        // finished downloading.
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            // TODO: FALLA EL REPEAT!
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, null);
            //console.log("Finalize texture loading (" + src + ")");
        };
        image.onerror = function (e) {
            console.log(e);
        }
        // Start downloading the image by setting its source.
        image.src = src;
        // Return the WebGLTexture object immediately.
        return texture;
    }

    var texture: WebGLTexture = loadTexture("diffuse.jpg");

    gl.enable(gl.DEPTH_TEST);

    var time_old: number = 0;
    var angle: number = 0.0;
    gl.clearColor(1.0, 1.0, 0.0, 1.0);

    for (var i = 0; i < 100; i++) {
        var loc: WebGLUniformLocation = program.uniformLocations["offsets[" + i + "]"];
        gl.uniform2f(loc, translations[i][0], translations[i][1]);
    }

    var render = function (time: number) {
        var dt: number = time - time_old;
        time_old = time;
        angle = (angle > Math.PI * 2.0) ? 0.0 : angle + 0.001 * dt;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(vao);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 100);
    }

    var counter = 0;
    // Render function
    var renderLoop = (dt: number) => {
        if (gl.NO_ERROR != gl.getError()) {
            alert(gl.getError());
        }
        render(dt);
        window.requestAnimationFrame(renderLoop);
    };
    //window.requestAnimationFrame(renderLoop);
    renderLoop(0);
};