import { BlockType } from './index';
import { Signal } from './Signal';
import { atan2 } from 'mathjs';

export class NodeBase {
  constructor(id: string, displayName: String, x: number, y: number, type: BlockType, width = 100, height = 50) {
    this.id = id;
    this.displayName = displayName;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.outDegree = 0;
    this.inDegree = 0;
  }

  execute(u: Signal[]): Signal {
    return { y: 0, t: 0, src: null };
  }

  increaseOutDegree() {
    this.outDegree++;
  }

  decreaseOutDegree() {
    if (this.outDegree <= 0) {
      throw new Error("Degree must be positive.");
    }
    this.outDegree--;
  }

  increaseInDegree() {
    this.inDegree++
  }

  decreaseInDegree() {
    if (this.inDegree <= 0) {
      throw new Error("Degree must be positive.");
    }
    this.inDegree--;
  }

  static getPortCoordinates = (node, position) => {
    switch (position) {
      case 0:
        return {
          x: node.x + node.width / 2,
          y: node.y,
        };
      case 1:
        return {
          x: node.x + node.width,
          y: node.y + node.height / 2,
        };
      case 2:
        return {
          x: node.x + node.width / 2,
          y: node.y + node.height,
        };
      case 3:
        return {
          x: node.x,
          y: node.y + node.height / 2,
        };
    }
  };

  static getPortsCoordinates = (node1, node2, edge) => {
    return {
      node1: NodeBase.getPortCoordinates(node1, edge.fromPos),
      node2: NodeBase.getPortCoordinates(node2, edge.toPos),
    };
  };

  static getArrowPoints = (from, to, fromPos, toPos, arrowDegree = 20, length = 10) => {
    const p1 = NodeBase.getPortCoordinates(to, toPos);
    const p2 = NodeBase.getPortCoordinates(from, fromPos);
    const vec = { x: p1.x - p2.x, y: p1.y - p2.y }
    const angle = atan2(vec.y, vec.x);
    const arrowDegreeInRad = arrowDegree * Math.PI / 180;
    const c2 = {
      x: p1.x - length * Math.cos(angle - arrowDegreeInRad),
      y: p1.y - length * Math.sin(angle - arrowDegreeInRad),
    }
    const c3 = {
      x: p1.x - length * Math.cos(angle + arrowDegreeInRad),
      y: p1.y - length * Math.sin(angle + arrowDegreeInRad),
    }
    return `${p1.x},${p1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`;
  }

  width: number;
  height: number;
  id: string;
  displayName: String;
  x: number;
  y: number;
  type: BlockType;
  inDegree: number;
  outDegree: number;
}