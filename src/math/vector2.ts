export class Vector2 {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static Add(v1: Vector2, v2: Vector2): Vector2 {
        return new Vector2(v1.x + v2.x, v1.y + v2.y);
    }

    public static Subtract(v1: Vector2, v2: Vector2): Vector2 {
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
    }

    public static Multiply(v1: Vector2, scalar: number): Vector2 {
        return new Vector2(v1.x * scalar, v1.y * scalar);
    }

    public add(v: Vector2) {
        this.x += v.x;
        this.y += v.y;
    }

    public subtract(v: Vector2) {
        this.x -= v.x;
        this.y -= v.y;
    }

    public multiply(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
    }

    public toString(): string {
        return `[${this.x.toFixed(6)}, ${this.y.toFixed(6)}]`;
    }
}