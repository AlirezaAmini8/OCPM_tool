import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import SmoothScroll from 'smooth-scroll';
import JsonData from '../data/data.json';
import Header from "./Header";
import UploadModal from '../UploadFile/UploadModal';

export const scroll = new SmoothScroll('a[href*="#"]', {
    speed: 1000,
    speedAsDuration: true,
});

const Landing = () => {
    const [landingPageData, setLandingPageData] = useState({});
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        setLandingPageData(JsonData);
    }, []);

    return (

        <Box sx={{
            textAlign: 'center',
            backgroundColor: '#4A6572'
        }}>

            <Header
                data={landingPageData.Header}
                onUploadButtonClick={() => setOpenModal(true)}
            />
            <UploadModal open={openModal} setOpen={setOpenModal} />
        </Box>
    );
};

export default Landing;
