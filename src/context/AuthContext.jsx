import { createContext, useContext, useState, useEffect } from "react";
import { account, databases, storage } from "../api/appwriteConfig";
import { ID, Query } from "appwrite";
import { generateDefaultQR } from "../utils/generateDefaultQR";

const AuthContext = createContext();

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
const PROFILE_BUCKET_ID = import.meta.env.VITE_APPWRITE_PROFILE_BUCKET_ID;
const QR_BUCKET_ID = import.meta.env.VITE_APPWRITE_QR_BUCKET_ID;

export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
     const [isAuthenticated, setIsAuthenticated] = useState(false);

     const updateUser = (newUserData) => {
          setUser((prevUser) => ({
               ...prevUser,
               ...newUserData,
          }));
     };

     const createUserDocument = async (user, profilePicFile) => {
          try {
               if (!user || !user.$id) throw new Error("User ID is missing");

               const existingUser = await databases.listDocuments(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    [Query.equal("userID", user.$id)]
               );
               if (existingUser.documents.length > 0) {
                    return existingUser.documents[0];
               }

               const qrBlob = await generateDefaultQR(user.$id);
               if (!qrBlob || !(qrBlob instanceof Blob)) throw new Error("Invalid QR Code Blob");

               // Change this line to use the correct filename format
               const qrFile = new File(
                    [qrBlob],
                    `${user.$id}_user_qr.png`, // New filename format
                    { type: "image/png" }
               );

               const qrFileResponse = await storage.createFile(QR_BUCKET_ID, ID.unique(), qrFile);

               let profilePicUrl = "";
               if (profilePicFile) {
                    // Change this line to use the correct filename format
                    const profilePicFileWithName = new File(
                         [profilePicFile],
                         `${user.$id}_user_pic.png`, // New filename format
                         { type: profilePicFile.type || "image/png" }
                    );

                    const profilePicResponse = await storage.createFile(
                         PROFILE_BUCKET_ID,
                         ID.unique(),
                         profilePicFileWithName
                    );
                    profilePicUrl = storage.getFilePreview(PROFILE_BUCKET_ID, profilePicResponse.$id);
               }
               // create user document with profile pic url 
               const userDoc = await databases.createDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    ID.unique(),
                    {
                         userID: user.$id,
                         name: user.name || "Unnamed User",
                         email: user.email || "No Email",
                         qrimageId: qrFileResponse.$id,
                         profilePicUrl,
                         role: "user", // Default role
                    }
               );

               return userDoc;
          } catch (error) {
               console.error("Error creating user document:", error);
          }
     };

     // Add this function to your AuthProvider
     const updateProfilePicture = async (userId, file) => {
          try {
               if (!userId || !file) throw new Error("User ID and file are required");

               // Create file with correct naming format
               const profilePicFile = new File(
                    [file],
                    `${userId}_user_pic.png`,
                    { type: file.type || "image/png" }
               );

               // Upload to storage
               const response = await storage.createFile(
                    PROFILE_BUCKET_ID,
                    ID.unique(),
                    profilePicFile
               );

               // Get the preview URL
               const profilePicUrl = storage.getFilePreview(PROFILE_BUCKET_ID, response.$id);

               // Update user document
               const userDoc = await databases.updateDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    user.$id, // Make sure you have access to user.$id here
                    { profilePicUrl }
               );

               // Update local state
               setUser(prev => ({ ...prev, profilePicUrl }));

               return profilePicUrl;
          } catch (error) {
               console.error("Error updating profile picture:", error);
               throw error;
          }
     };


     useEffect(() => {
          let isMounted = true; // Prevents updating state after unmounting

          const checkUser = async () => {
               try {
                    const user = await account.get();

                    // ✅ Check if user document already exists
                    const userDoc = await databases.listDocuments(
                         DATABASE_ID,
                         USERS_COLLECTION_ID,
                         [Query.equal("userID", user.$id)]
                    );

                    let userData = userDoc.documents.length > 0 ? userDoc.documents[0] : null;

                    if (!userData) {
                         userData = await createUserDocument(user);

                         if (!userData) {
                              console.error("🚨 Failed to create user document.");
                              return;
                         }
                    } else {
                    }

                    if (isMounted) {
                         setUser(userData);
                    }
                    setIsAuthenticated(true);
               } catch (error) {
                    setIsAuthenticated(false);
                    console.error("❌ Error getting user:", error);
                    if (isMounted) setUser(null);
               } finally {
                    if (isMounted) setLoading(false);
               }
          };

          checkUser();

          return () => {
               isMounted = false; // Prevent state updates if component unmounts
          };
     }, []);


     const register = async (email, password, name = "", profilePicFile = null) => {
          try {
               const newUser = await account.create(ID.unique(), email, password, name || email.split("@")[0]);
               const userDoc = await createUserDocument(newUser, profilePicFile);
               await login(email, password);
               return { ...newUser, ...userDoc };
          } catch (error) {
               console.error("Registration Error:", error);
               throw error;
          }
     };

     const login = async (email, password) => {
          try {
               // 🛑 Ensure no previous session exists
               try {
                    await account.deleteSessions();
               } catch (sessionError) {
                    if (sessionError.message.includes("missing scope")) {
                         console.info("No session to delete. Proceeding to login.");
                    } else {
                         console.warn("Unexpected session deletion error:", sessionError);
                    }
               }

               // ✅ Create new login session
               await account.createEmailPasswordSession(email, password, {
                    scopes: ['account']
               });

               // ✅ Get logged-in user details
               const currentUser = await account.get();

               // ✅ Check if user document exists in the database
               const userDoc = await databases.listDocuments(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    [Query.equal("userID", currentUser.$id)]
               );

               // ✅ If user document exists, use it; otherwise, create a new one
               let userData = userDoc.documents.length > 0 ? userDoc.documents[0] : await createUserDocument(currentUser);

               // ✅ Update state
               setUser(userData);
               setIsAuthenticated(true);
          } catch (error) {
               setIsAuthenticated(false);
               console.error("Login Error:", error);
               throw error;
          }
     };


     const logout = async () => {
          try {
               await account.deleteSessions();
               setUser(null);
               setIsAuthenticated(false);
          } catch (error) {
               console.error("Logout Error:", error);
               throw error;
          }
     };

     return (
          <AuthContext.Provider value={{ user, isAuthenticated, register, login, logout, loading, updateUser, updateProfilePicture }}>
               {children}
          </AuthContext.Provider>
     );
};

export const useAuth = () => useContext(AuthContext);