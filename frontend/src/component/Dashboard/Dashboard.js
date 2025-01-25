import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Avatar, ListItemAvatar, IconButton } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import axios from 'axios';
import ParticlesBg from 'particles-bg';
import UploadModal from '../UploadFile/UploadModal';
import DeleteIcon from '@mui/icons-material/Delete';
import { authContext } from "../../App";

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const navigate = useNavigate();
    const { auth } = useContext(authContext);

    useEffect(() => {
        if (!auth) {
            navigate('/');
            return;
        }

        const fetchFiles = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await axios.get('http://localhost:8000/api/user-files/', {
                    headers: { Authorization: `Token ${token}` }
                });
                setFiles(response.data);
                setLoading(false);
            } catch (error) {
                setError('Failed to fetch files');
                setLoading(false);
            }
        };
        fetchFiles();
    }, [auth, navigate]);

    const [deletingFiles, setDeletingFiles] = useState(new Set());
    const handleDeleteFile = async (fileId, event) => {
        event.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            setDeletingFiles(prev => new Set([...prev, fileId]));
            const token = sessionStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/files/${fileId}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        } catch (error) {
            setError('Failed to delete file');
        } finally {
            setDeletingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileId);
                return newSet;
            });
        }
    };

    const [fileLoading, setFileLoading] = useState(false);
    const [selectedFileId, setSelectedFileId] = useState(null);

    const handleFileClick = async (fileId) => {
        try {
            setFileLoading(true);
            setSelectedFileId(fileId);

            const token = sessionStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/api/files/${fileId}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            navigate('/visualization', {
                state: {
                    graph: response.data.graph,
                    objects: response.data.objects,
                    file_metadata_id: response.data.file_metadata_id,
                }
            });
        } catch (error) {
            setError('Failed to load file');
        }finally {
            setFileLoading(false);
            setSelectedFileId(null);
        }
    };

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const fileLoadingOverlay = (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <CircularProgress sx={{ color: 'white' }} />
        </Box>
    );


    return (
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            {fileLoading && fileLoadingOverlay}
            <ParticlesBg type="circle" bg={true} />
            <Box sx={{
                padding: 4,
                position: 'relative',
                zIndex: 1,
                maxWidth: 800,
                margin: '0 auto'
            }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4
                }}>
                    <Typography variant="h4" sx={{ color: 'white' }}>
                        My Process Models
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => setOpenModal(true)}
                        sx={{
                            bgcolor: '#63007C',
                            '&:hover': { bgcolor: '#430054' },
                            textTransform: 'none',
                            borderRadius: 2,
                            py: 1,
                            px: 3
                        }}
                    >
                        + New Upload
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 9999,
                    }}>
                        <CircularProgress sx={{ color: 'white' }} />
                    </Box>
                ) : error ? (
                    <Typography color="error" align="center">{error}</Typography>
                ) : files.length === 0 ? (
                    <Box sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center'
                    }}>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                            No uploaded files found. Upload your first OCEL file!
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 2,
                        boxShadow: 3
                    }}>
                        {files.map((file) => (
                            <ListItem
                                key={file.id}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: fileLoading ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                                        cursor: fileLoading ? 'not-allowed' : 'pointer'
                                    },
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                                    py: 2,
                                    opacity: selectedFileId === file.id ? 0.5 : 1
                                }}
                                onClick={() => !fileLoading && handleFileClick(file.id)}
                                disabled={fileLoading}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: '#63007C' }}>
                                        <InsertDriveFileIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            {file.file_name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="body2" color="text.secondary">
                                            Uploaded: {formatDate(file.uploaded_at)}
                                        </Typography>
                                    }
                                />
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={(e) => handleDeleteFile(file.id, e)}
                                    disabled={fileLoading || deletingFiles.has(file.id)}
                                >
                                    {deletingFiles.has(file.id) ? (
                                        <CircularProgress size={24} sx={{ color: '#63007C' }} />
                                    ) : (
                                        <DeleteIcon />
                                    )}
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                )}

                <UploadModal open={openModal} setOpen={setOpenModal} />
            </Box>
        </Box>
    );
};

export default Dashboard;