import React, { useState } from 'react';
import { Zoom } from '@visx/zoom';
import { Group } from '@visx/group';

const parseGraphContent = (content) => {
    const SCALE_FACTOR = 50;
    const rawLines = content.split('\n');
    const lines = [];
    let currentLine = '';

    for (const line of rawLines) {
        if (line.startsWith('graph ') || line.startsWith('node ') ||
            line.startsWith('edge ') || line.startsWith('stop')) {
            if (currentLine) lines.push(currentLine);
            currentLine = line;
        } else {
            currentLine += ' ' + line.trim();
        }
    }
    if (currentLine) lines.push(currentLine);

    const nodes = [];
    const edges = [];
    let graphWidth = 0;
    let graphHeight = 0;

    lines.forEach(line => {
        const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

        if (parts[0] === 'graph') {
            graphWidth = parseFloat(parts[1]) * SCALE_FACTOR;
            graphHeight = parseFloat(parts[2]) * SCALE_FACTOR;
        } else if (parts[0] === 'node') {
            const id = parts[1].slice(1, -1);
            const x = parseFloat(parts[2]) * SCALE_FACTOR;
            const y = parseFloat(parts[3]) * SCALE_FACTOR;
            const width = parseFloat(parts[4]) * SCALE_FACTOR;
            const height = parseFloat(parts[5]) * SCALE_FACTOR;

            // Find the label
            let labelPart = parts.slice(6).join(" "); // Join parts after the first 5 as the label
            let label = labelPart.includes('\n') ? labelPart : labelPart.split('"').slice(1, -1).join(' ');  // Handle multi-line or single-line labels

            // Handle start and end nodes
            const isStartNode = label.includes("start");
            const isEndNode = label.includes("end");

            // Handle node style attributes (e.g., color, font, fill)
            const fontColor = parts.find(p => p.startsWith('#')) || 'black';
            const fillColor = parts[parts.indexOf(fontColor) + 1] || 'white'; // After font color, if exists, is fill color

            // Handle shape, solid, filled, etc.
            const filledIndex = parts.indexOf('filled');
            const solidIndex = parts.indexOf('solid');
            const boxIndex = parts.indexOf('box');
            const ellipseIndex = parts.indexOf('ellipse');

            const shape = parts.includes('box') ? 'box' :
                parts.includes('ellipse') ? 'ellipse' : 'default';

            const isFilled = parts.includes('filled');
            const isUnderlined = parts.includes('underline');

            nodes.push({
                id,
                x,
                y,
                width,
                height,
                label,
                fontColor,
                fillColor,
                shape,
                isFilled,
                isUnderlined,
                isStartNode,
                isEndNode,
            });
        } else if (parts[0] === 'edge') {
            const source = parts[1].slice(1, -1);
            const target = parts[2].slice(1, -1);

            // Find edge color
            const color = parts.find(p => p.startsWith('#')) || '#000';

            // Find edge label (in quotes)
            const labelPart = parts.find(p => p.startsWith('"') && p.includes('UO='));
            const label = labelPart ? labelPart.slice(1, -1) : '';

            // Collect points (numeric values before the color)
            const pointsCount = parseInt(parts[3]);
            const points = parts.slice(4, 4 + pointsCount * 2).map(parseFloat);

            edges.push({
                source,
                target,
                color,
                label,
                points,
                pointsCount
            });
        }
    });

    return { nodes, edges, graphWidth, graphHeight };
};

const GraphVisualizer = ({ content }) => {
    const { nodes: initialNodes, edges, graphWidth, graphHeight } = parseGraphContent(content);
    const [nodes, setNodes] = useState(initialNodes);
    const [draggingId, setDraggingId] = useState(null);

    const handleMouseDown = (id) => {
        setDraggingId(id);
    };

    const handleMouseMove = (event) => {
        if (draggingId) {
            setNodes(nodes.map(node => {
                if (node.id === draggingId) {
                    return {
                        ...node,
                        x: node.x + event.movementX,
                        y: node.y + event.movementY,
                    };
                }
                return node;
            }));
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    const renderSelfReferenceEdge = (node, edge) => {
        const offsetX = node.width / 2;
        const offsetY = node.height / 2;

        const startX = node.x + offsetX;
        const startY = node.y;
        const endX = startX + offsetX;
        const endY = startY;

        return (
            <React.Fragment key={`self-${node.id}`}>
                <path
                    d={`M${startX},${startY} 
                        C${startX + offsetX},${startY - offsetY} 
                        ${endX + offsetX},${endY - offsetY} 
                        ${endX},${endY}`}
                    fill="none"
                    stroke={edge.color}
                    strokeWidth={2}
                    markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                    <text
                        x={startX + offsetX}
                        y={startY - offsetY / 2}
                        textAnchor="middle"
                        fontSize={10}
                        fill={edge.color}
                    >
                        {edge.label}
                    </text>
                )}
            </React.Fragment>
        );
    };

    const calculateEdgePoints = (sourceNode, targetNode) => {
        const sourceCenter = {
            x: sourceNode.x + sourceNode.width/2,
            y: sourceNode.y + sourceNode.height/2
        };

        const targetCenter = {
            x: targetNode.x + targetNode.width/2,
            y: targetNode.y + targetNode.height/2
        };

        const dx = targetCenter.x - sourceCenter.x;
        const dy = targetCenter.y - sourceCenter.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return { startX: 0, startY: 0, endX: 0, endY: 0 };

        const ux = dx / length;
        const uy = dy / length;

        const startX = sourceCenter.x + ux * (sourceNode.width/2);
        const startY = sourceCenter.y + uy * (sourceNode.height/2);
        const endX = targetCenter.x - ux * (targetNode.width/2);
        const endY = targetCenter.y - uy * (targetNode.height/2);

        return { startX, startY, endX, endY };
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            <Zoom
                width={graphWidth}
                height={graphHeight}
                scaleXMin={0.1}
                scaleXMax={10}
                scaleYMin={0.1}
                scaleYMax={10}
            >
                {(zoom) => (
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
                            </marker>
                        </defs>

                        <Group transform={zoom.toString()}>
                            {edges
                                .filter(edge => edge.source === edge.target)
                                .map(edge => {
                                    const sourceNode = nodes.find(n => n.id === edge.source);
                                    return sourceNode
                                        ? renderSelfReferenceEdge(sourceNode, edge)
                                        : null;
                                })
                            }

                            {edges
                                .filter(edge => edge.source !== edge.target)
                                .map((edge, i) => {
                                    const sourceNode = nodes.find(n => n.id === edge.source);
                                    const targetNode = nodes.find(n => n.id === edge.target);
                                    if (!sourceNode || !targetNode) return null;

                                    const { startX, startY, endX, endY } = calculateEdgePoints(sourceNode, targetNode);

                                    return (
                                        <React.Fragment key={i}>
                                            <line
                                                x1={startX}
                                                y1={startY}
                                                x2={endX}
                                                y2={endY}
                                                stroke={edge.color}
                                                strokeWidth={2}
                                                markerEnd="url(#arrowhead)"
                                            />
                                            {edge.label && (
                                                <text
                                                    x={(startX + endX) / 2}
                                                    y={(startY + endY) / 2}
                                                    textAnchor="middle"
                                                    fontSize={10}
                                                    fill={edge.color}
                                                >
                                                    {edge.label}
                                                </text>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                            {nodes.map((node) => {
                                const NodeShape = node.shape === 'ellipse'
                                    ? (props) => <ellipse {...props} />
                                    : (props) => <rect {...props} rx={5} />;

                                return (
                                    <Group
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        onMouseDown={() => handleMouseDown(node.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <NodeShape
                                            width={node.width}
                                            height={node.height}
                                            fill={node.fillColor}
                                            stroke={node.fontColor}
                                            strokeWidth={1}
                                            opacity={node.isFilled ? 1 : 0.5}
                                            strokeDasharray={node.isUnderlined ? '5,5' : 'none'}
                                        />
                                        <text
                                            x={node.width/2}
                                            y={node.height/2}
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            fontSize={10}
                                            fill={node.fontColor}
                                            fontStyle={node.isUnderlined ? 'italic' : 'normal'}
                                        >
                                            {node.label.split('\n').map((line, i) => (
                                                <tspan key={i} x={node.width/2} dy={i ? '1.2em' : 0}>
                                                    {line}
                                                </tspan>
                                            ))}
                                        </text>
                                    </Group>
                                );
                            })}
                        </Group>
                    </svg>
                )}
            </Zoom>
        </div>
    );
};

export default GraphVisualizer;
