

export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public static Black(): Color {
        return new Color(0.0, 0.0, 0.0, 1.0);
    }

    public static White(): Color {
        return new Color(1.0, 1.0, 1.0, 1.0);
    }

    public static Red(): Color {
        return new Color(1.0, 0.0, 0.0, 1.0);
    }

    public static Green(): Color {
        return new Color(0.0, 1.0, 0.0, 1.0);
    }

    public static Blue(): Color {
        return new Color(0.0, 0.0, 1.0, 1.0);
    }
}