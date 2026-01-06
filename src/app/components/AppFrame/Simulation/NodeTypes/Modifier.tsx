import { boxMuller } from '../../../core/math';
import { NodeBase, BlockType } from './index';
import { Signal } from './Signal';

export class Modifier extends NodeBase {
  constructor(id: string, x: number, y: number, std: number, mean: number, displayName = "Mod", width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.MODIFIER, width, height);
    this.std = std;
    this.mean = mean;
  }
  execute(u: Signal[]): Signal {
    return { y: u[0].y + boxMuller(this.mean, this.std), t: u[0].t ?? 0, src: this };
  }
  std: number;
  mean: number;
  static defaultWidth = 100;
  static defaultHeight = 50;
  value: number;
  style = 'bg-teal-600';
}
