import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiEdit, FiSave, FiX, FiArrowLeft, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiClock, FiShield } from "react-icons/fi";
import { FaTicketAlt, FaHistory, FaQrcode } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { storage, databases, fetchEvents } from "../api/appwriteConfig";
import { ID, Query } from "appwrite";

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

const Profile = () => {
     const { user, updateUser } = useAuth();
     const [editMode, setEditMode] = useState(false);
     const [activeTab, setActiveTab] = useState("profile");
     const [userTickets, setUserTickets] = useState([]);
     const [ticketsLoading, setTicketsLoading] = useState(false);
     const [userDetails, setUserDetails] = useState({
          name: "",
          email: "",
          phone: "",
          location: "",
          profilePicUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", // Default image
          qrimageId: "",
     });

     useEffect(() => {
          if (user) {
               setUserDetails({
                    name: user?.name || "John Doe",
                    email: user?.email || "johndoe@example.com",
                    phone: user?.phone || "",
                    location: user?.location || "",
                    profilePicUrl: user?.profilePicUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
                    qrimageId: user?.qrimageId || "",
               });
               
               // Fetch user tickets if active tab is tickets
               if (activeTab === "tickets") {
                    fetchUserTickets();
               }
          }
     }, [user, activeTab]);

     const fetchUserTickets = async () => {
          if (!user) return;
          
          try {
               setTicketsLoading(true);
               console.log("Fetching tickets for user ID:", user.$id);
               
               // Use the proper Appwrite Query format
               const response = await databases.listDocuments(
                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_TICKETS_COLLECTION_ID,
                    [Query.equal("userId", user.$id)]
               );
               
               console.log("Tickets response:", response);
               
               if (response && response.documents) {
                    console.log("Found tickets:", response.documents.length);
                    setUserTickets(response.documents);
               }
          } catch (error) {
               console.error("Error fetching user tickets:", error);
          } finally {
               setTicketsLoading(false);
          }
     };

     const handleInputChange = (e) => {
          setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
     };

     const handleImageUpload = async (e) => {
          const file = e.target.files[0];
          if (file) {
               try {
                    // Create new filename with correct format: {userID}_user_pic.png
                    const newFileName = `${user.$id}_user_pic.${file.name.split('.').pop()}`;

                    // Create new File object with correct name
                    const renamedFile = new File(
                         [file],
                         newFileName,
                         { type: file.type }
                    );

                    // Upload the renamed file
                    const uploadedFile = await storage.createFile(
                         import.meta.env.VITE_APPWRITE_USER_PROFILE_BUCKET_ID,
                         ID.unique(),
                         renamedFile // Use the renamed file here
                    );

                    const fileUrl = storage.getFilePreview(
                         import.meta.env.VITE_APPWRITE_USER_PROFILE_BUCKET_ID,
                         uploadedFile.$id
                    );

                    console.log("File uploaded successfully:", fileUrl);

                    // Update profilePicUrl in Appwrite database
                    await databases.updateDocument(
                         import.meta.env.VITE_APPWRITE_DATABASE_ID,
                         import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
                         user.$id,
                         { profilePicUrl: fileUrl }
                    );

                    // Update user state
                    updateUser({ profilePicUrl: fileUrl });
                    setUserDetails({ ...userDetails, profilePicUrl: fileUrl });

                    // Show success toast or notification
                    showNotification("Profile picture updated successfully!");
               } catch (error) {
                    console.error("Error uploading image:", error.message);
                    showNotification("Failed to update profile picture", "error");
               }
          }
     };

     const showNotification = (message, type = "success") => {
          // Simple alert for now - could be replaced with a proper toast component
          alert(message);
     };

     const handleSave = async () => {
          try {
               // Update user document in database
               await databases.updateDocument(
                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
                    user.$id,
                    {
                         name: userDetails.name,
                         phone: userDetails.phone,
                         location: userDetails.location,
                    }
               );
               
               // Update local user state
               updateUser({
                    name: userDetails.name,
                    phone: userDetails.phone,
                    location: userDetails.location,
               });
               
               setEditMode(false);
               showNotification("Profile updated successfully!");
          } catch (error) {
               console.error("Error updating profile:", error.message);
               showNotification("Failed to update profile", "error");
          }
     };

     if (!user) {
          return (
               <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                    <div className="max-w-4xl w-full bg-gray-900/50 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden p-6 text-center border border-gray-800">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                         <p className="text-white text-lg">Loading profile...</p>
                    </div>
               </div>
          );
     }

     const renderProfileSection = () => (
          <div className="bg-neutral-900/40 backdrop-blur-sm rounded-xl border border-neutral-800/50 overflow-hidden shadow-lg p-6">
               <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <FiUser className="mr-2" /> Personal Information
               </h2>
               
               <div className="space-y-6">
                    {/* Name field */}
                    <div className="space-y-2">
                         <label className="text-gray-400 text-sm block">Full Name</label>
                         {editMode ? (
                              <input
                                   type="text"
                                   name="name"
                                   value={userDetails.name}
                                   onChange={handleInputChange}
                                   className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                   placeholder="Your name"
                              />
                         ) : (
                              <p className="text-white text-lg">{userDetails.name}</p>
                         )}
                    </div>
                    
                    {/* Email field - readonly */}
                    <div className="space-y-2">
                         <label className="text-gray-400 text-sm block">Email Address</label>
                         <div className="flex items-center">
                              <FiMail className="text-gray-500 mr-2" />
                              <p className="text-white">{userDetails.email}</p>
                         </div>
                    </div>
                    
                    {/* Phone field */}
                    <div className="space-y-2">
                         <label className="text-gray-400 text-sm block">Phone Number</label>
                         {editMode ? (
                              <input
                                   type="text"
                                   name="phone"
                                   value={userDetails.phone}
                                   onChange={handleInputChange}
                                   className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                   placeholder="Your phone number"
                              />
                         ) : (
                              <div className="flex items-center">
                                   <FiPhone className="text-gray-500 mr-2" />
                                   <p className="text-white">{userDetails.phone || "Not provided"}</p>
                              </div>
                         )}
                    </div>
                    
                    {/* Location field */}
                    <div className="space-y-2">
                         <label className="text-gray-400 text-sm block">Location</label>
                         {editMode ? (
                              <input
                                   type="text"
                                   name="location"
                                   value={userDetails.location}
                                   onChange={handleInputChange}
                                   className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                   placeholder="Your city/location"
                              />
                         ) : (
                              <div className="flex items-center">
                                   <FiMapPin className="text-gray-500 mr-2" />
                                   <p className="text-white">{userDetails.location || "Not provided"}</p>
                              </div>
                         )}
                    </div>
                    
                    {/* Account created info */}
                    <div className="space-y-2">
                         <label className="text-gray-400 text-sm block">Member Since</label>
                         <div className="flex items-center">
                              <FiCalendar className="text-gray-500 mr-2" />
                              <p className="text-white">{new Date(user.$createdAt).toLocaleDateString()}</p>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderTicketsSection = () => (
          <div className="bg-neutral-900/40 backdrop-blur-sm rounded-xl border border-neutral-800/50 overflow-hidden shadow-lg p-6">
               <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <FaTicketAlt className="mr-2" /> My Tickets
               </h2>
               
               {ticketsLoading ? (
                    <div className="text-center py-10">
                         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                         <p className="text-gray-400">Loading your tickets...</p>
                    </div>
               ) : userTickets.length === 0 ? (
                    <div className="text-center py-10 bg-black/30 rounded-lg border border-neutral-800">
                         <FaTicketAlt className="text-gray-400 text-4xl mx-auto mb-3" />
                         <p className="text-gray-300 mb-2">You don't have any tickets yet</p>
                         <Link to="/events" className="mt-3 inline-block px-6 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors rounded-full text-sm">
                              Browse Events
                         </Link>
                    </div>
               ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                         {userTickets.map((ticket) => (
                              <div key={ticket.$id} className="bg-black/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden hover:border-neutral-600 transition-all">
                                   <div className="p-4">
                                        <h3 className="text-lg font-semibold text-white mb-1">{ticket.eventName}</h3>
                                        <p className="text-gray-400 text-sm mb-3">{ticket.eventSub_name}</p>
                                        
                                        <div className="flex flex-wrap gap-3 text-sm mt-4">
                                             <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
                                                  <FiCalendar className="text-gray-400 mr-1 h-3 w-3" />
                                                  <span className="text-gray-300">{ticket.eventDate}</span>
                                             </div>
                                             <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
                                                  <FiClock className="text-gray-400 mr-1 h-3 w-3" />
                                                  <span className="text-gray-300">{ticket.eventTime}</span>
                                             </div>
                                             <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
                                                  <FiMapPin className="text-gray-400 mr-1 h-3 w-3" />
                                                  <span className="text-gray-300 truncate max-w-[150px]">{ticket.eventLocation}</span>
                                             </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                                             <div>
                                                  <span className="text-gray-400 text-sm">Quantity: {ticket.quantity}</span>
                                                  <div className="text-yellow-500 font-medium">₹{ticket.totalAmountPaid}</div>
                                             </div>
                                             <Link to={`/tickets/${ticket.$id}`} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-full transition-colors">
                                                  View Ticket
                                             </Link>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );

     return (
          <div className="min-h-screen bg-black text-white">
               {/* Background image and textures */}
               <div 
                    className="fixed inset-0 w-full h-full bg-no-repeat bg-cover bg-center z-0 opacity-30"
                    style={{
                         backgroundImage: `url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1470&auto=format&fit=crop')`,
                         filter: 'blur(20px) brightness(0.2) saturate(0.6)',
                    }}
               ></div>
               
               <div 
                    className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none"
                    style={{
                         backgroundImage: `url("data:image/svg+xml;base64,${noiseSvgBase64}")`,
                         backgroundRepeat: 'repeat',
                    }}
               ></div>
               
               {/* Main content */}
               <div className="container mx-auto px-4 py-12 relative z-10">
                    {/* Header navigation */}
                    <div className="bg-black/70 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-neutral-800 mb-8 mt-20">
                         <div className="px-6 py-4 flex flex-wrap justify-between items-center">
                              <Link to="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                                   <FiArrowLeft className="mr-2" /> Back to Home
                              </Link>
                              
                              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                   <button
                                        onClick={() => setEditMode(!editMode)}
                                        className={`flex items-center px-4 py-2 rounded-full text-sm transition-colors ${
                                             editMode 
                                                  ? "bg-gray-700 hover:bg-gray-600 text-white" 
                                                  : "bg-white/10 hover:bg-white/20 text-white"
                                        }`}
                                   >
                                        {editMode ? (
                                             <>
                                                  <FiX className="mr-2" /> Cancel
                                             </>
                                        ) : (
                                             <>
                                                  <FiEdit className="mr-2" /> Edit Profile
                                             </>
                                        )}
                                   </button>
                                   
                                   {editMode && (
                                        <button 
                                             onClick={handleSave} 
                                             className="flex items-center px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-full text-sm"
                                        >
                                             <FiSave className="mr-2" /> Save Changes
                                        </button>
                                   )}
                              </div>
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                         {/* User card */}
                         <div className="lg:col-span-1">
                              <div className="bg-black/50 backdrop-blur-md rounded-xl border border-neutral-800/50 overflow-hidden shadow-lg">
                                   <div className="p-6 flex flex-col items-center">
                                        <div className="relative group mb-4">
                                             <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700/50 shadow-lg">
                                                  <img
                                                       src={userDetails.profilePicUrl}
                                                       alt="profile"
                                                       className="h-full w-full object-cover"
                                                       onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200";
                                                       }}
                                                  />
                                             </div>
                                             
                                             {editMode && (
                                                  <label
                                                       htmlFor="profile-upload"
                                                       className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                  >
                                                       <span className="text-white text-sm font-medium">Change Photo</span>
                                                       <input
                                                            type="file"
                                                            id="profile-upload"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                       />
                                                  </label>
                                             )}
                                        </div>
                                        
                                        <h2 className="text-xl font-bold text-white mb-1">{userDetails.name}</h2>
                                        <p className="text-gray-400 mb-4">{userDetails.email}</p>
                                        
                                        {/* Member status */}
                                        <div className="flex items-center bg-gradient-to-r from-gray-800 to-gray-700 px-3 py-1 rounded-full text-xs border border-gray-700">
                                             <FiShield className="mr-1 text-yellow-500" />
                                             <span className="text-gray-300">Member</span>
                                        </div>
                                   </div>
                                   
                                   {/* Profile navigation */}
                                   <div className="border-t border-neutral-800">
                                        <nav className="flex flex-col">
                                             <button 
                                                  onClick={() => setActiveTab("profile")}
                                                  className={`flex items-center py-3 px-6 transition-colors ${
                                                       activeTab === "profile" 
                                                            ? "bg-black/40 border-l-2 border-yellow-500 text-white" 
                                                            : "text-gray-400 hover:bg-white/5"
                                                  }`}
                                             >
                                                  <FiUser className="mr-3" /> 
                                                  Profile
                                             </button>
                                             
                                             <button 
                                                  onClick={() => setActiveTab("tickets")}
                                                  className={`flex items-center py-3 px-6 transition-colors ${
                                                       activeTab === "tickets" 
                                                            ? "bg-black/40 border-l-2 border-yellow-500 text-white" 
                                                            : "text-gray-400 hover:bg-white/5"
                                                  }`}
                                             >
                                                  <FaTicketAlt className="mr-3" /> 
                                                  My Tickets
                                             </button>
                                        </nav>
                                   </div>
                              </div>
                         </div>
                         
                         {/* Content area */}
                         <div className="lg:col-span-3">
                              {activeTab === "profile" && renderProfileSection()}
                              {activeTab === "tickets" && renderTicketsSection()}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default Profile;