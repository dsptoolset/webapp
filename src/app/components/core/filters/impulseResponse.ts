export const lowPassImpulseResponse = (cutOffFreq: number, N: number = 1024) => {
    let array = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
        if (i == N / 2) array[i] = cutOffFreq / Math.PI;
        else array[i] = 1 / (Math.PI * (i - (N / 2))) * Math.sin(cutOffFreq * (i - N / 2));
    }
    return array;
}

export const bandpassImpulseResponse = (w1: number, w2: number, N: number = 1024) => {
    let array = new Array(N).fill(0);
    const mid = Math.floor(N / 2); // Math.floor() is necessary to make it work for both odd and even Ns

    for (let i = 0; i < N; i++) {
        const k = i - mid;
        if (k == 0) {
            array[i] = (w2 - w1) / Math.PI;
        } else {
            array[i] = (Math.sin(w2 * k) - Math.sin(w1 * k)) / (Math.PI * k);
        }
    }

    return array;
};

