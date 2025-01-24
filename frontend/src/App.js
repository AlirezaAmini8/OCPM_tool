import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { createContext, useState } from "react";
import Landing from './component/Landing/Landing';
import Login from './component/Login/Login';
import Signup from './component/Signup/Signup';
import VisualizationPage from './component/Visualize/VisualizationPage';
import Dashboard from "./component/Dashboard/Dashboard";

export const authContext = createContext(false);
function App() {
    const [auth, setAuth] = useState(!!sessionStorage.getItem("token"));
    return (
        <authContext.Provider value={{ auth, setAuth }}>
            <Router>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/visualization" element={<VisualizationPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </Router>
        </authContext.Provider>
    );
}

export default App;
