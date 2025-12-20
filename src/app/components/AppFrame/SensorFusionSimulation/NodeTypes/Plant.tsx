
import { NodeBase, BlockType } from './index';
import { tfToSS } from '../../../core/control/lti';
import { addVectors, matrixMultiply } from '../../../core/math';
import { Signal } from './Signal';


export class Plant extends NodeBase {
  constructor(
    id: string,
    x: number,
    y: number,
    num: number[],
    den: number[],
    samplingPeriod = 0.01,
    dt = 0.01,
    displayName = "Plant",
    simT = 0,
    simPrev = 0,
    simCurr = 0,
    width = 100,
    height = 50
  ) {
    super(id, displayName, x, y, BlockType.PLANT, width, height);
    this.num = num;
    this.den = den;
    this.simT = simT;
    this.simPrev = simPrev;
    this.simCurr = simCurr;
    this.dt = dt;
    this.samplingPeriod = samplingPeriod;

    this.stepsPerSample = Math.round(samplingPeriod / dt);
    this.init();
  }

  setTs(Ts: number) {
    this.stepsPerSample = Math.round(Ts / this.dt);
  }

  init() {
    const { A, B, C, D } = tfToSS({ num: this.num, den: this.den });
    this.A = A;
    this.B = B;
    this.C = C;
    this.D = D;

    this.x0 = Array(A.length).fill(0);
    this.X = structuredClone(this.x0);
    this.states = [structuredClone(this.X)];


    this.t = 0;

    this.outputs = [0]; // zero init
    this.times = [0];
    this.sampledOutput = [];
    this.sampledTimes = [];
  }

  execute(u: Signal[]): Signal {
    const input = u.length > 0 ? [u[0].y] : [];

    for (let step = 0; step < this.samplingPeriod / this.dt; step++) {
      const yState = matrixMultiply(this.C, this.X) as number[];
      const inputContribution = matrixMultiply(this.B, input) as number[];
      const y = yState.map((yi, i) => yi + (this.D || 0) * (input[i] || 0));
      this.outputs.push(y[0]);
      this.times.push(this.t);

      if (this.outputs.length % this.stepsPerSample == 0) {
        this.sampledOutput.push(y[0]);
        this.sampledTimes.push(this.t);
      }

      const xDot = matrixMultiply(this.A, this.X) as number[];
      const xDotFinal = addVectors(xDot, inputContribution);
      this.X = this.X.map((xi, i) => xi + this.dt * xDotFinal[i]);
      this.states.push(structuredClone(this.X));

      this.t += this.dt;
    }

    // Return the latest output
    const lastY = this.outputs[this.outputs.length - 1];
    return { y: lastY, t: this.t, src: this };
  }


  setNum(num: number[]) {
    this.num = num;
  }

  setDen(den: number[]) {
    this.den = den;
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  value: number;
  style = 'bg-teal-600';
  num: number[];
  den: number[];

  simT: number;

  A: number[][] | undefined;
  B: number[][] | undefined;
  C: number[][] | undefined;
  D: number | undefined;
  simPrev: number;
  simCurr: number;


  x0: number[];
  dt: number;
  numOfSteps: number;
  samplingPeriod: number;

  X: number[];

  states: number[][];
  outputs: number[] = [];
  times: number[] = [];
  t = 0;
  sampledOutput = [];
  sampledTimes = [];
  stepsPerSample: number;
}

