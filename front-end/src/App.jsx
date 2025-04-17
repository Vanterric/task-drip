import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";

// Placeholder for protected app area (we'll wire that up next)
const AppHome = () => <div className="p-8">🏠 Task Drip App</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<AppHome />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
