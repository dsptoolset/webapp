import { useState } from "react";
import ReactDOM from "react-dom";
import { BlockType, InputType } from './types';
import { InputNode, SumNode, TFNode } from "./types";

export const NodeConfigurePopup = ({ isOpen, onClose, incomingPorts, node, setNodes }) => {
    const [blockType, setBlockType] = useState<BlockType | undefined>();
    const [num, setNum] = useState("");
    const [den, setDen] = useState("");
    const [sumSelections, setSumSelections] = useState({});
    const [signalValue, setSignalValue] = useState("");

    if (!isOpen) return null;

    const handleSumChange = (node, value) => {
        setSumSelections(prev => ({ ...prev, [node]: value }));
    };

    return ReactDOM.createPortal(
        <div style={styles.overlay}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}>
            <div style={styles.modal}>
                {/* TFNode Fields */}
                {node instanceof TFNode && (
                    <div style={styles.tfFields}>
                        <input
                            type="text"
                            placeholder="Numerator (num)"
                            value={num}
                            onChange={(e) => setNum(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Denominator (den)"
                            value={den}
                            onChange={(e) => setDen(e.target.value)}
                        />
                    </div>
                )}

                {/* SumNode Fields */}
                {node instanceof SumNode && (
                    <div style={styles.sumFields}>
                        {incomingPorts.map((port) => (
                            <div key={port.id} style={{ marginBottom: 8 }}>
                                <label>{port.id}: </label>
                                <select
                                    value={sumSelections[port.id] || "+"}
                                    onChange={(e) => handleSumChange(port, e.target.value)}
                                >
                                    <option value="+">+</option>
                                    <option value="-">-</option>
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* SignalGen Fields */}
                {node instanceof InputNode && (
                    <div>
                        <input
                            type="text"
                            placeholder="Value"
                            value={signalValue}
                            onChange={(e) => setSignalValue(e.target.value)}
                        />
                    </div>
                )}

                {/* Buttons */}
                <div style={styles.buttonRow}>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        Cancel
                    </button>
                    <button onClick={() => {
                        setNodes((prevNodes) => {
                            const filtered = prevNodes.filter((n) => n.id !== node.id);
                            let newNode;
                            switch (blockType) {
                                case BlockType.TF:
                                    newNode = new TFNode(
                                        node.id,
                                        node.displayName,
                                        node.x,
                                        node.y,
                                        num.split(" "),
                                        den.split(" ")
                                    );
                                    break;

                                // case BlockType.SumNode:
                                //     newNode = new SumNode(
                                //         node.id,
                                //         node.displayName,
                                //         node.x,
                                //         node.y,
                                //         sumSelections. // assuming sumSelections is an object mapping ports to '+' or '-'
                                //     );
                                //     break;

                                case BlockType.INPUT:
                                    newNode = new InputNode(
                                        node.id,
                                        node.displayName,
                                        node.x,
                                        node.y,
                                        InputType.STEP,
                                        Number(signalValue)
                                    );
                                    break;
                            }

                            return [...filtered, newNode];
                        });
                        // Handle submit logic here
                        console.log({ blockType, num, den, sumSelections, signalValue });
                        onClose();
                    }}>Submit</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const styles: {
    overlay: React.CSSProperties;
    modal: React.CSSProperties;
    buttonRow: React.CSSProperties;
    tfFields: React.CSSProperties;
    sumFields: React.CSSProperties;
} = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    },
    modal: {
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        width: 400,
    },
    buttonRow: {
        marginTop: 20,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
    },
    tfFields: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 10,
    },
    sumFields: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 10,
    },
};
