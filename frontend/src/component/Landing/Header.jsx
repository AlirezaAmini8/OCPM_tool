import React from 'react';
import { Button, Typography, Container, Grid2, darken } from '@mui/material';
import ParticlesBg from "particles-bg";
import { Link } from 'react-router-dom';

const Header = ({ data, onUploadButtonClick }) => {
    return (
        <header id="header" style={{ position: 'relative' }}>
            <ParticlesBg type="circle" bg={{ zIndex: 0, position: "center", top: 0 }} />
            <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Container>
                    <Grid2 container justify="center">
                        <Grid2 item md={10}>
                            <div className="intro-text" style={{ zIndex: 0, position: 'relative', textAlign: 'center' }}>
                                <Typography variant="h1" gutterBottom>
                                    {data?.title || 'Loading'}
                                </Typography>
                                <Typography variant="body1" sx={{ marginBottom: 2 }}>
                                    {data?.paragraph || 'Loading'}
                                </Typography>
                                <div>
                                    {data?.buttons && data.buttons.length > 0 ? (
                                        data.buttons.map((button, index) => (
                                            <Button
                                                key={index}
                                                variant="contained"
                                                sx={{
                                                    margin: '10px',
                                                    backgroundColor: button.color,
                                                    '&:hover': {
                                                        backgroundColor: button.color ? darken(button.color, 0.2) : '#FF3D00',
                                                    }
                                                }}
                                                component={Link}
                                                to={button.action}
                                                onClick={button.label === 'Upload OCEL File' ? onUploadButtonClick : undefined}
                                            >
                                                {button.label}
                                            </Button>
                                        ))
                                    ) : (
                                        <Typography variant="body1" sx={{ marginBottom: 2 }}>
                                            No buttons available.
                                        </Typography>
                                    )}
                                </div>
                            </div>
                        </Grid2>
                    </Grid2>
                </Container>
            </div>
        </header>
    );
};

export default Header;
