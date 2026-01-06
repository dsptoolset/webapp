import { Fusion } from './Fusion';

type Interval = [number, number];
type Tuple = [number, number];

export class MarzullosAlgorithm extends Fusion {
  private sensorValidRange: number;

  constructor(id: string, x: number, y: number, sensorValidRange: number) {
    super(id, x, y);
    if (sensorValidRange < 0) throw new Error("Sensor valid range must be positive.")
    this.sensorValidRange = sensorValidRange;
  }

  output(input: number[]): number {

    let intervals: [number, number][];
    for (const i of input) {
      intervals.push([i - this.sensorValidRange / 2, i + this.sensorValidRange / 2])
    }
    return this.algo(intervals);
  }

  buildTuples(values: [number, number][]): Tuple[] {
    const res: Tuple[] = [];
    values.forEach(([start, end], i) => {
      if (end < start) {
        throw new Error(`Second value should be greater than or equal to the first. Error at index ${i}`);
      }
      res.push([start, -1]);
      res.push([end, 1]);
    });
    return res;
  }

  sortTuples(tuples: Tuple[]): Tuple[] {
    return tuples.sort((a, b) => a[0] - b[0]);
  }

  algo(values: Interval[]): number {
    const tuples = this.sortTuples(this.buildTuples(values));

    tuples.forEach(t => console.log(t[0], t[1]));

    let best = 0;
    let count = 0;
    let bestStart = 0;
    let bestEnd = 0;

    for (let i = 0; i < tuples.length - 1; i++) {
      const [offset, type] = tuples[i];
      const nextOffset = tuples[i + 1][0];

      count -= type;
      if (count > best) {
        best = count;
        bestStart = offset;
        bestEnd = nextOffset;
      }

    }
    const bestEstimate = (bestStart + bestEnd) / 2;
    return bestEstimate;
  }


}


