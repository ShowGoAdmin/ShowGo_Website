import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ensure correct import path

const AdminRoutes = () => {
    const { user } = useAuth(); // Get the user from AuthContext

    console.log("🔍 Checking Admin Access in Route:", user);

    // Ensure user has a role and it's "admin"
    if (!user || user.role !== "admin") {
        console.log("⛔ User is not admin, redirecting to home.");
        return <Navigate to="/" />; // Redirect to home if not admin
    }

    return <Outlet />; // Render admin pages if user is admin
};

export default AdminRoutes;
