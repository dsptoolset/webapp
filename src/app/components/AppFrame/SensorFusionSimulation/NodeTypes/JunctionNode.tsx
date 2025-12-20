
import { NodeBase, BlockType } from './index';

export class JunctionNode extends NodeBase {
  constructor(id: string, x: number, y: number) {
    super(id, 'junction', x, y, BlockType.JUNCTION, 10, 10);
  }
  static defaultWidth = 5;
  static defaultHeight = 5;
}
