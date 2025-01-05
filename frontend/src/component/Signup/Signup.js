import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { useContext, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { authContext } from "../../App";
import axios from 'axios';

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const { setAuth } = useContext(authContext);
    const navigate = useNavigate();
    const [signupError, setSignupError] = useState(null);

    const nav = () => {
        navigate('/dashboard');
    };

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            nav();
        }
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (!data.get('password') || !data.get('username')) {
            setSignupError('Some fields are empty!');
            return;
        }

        try {
            const payload = JSON.stringify({
                password: data.get('password'),
                username: data.get('username'),
            });
            const customConfig = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const response = await axios.post('http://localhost:8000/signup/', payload, customConfig);
            if (response.status === 201) {
                sessionStorage.setItem('token', response.data.token);
                setAuth(true);
                nav();
            } else {
                setSignupError('Username or password is incorrect!');
            }
        } catch (error) {
            setSignupError('Username or password is incorrect!');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
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
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, borderRadius: '20px', color: 'white' }}
                    >
                        Sign Up
                    </Button>
                    {signupError && (
                        <Typography variant="body2" color="error" align="center">
                            {signupError}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
