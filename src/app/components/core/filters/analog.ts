import { complex } from 'mathjs';

export const getCausalButterworthPoles = (N: number, omega_c: number) => { // N = Filter Order
    let s_k = [];
    for (let k = 0; k < 2 * N; k++) {
        let tmp = (Math.PI) / (2 * N) * (N + 2 * k - 1);
        s_k.push(complex(omega_c * Math.cos(tmp), omega_c * Math.sin(tmp)));
    }
    return s_k.filter(e => e.re < 0);
}

export const getChebyshevIPoles = (N: number, omega_c: number, epsilon = 0.2) => {
    const poles = [];

    const beta = (1 / N) * Math.asinh(1 / epsilon);
    const sigma = Math.sinh(beta);
    const omega = Math.cosh(beta);

    for (let k = 1; k <= N; k++) {
        const theta = (Math.PI * (2*k - 1)) / (2 * N);

        // normalized prototype pole
        const re = -sigma * Math.sin(theta);
        const im =  omega * Math.cos(theta);

        // now apply cutoff
        poles.push(complex(omega_c * re, omega_c * im));
    }

    return poles;
};