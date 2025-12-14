import { filter, convolve } from './filters/index';
import { complex, type Complex } from 'mathjs';
import { FilterType } from './enums';
import { transformAnalogLowpassToHighpass } from './transforms/index';

export const aValueTimesElementsOfArray = (K: number, arr: number[]) => {
    let res = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(arr[i]! * K);
    }
    return res;
}

export const addArraysFromRight = (arr1: number[], arr2: number[]) => {

    let maxLength = arr1.length > arr2.length ? arr1.length : arr2.length;
    let res = Array(maxLength).fill(0);
    let arr1LastIndex = arr1.length - 1;
    let arr2LastIndex = arr2.length - 1;

    for (let i = maxLength - 1; i >= 0; i--) {
        if (arr1LastIndex >= 0) res[i] += arr1[arr1LastIndex--];
        if (arr2LastIndex >= 0) res[i] += arr2[arr2LastIndex--];
    }

    return res;
};

export const ZeroPad = (array: number[], sizeOfTheZeroPaddedArray: number) => {
    console.assert(array.length < sizeOfTheZeroPaddedArray);
    let theRestOfTheZeroPaddedArray = new Array(sizeOfTheZeroPaddedArray - array.length).fill(0);
    return array.concat(theRestOfTheZeroPaddedArray);
}

export const getImpulseResponse = (
    filterCoefficients: { num: number[]; den: number[] },
    size: number = 1000
): number[] => {
    const impulseSignal: number[] = [];
    impulseSignal.push(1);
    for (let i = 0; i < size; i++) {
        impulseSignal.push(0);
    }
    return filter(impulseSignal, filterCoefficients);
};

export const H_of_s = (
    poles: Complex[],
    Omega_c: number,
    type: FilterType
): { num: number[]; den: number[] } | undefined => {
    let convRes: Complex[] = [];
    let tmp: Complex[][] = [];
    for (let i = 0; i < poles.length; i++) {
        tmp.push([complex(1, 0), complex(-poles[i]!.re, -poles[i]!.im)]);
    }

    let tmp2: Complex[] = tmp[0]!;
    for (let i = 1; i < tmp.length; i++) {
        tmp2 = convolve(tmp2, tmp[i]!);
    }
    convRes = tmp2;

    const den: number[] = [1];
    for (let i = 1; i < convRes.length; i++) {
        den.push(convRes[i]!.re);
    }

    const tf: { num: number[]; den: number[] } = { num: [Math.pow(Omega_c, poles.length)], den };

    switch (type) {
        case FilterType.LOWPASS:
            return tf;
        case FilterType.HIGHPASS:
            return transformAnalogLowpassToHighpass(poles, Omega_c);
    }
};

export const countNumberOfOccurrences = (str: string, c: string): number => {
    return str.split(c).length - 1;
};

export const elementWiseAdd = (arr1: number[], arr2: number[]): number[] => {
    console.assert(arr1.length === arr2.length);
    const res: number[] = new Array(arr1.length);
    for (let i = 0; i < arr1.length; i++) {
        res[i] = arr1[i]! + arr2[i]!;
    }
    return res;
};

export const elementWiseMultiply = (arr1: number[], arr2: number[]): number[] => {
    console.assert(arr1.length === arr2.length);
    const res: number[] = new Array(arr1.length);
    for (let i = 0; i < arr1.length; i++) {
        res[i] = arr1[i]! * arr2[i]!;
    }
    return res;
};

export const multiplyArrayByAConstant = (arr: number[], constant: number): number[] => {
    const res: number[] = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        res[i] = constant * arr[i]!;
    }
    return res;
};

export const construct_Z_plus_one_or_Z_minus_one_polynomial = (N: number, diff: number): number[] => {
    const polynomialCoeffs: number[][] = [];
    for (let i = 0; i < N - diff; i++)
        polynomialCoeffs.push([1, 1]);

    for (let i = 0; i < diff; i++)
        polynomialCoeffs.push([1, -1]);

    let res: number[] = polynomialCoeffs[0]!;
    for (let i = 1; i < polynomialCoeffs.length; i++) {
        res = convolve(res, polynomialCoeffs[i]!);
    }
    return res;
};