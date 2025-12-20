import { DiscretePID, Display, Edge, Generator, NodeBase, FSFilter } from './NodeTypes';
import { Plant } from './NodeTypes/Plant';
import { Signal } from './NodeTypes/Signal';

export const simulate = (nodes: NodeBase[], edges: Edge[], setNodes: any, Ts = 0.01, simulationSteps = 100, setSimFinishTrigger) => {
    validate(nodes, edges);
    const topo = topoSort(nodes, edges);
    if (!topo) throw new Error("A cycle was found in the graph.");

    // Init nodes
    init(nodes);
    setTs(nodes, Ts);

    // Compute parent nodes
    const parents = new Map<NodeBase, NodeBase[]>();
    for (const edge of edges) {
        if (!parents.has(edge.to)) parents.set(edge.to, []);
        parents.get(edge.to)!.push(edge.from);
    }

    // Simulation loop
    const output = new Map<NodeBase, any>();

    for (let step = 0; step < simulationSteps; step++) {
        // Compute outputs in topological order
        for (const node of topo) {
            const parentList = parents.get(node) || [];
            const input: Signal[] = [];

            // Collect parent outputs
            for (const parent of parentList) {
                const parentOutput = output.get(parent);
                if (parentOutput) input.push(parentOutput);
            }

            // Compute node output based on type
            let nodeOutput: Signal;
            console.log("Executing: " + node.id + " with input: " + input.map(e => String(e.y)).join(','));
            nodeOutput = node.execute(input);
            console.log("Output: " + nodeOutput.y);
            output.set(node, nodeOutput);
        }
    }
    // shallow copy causes rerender
    setNodes([...nodes]);
    setSimFinishTrigger((_) => true);
    return output;
};

function validate(nodes: NodeBase[], edges: Edge[]) {
    // Only one continuous Plant allowed
    let numOfPlants = nodes.filter(n => n instanceof Plant).length;
    if (numOfPlants > 1) throw new Error("Only one continuous plant is allowed.");

    // Display and DiscretePID should only have one input
    nodes.forEach(n => {
        if ((n instanceof Display || n instanceof DiscretePID) && n.inDegree > 1) {
            throw new Error(`${n.constructor.name} should only have one input.`);
        }
    });
}

function topoSort(nodes: NodeBase[], edges: Edge[]): NodeBase[] | null {
    const adjList = edgeListToAdjList(nodes, edges);

    const inDegree = new Map<NodeBase, number>();
    for (const node of nodes) inDegree.set(node, 0);
    for (const edge of edges) {
        if (!(edge.from.displayName != "Plant")) {
            inDegree.set(edge.to, inDegree.get(edge.to)! + 1);
        }
    }

    const queue: NodeBase[] = [];
    for (const node of nodes) if (inDegree.get(node) === 0) queue.push(node);

    const order: NodeBase[] = [];
    while (queue.length > 0) {
        const node = queue.shift()!;
        order.push(node);

        for (const next of adjList.get(node)!) {
            const deg = inDegree.get(next)! - 1;
            inDegree.set(next, deg);
            if (deg == 0) queue.push(next);
        }
    }

    return order.length == nodes.length ? order : null;
}

function edgeListToAdjList(nodes: NodeBase[], edges: Edge[]): Map<NodeBase, NodeBase[]> {
    const adjList = new Map<NodeBase, NodeBase[]>();
    for (const node of nodes) adjList.set(node, []);
    for (const edge of edges) adjList.get(edge.from)!.push(edge.to);
    return adjList;
}

const init = (nodes) => {
    nodes.forEach(node => {
        if (typeof node.init == "function") {
            node.init();
        }
    })
}

const setTs = (nodes, Ts) => {
    nodes.forEach(node => {
        if (typeof node.setTs == "function") { node.setTs(Ts) } ''
    });
}