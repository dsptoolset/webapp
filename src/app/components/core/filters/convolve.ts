import { add, multiply, type Complex } from 'mathjs';

export const convolve = (a: number[] | Complex[], b: number[] | Complex[]) => {
    let m = a.length + b.length - 1;
    let result = new Array(m).fill(0);
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            result[i + j] = add(result[i + j] ?? 0, multiply(a[i] ?? 0, b[j] ?? 0));
        }
    }
    return result;
}