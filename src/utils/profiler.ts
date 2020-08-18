export type ProfileHandler<T> = (val: T) => void;
export type ProfileCalculation<T> = (values: T[]) => T;

export const AVERAGE_CALCULATION = (values: number[]) => {
    let sum = 0;
    for (const val of values) {
        sum += val;
    }
    return sum / values.length;
}

export const SUM_CALCULATION = (values: number[]) => {
    let sum = 0;
    for (const val of values) {
        sum += val;
    }
    return sum;
}

export class Profiler<T> {
    private name: string;
    private sampleSize: number;
    private currentSamples: number;
    private samples: T[];

    private profileHandler?: ProfileHandler<T>;
    private sampleHandler?: ProfileHandler<T>;
    private calculationHandler: ProfileCalculation<T>;

    constructor(name: string, calculation: ProfileCalculation<T>, sampleSize: number = 100) {
        this.name = name;
        this.sampleSize = sampleSize;
        this.calculationHandler = calculation;
        this.currentSamples = 0;
        this.samples = [];
    }

    public onProfile(handler: ProfileHandler<T>) {
        this.profileHandler = handler;
    }

    public onSample(handler: ProfileHandler<T>) {
        this.sampleHandler = handler;
    }

    public sample(val: T) {

        if (this.sampleHandler) this.sampleHandler(val);

        this.samples.push(val);
        this.currentSamples++;

        if (this.currentSamples >= this.sampleSize) {

            if (this.profileHandler) this.profileHandler(this.calculationHandler(this.samples));

            this.samples = [];
            this.currentSamples = 0;
        }
    }
}