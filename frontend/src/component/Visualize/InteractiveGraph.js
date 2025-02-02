import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import graphlibDot from "graphlib-dot";

const InteractiveGraph = ({ dotString }) => {
    const svgRef = useRef();

    useEffect(() => {
        const graph = graphlibDot.read(dotString); // Parse the DOT string

        // Convert nodes and edges
        const nodes = graph.nodes().map((node) => ({
            id: node,
            ...graph.node(node),
            fx: null,
            fy: null
        }));

        const links = graph.edges().map((edge) => ({
            source: edge.v,
            target: edge.w,
            ...graph.edge(edge)
        }));

        const width = 1000;
        const height = 600;

        // Clear the previous content of the SVG
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .call(d3.zoom().on("zoom", ({ transform }) => {
                g.attr("transform", transform);
            }));

        const g = svg.append("g");

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force("collision", d3.forceCollide().radius(30));

        svg.append("defs").selectAll("marker")
            .data(["arrow"])
            .enter().append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 20)
            .attr("refY", 5)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "#2197E0");

        // Create links (edges)
        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", d => d.color || "#2197E0")
            .attr("stroke-width", d => d.penwidth ? d.penwidth * 1.2 : 1)
            .attr("marker-end", "url(#arrow)");

        // Create node groups
        const nodeGroup = g.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g");

        nodeGroup.each(function(d) {
            const node = d3.select(this);
            const size = 20;

            if (d.shape === "box") {
                node.append("rect")
                    .attr("width", size * 2)
                    .attr("height", size)
                    .attr("x", -size)
                    .attr("y", -size / 2)
                    .attr("fill", d.fillcolor || "#B0B0FF")
                    .attr("stroke", "#666")
                    .attr("stroke-width", 1);
            } else if (d.shape === "ellipse") {
                node.append("circle")
                    .attr("r", size / 2)
                    .attr("fill", d.fillcolor || "#B0B0FF")
                    .attr("stroke", "#666")
                    .attr("stroke-width", 1);
            } else if (d.shape === "underline") {
                node.append("path")
                    .attr("d", `M${-size},${size / 4} L${size},${size / 4}`)
                    .attr("stroke", d.fontcolor || "#2197E0")
                    .attr("stroke-width", 2);
            } else {
                node.append("circle")
                    .attr("r", size / 2)
                    .attr("fill", d.fillcolor || "#B0B0FF")
                    .attr("stroke", "#666")
                    .attr("stroke-width", 1);
            }
        });

        // Dragging functionality
        nodeGroup.call(d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
            }));

        // Labels for nodes
        nodeGroup.append("text")
            .text(d => d.label || d.id)
            .attr("font-size", "12px")
            .attr("text-anchor", "middle")
            .attr("dy", d => d.shape === "underline" ? "20" : "0")
            .attr("fill", d => d.fontcolor || "black");

        // Labels for edges
        const edgeLabels = g.append("g")
            .selectAll("text")
            .data(links)
            .enter().append("text")
            .text(d => d.label || "")
            .attr("font-size", d => d.fontsize ? `${d.fontsize}px` : "8px")
            .attr("fill", d => d.fontcolor || "#2197E0")
            .attr("text-anchor", "middle");

        // Simulation tick to update the positions
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeGroup
                .attr("transform", d => `translate(${d.x},${d.y})`);

            edgeLabels
                .attr("x", d => (d.source.x + d.target.x) / 2)
                .attr("y", d => (d.source.y + d.target.y) / 2 - 5);
        });
    }, [dotString]);

    return <svg ref={svgRef} width="100%" height="600"></svg>;
};

export default InteractiveGraph;
