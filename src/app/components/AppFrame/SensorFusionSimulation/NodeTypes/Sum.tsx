import { NodeBase, BlockType } from './index';
import type { Signal } from './Signal';

export class Sum extends NodeBase {
    constructor(
        id: string,
        x: number,
        y: number,
        displayName = "Sum",
        width = 50,
        height = 50
    ) {
        super(id, displayName, x, y, BlockType.SUM, width, height);
    }

    execute(u: Signal[]): Signal {
        let tmp = 0;

        for (const sig of u) {
            const sign = this.sumSigns.get(sig.src) ?? "+";
            if (sign == "+") tmp += sig.y;
            else if (sign == "-") tmp -= sig.y;
        }

        return {
            y: tmp,
            t: u[0]?.t ?? 0,
            src: this
        };
    }

    setSign(node: NodeBase, sign: "+" | "-") {
        this.sumSigns.set(node, sign);
    }

    getSign() {
        return this.sumSigns;
    }

    static defaultWidth = 50;
    static defaultHeight = 50;
    style = 'bg-red-600';
    sumSigns: Map<NodeBase, "+" | "-"> = new Map();
}
