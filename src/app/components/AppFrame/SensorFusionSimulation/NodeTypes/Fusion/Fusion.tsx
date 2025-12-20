
import { NodeBase, BlockType } from '../index';

export class Fusion extends NodeBase {
  constructor(id: string, x: number, y: number, displayName = "FSN", width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.FUSION, width, height);
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-teal-600';
}
