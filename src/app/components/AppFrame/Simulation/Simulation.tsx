import React, { useEffect, useRef, useState } from "react";
import { Node } from "./Node";
import { atan2 } from 'mathjs';
import { DiscretePIDNode, selectionModeEnum, BlockType, InputType,  TFNode, NodeBase, SumNode, InputNode, Edge, JunctionNode } from './types';
import { graphProcessor } from "./SimulationEngine";

export const Simulation = () => {
    const canvasRef = useRef(null);
    const [nodes, setNodes] = useState<NodeBase[]>([]);

    const [edgeList, setEdgeList] = useState<Edge[]>([]);
    // { from: node, to: nodes[i], fromPos: 1, toPos: 1 }

    useEffect(() => {
        const initNodes = [
            new InputNode("i1", "Step", 100, 100, InputType.STEP, 5),
            new SumNode("i2", 280, 100, ["i1", "i4"], ["+", "-"]),
            new DiscretePIDNode("i3", "PID Ctrl", 200, 250, 2, 0.5, 0.1, 0.01),
            new TFNode("i4", "Plant", 500, 100),
        ];
        const initEdgeList = [
            { from: initNodes[0], to: initNodes[1], fromPos: 1, toPos: 3 },
            { from: initNodes[1], to: initNodes[2], fromPos: 2, toPos: 0 },
            { from: initNodes[2], to: initNodes[3], fromPos: 3, toPos: 2 },
            { from: initNodes[3], to: initNodes[1], fromPos: 3, toPos: 1 },
        ];

        initNodes[0].increaseOutDegree();
        initNodes[1].increaseInDegree();

        initNodes[1].increaseOutDegree();
        initNodes[2].increaseInDegree();

        initNodes[2].increaseOutDegree();
        initNodes[3].increaseInDegree();

        initNodes[3].increaseOutDegree();
        initNodes[1].increaseInDegree();

        setNodes(initNodes);
        setEdgeList(initEdgeList);
    }, []);

    const [selectedMode, setSelectedMode] = useState<selectionModeEnum>(selectionModeEnum.ADD_TF);

    const [connectionFrom, setConnectionFrom] = useState<NodeBase | undefined>(undefined);

    const coordfallsInShape = ({ x, y }, node) => {
        const left = node.x;
        const right = left + node.width;
        const top = node.y;
        const bottom = top + node.height;
        return x > left && x < right && y > top && y < bottom;
    }

    const getPortCoordinates = (node, position) => {
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

    const getPortsCoordinates = (node1, node2, edge) => {
        return {
            node1: getPortCoordinates(node1, edge.fromPos),
            node2: getPortCoordinates(node2, edge.toPos),
        };
    };

    const updateNodePosition = (id, newPosition) => {
        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (node.id === id) {
                    const copy = Object.create(Object.getPrototypeOf(node));
                    Object.assign(copy, node);
                    copy.x = newPosition.x;
                    copy.y = newPosition.y;
                    return copy;
                }
                return node;
            })
        );

    };

    const findNodeIfExists = (x: number, y: number) => {
        for (let i = 0; i < nodes.length; i++) {
            if (coordfallsInShape({ x: x, y: y }, nodes[i])) {
                return nodes[i];
            }
        }
        return null;
    }

    const handleCanvasOnClick = (e) => {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY;
        const node = findNodeIfExists(x, y);
        switch (selectedMode) {
            case selectionModeEnum.ADD_TF:
                if (!node) {
                    setNodes((prev) => [...prev, new TFNode(String(Math.random()), "TF", x - (TFNode.defaultWidth / 2), y - (TFNode.defaultHeight / 2))]);
                }
                break;
            case selectionModeEnum.ADD_SUM:
                if (!node) {
                    setNodes((prev) => [...prev, new SumNode(String(Math.random()), x - (SumNode.defaultWidth / 2), y - (SumNode.defaultHeight / 2), [], [])]);
                }
                break;
            case selectionModeEnum.ADD_JUNCTION:
                if (!node) {
                    setNodes((prev) => [...prev, new JunctionNode(String(Math.random()), x - (JunctionNode.defaultWidth / 2), y - (JunctionNode.defaultHeight / 2) )]);
                }
                break;                
            case selectionModeEnum.ADD_INPUT:
                if (!node) {
                    setNodes((prev) => [...prev, new InputNode(String(Math.random()), "Input", x - (InputNode.defaultWidth / 2), y - (InputNode.defaultHeight / 2), InputType.STEP, 1)]);
                }
                break;

            case selectionModeEnum.REMOVE:
                if (node) {
                    setEdgeList(prevEdges =>
                        prevEdges.filter(
                            e => e.to.id !== node.id && e.from.id !== node.id
                        )
                    );
                    setNodes(prevNodes => prevNodes.filter(n => n.id != node.id));
                }
                break;
            case selectionModeEnum.MAKE_CONNECTION:
                if (node) {
                    if (!connectionFrom) {
                        setConnectionFrom(node);
                    } else if (connectionFrom != node) {
                        let fromPos, toPos;

                        if (Math.abs(node.x - connectionFrom.x) < node.height) {
                            fromPos = node.y > connectionFrom.y ? 2 : 0;
                            toPos = node.y > connectionFrom.y ? 0 : 2;
                        }
                        else if (node.x > connectionFrom.x) {
                            fromPos = 1;
                            toPos = 3;
                        } else {
                            fromPos = 3;
                            toPos = 1;
                        }
                        setEdgeList((prev) => [...prev, { from: connectionFrom, to: node, fromPos: fromPos, toPos: toPos }]);

                        // { Update degrees }
                        setNodes(prev =>
                            prev.map(n => {
                                if (n.id === node.id) {
                                    const copy = Object.create(Object.getPrototypeOf(n));
                                    Object.assign(copy, n);
                                    copy.increaseInDegree();
                                    return copy;
                                }
                                if (n.id === connectionFrom.id) {
                                    const copy = Object.create(Object.getPrototypeOf(n));
                                    Object.assign(copy, n);
                                    copy.increaseOutDegree();
                                    return copy;
                                }
                                return n;
                            })
                        );
                        setConnectionFrom(null);
                    }
                }
                break;

        }
    }

    const getArrowPoints = (from, to, fromPos, toPos, arrowDegree = 20, length = 10) => {
        const p1 = getPortCoordinates(to, toPos);
        const p2 = getPortCoordinates(from, fromPos);
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

    return (
        <>
            <div className="w-[calc(100vw-230px)] mr-5 flex justify-between fixed bg-white z-50 pl-3">
                <div className="flex">
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white text-xm" onClick={() => setSelectedMode(selectionModeEnum.ADD_TF)}>TF</button>
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white font-bold" onClick={() => setSelectedMode(selectionModeEnum.ADD_SUM)}>&Sigma;</button>
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white font-bold" onClick={() => setSelectedMode(selectionModeEnum.ADD_INPUT)}>{'>'}</button>
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white font-bold" onClick={() => setSelectedMode(selectionModeEnum.ADD_JUNCTION)}>&#9679;</button>
                    <div className="m-1 h-10 w-1.5 bg-gray-300 w-[5px]"></div>
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white font-bold" onClick={() => setSelectedMode(selectionModeEnum.REMOVE)}>-</button>
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white " onClick={() => setSelectedMode(selectionModeEnum.MOVE)}>&#10021;</button>
                    <button className="m-1 w-10 h-10 rounded bg-gray-500 hover:bg-gray-600 text-white font-bold " onClick={() => setSelectedMode(selectionModeEnum.MAKE_CONNECTION)}>&#8702;</button>
                </div>
                <div>
                    <button className="m-1 px-5 mx-2 h-10 rounded bg-teal-500 hover:bg-teal-600 text-white " onClick={null}>Simulate</button>
                </div>

            </div>
            <div
                ref={canvasRef}
                style={{ position: "relative", width: "100vw", height: "100vh" }}
                onClick={handleCanvasOnClick}
            >
                <svg
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                >
                    {edgeList.map(edge => {
                        const from = nodes.find(n => n.id == edge.from.id);
                        const to = nodes.find(n => n.id == edge.to.id);
                        const coords = getPortsCoordinates(from, to, edge);
                        return (
                            <React.Fragment key={`${from.id}->${to.id}`}>
                                <line
                                    stroke="black"
                                    strokeWidth={2}
                                    x1={coords.node1.x}
                                    y1={coords.node1.y}
                                    x2={coords.node2.x}
                                    y2={coords.node2.y}
                                />
                                <polygon
                                    points={getArrowPoints(from, to, edge.fromPos, edge.toPos)}
                                    stroke="black"
                                    strokeWidth={3}
                                />
                            </React.Fragment>
                        )
                    })}
                </svg>

                {nodes.map(node => (
                    <Node
                        key={node.id}
                        node={node}
                        setNodes={setNodes}
                        updatePosition={(newPosition) => {
                            updateNodePosition(node.id, newPosition);
                        }}
                        canvasRef={canvasRef}
                        selectedMode={selectedMode}
                        edgeList={edgeList}
                    />
                ))}

            </div>
        </>
    );

};
