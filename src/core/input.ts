import {Vector2} from "../math/vector2";

export interface Gamepad {
    MoveUp: boolean;
    MoveRight: boolean;
    MoveDown: boolean;
    MoveLeft: boolean;

    LookUp: boolean;
    LookRight: boolean;
    LookDown: boolean;
    LookLeft: boolean;

    A: boolean;
    B: boolean;
    X: boolean;
    Y: boolean;

    Fire1: boolean;
    Fire1Alt: boolean;

    Fire2: boolean;
    Fire2Alt: boolean;

    Start: boolean;
    Select: boolean;
    Home: boolean;
}

export enum GAMEPAD_FLAG {
    A = "A",
    B = "B",
    X = "X",
    Y = "Y",

    MOVE_UP = "MoveUp",
    MOVE_RIGHT = "MoveRight",
    MOVE_DOWN = "MoveDown",
    MOVE_LEFT = "MoveLeft",

    LOOK_UP = "LookUp",
    LOOK_RIGHT = "LookRight",
    LOOK_DOWN = "LookDown",
    LOOK_LEFT = "LookLeft",
}

export const INITIAL_GAMEPAD: Gamepad = {
    A: false,
    B: false,
    Fire1: false,
    Fire1Alt: false,
    Fire2: false,
    Fire2Alt: false,
    Home: false,
    LookDown: false,
    LookLeft: false,
    LookRight: false,
    LookUp: false,
    MoveDown: false,
    MoveLeft: false,
    MoveRight: false,
    MoveUp: false,
    Select: false,
    Start: false,
    X: false,
    Y: false
}

export const KEYBOARD_TO_GAMEPAD_MAP = {
    'KeyW': GAMEPAD_FLAG.MOVE_UP,
    'KeyD': GAMEPAD_FLAG.MOVE_RIGHT,
    'KeyS': GAMEPAD_FLAG.MOVE_DOWN,
    'KeyA': GAMEPAD_FLAG.MOVE_LEFT,

    'ArrowUp': GAMEPAD_FLAG.LOOK_UP,
    'ArrowRight': GAMEPAD_FLAG.LOOK_RIGHT,
    'ArrowDown': GAMEPAD_FLAG.LOOK_DOWN,
    'ArrowLeft': GAMEPAD_FLAG.LOOK_LEFT,
}

export interface InputDevice {
    id?: number;
    getState(input: GAMEPAD_FLAG): boolean;
}

export class KeyboardAndMouseInput implements InputDevice{
    private gamepad: Gamepad = INITIAL_GAMEPAD;
    public id?: number;

    private currentMousePos: Vector2;

    constructor() {

        this.currentMousePos = new Vector2(0, 0);

        window.addEventListener("keydown", (k) => {
            if (KEYBOARD_TO_GAMEPAD_MAP.hasOwnProperty(k.code)) {
                this.gamepad[KEYBOARD_TO_GAMEPAD_MAP[k.code]] = true;
            }
        })

        window.addEventListener("keyup", (k) => {
            if (KEYBOARD_TO_GAMEPAD_MAP.hasOwnProperty(k.code)) {
                this.gamepad[KEYBOARD_TO_GAMEPAD_MAP[k.code]] = false;
            }
        })

        window.addEventListener("mousemove", (m) => {
            const newPos = new Vector2(m.clientX, m.clientY);
            const delta = Vector2.Subtract(newPos, this.currentMousePos);
            this.currentMousePos = newPos;
        })
    }

    public getState(input: GAMEPAD_FLAG): boolean {
        return this.gamepad[input];
    }
}

export class InputManager {
    private devices: InputDevice[];
    private deviceCount: number;

    constructor() {
        this.devices = [];
        this.deviceCount = 0;
    }

    public addDevice(device: InputDevice): InputDevice {
        device.id = this.deviceCount;
        this.devices.push(device);
        this.deviceCount++;
        return device;
    }

    public validDeviceId(id: number): boolean {
        return id >= 0 && id < this.deviceCount;
    }

    public removeDevice(id: number) {
        if (this.validDeviceId(id)) {
            this.devices.splice(id, 1);
            this.deviceCount--;
        }
    }

    public getDevice(id: number) {
        if (!this.validDeviceId(id)) throw new Error("Invalid Device ID: " + id);
        return this.devices[id];
    }
}