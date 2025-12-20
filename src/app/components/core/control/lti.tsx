import { makeMatrix, matrixMultiply, addVectors } from "../math";

export const eulerIntegration = (
    A: number[][],
    B: number[][],
    C: number[][],
    x0: number[],
    u: number[],
    deltaT: number,
    numSteps: number,
    samplingPeriod: number
) => {
    let x = structuredClone(x0);

    const states: number[][] = [structuredClone(x)];
    const outputs: number[] = [];
    const times: number[] = [];
    let t = 0;
    const sampledOutput = [];
    const sampledTimes = [];
    const stepsPerSample = Math.round(samplingPeriod / deltaT);

    for (let step = 0; step < numSteps; step++) {

        const y = matrixMultiply(C, x) as number[];
        outputs.push(y[0]);
        times.push(t);

        // Euler update
        const xDot = matrixMultiply(A, x) as number[];
        const uEffect = matrixMultiply(B, u) as number[];
        const xDotFinal = addVectors(xDot, uEffect);
        x = x.map((xi, i) => xi + deltaT * xDotFinal[i]);

        states.push(structuredClone(x));

        if (step % stepsPerSample === 0) {
            sampledOutput.push(y[0]);
            sampledTimes.push(t);
        }

        t += deltaT;
    }

    return { sampledOutput, sampledTimes, times, states, outputs };
};

export const tfToSS = (coef: { num: number[], den: number[] }) => {
    if (coef.num.length < 1 || coef.den.length < 2) {
        throw new Error("Invalid transfer function.");
    }

    // Normalize the transfer function if necessary (i.e., make the denominator's leading coefficient 1)
    if (coef.den[0] !== 1) {
        coef = normalizeTf(coef);
    }

    const N = coef.den.length - 1;

    // Initialize A Matrix (N x N)
    const A = makeMatrix(N, N);

    // Fill A Matrix based on denominator coefficients
    for (let col = 0; col < N; col++) {
        if (col > 0) {
            A[col - 1][col] = 1; // Subdiagonal (shift matrix)
        }
        A[N - 1][col] = -coef.den[N - col]; // Last row is the negative of denominator coefficients
    }

    // Initialize B Vector (N x 1)
    const B = makeMatrix(N, 1);
    B[N - 1][0] = coef.num[0]; // Last element in B is the first numerator coefficient

    // Initialize C Matrix (1 x N) using makeMatrix
    const C = makeMatrix(1, N); // Create 1 row and N columns
    for (let i = 0; i < N; i++) {
        C[0][i] = coef.num[i] || 0; // Fill the row with the numerator coefficients
    }

    // Initialize D Scalar (1 x 1)
    const D = 0; // Typically 0 unless there's a direct feedthrough

    return { A, B, C, D };
};

const normalizeTf = (coef: { num: number[], den: number[] }) => {
    let copy = structuredClone(coef);
    copy.num = copy.num.map(e => e / coef.den[0]);
    copy.den = copy.den.map(e => e / coef.den[0]);
    return copy;
};

// const { A, B, C, D } = tfToSS({ num: [2, 5], den: [1, 3, 2] });

// const x0 = [0, 0];  // Initial state
// const u = [1];      // Input vector (constant input)
// const deltaT = 0.01; // Time step for Euler integration
// const numSteps = 1000; // Number of steps

// const result = eulerIntegration(A, B, C, x0, u, deltaT, numSteps);

// console.log("States:", result.states); // States over time
// console.log("Outputs:", result.outputs); // Outputs over time
