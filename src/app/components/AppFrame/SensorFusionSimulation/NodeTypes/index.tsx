
export enum selectionModeEnum {
  ADD_GENERATOR = "ADD_GENERATOR",
  ADD_PLANT = "ADD_PLANT",
  ADD_MODIFIER = "ADD_MODIFIER",
  ADD_FSFILTER = "ADD_FSFILTER",
  ADD_DISPLAY = "ADD_DISPLAY",
  ADD_FUSION = "ADD_FUSION",
  ADD_OUTPUT = "ADD_OUTPUT",
  ADD_JUNCTION = "ADD_JUNCTION",
  ADD_SUM = "ADD_SUM",
  ADD_DISCRETE_PID = "ADD_DISCRETE_PID",
  REMOVE = "REMOVE",
  MOVE = "MOVE",
  MAKE_CONNECTION = "MAKE_CONNECITON",
  ZOHSAMPLER = "ZOHSAMPLER"
}

export enum BlockType {
  GENERATOR = "GENERATOR",
  PLANT = "PLANT",
  MODIFIER = "MODIFIER",
  FSFILTER = "FSFILTER",
  DISPLAY = "DISPLAY",
  FUSION = "FUSION",
  OUTPUT = "OUTPUT",
  JUNCTION = "JUNCTION",
  DISCRETE_PID = "DISCRETE_PID",
  SUM = "SUM",
  SCOPE = "SCOPE",
  ZOHSAMPLER = "ZOHSAMPLER",
}

import { NodeBase } from './NodeBase';
export { NodeBase } from './NodeBase';
export { Generator } from './Generator';
export { FSFilter } from './FSFilter';
export { Modifier } from './Modifier';
export { JunctionNode } from './JunctionNode';
export { Display } from './Display';
export { DiscretePID } from './DiscretePID';
export { Fusion, WeightedAverage } from './Fusion';
export { Sum } from './Sum';

export interface Edge {
  from: NodeBase;
  to: NodeBase;
  fromPos: number;
  toPos: number;
}

export type EdgeGain = { num: number[]; den: number[] };
