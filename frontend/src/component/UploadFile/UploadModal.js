import React, { useState } from 'react';
import { Modal, Box, Button, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadModal = ({ open, setOpen }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const navigate = useNavigate();

    const handleClose = () => {
        setOpen(false);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = () => {
        if (!file) return;

        handleClose();
        setLoading(true);
        setShowSpinner(true);

        const formData = new FormData();
        formData.append('file', file);

        axios
            .post('http://localhost:8000/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(sessionStorage.getItem('token')
                        ? { 'Authorization': `Token ${sessionStorage.getItem('token')}` }
                        : {})
                },
            })
            .then((response) => {
                setShowSpinner(false);
                setLoading(false);
                navigate('/visualization', {
                    state: {
                        graph: response.data.graph,
                        objects: response.data.objects,
                        file_metadata_id: response.data.file_metadata_id,
                } });
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
                setShowSpinner(false);
                setLoading(false);
            });
    };

    return (
        <>
            <Modal open={open} onClose={handleClose} sx={{ zIndex: 500 }}>
                <Box
                    sx={{
                        width: 400,
                        padding: 3,
                        backgroundColor: 'white',
                        margin: 'auto',
                        marginTop: '10%',
                        textAlign: 'center',
                        borderRadius: 2,
                        border: '5px solid orange',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Upload OCEL File
                    </Typography>
                    <input type="file" onChange={handleFileChange} accept=".jsonocel" />
                    <Box sx={{ marginTop: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpload}
                            disabled={loading}
                            sx={{
                                backgroundColor: 'orange',
                                '&:hover': {
                                    backgroundColor: 'darkorange',
                                },
                            }}
                        >
                            Upload
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {showSpinner && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress sx={{ color: 'white' }} />
                        <Typography sx={{ color: 'white', marginTop: 2 }}>
                            Processing your file...
                        </Typography>
                    </Box>
                </Box>
            )}
        </>
    );
};

export default UploadModal;