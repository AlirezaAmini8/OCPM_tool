import React, { useState } from 'react';
import { Network } from 'vis-network/standalone';
const DotGraphVisualization = ({ dotString }) => {
    // Parse the DOT string into a format suitable for the graph
    const parseDotToGraphData = (dotString) => {
        const nodes = [];
        const edges = [];
        const lines = dotString.split('\n');

        // Default graph attributes
        let rankdir = 'LR';

        lines.forEach(line => {
            const trimmedLine = line.trim();

            // Parse graph attributes
            if (trimmedLine.startsWith('rankdir=')) {
                rankdir = trimmedLine.split('=')[1].replace(/["\s]/g, '');
            }

            // Parse node definition with all attributes
            const nodeMatch = trimmedLine.match(/^"([^"]+)"\s*\[(.*)\]$/);
            if (nodeMatch) {
                const nodeId = nodeMatch[1];
                const attributes = parseAttributes(nodeMatch[2]);

                nodes.push({
                    id: nodeId,
                    label: (attributes.label || nodeId).replace(/\\n/g, '\n'),
                    shape: attributes.shape || 'box',
                    color: {
                        background: attributes.fillcolor || attributes.color || '#C0C0FF',
                        border: '#2B7CE9'
                    },
                    font: {
                        color: attributes.fontcolor || '#000000',
                        size: parseInt(attributes.fontsize) || 14,
                        multi: true
                    }
                });
            }

            // Parse edge definition with all attributes
            const edgeMatch = trimmedLine.match(/^"([^"]+)"\s*->\s*"([^"]+)"\s*\[(.*)\]$/);
            if (edgeMatch) {
                const from = edgeMatch[1];
                const to = edgeMatch[2];
                const attributes = parseAttributes(edgeMatch[3]);

                edges.push({
                    id: from+to,
                    from: from,
                    to: to,
                    label: attributes.label || '',
                    color: {
                        color: attributes.color || '#DC167D',
                        inherit: false
                    },
                    font: {
                        color: attributes.fontcolor || '#DC167D',
                        size: parseInt(attributes.fontsize) || 8
                    },
                    width: parseFloat(attributes.penwidth) || 1,
                    arrows: {
                        to: {
                            enabled: true,
                            scaleFactor: 0.5
                        }
                    }
                });
            }
        });

        return { nodes, edges, rankdir };
    };

    // Helper function to parse DOT attributes string into object
    const parseAttributes = (attributesStr) => {
        const attributes = {};
        const pairs = attributesStr.match(/(\w+)=(?:"([^"]*)"|\w+)/g) || [];

        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            attributes[key] = value.replace(/"/g, '');
        });

        return attributes;
    };

    const { nodes, edges, rankdir } = parseDotToGraphData(dotString);
    const networkRef = React.useRef(null);

    React.useEffect(() => {
        const container = document.getElementById('network');

        const data = {
            nodes: nodes,
            edges: edges
        };

        const options = {
            nodes: {
                shape: 'box',
                margin: 10,
                widthConstraint: {
                    minimum: 50,
                    maximum: 200
                },
                font: {
                    multi: true
                }
            },
            edges: {
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5
                    }
                },
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: rankdir,
                    sortMethod: 'directed',
                    nodeSpacing: 150,
                    levelSeparation: 150
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                zoomView: true,
                hover: true
            }
        };

        if (container) {
            networkRef.current = new Network(container, data, options);
        }

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
            }
        };
    }, [nodes, edges, rankdir]);

    return (
        <div id="network" style={{ width: '100%', height: '800px', border: '1px solid #ddd' }} />
    );
};

export default DotGraphVisualization;