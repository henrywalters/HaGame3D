import {Clock} from "./clock";

export class Timer {
    private _start: number | null;

    constructor() {
        this.start();
    }

    public start() {
        this._start = Clock.Now();
    }

    public stop(): number {
        const dur = Clock.Now() - this._start;
        this._start = null;
        return dur;
    }

    public lap(): number {
        const dur = Clock.Now() - this._start;
        return dur;
    }
}