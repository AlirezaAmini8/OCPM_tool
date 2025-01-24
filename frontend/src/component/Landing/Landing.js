import React, { useState, useEffect, useContext } from 'react';
import { Box } from '@mui/material';
import SmoothScroll from 'smooth-scroll';
import JsonData from '../data/data.json';
import Header from "./Header";
import UploadModal from '../UploadFile/UploadModal';
import { authContext } from "../../App";
import { useNavigate } from 'react-router-dom';

export const scroll = new SmoothScroll('a[href*="#"]', {
    speed: 1000,
    speedAsDuration: true,
});

const Landing = () => {
    const [landingPageData, setLandingPageData] = useState({});
    const [openModal, setOpenModal] = useState(false);
    const { auth } = useContext(authContext);
    const navigate = useNavigate();

    useEffect(() => {
        setLandingPageData(JsonData);
    }, []);

    const handleButtonClick = (button) => {
        if (button.label === 'Upload OCEL File') {
            setOpenModal(true);
        } else if (button.label === 'Dashboard' && !auth) {
            alert('Please log in first to access the dashboard.');
        } else {
            navigate(button.action);
        }
    };

    return (
        <Box sx={{
            textAlign: 'center',
            backgroundColor: '#4A6572'
        }}>
            <Header
                data={landingPageData.Header}
                onUploadButtonClick={() => setOpenModal(true)}
                onButtonClick={handleButtonClick}
                isLoggedIn={auth}
            />
            <UploadModal open={openModal} setOpen={setOpenModal} />
        </Box>
    );
};

export default Landing;