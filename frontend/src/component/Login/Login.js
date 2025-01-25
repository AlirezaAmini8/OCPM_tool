import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { useContext, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { authContext } from "../../App";
import axios from 'axios';
import ParticlesBg from 'particles-bg';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { setAuth } = useContext(authContext);
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState(null);

    const handleBackClick = () => {
        navigate('/');
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        try {
            const payload = {
                username: data.get('username'),
                password: data.get('password'),
            };
            const response = await axios.post('http://localhost:8000/login/', payload);

            if (response.status === 200 && response.data.data.token) {
                sessionStorage.setItem('token', response.data.data.token);
                sessionStorage.setItem('isAuthenticated', 'true');
                setAuth(true);
                navigate('/dashboard');
            } else {
                setLoginError('Login failed. Please check your username and password.');
            }
        } catch (error) {
            if (error.response) {
                setLoginError(error.response.data.message || 'Unexpected error occurred. Please try again.');
            } else if (error.request) {
                setLoginError('No response from the server. Please check your connection.');
            } else {
                setLoginError('Unexpected error occurred. Please try again.');
            }
        }
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
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5" sx={{ color: 'white' }}>
                    Login
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
                                        {showPassword ? <VisibilityIcon sx={{color: 'white'}}/> : <VisibilityOffIcon sx={{color: 'white'}} /> }
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
                        Login
                    </Button>
                    {loginError && (
                        <Typography variant="body2" color="error" align="center">
                            {loginError}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
