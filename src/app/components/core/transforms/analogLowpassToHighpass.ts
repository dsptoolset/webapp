import { complex, type Complex } from 'mathjs';
import { convolve } from '../filters/index';

export const transformAnalogLowpassToHighpass = (
    poles: Complex[],
    Omega_c: number
): { num: number[]; den: number[] } => {
    const hpPoles: Complex[] = poles.map((p: Complex) => {
        const denom: number = p.re * p.re + p.im * p.im;
        return complex(
            (Omega_c * Omega_c * p.re) / denom,
            (-Omega_c * Omega_c * p.im) / denom
        );
    });

    const tmp: Complex[][] = hpPoles.map((p: Complex) => [complex(1, 0), complex(-p.re, -p.im)]);

    if (tmp.length === 0) throw new Error("hpPoles array is empty"); // safety check
    let tmp2: Complex[] = tmp[0]!;
    for (let i = 1; i < tmp.length; i++) {
        tmp2 = convolve(tmp2, tmp[i]!);
    }
    const convRes: Complex[] = tmp2;

    const den: number[] = [1];
    for (let i = 1; i < convRes.length; i++) {
        den.push(convRes[i]!.re);
    }

    let num: number[] = new Array(poles.length + 1).fill(0);
    num[0] = Math.pow(Omega_c, poles.length);

    const gain: number = num[0] / den[0]!;
    num = num.map((c: number) => c / gain);

    return { num, den };
};
