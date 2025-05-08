import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import UnlockPage from "./pages/unlock/Unlock";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/home/HomePage";
import SubscribePage from "./pages/subscribe/SubscribePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="/app" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/app" />} />
      </Routes>
    </Router>
  );
}

export default App;
