import { multiplyArrayByAConstant } from '../utils';
import { multiply, pinv, transpose } from 'mathjs';

export const leastSquares_linearPhaseFIR = (
    F: number[],
    A: number[],
    Weights: number[],
    N: number) => {
    const L = 4098;
    const M = (N - 1) / 2;
    let normalizedFreqs = Array.from({ length: L + 1 }, (_, i) => i / L);
    let w = multiplyArrayByAConstant(normalizedFreqs, Math.PI);
    let D = Array(L + 1).fill(0);

    for (let k = 0; k < F.length / 2; k++) {
        let f1 = F[k * 2];
        let f2 = F[k * 2 + 1];
        let A1 = A[k * 2];
        let A2 = A[k * 2 + 1];

        for (let i = 0; i <= L; i++) {
            if (normalizedFreqs[i]! >= f1! && normalizedFreqs[i]! <= f2!) {
                D[i] = A1! + (A2! - A1!) * (normalizedFreqs[i]! - f1!) / (f2! - f1!);
            }
        }
    }

    // Build cosine matrix
    const C = [];
    for (let i = 0; i <= L; i++) {
        const row = [];
        for (let k = 0; k <= M; k++) {
            row.push(Math.cos(w[i]! * k));
        }
        C.push(row);
    }

    // The equation to solve is:
    // a = inv(C' W C) C' W D
    // Here, W is a diagonal matrix of size (L+1) x (L+1), where each diagonal element assigns a weight to the corresponding normalized frequency point.
    // For efficiency, omit creating the W and directly apply element-wise multiplication.
    const WVec: number[] = [];
    let weightsIdx = 0;
    for (let i = 0; i <= L; i++) {
        const f = normalizedFreqs[i];
        while (weightsIdx < Weights.length - 1 && f! > F[2 * weightsIdx + 1]!) {
            weightsIdx++;
        }

        WVec.push(Weights[weightsIdx]!);
    }
    const WC = C.map((row, i) => row.map(x => x * WVec[i]!));
    const WD = D.map((d, i) => d * WVec[i]!);
    
    // Solve
    const a = multiply(pinv(multiply(transpose(C), WC)), multiply(transpose(C), WD));

    const h = new Array(N).fill(0);
    h[M] = a[0];
    for (let k = 1; k <= M; k++) {
        h[M - k] = a[k]! / 2;
        h[M + k] = a[k]! / 2;
    }

    return h;
};
