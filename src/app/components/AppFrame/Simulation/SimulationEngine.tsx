import { Edge, EdgeGain, TFNode, NodeBase, DiscretePIDNode, BlockType } from './types';
import { convolve } from '../../core';
import { string } from 'mathjs';
import { applyMasonsRule } from './MGF';


class SignalFlowNode {
    constructor(name = '') {
        this.name = name;
    }
    name: string;
    num: number[];
    den: number[];
}

class SignalFlowEdge {
    inward: SignalFlowNode[];
    outward: SignalFlowNode[];
}

enum SimulationConfig {
    CONTINUOUS_SUBSYSTEMS = "CONTINUOUS_SUBSYSTEMS",
    CONTINUOUS_PLANT_WITH_DISCRETE_ELEM = "CONTINUOUS_PLANT_WITH_DISCRETE_ELEM"
}

const detectSimulationConfig = (graph: Edge[]) => {
    for (let i = 0; i < graph.length; i++) {
        if (graph instanceof DiscretePIDNode) // the list gets bigger later
            return SimulationConfig.CONTINUOUS_PLANT_WITH_DISCRETE_ELEM;
        return SimulationConfig.CONTINUOUS_SUBSYSTEMS;
    }
}

const dfs = (
    start: NodeBase,
    adjList: Map<NodeBase, NodeBase[]>,
    visit
) => {
    const visited = new Set<string>();
    const stack: NodeBase[] = [];

    stack.push(start);

    while (stack.length > 0) {
        const current = stack.pop()!;

        if (visited.has(current.id)) continue;

        visited.add(current.id);
        visit(current);

        const neighbors = adjList.get(current) ?? [];

        // reverse to preserve original traversal order
        for (let i = neighbors.length - 1; i >= 0; i--) {
            const neighbor = neighbors[i];
            if (!visited.has(neighbor.id)) {
                stack.push(neighbor);
            }
        }
    }
};


const buildAdjList = (edges: Edge[]) => {
    const adjList = new Map<NodeBase, NodeBase[]>();

    for (const edge of edges) {
        const { from, to } = edge;

        let neighbors = adjList.get(from);
        if (!neighbors) {
            neighbors = [];
            adjList.set(from, neighbors);
        }

        neighbors.push(to);
    }

    return adjList;
}


const signalFlowGraphFromBlockDiagram = (edgeList: Edge[], nodes: NodeBase[]) => {
    const newEdgeList = mergeCascadedTFBlocks(edgeList);
    const signalFlowGraph = new Map<NodeBase, { target: NodeBase; gain: EdgeGain }[]>();
    const signalNodeMap = new Map<string, NodeBase>();

    /* -------------------------------------------------
       Step 1: Create ONE signal node per block output
       ------------------------------------------------- */
    nodes.forEach(block => {
        const signalNode = new NodeBase(
            block.id + '_sig',
            block.displayName + '_sig',
            block.x,
            block.y,
            BlockType.SIGNALFLOW_NODE
        );

        signalNodeMap.set(block.id, signalNode);
        signalFlowGraph.set(signalNode, []);
    });

    /* -------------------------------------------------
       Step 2: Convert block edges → SFG edges
       ------------------------------------------------- */
    newEdgeList.forEach(edge => {
        const fromSignal = signalNodeMap.get(edge.from.id)!;
        const toSignal   = signalNodeMap.get(edge.to.id)!;

        let gain: EdgeGain =  { num: [1], den: [1] }; // gain of 1

        // TF block contributes gain
        if ('num' in edge.from && 'den' in edge.from) {
            const tf = edge.from as any;
            gain = { num: tf.num, den: tf.den };
        }

        signalFlowGraph.get(fromSignal)!.push({
            target: toSignal,
            gain
        });

        fromSignal.outDegree++;
        toSignal.inDegree++;
    });

    return signalFlowGraph;
};


const simulate_continuous_plant = (tf) => {

}


// const simulate_continuous_plant_with_discrete_elem = (tf, pidC) => {

// }

export const simulate = (edgeList: Edge[], nodes, setOutput, iterations: number = 10000) => {
    // detect loop
    const typeOfSimulationConfig = detectSimulationConfig(edgeList);
    let simulationOutput;
    let signalFlowGraph = signalFlowGraphFromBlockDiagram(edgeList, nodes);
    let simplifiedSystem = applyMasonsRule(signalFlowGraph);

    switch (typeOfSimulationConfig) {
        case SimulationConfig.CONTINUOUS_SUBSYSTEMS:
            simulationOutput = simulate_continuous_plant(simplifiedSystem);
            break;
        // case SimulationConfig.CONTINUOUS_PLANT_WITH_DISCRETE_ELEM:
        //     simulationOutput = simulate_continuous_plant_with_discrete_elem(simplifiedTF);
        //     break;
    }
    console.log(simulationOutput);
    setOutput(simulationOutput);

}

export const mergeCascadedTFBlocks = (edges: Edge[]) => {
    const result: Edge[] = [];
    const removedNodes = new Set<string>();
    const addedEdges: Edge[] = [];

    for (const edge of edges) {
        const { from, to } = edge;

        if (
            from instanceof TFNode &&
            to instanceof TFNode &&
            from.outDegree == 1 &&
            to.inDegree == 1
        ) {
            const newNode = new TFNode(
                string(Math.random()),
                'TF',
                (from.x + to.x) / 2,
                (from.y + to.y) / 2
            );

            newNode.num = convolve(from.num, to.num);
            newNode.den = convolve(from.den, to.den);

            removedNodes.add(from.id);
            removedNodes.add(to.id);
            // Add the new edges to addedEdges. Don't add to edges! We are currently iterating over it.
            reconnect(edges, from, to, newNode, addedEdges);
        }
    }

    for (const edge of edges) {
        if (
            !removedNodes.has(edge.from.id) &&
            !removedNodes.has(edge.to.id)
        ) {
            result.push(edge);
        }
    }

    return [...result, ...addedEdges];
};
const reconnect = (
    edges: Edge[],
    from: NodeBase,
    to: NodeBase,
    newNode: NodeBase,
    addedEdges: Edge[]
) => {
    for (const edge of edges) {
        if (edge.to.id == from.id) {
            addedEdges.push({
                from: edge.from,
                to: newNode,
                fromPos: edge.fromPos,
                toPos: edge.toPos
            });
        }
    }

    for (const edge of edges) {
        if (edge.from.id == to.id) {
            addedEdges.push({
                from: newNode,
                to: edge.to,
                fromPos: edge.fromPos,
                toPos: edge.toPos
            });
        }
    }
};
// export const mergeCascadedTFBlocks = (edgeList: Edge[]) => {
//     const newEdgeList: Edge[] = [...edgeList];
//     const nodesToBeRemoved: NodeBase[] = [];

//     for (let i = 0; i < edgeList.length; i++) {
//         const edge = edgeList[i];
//         const from = edge.from;
//         const to = edge.to;

//         if (from instanceof TFNode && to instanceof TFNode) {
//             if (from.outDegree === 1 && to.inDegree === 1) {
//                 const newNode = new TFNode(
//                     String(Math.random()),
//                     'TF',
//                     (from.x + to.x) / 2,
//                     (from.y + to.y) / 2
//                 );

//                 newNode.num = convolve(from.num, to.num);
//                 newNode.den = convolve(from.den, to.den);

//                 makeNewConnections(newNode, from, to, newEdgeList);

//                 newEdgeList.push({
//                     from: from,
//                     to: newNode,
//                     fromPos: 1,
//                     toPos: 3
//                 });

//                 nodesToBeRemoved.push(from, to);
//             }
//         }
//     }

//     const filteredEdgeList = newEdgeList.filter(
//         edge => !nodesToBeRemoved.includes(edge.from) && !nodesToBeRemoved.includes(edge.to)
//     );
//     return filteredEdgeList;
// };


// const makeNewConnections = (newNode: TFNode, from: TFNode, to: TFNode, edgeList: Edge[]) => {
//     for (let i = 0; i < edgeList.length; i++) {
//         const edge = edgeList[i];
//         if (edge.to == from) {
//             edgeList.push({
//                 from: edge.from,
//                 to: newNode,
//                 fromPos: edge.fromPos,
//                 toPos: edge.toPos
//             });
//         }
//     }

//     for (let i = 0; i < edgeList.length; i++) {
//         const edge = edgeList[i];
//         if (edge.from == to) {
//             edgeList.push({
//                 from: newNode,
//                 to: edge.to,
//                 fromPos: edge.fromPos,
//                 toPos: edge.toPos
//             });
//         }
//     }
// };

