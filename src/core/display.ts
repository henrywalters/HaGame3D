import {Color} from "../helpers/color";
import {mat4, vec3, vec2} from "gl-matrix";
import {Shapes} from "../helpers/shapes";
import {Functions} from "../math/functions";
import readline = require('readline');
import {Mesh, OBJ} from "webgl-obj-loader";
import {NetworkFilesystem} from "..";

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
    private nfs: NetworkFilesystem;

    constructor(id: string) {
        this.nfs = new NetworkFilesystem();
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

    public renderMesh(program: ShaderProgram, mesh: Mesh, position: vec3, rotation: number, rotationDir: vec3) {
        const model = mat4.create();
        const normal = mat4.create();

        mat4.translate(model, model, position);
        mat4.rotate(model, model, rotation, rotationDir);
        mat4.invert(normal, model);
        mat4.transpose(normal, normal);

        this.gl.useProgram(program.program);

        this.gl.uniformMatrix4fv(program.uniformLocations["projectionMatrix"], false, this.window.projectionMatrix);
        this.gl.uniformMatrix4fv(program.uniformLocations["modelViewMatrix"], false, model);
        this.gl.uniformMatrix4fv(program.uniformLocations["normalMatrix"], false, normal);

        OBJ.initMeshBuffers(this.gl, mesh);

        // @ts-ignore
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertexBuffer);

        // @ts-ignore
        this.gl.vertexAttribPointer(program.attribLocations["vertexPosition"], mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(program.attribLocations["vertexPosition"]);

        // @ts-ignore
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);

        // @ts-ignore
        this.gl.vertexAttribPointer(program.attribLocations["vertexNormal"], mesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(program.attribLocations["vertexNormal"]);

        // @ts-ignore
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

        // @ts-ignore
        this.gl.drawElements(this.gl.TRIANGLES, mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
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
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error("Failed to load shader: " + source + " ERROR: " + error);
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

    public initializeOBJModelBuffers(mesh: Mesh) {
        OBJ.initMeshBuffers(this.gl, mesh);
    }

    public loadOBJModel(source: string): Mesh {
        return new OBJ.Mesh(source);
    }

    public loadAndInitializeOBJModel(source: string) {
        const model = this.loadOBJModel(source);
        this.initializeOBJModelBuffers(model);
        return model;
    }
}