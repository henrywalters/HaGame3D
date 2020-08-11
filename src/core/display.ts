import {Color} from "../helpers/color";
import {mat4} from "gl-matrix";
import {Shapes} from "../helpers/shapes";
import {Functions} from "../math/functions";

export interface Window {
    element: HTMLCanvasElement;
    context: WebGLRenderingContext;
    clearColor: Color;
    width: number;
    height: number;
    id: string;

    fieldOfView: number;
    aspect: number;
    zNear: number;
    zFar: number;

    projectionMatrix: mat4;
}

export interface Buffers {
    position: WebGLBuffer;
    color: WebGLBuffer;
    indices: WebGLBuffer;
    textureCoords: WebGLBuffer;
    normals: WebGLBuffer;
}

export interface ShaderProgram {
    program: WebGLProgram;
    attribLocations: {[key: string]: number};
    uniformLocations: {[key: string]: WebGLUniformLocation | null};
}

export class Display {
    private window: Window;

    private rotation: number = 0;

    constructor(id: string) {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        const context = canvas.getContext("webgl");
        if (context === null) {
            throw new Error("Failed to initialize webGl context");
        }
        this.window = {
            element: canvas,
            context,
            clearColor: Color.Black(),
            width: canvas.width,
            height: canvas.height,
            id,
            fieldOfView: 45 * Math.PI / 180,
            aspect: canvas.clientWidth / canvas.clientHeight,
            zNear: 0.1,
            zFar: 100.0,
            projectionMatrix: mat4.create(),
        };

        mat4.perspective(this.window.projectionMatrix,
            this.window.fieldOfView,
            this.window.aspect,
            this.window.zNear,
            this.window.zFar);
    }

    public getWindow(): Window {
        return this.window;
    }

    public render(program: ShaderProgram, buffers: Buffers, texture: WebGLTexture) {
        const modelView = mat4.create();
        const normal = mat4.create();
        this.rotation -= 0.02;

        mat4.translate(modelView, modelView, [-0.0, 0.0, -6.0]);

        mat4.rotate(modelView, modelView, this.rotation, [-1, 0, 1]);

        mat4.invert(normal, modelView);
        mat4.transpose(normal, normal);

        {
            const numComponents = 3;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;

            const offset = 0;

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.position);
            this.gl.vertexAttribPointer(program.attribLocations["vertexPosition"], numComponents, type, normalize, stride, offset);
            this.gl.enableVertexAttribArray(program.attribLocations["vertexPosition"]);
        }

        {
            const numComponents = 2;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;

            const offset = 0;

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.textureCoords);
            this.gl.vertexAttribPointer(program.attribLocations["textureCoord"], numComponents, type, normalize, stride, offset);
            this.gl.enableVertexAttribArray(program.attribLocations["textureCoord"]);
        }

        {
            const numComponents = 3;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.normals);
            this.gl.vertexAttribPointer(program.attribLocations["vertexNormal"], numComponents, type, normalize, stride, offset);
            this.gl.enableVertexAttribArray(program.attribLocations["vertexNormal"]);
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        this.gl.useProgram(program.program);

        this.gl.uniformMatrix4fv(program.uniformLocations["projectionMatrix"], false, this.window.projectionMatrix);
        this.gl.uniformMatrix4fv(program.uniformLocations["modelViewMatrix"], false, modelView);
        this.gl.uniformMatrix4fv(program.uniformLocations["normalMatrix"], false, normal);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(program.uniformLocations["uSampler"], 0);

        {
            const vertexCount = 36;
            const type = this.gl.UNSIGNED_SHORT;
            const offset = 0;
            this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
        }
    }

    public clear() {
        this.gl.clearColor(this.window.clearColor.r, this.window.clearColor.g, this.window.clearColor.b, this.window.clearColor.a);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    public get gl() {
        return this.window.context;
    }

    public initializeBuffers(): Buffers {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(Shapes.Cube()), this.gl.STATIC_DRAW);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);

        const faceColors = [
            [1.0,  1.0,  1.0,  1.0],    // Front face: white
            [1.0,  0.0,  0.0,  1.0],    // Back face: red
            [0.0,  1.0,  0.0,  1.0],    // Top face: green
            [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
            [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
            [1.0,  0.0,  1.0,  1.0],    // Left face: purple
        ];

        var colors = [];

        for (var j = 0; j < faceColors.length; ++j) {
            const c = faceColors[j];

            // Repeat each color four times for the four vertices of the face
            colors = colors.concat(c, c, c, c);
        }

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

        const textureCoords = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoords);

        const textureCoordinates = [
            // Front
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Back
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Top
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Bottom
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Right
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Left
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);

        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);

        const vertexNormals = [
            // Front
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,

            // Back
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,

            // Top
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,

            // Bottom
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,

            // Right
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,

            // Left
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer,
            textureCoords: textureCoords,
            normals: normalBuffer,
        };
    }

    public loadShaderProgram(vsSource: string, fsSource: string): WebGLProgram {
        const vs = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            this.gl.deleteProgram(program);
            throw new Error("Failed to load shader program: " + this.gl.getProgramInfoLog(program));
        }

        return program;
    }

    private loadShader(type: GLenum, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            this.gl.deleteShader(shader);
            throw new Error("Failed to load shader: " + this.gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    public loadTexture(url: string): WebGLTexture {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = this.gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0,0,255,255]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        const image = new Image();

        image.onload = () => {
            console.log(image);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

            if (Functions.IsPowerOf2(image.width) && Functions.IsPowerOf2(image.height)) {
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
            } else {
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            }
        }

        image.src = url;

        return texture;

    }
}