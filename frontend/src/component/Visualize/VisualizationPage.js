import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Typography,
    Button,
    Container,
    Alert,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Menu,
    Checkbox,
    IconButton,
    CircularProgress,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestoreIcon from '@mui/icons-material/Restore';
import InteractiveGraph from './InteractiveGraph';
import GraphVisualizer from "./GraphVisualizer";
import DotGraphVisualization from "./DotGraphVisualization";
import GraphRenderer from "./GraphRenderer";

const VisualizationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const graphContainerHtml = useRef(null);
    const graphContainerSvg = useRef(null);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1);
    const [loading, setLoading] = useState(false);


    // Filter states
    const [activityPercent, setActivityPercent] = useState(10);
    const [pathPercent, setPathPercent] = useState(10);
    const [visualizationType, setVisualizationType] = useState('ocdfg');
    const [annotationType, setAnnotationType] = useState('unique_objects');
    const [orientation, setOrientation] = useState('horizontal');
    const { graph, objects, file_metadata_id } = location.state || {};
    const [selectedObjects, setSelectedObjects] = useState(objects || []);
    const [exportFormat, setExportFormat] = useState('svg');
    const [finalFormat, setFinalFormat] = useState('svg');

    // State for managing the dropdown open/close
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);


    const handleZoomIn = () => {
        setScale(prevScale => Math.min(5, prevScale + 0.1));
    };

    const handleZoomOut = () => {
        setScale(prevScale => Math.max(0.1, prevScale - 0.1));
    };

    const handleResetZoom = () => {
        setScale(1);
    };

    const handleWheel = (e) => {
        if (e.ctrlKey) {  // Только если клавиша Ctrl зажата
            e.preventDefault();
            const delta = e.deltaY;
            const zoomFactor = 0.1;

            setScale(prevScale => {
                const newScale = delta > 0
                    ? Math.max(0.1, prevScale - zoomFactor)
                    : Math.min(5, prevScale + zoomFactor);
                return newScale;
            });
        }
    };
    const handleFormatChange = (event) => {
        setExportFormat(event.target.value);
    };

    // Handler for opening the dropdown
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Handler for closing the dropdown
    const handleClose = () => {
        setAnchorEl(null);
    };

    // Handler for checkbox changes
    const handleObjectSelection = (object) => {
        setSelectedObjects((prevSelected) =>
            prevSelected.includes(object)
                ? prevSelected.filter((item) => item !== object)
                : [...prevSelected, object]
        );
    };

    // Filter handlers
    const handleActivityPercentChange = (event, newValue) => {
        setActivityPercent(newValue);
    };

    const handleEdgePercentChange = (event, newValue) => {
        setPathPercent(newValue);
    };

    const handleVisualizationTypeChange = (event) => {
        setVisualizationType(event.target.value);
    };

    const handleAnnotationTypeChange = (event) => {
        setAnnotationType(event.target.value);
    };

    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    };

    // Handler for applying filters
    const handleApplyFilters = () => {
        const unselectedObjects = objects.filter((object) => !selectedObjects.includes(object));

        setLoading(true);

        axios
            .post('http://localhost:8000/filters/', {
                activityPercent,
                pathPercent,
                visualizationType,
                annotationType,
                orientation,
                unselectedObjects,
                file_metadata_id,
                format: exportFormat,
            })
            .then((response) => {
                console.log('Filters applied successfully:', response.data)
                setFinalFormat(exportFormat)
                navigate('/visualization', {
                    state: {
                        graph: response.data.graph,
                        objects,
                        file_metadata_id: response.data.file_metadata_id,
                    },
                });
            })
            .catch((error) => {
                console.error('Error applying filters:', error);
                setError('Error applying filters. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Render the graph
    useEffect(() => {
        if (!graph || finalFormat === 'svg') return;

        try {
            if (graphContainerSvg.current) {
                graphContainerSvg.current.innerHTML = '';
                const svgContainer = document.createElement('div');
                svgContainer.style.transform = `scale(${scale})`;
                svgContainer.style.transformOrigin = 'center';
                svgContainer.style.transition = 'transform 0.2s ease-out';
                svgContainer.innerHTML = graph;
                const newSvg = svgContainer.querySelector('svg');
                if (newSvg) {
                    newSvg.style.width = '100%';
                    newSvg.style.height = '100%';
                    newSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
                graphContainerSvg.current.appendChild(svgContainer);
            }
        } catch (err) {
            setError('Error displaying SVG. Please ensure the file is valid.');
            console.error('Error:', err);
        }
    }, [graph, scale, finalFormat]);

    useEffect(() => {
        if (!graph || finalFormat === 'html') return;

        try {
            if (graphContainerHtml.current) {
                graphContainerHtml.current.innerHTML = '';
                const htmlContainer = document.createElement('div');
                htmlContainer.innerHTML = graph;
                graphContainerHtml.current.appendChild(htmlContainer);
            }
        } catch (err) {
            setError('Error displaying HTML. Please ensure the file is valid.');
            console.error('Error:', err);
        }
    }, [graph, finalFormat]);

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Filter Controls */}
            <Box
                sx={{
                    backgroundColor: '#1A1A1A',
                    color: 'white',
                    padding: 2,
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Container maxWidth="xl">
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        {/* Conditionally render Activity Percent Slider for OC-DFG */}
                        {visualizationType === 'ocdfg' && (
                            <Box sx={{ width: '200px' }}>
                                <Typography gutterBottom sx={{ color: 'red' }}>
                                    % of Activities
                                </Typography>
                                <Slider
                                    value={activityPercent}
                                    onChange={handleActivityPercentChange}
                                    aria-labelledby="activity-percent-slider"
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={100}
                                    sx={{ color: '#ff4F00' }}
                                />
                            </Box>
                        )}

                        {/* Conditionally render edge Percent Slider for OC-DFG */}
                        {visualizationType === 'ocdfg' && (
                            <Box sx={{ width: '200px' }}>
                                <Typography gutterBottom sx={{ color: 'red' }}>
                                    % of Edges
                                </Typography>
                                <Slider
                                    value={pathPercent}
                                    onChange={handleEdgePercentChange}
                                    aria-labelledby="path-percent-slider"
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={100}
                                    sx={{ color: '#ff4F00' }}
                                />
                            </Box>
                        )}

                        {/* Conditionally render Annotation Type Selector for OC-DFG */}
                        {visualizationType === 'ocdfg' && (
                            <FormControl sx={{ minWidth: '150px' }}>
                                <InputLabel sx={{ color: 'white' }}>Annotation</InputLabel>
                                <Select
                                    value={annotationType}
                                    onChange={handleAnnotationTypeChange}
                                    label="Annotation"
                                    sx={{
                                        backgroundColor: '#63007C',
                                        color: 'white',
                                        '& .MuiSelect-icon': {
                                            color: 'white',
                                        },
                                    }}
                                >
                                    <MenuItem value="unique_objects">Unique Objects (UO)</MenuItem>
                                    <MenuItem value="events">Events</MenuItem>
                                    <MenuItem value="total_objects">Total Objects</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {/* Selector for Visualization Type */}
                        <FormControl sx={{ minWidth: '150px' }}>
                            <InputLabel sx={{ color: 'white' }}>Visualization</InputLabel>
                            <Select
                                value={visualizationType}
                                onChange={handleVisualizationTypeChange}
                                label="Visualization"
                                sx={{
                                    backgroundColor: '#63007C',
                                    color: 'white',
                                    '& .MuiSelect-icon': {
                                        color: 'white',
                                    },
                                }}
                            >
                                <MenuItem value="ocdfg">OC-DFG</MenuItem>
                                <MenuItem value="oc_petri_net">OC-Petri Net</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Selector for Orientation */}
                        <FormControl sx={{ minWidth: '150px' }}>
                            <InputLabel sx={{ color: 'white' }}>Orientation</InputLabel>
                            <Select
                                value={orientation}
                                onChange={handleOrientationChange}
                                label="Orientation"
                                sx={{
                                    backgroundColor: '#63007C',
                                    color: 'white',
                                    '& .MuiSelect-icon': {
                                        color: 'white',
                                    },
                                }}
                            >
                                <MenuItem value="vertical">Vertical</MenuItem>
                                <MenuItem value="horizontal">Horizontal</MenuItem>
                            </Select>
                        </FormControl>
                        { /* Format Selector */}
                        {visualizationType === 'ocdfg' && (
                            <FormControl sx={{ minWidth: '150px' }}>
                                <InputLabel sx={{ color: 'white' }}>Format</InputLabel>
                                <Select
                                    value={exportFormat}
                                    onChange={handleFormatChange}
                                    label="Format"
                                    sx={{
                                        backgroundColor: '#63007C',
                                        color: 'white',
                                        '& .MuiSelect-icon': { color: 'white' },
                                    }}
                                >
                                    <MenuItem value="svg">SVG</MenuItem>
                                    <MenuItem value="html">HTML</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                        {/* Multi-Select Dropdown for Objects */}
                        <>
                            <Button
                                variant="contained"
                                onClick={handleClick}
                                sx={{
                                    backgroundColor: '#63007C',
                                    color: 'white',
                                    '&:hover': { backgroundColor: '#430054' },
                                }}
                            >
                                Objects
                            </Button>

                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                PaperProps={{
                                    style: {
                                        backgroundColor: 'white',
                                    },
                                }}
                            >
                                {objects?.map((object) => (
                                    <MenuItem
                                        key={object}
                                        sx={{
                                            color: 'black',
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedObjects.includes(object)}
                                            onChange={() => handleObjectSelection(object)}
                                            sx={{
                                                color: '#63007C',
                                                '&.Mui-checked': {
                                                    color: '#ff4F00',
                                                },
                                            }}
                                        />
                                        {object}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>

                        {/* Apply Filters Button */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleApplyFilters}
                            sx={{
                                height: '40px',
                                backgroundColor: '#63007C',
                                '&:hover': { backgroundColor: '#430054' },
                            }}
                        >
                            Apply Filters
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Graph Visualization Section */}
            <Box
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    ref={finalFormat === 'svg' ? graphContainerSvg : graphContainerHtml}
                    onWheel={handleWheel}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    ) : (
                        <>
                            {finalFormat === 'svg' ? (
                                <Box
                                    sx={{
                                        transform: `scale(${scale})`,
                                        transformOrigin: 'center',
                                        transition: 'transform 0.2s ease-out',
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: graph }}
                                />
                            ) : (
                                <InteractiveGraph dotString={graph} />
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {/* Zoom Controls */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: 'flex',
                    gap: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    padding: 1,
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                    zIndex: 2,
                }}
            >
                <IconButton onClick={handleZoomIn} size="small">
                    <ZoomInIcon />
                </IconButton>
                <IconButton onClick={handleResetZoom} size="small">
                    <RestoreIcon />
                </IconButton>
                <IconButton onClick={handleZoomOut} size="small">
                    <ZoomOutIcon />
                </IconButton>
            </Box>

            {/* Loading Spinner */}
            {loading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress sx={{ color: 'white' }} />
                        <Typography sx={{ color: 'white', marginTop: 2 }}>
                            Processing your filters...
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default VisualizationPage;