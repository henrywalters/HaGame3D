import {Color} from "../helpers/color";
import {mat4, vec3, vec2} from "gl-matrix";
import {Shapes} from "../helpers/shapes";
import {Functions} from "../math/functions";
import readline = require('readline');
import {Mesh, OBJ} from "webgl-obj-loader";
import {AVERAGE_CALCULATION, NetworkFilesystem, Profiler, Timer} from "..";

export interface Window {
    container: HTMLDivElement;
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

    private matrixProfile: Profiler<number>;
    private bufferProfile: Profiler<number>;
    private renderProfile: Profiler<number>;

    private cameraPos: vec3;
    private cameraRot: vec3;

    constructor(id: string) {
        this.nfs = new NetworkFilesystem();
        const container = document.getElementById(id) as HTMLDivElement;
        const canvas = document.createElement('canvas');
        canvas.height = container.clientHeight;
        canvas.width = container.clientWidth;
        container.append(canvas);

        const context = canvas.getContext("webgl");
        if (context === null) {
            throw new Error("Failed to initialize webGl context");
        }
        this.window = {
            container,
            element: canvas,
            context,
            clearColor: Color.Black(),
            width: canvas.width,
            height: canvas.height,
            id,
            fieldOfView: 45 * Math.PI / 180,
            aspect: canvas.clientWidth / canvas.clientHeight,
            zNear: 0.1,
            zFar: 1000.0,
            projectionMatrix: mat4.create(),
        };

        this.updateWindow();

        window.addEventListener("resize", () => {
            this.updateWindow();
        })

        this.matrixProfile = new Profiler<number>("Matrix Profiler", AVERAGE_CALCULATION);
        this.bufferProfile = new Profiler<number>("Buffer Profiler", AVERAGE_CALCULATION);
        this.renderProfile = new Profiler<number>("Render Profiler", AVERAGE_CALCULATION);

        this.cameraPos = [0.0, 0.0, 0.0];
        this.cameraRot = [0.0, 0.0, 0.0];
    }

    private updateWindow() {
        this.window.element.height = this.window.container.clientHeight;
        this.window.element.width = this.window.container.clientWidth;
        this.window.height = this.window.element.clientHeight;
        this.window.width = this.window.element.clientWidth;
        this.window.aspect = this.window.width / this.window.height;

        mat4.perspective(this.window.projectionMatrix,
            this.window.fieldOfView,
            this.window.aspect,
            this.window.zNear,
            this.window.zFar);

        console.log("resize");
        console.log(this.window.width, this.window.height);
    }

    public getCameraPos() {
        return this.cameraPos;
    }

    public getCameraRot() {
        return this.cameraRot;
    }

    public setCameraPos(pos: vec3) {
        this.cameraPos = pos;
    }

    public moveCameraPos(delta: vec3) {
        this.cameraPos[0] += delta[0];
        this.cameraPos[1] += delta[1];
        this.cameraPos[2] += delta[2];
    }

    public setCameraRot(rot: vec3) {
        this.cameraRot = rot;
    }

    public rotateCamera(rot: vec3) {
        this.cameraRot[0] += rot[0];
        this.cameraRot[1] += rot[1];
        this.cameraRot[2] += rot[2];
    }

    public getWindow(): Window {
        return this.window;
    }

    public prepareMeshBuffers(program: ShaderProgram, mesh: Mesh, texture?: WebGLTexture) {
        this.gl.useProgram(program.program);

        // @ts-ignore
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertexBuffer);

        // @ts-ignore
        this.gl.vertexAttribPointer(program.attribLocations["vertexPosition"], mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(program.attribLocations["vertexPosition"]);

        // @ts-ignore
        if (mesh.textureBuffer && texture) {

            // @ts-ignore
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.textureBuffer);
            // @ts-ignore
            this.gl.vertexAttribPointer(program.attribLocations["textureCoord"], mesh.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(program.attribLocations["textureCoord"]);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.uniform1i(program.uniformLocations["uSampler"], 0);
        }

        // @ts-ignore
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);

        // @ts-ignore
        this.gl.vertexAttribPointer(program.attribLocations["vertexNormal"], mesh.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(program.attribLocations["vertexNormal"]);

        if (texture) {

        }

        // @ts-ignore
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    }

    public renderMesh(program: ShaderProgram, mesh: Mesh, position: vec3, rotation: number, rotationDir: vec3, texture?: WebGLTexture) {

        const model = mat4.create();
        const normal = mat4.create();
        const view = mat4.create();

        mat4.identity(view);
        mat4.translate(view, view, this.cameraPos);
        mat4.rotate(view, view, this.cameraRot[0], [1.0, 0.0, 0.0]);
        mat4.rotate(view, view, this.cameraRot[1], [0.0, 1.0, 0.0]);
        mat4.rotate(view, view, this.cameraRot[2], [0.0, 0.0, 1.0]);

        mat4.invert(view, view);

        mat4.translate(model, model, position);
        mat4.rotate(model, model, rotation, rotationDir);
        mat4.invert(normal, model);
        mat4.transpose(normal, normal);


        this.gl.uniformMatrix4fv(program.uniformLocations["projectionMatrix"], false, this.window.projectionMatrix);
        this.gl.uniformMatrix4fv(program.uniformLocations["viewMatrix"], false, view);
        this.gl.uniformMatrix4fv(program.uniformLocations["modelMatrix"], false, model);
        this.gl.uniformMatrix4fv(program.uniformLocations["normalMatrix"], false, normal);

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