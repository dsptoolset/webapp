import { aValueTimesElementsOfArray, addArraysFromRight, construct_Z_plus_one_or_Z_minus_one_polynomial } from '../utils';

export const bilinearTransform = (coeff: { num: number[]; den: number[] }): { num: number[]; den: number[] } => {
    // Reverse coefficients
    coeff.num = coeff.num.slice().reverse();
    coeff.den = coeff.den.slice().reverse();

    const N: number = Math.max(coeff.num.length, coeff.den.length) - 1;
    const K: number = 2;

    // Build numerator
    const tmpNum: number[][] = coeff.num.map((c, i) =>
        aValueTimesElementsOfArray(c * Math.pow(K, i), construct_Z_plus_one_or_Z_minus_one_polynomial(N, i))
    );

    let resNum: number[] = tmpNum[0] ?? [];
    for (let i = 1; i < tmpNum.length; i++) {
        resNum = addArraysFromRight(resNum, tmpNum[i]!);
    }

    // Build denominator
    const tmpDen: number[][] = coeff.den.map((c, i) =>
        aValueTimesElementsOfArray(c * Math.pow(K, i), construct_Z_plus_one_or_Z_minus_one_polynomial(N, i))
    );

    let resDen: number[] = tmpDen[0] ?? [];
    for (let i = 1; i < tmpDen.length; i++) {
        resDen = addArraysFromRight(resDen, tmpDen[i]!);
    }

    // Normalize
    if (resDen.length === 0) throw new Error("Denominator array is empty");

    const firstCoefBeforeBeingChanged: number = resDen[0]!;
    resDen = resDen.map(x => x / firstCoefBeforeBeingChanged);
    resNum = resNum.map(x => x / firstCoefBeforeBeingChanged);

    return { num: resNum, den: resDen };
};
