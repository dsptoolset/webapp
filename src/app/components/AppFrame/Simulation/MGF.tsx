import { convolve } from "../../core";
import { NodeBase, EdgeGain } from "./types";
import { combinations } from "../../core/math";

// receives signalFlowGraph as adj. list 
export const applyMasonsRule = (
    start: NodeBase,
    end: NodeBase,
    signalFlowGraph: Map<NodeBase, { target: NodeBase; gain: EdgeGain }[]>
): EdgeGain => {

    // 1️⃣ Forward paths
    const forwardPaths = getForwardPaths(start, end, signalFlowGraph);
    const forwardGains: EdgeGain[] = [];

    for (const path of forwardPaths) {
        let gain: EdgeGain = { num: [1], den: [1] };
        for (let i = 0; i < path.length - 1; i++) {
            const edges = signalFlowGraph.get(path[i]) || [];
            const edge = edges.find(e => e.target.id === path[i + 1].id);
            if (!edge) throw new Error("Edge not found");
            gain = multiplyTF(gain, edge.gain);
        }
        forwardGains.push(gain);
    }

    // 2️⃣ Loops
    const allCycles = findAllCycles(signalFlowGraph);
    const allLoopGains: EdgeGain[] = allCycles.map(loop => {
        let gain: EdgeGain = { num: [1], den: [1] };
        for (let i = 0; i < loop.length; i++) {
            const from = loop[i];
            const to = loop[(i + 1) % loop.length];
            const edge = (signalFlowGraph.get(from) || [])
                .find(e => e.target.id === to.id);
            if (!edge) throw new Error("Loop edge not found");
            gain = multiplyTF(gain, edge.gain);
        }
        return gain;
    });

    // 3️⃣ Δ
    const delta = computeDelta(allCycles, allLoopGains);

    // 4️⃣ Numerator Σ Pk Δk
    let numerator: EdgeGain = { num: [0], den: [1] };

    for (let i = 0; i < forwardPaths.length; i++) {
        const deltaK = computeDeltaK(
            forwardPaths[i],
            allCycles,
            allLoopGains
        );
        const term = multiplyTF(forwardGains[i], deltaK);
        numerator = addTF(numerator, term);
    }

    // 5️⃣ Final result
    return divideTF(numerator, delta);
};


// Compute Delta (or Delta_k) using inclusion–exclusion
function computeDelta(allCycles: NodeBase[][], allLoopGains: EdgeGain[]): EdgeGain {
    let delta: EdgeGain = { num: [1], den: [1] };
    const n = allCycles.length;

    for (let r = 1; r <= n; r++) {
        const combs = combinations(n, r);
        for (let comb of combs) {
            if (hasTouchingNodes(allCycles, comb)) continue;

            const gains = comb.map(i => allLoopGains[i]);
            const prod = multiplyGains(gains);
            // Inclusion-exclusion sign
            const sign = r % 2 == 1 ? -1 : 1;
            delta.num = convolve(delta.num, [sign]).map((v, i) => v + (prod.num[i] || 0));
            delta.den = convolve(delta.den, [1]);
        }
    }

    return delta;
}

const hasTouchingNodes = (allCycles, comp) => {
    const s = new Set<NodeBase>();
    for(let i = 0; i < allCycles[comp[0]].length; i++)
    {
        s.add(allCycles[comp[i]]);
    }
}

function computeDeltaK(
    forwardPath: NodeBase[],
    allCycles: NodeBase[][],
    allLoopGains: EdgeGain[]
): EdgeGain {

    // 1️⃣ Keep only loops that do NOT touch the forward path
    const eligibleLoops: NodeBase[][] = [];
    const eligibleGains: EdgeGain[] = [];

    for (let i = 0; i < allCycles.length; i++) {
        const loop = allCycles[i];
        const touchesPath = loop.some(
            ln => forwardPath.some(pn => pn.id === ln.id)
        );
        if (!touchesPath) {
            eligibleLoops.push(loop);
            eligibleGains.push(allLoopGains[i]);
        }
    }

    // 2️⃣ Δₖ is just Δ of the remaining loops
    return computeDelta(eligibleLoops, eligibleGains);
}


function multiplyGains(gains: EdgeGain[]): EdgeGain {
    return gains.reduce(
        (acc, g) => ({
            num: convolve(acc.num, g.num),
            den: convolve(acc.den, g.den),
        }),
        { num: [1], den: [1] }
    );
}

// function hasCommonNode(allCycles, combs) {
//     for (let i = 0; i < combs.length; i++)
//     {
//         const cycles = allCycles
//     }
//   let s = new Set();
//   for (let i = 0; i < cycles[]; i++) {
//     common.add(first[i]);
//   }

//   // Intersect with each remaining path
//   for (let i = 1; i < paths.length; i++) {
//     const current = new Set();
//     const nodes = paths[i].split("->");
//     for (let j = 0; j < nodes.length; j++) {
//       current.add(nodes[j]);
//     }

//     // Remove nodes not present in current set
//     for (const node of common) {
//       if (!current.has(node)) {
//         common.delete(node);
//       }
//     }

//     // Early exit
//     if (common.size === 0) {
//       return false;
//     }
//   }

//   return true;
// }


const getForwardPaths = (
    start: NodeBase,
    end: NodeBase,
    graph: Map<NodeBase, { target: NodeBase; gain: EdgeGain }[]>
) => {
    const paths: NodeBase[][] = [];

    const helper = (
        node: NodeBase,
        visited: Set<string>,
        path: NodeBase[]
    ) => {
        visited.add(node.id);
        path.push(node);

        if (node.id == end.id) {
            paths.push([...path]);
        } else {
            const neighbors = graph.get(node) || [];
            for (let i = 0; i < neighbors.length; i++) {
                const targetNode = neighbors[i].target;
                if (!visited.has(targetNode.id)) {
                    helper(targetNode, visited, path);
                }
            }

        }
        path.pop();
        visited.delete(node.id);
    };

    helper(start, new Set(), []);
    return paths;
};

// first finds the node with the smallest id, then reconstruct the cycle starting from the smallest id
// the key is generated from this cycle.
// this is the correct approach. simply sorting the id and creating a string is not correct. A-B-C-D and A-C-B-D gives the same key if relying on simply sorting. 
const cycleKey = (cycle: NodeBase[]): string => {
    let minId = 0;
    for (let i = 1; i < cycle.length; i++) {
        if (cycle[i].id < cycle[minId].id) {
            minId = i;
        }
    }

    const res = [...cycle.slice(minId), ...cycle.slice(0, minId)];
    return res.map(n => n.id).join("->");
}

function findAllCycles(graph: Map<NodeBase, { target: NodeBase; gain: EdgeGain }[]>): NodeBase[][] {
    const cycles: NodeBase[][] = [];
    const visited = new Set<NodeBase>();
    const stack: NodeBase[] = [];
    const cycleWasPrevFound = new Set<string>();


    function dfs(node: NodeBase, start: NodeBase) {
        visited.add(node);
        stack.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            if (neighbor.target.id == start.id) {
                // only detect add it to cycles if it's unique
                const key = cycleKey(stack);
                if (!cycleWasPrevFound.has(key)) {
                    cycleWasPrevFound.add(key);
                    cycles.push([...stack]);
                }
            } else if (!visited.has(neighbor.target)) {
                dfs(neighbor.target, start);
            }
        }

        stack.pop();
        visited.delete(node);
    }

    for (const node of Array.from(graph.keys())) {
        dfs(node, node);
    }

    return cycles;
}

function addTF(a: EdgeGain, b: EdgeGain): EdgeGain {
    const num1 = convolve(a.num, b.den);
    const num2 = convolve(b.num, a.den);
    const den = convolve(a.den, b.den);

    const len = Math.max(num1.length, num2.length);
    const num = Array(len).fill(0);
    for (let i = 0; i < len; i++) {
        num[i] = (num1[i] || 0) + (num2[i] || 0);
    }
    return { num, den };
}

function multiplyTF(a: EdgeGain, b: EdgeGain): EdgeGain {
    return {
        num: convolve(a.num, b.num),
        den: convolve(a.den, b.den),
    };
}

function divideTF(a: EdgeGain, b: EdgeGain): EdgeGain {
    return {
        num: convolve(a.num, b.den),
        den: convolve(a.den, b.num),
    };
}
