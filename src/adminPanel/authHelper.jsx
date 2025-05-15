import { account } from "../api/appwriteConfig";  

// ✅ Get current logged-in user
export const getCurrentUser = async () => {
     try {
          const user = await account.get();
          console.log("Current User:", user);  
          return user;
     } catch (error) {
          console.error("User fetch error:", error);
          return null;
     }
};

// ✅ Check if the user is an admin
export const isAdmin = async () => {
     const user = await getCurrentUser();
     const ADMIN_USER_ID = import.meta.env.VITE_APPWRITE_ADMIN_USER_ID;  

     console.log("Admin ID from env:", ADMIN_USER_ID);
     console.log("User ID:", user?.$id);

     return user && user.$id === ADMIN_USER_ID;
};

