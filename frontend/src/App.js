import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { createContext} from "react";
import Landing from './component/Landing/Landing';
import Login from './component/Login/Login';
import Signup from './component/Signup/Signup';
import VisualizationPage from './component/Visualize/VisualizationPage';

export const authContext = createContext(false);

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/visualization" element={<VisualizationPage />} />
            </Routes>
        </Router>
    );
}

export default App;
