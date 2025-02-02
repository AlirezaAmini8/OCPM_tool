import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import graphlibDot from "graphlib-dot";

const GraphRenderer = ({ dotString }) => {
    const svgRef = useRef();
    const simulationRef = useRef(null);

    useEffect(() => {
        if (!dotString) return;

        try {
            const graph = graphlibDot.read(dotString);
            const nodes = graph.nodes().map(node => ({
                id: node,
                ...graph.node(node),
                fx: null,
                fy: null
            }));

            const links = graph.edges().map(edge => ({
                source: edge.v,
                target: edge.w,
                ...graph.edge(edge)
            }));

            const width = 1200;
            const height = 800;

            // Clear previous render
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();

            // Set up zoom
            const zoom = d3.zoom()
                .scaleExtent([0.5, 5])
                .on("zoom", ({ transform }) => {
                    g.attr("transform", transform);
                });

            svg.attr("viewBox", [0, 0, width, height])
                .call(zoom);

            const g = svg.append("g");

            // Arrow marker definition
            svg.append("defs").selectAll("marker")
                .data(["arrow"])
                .enter().append("marker")
                .attr("id", "arrow")
                .attr("viewBox", "0 0 10 10")
                .attr("refX", 25)
                .attr("refY", 5)
                .attr("markerWidth", 8)
                .attr("markerHeight", 8)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M 0 0 L 10 5 L 0 10 z")
                .attr("fill", "#DC167D");

            // Force simulation
            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links)
                    .id(d => d.id)
                    .distance(d => d.distance || 150)
                )
                .force("charge", d3.forceManyBody().strength(-500))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collide", d3.forceCollide().radius(40));

            simulationRef.current = simulation;

            // Draw links
            const link = g.append("g")
                .selectAll(".link")
                .data(links)
                .enter().append("line")
                .attr("class", "link")
                .attr("stroke", d => d.color || "#DC167D")
                .attr("stroke-width", d => (d.penwidth || 1) * 2)
                .attr("marker-end", "url(#arrow)");

            // Draw nodes
            const nodeGroup = g.append("g")
                .selectAll(".node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .call(d3.drag()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded)
                );

            nodeGroup.each(function(d) {
                const node = d3.select(this);
                const baseSize = 30;

                // Handle different node shapes
                if (d.shape === "box") {
                    node.append("rect")
                        .attr("width", baseSize * 2)
                        .attr("height", baseSize)
                        .attr("x", -baseSize)
                        .attr("y", -baseSize/2)
                        .attr("fill", d.fillcolor || "#C0C0FF")
                        .attr("stroke", "#333");
                }
                else if (d.shape === "underline") {
                    node.append("text")
                        .attr("dy", "0.3em")
                        .style("text-decoration", "underline")
                        .style("font-size", "12px")
                        .text(d.label);
                }
                else { // Default ellipse
                    node.append("circle")
                        .attr("r", baseSize)
                        .attr("fill", d.fillcolor || "#C0C0FF")
                        .attr("stroke", "#333");
                }

                // Node label
                node.append("text")
                    .text(d.label || d.id)
                    .attr("dy", d => d.shape === "underline" ? "1.2em" : "0.3em")
                    .attr("font-size", "10px")
                    .attr("fill", d.fontcolor || "#333")
                    .attr("text-anchor", "middle");
            });

            // Edge labels
            const edgeLabels = g.append("g")
                .selectAll(".edge-label")
                .data(links)
                .enter().append("text")
                .attr("class", "edge-label")
                .text(d => d.label)
                .attr("font-size", d => `${d.fontsize || 8}px`)
                .attr("fill", d => d.fontcolor || "#DC167D")
                .attr("text-anchor", "middle");

            // Simulation handler
            simulation.on("tick", () => {
                link.attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);

                edgeLabels.attr("x", d => (d.source.x + d.target.x)/2)
                    .attr("y", d => (d.source.y + d.target.y)/2 - 5);
            });

        } catch (error) {
            console.error("Graph rendering error:", error);
        }

        return () => {
            if (simulationRef.current) simulationRef.current.stop();
        };
    }, [dotString]);

    // Drag handlers
    const dragStarted = (event, d) => {
        if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
        d.fx = event.x;
        d.fy = event.y;
    };

    const dragged = (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    };

    const dragEnded = (event, d) => {
        if (!event.active) simulationRef.current.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    };

    return <svg ref={svgRef} width="100%" height="800" style={{ border: "1px solid #ccc" }} />;
};

export default GraphRenderer;