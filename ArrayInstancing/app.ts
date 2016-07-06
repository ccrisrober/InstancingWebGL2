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

    program.addAttributes(["position", "color", "offset"]);
    console.log(program.attribLocations);
    console.log(program.uniformLocations);

    gl.enable(gl.DEPTH_TEST);

    var translations = new Float32Array(100 * 2);
    var offset = 0.1;

    var index = 0;

    for (var y = -10; y < 10; y += 2) {
        for (var x = -10; x < 10; x += 2) {
            translations[index++] = x / 10 + offset;
            translations[index++] = y / 10 + offset;
        }
    }

    var instanceVBO: WebGLBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        translations,
        gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create quadVBO
    var quadVBO: WebGLBuffer = gl.createBuffer();
    var quadVertices: Float32Array = new Float32Array([
         // Positions   // Colors
        -0.05,  0.05,   1.0, 0.0, 0.0,
         0.05, -0.05,   0.0, 1.0, 0.0,
        -0.05, -0.05,   0.0, 0.0, 1.0,

        -0.05,  0.05,   1.0, 0.0, 0.0,
         0.05, -0.05,   0.0, 1.0, 0.0,
         0.05,  0.05,   0.0, 1.0, 1.0	
    ]);

    var quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.attribLocations["position"]);
    gl.vertexAttribPointer(program.attribLocations["position"], 2, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(program.attribLocations["color"]);
    gl.vertexAttribPointer(program.attribLocations["color"], 3, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    // Also set instance data
    gl.enableVertexAttribArray(program.attribLocations["offset"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO);
    gl.vertexAttribPointer(program.attribLocations["offset"], 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.vertexAttribDivisor(2, 1); // Tell OpenGL this is an instanced vertex attribute.
    gl.bindVertexArray(null);


    var render = function (time: number) {

        gl.clearColor(1.0, 1.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        program.use();

        gl.bindVertexArray(quadVAO);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 100);
        gl.bindVertexArray(null);
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
    renderLoop(0);
};