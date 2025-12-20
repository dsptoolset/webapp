import { NodeBase, BlockType } from './index';
import { Signal } from './Signal';

export class FSFilter extends NodeBase {
  y_buffer: number[];
  x_buffer: number[];
  den: number[];
  num: number[];
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-teal-600';

  constructor(
    id: string,
    x: number,
    y: number,
    den: number[] = [],
    num: number[] = [],
    displayName = "Filter",
    width = FSFilter.defaultWidth,
    height = FSFilter.defaultHeight
  ) {
    super(id, displayName, x, y, BlockType.FSFILTER, width, height);
    this.den = den;
    this.num = num;

    this.init();
  }

  init() {
    // Buffers initialized to the correct length
    this.y_buffer = new Array(this.den.length - 1).fill(0);
    this.x_buffer = new Array(this.num.length).fill(0);
  }

  execute(u: Signal[]): Signal {
    // Shift x_buffer
    for (let i = this.x_buffer.length - 1; i > 0; i--) {
      this.x_buffer[i] = this.x_buffer[i - 1];
    }
    this.x_buffer[0] = u[0].y;

    // Compute x terms
    let x_sum = 0;
    for (let i = 0; i < this.num.length; i++) {
      x_sum += this.num[i] * this.x_buffer[i];
    }

    // Compute y terms (skip a0, which is assumed 1)
    let y_sum = 0;
    for (let i = 1; i < this.den.length; i++) {
      y_sum += this.den[i] * this.y_buffer[i - 1];
    }

    const output = x_sum - y_sum;

    // Shift y_buffer
    for (let i = this.y_buffer.length - 1; i > 0; i--) {
      this.y_buffer[i] = this.y_buffer[i - 1];
    }
    if (this.y_buffer.length > 0) this.y_buffer[0] = output;
    return {y: output, t: u[0].t, src: this};
  }
}
