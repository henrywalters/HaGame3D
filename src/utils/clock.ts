export class Clock {
    public static Now(): number {
        return performance.now();
    }
}