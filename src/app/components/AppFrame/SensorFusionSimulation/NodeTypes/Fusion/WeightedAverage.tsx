import { Fusion } from './Fusion'

export class WeightedAverage extends Fusion {
  private weights: number[];

  constructor(id: string, x: number, y: number, weights: number[]) {
    super(id, x, y);
    this.weights = this.normalizeWeights(weights);
  }

  setWeights(weights: number[]) {
    this.weights = this.normalizeWeights(weights);
  }

  output(input: number[]): number {
    if (input.length !== this.weights.length) {
      throw new Error("Weights length != input length.");
    }

    let out = 0;
    for (let i = 0; i < input.length; i++) {
      out += input[i] * this.weights[i];
    }
    return out;
  }

  private normalizeWeights(weights: number[]): number[] {
    if (weights.length == 0) {
      throw new Error("Weights array is empty.");
    }

    let sum = 0;
    for (const w of weights) {
      if (w < 0) {
        throw new Error("Weights must be non-negative.");
      }
      sum += w;
    }

    if (sum == 0) {
      throw new Error("Sum of weights must be > 0.");
    }

    return weights.map(w => w / sum);
  }
}
