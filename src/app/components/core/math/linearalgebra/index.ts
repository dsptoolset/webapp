export // Matrix-Matrix and Matrix-Vector Multiplication function
const matrixMultiply = (A: number[][], B: number[] | number[][]): number[] | number[][] => {
    if (Array.isArray(B[0])) {
        // Matrix-Matrix Multiplication
        const result: number[][] = [];
        for (let i = 0; i < A.length; i++) {
            result[i] = [];
            for (let j = 0; j < (B as number[][])[0].length; j++) {
                result[i][j] = 0;
                for (let k = 0; k < A[0].length; k++) {
                    result[i][j] += A[i][k] * (B as number[][])[k][j];
                }
            }
        }
        return result; // Return as a matrix (2D array)
    } else {
        // Matrix-Vector Multiplication
        const result: number[] = new Array(A.length).fill(0);
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < A[0].length; j++) {
                result[i] += A[i][j] * (B as number[])[j];
            }
        }
        return result; // Always return as a vector (1D array)
    }
};




export const makeMatrix = (rows: number, cols: number): number[][] => {
    if (rows < 1 || cols < 1) throw new Error("Incorrect matrix size.");
    return Array.from({ length: rows }, () => new Array(cols).fill(0));
};

export const addVectors = (v1: number[], v2: number[]): number[] => {
    if (v1.length !== v2.length) throw new Error("Vectors length mismatch.");
    const res: number[] = new Array(v1.length); 

    for (let i = 0; i < v1.length; i++) {
        res[i] = v1[i] + v2[i];
    }

    return res;
};
