import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import LandingPage from "./pages/shared/LandingPage";
import Properties from "./pages/shared/Properties";
import PropertyDetails from "./pages/shared/PropertyDetails";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import Contact from "./pages/shared/Contact";
import Profile from "./pages/shared/Profile";
import Wishlist from "./pages/buyer/Wishlist";
import MyRent from "./pages/buyer/MyRent";
import AddProperty from "./pages/seller/AddProperty";
import EditProperty from "./pages/seller/EditProperty";
import SellerDashboard from "./pages/seller/SellerDashboard";
import Rooms from "./pages/seller/Rooms";
import Tenants from "./pages/seller/Tenants";
import Staff from "./pages/seller/Staff";
import Reports from "./pages/seller/Reports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
    };
  }, []);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["viewer", "owner", "admin"]}><Profile /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute allowedRoles={["viewer"]}><Wishlist /></ProtectedRoute>} />
        <Route path="/my-rent" element={<ProtectedRoute allowedRoles={["viewer"]}><MyRent /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["owner"]}><SellerDashboard /></ProtectedRoute>} />
        <Route path="/add-property" element={<ProtectedRoute allowedRoles={["owner"]}><AddProperty /></ProtectedRoute>} />
        <Route path="/edit-property/:id" element={<ProtectedRoute allowedRoles={["owner"]}><EditProperty /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute allowedRoles={["owner"]}><Rooms /></ProtectedRoute>} />
        <Route path="/tenants" element={<ProtectedRoute allowedRoles={["owner"]}><Tenants /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute allowedRoles={["owner"]}><Staff /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["owner"]}><Reports /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
