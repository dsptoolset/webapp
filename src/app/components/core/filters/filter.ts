export const filter = (
    signal: number[],
    filterCoefficients: { num: number[]; den: number[] }
): number[] => {
    const y_buffer = new Array(filterCoefficients.den.length).fill(0);
    let result: number[] = [];

    for (let i = 0; i < signal.length; i++) {
        let x_term_sums = 0;
        for (let j = 0; j < filterCoefficients.num.length; j++) {
            x_term_sums += filterCoefficients.num[j]! * (i - j < 0 ? 0 : signal[i - j]!);
        }

        let y_term_sums = 0;
        for (let j = 1; j < filterCoefficients.den.length; j++) {
            y_term_sums += filterCoefficients.den[j]! * (i - j < 0 ? 0 : y_buffer[j - 1]);
        }
        const output = x_term_sums - y_term_sums;

        for (let j = y_buffer.length - 1; j > 0; j--) {
            y_buffer[j] = y_buffer[j - 1];
        }
        y_buffer[0] = output;

        result.push(output);
    }

    return result;
};
