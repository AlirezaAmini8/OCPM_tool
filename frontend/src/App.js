import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Landing from './component/Landing/Landing';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                {/*<Route path="/upload" element={<UploadModal />} />*/}
                {/*<Route path="/visualization" element={<Visualization />} />*/}
            </Routes>
        </Router>
    );
};

export default App