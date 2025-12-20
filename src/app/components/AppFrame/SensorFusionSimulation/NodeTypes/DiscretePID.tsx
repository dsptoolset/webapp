import { NodeBase, BlockType } from './index';
import type { Signal } from './Signal';

export class DiscretePID extends NodeBase {
  constructor(
    id: string,
    x: number,
    y: number,
    Kp = 2.0,
    Ki = 1.0,
    Kd = 0.01,
    Ts = 0.01,
    integral_max = 1,
    integral_min = -1,
    displayName = "D-PID",
    width = 100,
    height = 50
  ) {
    super(id, displayName, x, y, BlockType.DISCRETE_PID, width, height);
    this.Kp = Kp;
    this.Ki = Ki;
    this.Kd = Kd;
    this.Ts = Ts;
    this.integral_min = integral_min;
    this.integral_max = integral_max;
  }

  execute(u: Signal[]): Signal {
    const e = u[0]?.y ?? 0;

    this.integral += e * this.Ts;
    this.integral = this.clamp(this.integral);
    console.log("I:", this.integral, this.integral_max)
    const derivative = (e - this.e_prev) / this.Ts;

    const pTerm = this.Kp * e;
    const iTerm = this.Ki * this.integral;
    const dTerm = this.Kd * derivative;

    const output = pTerm + iTerm + dTerm;

    this.e_prev = e;

    return {
      y: output,
      t: u[0]?.t ?? 0,
      src: this
    };
  }

  setTs(Ts: number) {
    this.Ts = Ts;
  }
  
  init() {
    this.integral = 0;
    this.e_prev = 0;
  }

  clamp(integral) {
    if(integral > this.integral_max) return this.integral_max;
    if(integral < this.integral_min) return this.integral_min;
    return integral;
  }
  
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-teal-600';
  Kp: number;
  Ki: number;
  Kd: number;
  integral: number = 0;
  integral_max = Infinity;
  integral_min = -Infinity;
  e_prev: number = 0;
  Ts: number;
}
