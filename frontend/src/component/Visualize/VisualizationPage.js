import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
} from '@mui/material';

const VisualizationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const graphContainer = useRef(null);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1);

    // Filter states
    const [activityPercent, setActivityPercent] = useState(100);
    const [pathPercent, setPathPercent] = useState(100);
    const [visualizationType, setVisualizationType] = useState('ocdfg');
    const [annotationType, setAnnotationType] = useState('unique_objects');
    const [selectedObjects, setSelectedObjects] = useState([]);

    // State for managing the dropdown open/close
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const { graph } = location.state || {};

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

    const handlePathPercentChange = (event, newValue) => {
        setPathPercent(newValue);
    };

    const handleVisualizationTypeChange = (event) => {
        setVisualizationType(event.target.value);
    };

    const handleAnnotationTypeChange = (event) => {
        setAnnotationType(event.target.value);
    };

    const handleApplyFilters = () => {
        console.log('Applying filters:', {
            activityPercent,
            pathPercent,
            visualizationType,
            annotationType,
            selectedObjects,
        });
    };

    // Render the graph
    useEffect(() => {
        if (!graph) {
            navigate('/');
            return;
        }

        try {
            if (!graph.includes('<svg')) {
                throw new Error('Invalid SVG content');
            }

            if (graphContainer.current) {
                graphContainer.current.innerHTML = '';

                const svgContainer = document.createElement('div');
                svgContainer.style.transform = `scale(${scale})`;
                svgContainer.style.transformOrigin = 'center';
                svgContainer.style.transition = 'transform 0.2s ease-out';

                svgContainer.innerHTML = graph;

                const newSvg = svgContainer.querySelector('svg');
                if (newSvg) {
                    newSvg.style.width = '100%';
                    newSvg.style.height = '100%';
                    newSvg.style.maxWidth = '100%';

                    newSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }

                graphContainer.current.appendChild(svgContainer);
            }
        } catch (err) {
            setError('Error displaying SVG. Please ensure the file is valid.');
            console.error('Error:', err);
        }
    }, [graph, navigate, scale]);

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Filter Controls */}
            <Box
                sx={{
                    backgroundColor: '#1A1A1A',
                    color: 'white',
                    padding: 2,
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Container maxWidth="xl">
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        {/* Slider for % of Activities */}
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

                        {/* Slider for % of Paths */}
                        <Box sx={{ width: '200px' }}>
                            <Typography gutterBottom sx={{ color: 'red' }}>
                                % of Paths
                            </Typography>
                            <Slider
                                value={pathPercent}
                                onChange={handlePathPercentChange}
                                aria-labelledby="path-percent-slider"
                                valueLabelDisplay="auto"
                                min={0}
                                max={100}
                                sx={{ color: '#ff4F00' }}
                            />
                        </Box>

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

                        {/* Selector for Annotation Type */}
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
                                {['Pay', 'Order', 'Reserve', 'Take'].map((object) => (
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
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f9f9f9',
                }}
            >
                {/* Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                {/* Graph Container */}
                <Box
                    ref={graphContainer}
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    {!graph && !error && (
                        <Typography color="text.secondary" align="center">
                            No graph data available. Please upload an SVG file.
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default VisualizationPage;