import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ParticlesBg from 'particles-bg';

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [signupError, setSignupError] = useState(null);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        try {
            const payload = {
                username: data.get('username'),
                password: data.get('password'),
            };
            await axios.post('http://localhost:8000/signup/', payload);
            setSignupSuccess(true);
            setSignupError(null);
        } catch (error) {
            if (error.response && error.response.data) {
                setSignupError(error.response.data.message);
            } else {
                setSignupError('An unexpected error occurred. Please try again.');
            }
        }
    };

    const handleBackClick = () => {
        navigate('/');
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <ParticlesBg type="circle" bg={true} />
            <Box sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 4,
                borderRadius: 2,
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.5)'
            }}>
                <Box sx={{ display: 'flex', alignSelf: 'flex-start', mb: 2 }}>
                    <IconButton
                        onClick={handleBackClick}
                        sx={{
                            color: 'white',
                            backgroundColor: 'blue',
                            '&:hover': {
                                backgroundColor: 'darkblue',
                            },
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
                <Typography component="h1" variant="h5" sx={{ color: 'white' }}>
                    Sign Up
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        InputLabelProps={{ style: { color: 'white' } }}
                        sx={{
                            input: { color: 'white' },
                            fieldset: { borderColor: 'white' },
                            '&:hover fieldset': { borderColor: 'gray' },
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        InputLabelProps={{ style: { color: 'white' } }}
                        sx={{
                            input: { color: 'white' },
                            fieldset: { borderColor: 'white' },
                            '&:hover fieldset': { borderColor: 'gray' },
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityIcon sx={{color: 'white'}}/> : <VisibilityOffIcon sx={{color: 'white'}}/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            borderRadius: '20px',
                            backgroundColor: 'secondary.main',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'secondary.dark',
                            },
                        }}
                    >
                        Sign Up
                    </Button>
                    {signupError && (
                        <Typography variant="body2" color="error" align="center">
                            {signupError}
                        </Typography>
                    )}
                    {signupSuccess && (
                        <Typography variant="body2" align="center" sx={{ color: '#4caf50' }}>
                            Signup successful! Please log in to continue.
                        </Typography>
                    )}
                </Box>
            </Box>
        </Container>
    );
}