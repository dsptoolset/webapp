export const boxMuller = (mean: number, std: number) => {
    let theta = 2 * Math.PI * Math.random();
    let R = Math.sqrt(-2 * Math.log(Math.random()));
    let x = R * Math.cos(theta);
    return x * std + mean;
}
