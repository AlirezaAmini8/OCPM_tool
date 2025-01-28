import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const ConfirmDialog = ({ open, onClose, onConfirm, title, message }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{
                bgcolor: '#FFEBEE',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <WarningIcon sx={{ color: '#D32F2F' }} />
                <Typography variant="h6" component="span">
                    {title || 'Confirm Action'}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Typography>
                    {message || 'Are you sure you want to proceed with this action?'}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        color: 'text.secondary',
                        borderColor: 'text.secondary',
                        '&:hover': {
                            borderColor: 'text.primary',
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    sx={{
                        bgcolor: '#1b00ff',
                        '&:hover': { bgcolor: '#1300a4' }
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;