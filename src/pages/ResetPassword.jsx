import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Client, Account } from "appwrite";
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

const ResetPassword = () => {
     const [searchParams] = useSearchParams();
     const [password, setPassword] = useState("");
     const [confirmPassword, setConfirmPassword] = useState("");
     const [message, setMessage] = useState({ text: "", type: "" });
     const [loading, setLoading] = useState(false);
     const navigate = useNavigate();

     // Initialize Appwrite
     const client = new Client()
          .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
          .setProject(import.meta.env.VITE_APPWRITE_PROJECT);

     const account = new Account(client);

     const handleSubmit = async (e) => {
          e.preventDefault();
          setLoading(true);
          setMessage({ text: "", type: "" });

          if (password !== confirmPassword) {
               setMessage({ text: "Passwords don't match", type: "error" });
               setLoading(false);
               return;
          }

          try {
               const userId = searchParams.get("userId");
               const secret = searchParams.get("secret");

               await account.updateRecovery(userId, secret, password, confirmPassword);

               setMessage({
                    text: "Password reset successfully! Redirecting to login...",
                    type: "success"
               });

               setTimeout(() => navigate("/login"), 2000);
          } catch (err) {
               console.error("Reset error:", err);
               setMessage({
                    text: err.message || "Failed to reset password",
                    type: "error"
               });
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="min-h-screen relative bg-black flex items-center justify-center p-4 overflow-hidden">
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
               <div className="relative z-10 bg-gray-800/70 backdrop-blur-sm p-8 rounded-lg max-w-md w-full border border-gray-700/30 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Reset Password</h2>

                    {message.text && (
                         <div className={`mb-4 p-3 rounded-md ${message.type === "success"
                                   ? "bg-green-500/20 text-green-200"
                                   : "bg-red-500/20 text-red-200"
                              }`}>
                              {message.text}
                         </div>
                    )}

                    <form onSubmit={handleSubmit}>
                         <div className="mb-4">
                              <label htmlFor="password" className="block text-gray-300 mb-2">
                                   New Password
                              </label>
                              <input
                                   type="password"
                                   id="password"
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                                   className="w-full h-11 px-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                                   required
                                   minLength="8"
                              />
                         </div>

                         <div className="mb-6">
                              <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">
                                   Confirm Password
                              </label>
                              <input
                                   type="password"
                                   id="confirmPassword"
                                   value={confirmPassword}
                                   onChange={(e) => setConfirmPassword(e.target.value)}
                                   className="w-full h-11 px-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                                   required
                                   minLength="8"
                              />
                         </div>

                         <button
                              type="submit"
                              disabled={loading}
                              className="w-full h-11 px-4 py-2 bg-black text-white rounded-md hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
                         >
                              {loading ? "Processing..." : "Reset Password"}
                         </button>
                    </form>
               </div>
          </div>
     );
};

export default ResetPassword;