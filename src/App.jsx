import { useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import React from "react";

import Events from "./pages/Events";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AccountDelete from "./pages/AccountDelete";
import JoinCommunity from "./pages/JoinCommunity";
import MembersAdded from "./pages/MembersAdded";
import EventDetails from "./pages/EventDetails";
import BookingConfirmation from "./pages/BookingConfirmation";
import LoginPage from "./pages/LoginSignup";
import AdminPanel from "./adminPanel/AdminPanel";
import Footer from "./components/Footer";
import Profile from "./pages/Profile";
import AdminRoutes from "./routes/AdminRoutes";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ResetPassword from "./pages/ResetPassword";

// Add this ScrollToTop component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth" // For smooth scrolling
    });
  }, [pathname]);

  return null;
}

function App() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Add ScrollToTop component here */}
      <ScrollToTop />

      {/* No padding for any page - navbar will overlap with content */}
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/account-delete" element={<AccountDelete />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/event-details/:eventId" element={<EventDetails />} />
            <Route path="/joinGroup">
              <Route index element={<JoinCommunity />} />
              <Route path=":groupId" element={<JoinCommunity />} />
            </Route>
            <Route path="/members-added" element={<MembersAdded />} />
            <Route path="/login-signup" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/login-signup" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/booking-confirmation/:orderId" element={<BookingConfirmation />} />
            <Route path="/admin" element={<AdminRoutes user={user} />}>
              <Route index element={<AdminPanel />} />
            </Route>
          </Routes>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default App;