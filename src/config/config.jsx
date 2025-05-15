export const MAPS_CONFIG = {
  
  apiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY,
  
  // Optional: Add default location if needed
  defaultLocation: "Convention+Center+New+Delhi"
};

if (!MAPS_CONFIG.apiKey) {
  console.error("Google Maps API key is missing!");
  // Throw an error in development
  if (import.meta.env.MODE === 'development') {
    throw new Error("Google Maps API key is required");
  }
}