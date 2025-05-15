import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Client, Account } from "appwrite";
import { Eye, EyeOff } from "lucide-react";
import eventBkgImage from "../assets/event_bkg_image.jpg"; // Import the event background image

// Noise texture SVG for background effect
const noiseTexture = `
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.15 0"/>
    </filter>
    <rect width="500" height="500" filter="url(#noise)" opacity="0.3"/>
  </svg>
`;

// Convert SVG to base64 for use in CSS
const noiseSvgBase64 = btoa(noiseTexture);

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const navigate = useNavigate();
  const { register, login } = useAuth();

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT); // Must match exactly

  const account = new Account(client);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        await register(formData.email, formData.password, formData.fullName);
        setIsLogin(true);
        setError("Signup successful! Please log in.");
      } else {
        await login(formData.email, formData.password);
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage("");
    setForgotPasswordLoading(true);

    try {
      await account.createRecovery(
        forgotPasswordEmail,
        `${window.location.origin}/reset-password`
      );
      setForgotPasswordMessage("Password reset email sent!");
      setTimeout(() => setShowForgotPasswordModal(false), 2000);
    } catch (err) {
      console.error('Error details:', err);
      setForgotPasswordMessage(
        err.type === 'user_not_found'
          ? 'No account found with this email'
          : 'Failed to send reset email. Please try again.'
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  return (
    <div className="min-h-screen relative bg-black p-6 flex items-center justify-center overflow-hidden">
      {/* Background image with blue overlay */}
      <div 
        className="fixed inset-0 w-full h-full bg-no-repeat bg-cover bg-center z-0 opacity-30"
        style={{
          backgroundImage: `url(${eventBkgImage})`,
          filter: 'blur(20px) brightness(0.3) saturate(0.8) hue-rotate(210deg)', // Blue tint
        }}
      ></div>
      
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,${noiseSvgBase64}")`,
          backgroundRepeat: 'repeat',
        }}
      ></div>

      {/* Content with higher z-index */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-lg max-w-md w-full border border-gray-700/30">
              <h3 className="text-xl font-bold text-white mb-4">Forgot Password</h3>
              <p className="text-gray-300 mb-4">Enter your email to receive reset instructions</p>

              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="block w-full h-11 px-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent mb-4"
                  required
                />

                {forgotPasswordMessage && (
                  <div className={`mb-4 p-3 rounded-md ${forgotPasswordMessage.includes("sent") ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>
                    {forgotPasswordMessage}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 rounded-md text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="px-4 py-2 rounded-md bg-black text-white hover:bg-black transition-colors"
                  >
                    {forgotPasswordLoading ? "Sending..." : "Send Instructions"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="flex flex-col justify-center p- mt-10">
                   

            <h2 className="mt-8 mb-6">
              <span className="block text-5xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                <span className="block">Snap</span>
                <span className="block">Tickets,</span>
              </span>
              <span className="block text-5xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500 mt-1">Share Moments</span>
            </h2>

            <p className="text-white md:text-ml lg:text-base xl:text-xl mb-8">
              Book tickets for concerts, sports, theater, and more with just a few clicks.
            </p>
          </div>

          {/* Auth Form Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-gray-800/30 shadow-xl mt-30">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit}>
              {/* Full Name - Only for Sign Up */}
              {!isLogin && (
                <div className="space-y-3">
                  <label htmlFor="fullName" className="block text-sm font-medium text-white mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full h-11 px-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-3 mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full h-11 px-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-3 mt-4">
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full h-11 px-4 pr-10 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={18}/> : <EyeOff size={18} />  }
                  </button>
                </div>
                {isLogin && (
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-sm text-white hover:text-amber-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {/* Confirm Password - Only for Sign Up */}
              {!isLogin && (
                <div className="space-y-3 mt-4">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full h-11 px-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-md bg-black text-white font-medium hover:bg-black transition-colors"
                >
                  {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
                </button>
              </div>
            </form>

            {/* Toggle Link */}
            <div className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-white hover:text-white font-medium"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AuthForm;