export enum selectionModeEnum {
  ADD_TF = "ADD_TF",
  ADD_DISCRETE_PID = "ADD_DISCRETE_PID",
  ADD_SUM = "ADD_SUM",
  ADD_INPUT = "ADD_INPUT",
  ADD_OUTPUT = "ADD_OUTPUT",
  ADD_JUNCTION = "ADD_JUNCTION",
  REMOVE = "REMOVE",
  MOVE = "MOVE",
  MAKE_CONNECTION = "MAKE_CONNECITON",
}

export enum BlockType {
  INPUT = "INPUT",
  JUNCTION = "JUNCTION",
  OUTPUT = "OUTPUT",
  SUM = "SUM",
  SCOPE = "SCOPE",
  TF = "TF",
  DISCRETE_PID = "DISCRETE_PID",
  SIGNALFLOW_NODE = "SIGNALFLOW_NODE"
}

export enum InputType {
  STEP = "STEP"
}

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

export class InputNode extends NodeBase {
  constructor(id: string, displayName: String, x: number, y: number, inputType: InputType, value: number, width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.INPUT);
    this.inputType = inputType;
    this.value = value;
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  inputType: InputType;
  value: number;
  style = 'bg-red-500';
}

export class OutputNode extends NodeBase {
  constructor(id: string, displayName: String, x: number, y: number, inputType: InputType, value: number, width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.OUTPUT);
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-red-500';
}

export class TFNode extends NodeBase {
  constructor(id: string, displayName: String, x: number, y: number, num = [], den = [], width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.TF);
    this.num = num;
    this.den = den;
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  num: number[];
  den: number[];
  style = 'bg-blue-500';
}

export class DiscretePIDNode extends NodeBase {
  constructor(id: string, displayName: String, x: number, y: number, Kp: number, Ki: number, Kd: number, Ts: number, outputMin = -Infinity, outputMax = Infinity, width = 100, height = 50) {
    super(id, displayName, x, y, BlockType.DISCRETE_PID);
    this.Kp = Kp;
    this.Ki = Ki;
    this.Kd = Kd;
    this.Ts = Ts;
  }
  static defaultWidth = 100;
  static defaultHeight = 50;
  style = 'bg-blue-500';
  private Kp: number;
  private Ki: number;
  private Kd: number;
  private Ts: number;
  private integral = 0;
  private prevError = 0;
  private outputMin: number;
  private outputMax: number;

  update(setpoint: number, measurement: number): number {
    const error = setpoint - measurement;

    const P = this.Kp * error;

    this.integral += this.Ki * this.Ts * error;

    const derivative = (error - this.prevError) / this.Ts;
    const D = this.Kd * derivative;

    let output = P + this.integral + D;

    if (output > this.outputMax) {
      output = this.outputMax;
      this.integral -= this.Ki * this.Ts * error;
    } else if (output < this.outputMin) {
      output = this.outputMin;
      this.integral -= this.Ki * this.Ts * error;
    }

    this.prevError = error;
    return output;
  }

}

export class SumNode extends NodeBase {
  constructor(id: string, x: number, y: number, nodesIds: string[], signs: string[], width = 50, height = 50) {
    super(id, 'sigma', x, y, BlockType.TF, width, height);
    this.nodesIds = nodesIds;
    this.signs = signs;
  }
  static defaultWidth = 50;
  static defaultHeight = 50;
  style = '';
  nodesIds: string[];
  signs: string[];
}

export class JunctionNode extends NodeBase {
  constructor(id: string, x: number, y: number) {
    super(id, 'junction', x, y, BlockType.JUNCTION, 10, 10);
  }
  static defaultWidth = 5;
  static defaultHeight = 5;
}

export interface Edge {
  from: NodeBase;
  to: NodeBase;
  fromPos: number;
  toPos: number;
}

export type EdgeGain = { num: number[]; den: number[] };
