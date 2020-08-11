export class Functions {
    public static IsPowerOf2(num: number): boolean {
        return num != 0 && (num & (num - 1)) == 0;
    }
}