import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ReactNode } from "react"; // Import ReactNode for type annotation

import Register from "./pages/Register";
import Login from "./pages/Login";
import ReportCreationPage from "./pages/ReportCreationPage";
import AdminDashboard from "./pages/AdminDashboard";

// Protected Route Component with proper typing
type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>; // Render the children
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="/ReportCreationPage/:userId"
          element={
            <ProtectedRoute>
              <ReportCreationPage />
            </ProtectedRoute>
          }
        />
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<h1>Not found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
