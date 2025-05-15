import { useState, useEffect, useRef } from "react";
import EventList from "../pages/EventList.jsx";
import { Client, Databases, ID, Storage } from "appwrite";
import { isAdmin } from "./authHelper.jsx";
import { MAPS_CONFIG } from "../config/config.jsx";

const AdminPanel = () => {
     const [showEventList, setShowEventList] = useState(false);
     const [editingIndex, setEditingIndex] = useState(null);
     const [events, setEvents] = useState([]);
     const [loading, setLoading] = useState(false);
     const [admin, setAdmin] = useState(false);
     const [phases, setPhases] = useState([]);
     const [categories, setCategories] = useState([]);
     const [showMapModal, setShowMapModal] = useState(false);
     const [selectedLocation, setSelectedLocation] = useState(null);
     const [venueName, setVenueName] = useState("");
     const [mapUrl, setMapUrl] = useState('');
     const [map, setMap] = useState(null);

     // Map related refs and state
     const modalMapRef = useRef(null);
     const modalMarkerRef = useRef(null);
     const autocompleteRef = useRef(null);
     const resultMapRef = useRef(null);
     const resultMarkerRef = useRef(null);
     const [location, setLocation] = useState(null); // { lat, lng, address }
     const [termsAndConditions, setTermsAndConditions] = useState("");

     useEffect(() => {
          isAdmin().then((res) => {
               setAdmin(res);
          });
     }, []);

     // Get Address from LatLng
     const getAddressFromCoords = async (lat, lng) => {
          const res = await fetch(
               `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_CONFIG.apiKey}`
          );
          const data = await res.json();

          if (!data.results?.[0]) return "Address not found";

          // Extract only the street address, locality, and city components
          const components = data.results[0].address_components;
          const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || '';
          const route = components.find(c => c.types.includes('route'))?.long_name || '';
          const locality = components.find(c => c.types.includes('locality'))?.long_name || '';
          const city = components.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '';

          // Construct address without Plus Code
          const addressParts = [];
          if (streetNumber) addressParts.push(streetNumber);
          if (route) addressParts.push(route);
          if (locality) addressParts.push(locality);
          if (city && !locality.includes(city)) addressParts.push(city);

          return addressParts.join(', ') || data.results[0].formatted_address;
     };

     // Initialize Modal Map
     useEffect(() => {
          if (!showMapModal || !window.google || !modalMapRef.current) return;

          const map = new window.google.maps.Map(modalMapRef.current, {
               center: { lat: 28.6139, lng: 77.209 },
               zoom: 14,
          });

          const marker = new window.google.maps.Marker({
               map,
               draggable: true,
          });

          const loadGoogleMaps = () => {
               const script = document.createElement('script');
               script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.apiKey}&libraries=places&callback=initMap`;
               script.async = true;
               script.defer = true;
               document.head.appendChild(script);
          };

          window.initMap = () => {
               // This will be called when Maps API is loaded
               console.log('Google Maps API loaded');
          };

          loadGoogleMaps();

          modalMarkerRef.current = marker;

          map.addListener("click", async (e) => {
               const lat = e.latLng.lat();
               const lng = e.latLng.lng();
               const address = await getAddressFromCoords(lat, lng);
               marker.setPosition({ lat, lng });
               map.setCenter({ lat, lng });
               setLocation({ lat, lng, address });
               setVenueName(address.split(",")[0] || address); // Set venue name as first part of address
          });

          marker.addListener("dragend", async (e) => {
               const lat = e.latLng.lat();
               const lng = e.latLng.lng();
               const address = await getAddressFromCoords(lat, lng);
               marker.setPosition({ lat, lng });
               map.setCenter({ lat, lng });
               setLocation({ lat, lng, address });
               setVenueName(address.split(",")[0] || address);
          });

          // Autocomplete
          if (autocompleteRef.current) {
               const auto = document.createElement("gmpx-place-autocomplete");
               auto.setAttribute("style", "width: 100%; padding: 8px; font-size: 16px;");
               auto.setAttribute("placeholder", "Search location...");
               auto.addEventListener("gmpx-placechange", async (e) => {
                    const place = e.detail;
                    const lat = place.location.latitude;
                    const lng = place.location.longitude;
                    const address = place.address.formattedAddress;
                    marker.setPosition({ lat, lng });
                    map.setCenter({ lat, lng });
                    setLocation({ lat, lng, address });
                    setVenueName(address.split(",")[0] || address);
               });
               autocompleteRef.current.innerHTML = "";
               autocompleteRef.current.appendChild(auto);
          }
     }, [showMapModal]);

     // Initialize Result Map (below Add Location)
     useEffect(() => {
          if (!location || !window.google || !resultMapRef.current) return;

          const map = new window.google.maps.Map(resultMapRef.current, {
               center: { lat: location.lat, lng: location.lng },
               zoom: 15,
          });

          const marker = new window.google.maps.Marker({
               position: { lat: location.lat, lng: location.lng },
               map,
          });

          resultMarkerRef.current = marker;

          // Update event data with location when location changes
          if (location && venueName) {
               setEventData(prev => ({
                    ...prev,
                    eventLocation_Lat_Lng_VenueName: `${location.lat},${location.lng},${venueName}`,
                    location: location.address
               }));
          }
     }, [location]);

     const client = new Client()
          .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
          .setProject(import.meta.env.VITE_APPWRITE_PROJECT);

     const databases = new Databases(client);
     const storage = new Storage(client);

     const [eventData, setEventData] = useState({
          name: "",
          sub_name: "",
          price: "",
          eventInfo: "",
          location: "",
          eventLocation_Lat_Lng_VenueName: "",
          organiserId: "",
          tags: "",
          totalTickets: "",
          ticketsLeft: "",
          image: null,
          existingImage: null,
          date: "",
          time: ""
     });

     useEffect(() => {
          fetchEvents();
     }, []);

     const fetchEvents = async () => {
          setLoading(true);
          try {
               const response = await databases.listDocuments(
                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_COLLECTION_ID
               );

               const eventsWithPhasesAndCategories = response.documents.map(event => {
                    // Preserve the original categories array
                    const originalCategories = Array.isArray(event.categories)
                         ? event.categories
                         : [];

                    // Initialize form categories (will be populated when editing)
                    const formCategories = {
                         "General Admission": { price: "", quantity: "", selected: false },
                         "VIP": { price: "", quantity: "", selected: false },
                         "VVIP": { price: "", quantity: "", selected: false }
                    };

                    return {
                         ...event,
                         categories: originalCategories, // Preserve all original categories
                         formCategories, // For form display
                         phase: event.phase || []
                    };
               });

               setEvents(eventsWithPhasesAndCategories);
          } catch (error) {
               console.error("Error fetching events:", error);
          } finally {
               setLoading(false);
          }
     };


     // In the addPhase function
     const addPhase = () => {
          setCategories([]); // Reset to empty array instead of static categories
          const newPhase = { name: "", startDate: "", endDate: "" };

          if (phases.length > 0) {
               const lastPhase = phases[phases.length - 1];
               newPhase.startDate = lastPhase.endDate || "";
          }

          setPhases([...phases, newPhase]);
     };

     // In handlePhaseChange, ensure categories and phases are updated correctly
     const handlePhaseChange = (index, field, value) => {
          const newPhases = [...phases];
          newPhases[index] = {
               ...newPhases[index],
               [field]: value
          };

          if (field === 'name') {
               setCategories([]); // Reset categories when phase name changes
          }

          if (field === 'endDate' && index < newPhases.length - 1) {
               newPhases[index + 1] = {
                    ...newPhases[index + 1],
                    startDate: value
               };
          }

          setPhases(newPhases);
     };

     const handleTicketBooking = async (eventId) => {
          try {
               // First get the current event data
               const event = await databases.getDocument(
                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_COLLECTION_ID,
                    eventId
               );

               // Calculate new tickets left (decrease by 1)
               const newTicketsLeft = Math.max(0, parseInt(event.ticketsLeft) - 1);

               // Also update the category quantity if currentTicket is selected
               let categories = event.categories || [];
               if (currentTicket) {
                    categories = categories.map(cat => {
                         if (cat.type === currentTicket.type) {
                              return {
                                   ...cat,
                                   quantity: Math.max(0, parseInt(cat.quantity) - 1).toString()
                              };
                         }
                         return cat;
                    });
               }

               // Update the event document with both changes
               await databases.updateDocument(
                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_COLLECTION_ID,
                    eventId,
                    {
                         ticketsLeft: newTicketsLeft.toString(),
                         categories: categories
                    }
               );

               // Refresh the events list
               await fetchEvents();
          } catch (error) {
               console.error("Error booking ticket:", error);
          }
     };

     // When editing an existing event, you must carefully load all the phase data without losing existing data
     const handleEdit = (index) => {
          const eventToEdit = events[index];

          // Parse location data if it exists
          if (eventToEdit.eventLocation_Lat_Lng_VenueName) {
               const [lat, lng, ...venueParts] = eventToEdit.eventLocation_Lat_Lng_VenueName.split(",");
               if (lat && lng) {
                    setLocation({
                         lat: parseFloat(lat),
                         lng: parseFloat(lng),
                         address: eventToEdit.location
                    });
                    setVenueName(venueParts.join(","));
               }
          }

          // Load categories from the event
          const loadedCategories = eventToEdit.categories?.map(cat => {
               const [name, price, quantity] = cat.split(":");
               return { name, price, quantity };
          }) || [];

          // Get all phases - fixed date parsing
          const loadedPhases = eventToEdit.phase?.map(p => {
               if (typeof p === 'string') {
                    // Split the phase string into parts
                    const parts = p.split(":");
                    if (parts.length >= 3) {
                         // The format is "PhaseName: StartDate: EndDate"
                         const name = parts[0].trim();
                         // The dates are already in readable format (e.g., "January 1, 2023")
                         // We need to convert them back to YYYY-MM-DD format for the date input
                         const startDate = parts[1] ? new Date(parts[1].trim()).toISOString().split('T')[0] : "";
                         const endDate = parts[2] ? new Date(parts[2].trim()).toISOString().split('T')[0] : "";
                         return { name, startDate, endDate };
                    }
               }
               // Fallback for invalid format
               return { name: p, startDate: "", endDate: "" };
          }) || [];

          setCategories(loadedCategories);
          setPhases(loadedPhases);

          setEventData({
               ...eventData,
               ...eventToEdit,
               sub_name: eventToEdit.sub_name || "",
               eventLocation_Lat_Lng_VenueName: eventToEdit.eventLocation_Lat_Lng_VenueName || "",
               existingImage: eventToEdit.imageField,
               image: null
          });
          setEditingIndex(index);
          setShowEventList(false);
     };

     const handleDelete = async (eventId) => {
          if (window.confirm("Are you sure you want to move this event to expired events?")) {
               setLoading(true);
               try {
                    // Step 1: Fetch the event data first
                    const eventToDelete = await databases.getDocument(
                         import.meta.env.VITE_APPWRITE_DATABASE_ID,
                         import.meta.env.VITE_APPWRITE_COLLECTION_ID,
                         eventId
                    );

                    // Step 2: Prepare data for expiredEvents (handle optional fields)
                    const expiredEventData = {
                         name: eventToDelete.name,
                         location: eventToDelete.location || "",
                         imageFileId: eventToDelete.imageFileId || "",
                         time: eventToDelete.time,
                         sub_name: eventToDelete.sub_name || "",
                         date: eventToDelete.date,
                         price: eventToDelete.price,
                         eventLocation_Lat_Lng_VenueName: eventToDelete.eventLocation_Lat_Lng_VenueName || "",
                         organiserId: eventToDelete.organiserId,
                         tags: eventToDelete.tags || [],
                         eventInfo: eventToDelete.eventInfo,
                         totalTickets: eventToDelete.totalTickets,
                         ticketsLeft: eventToDelete.ticketsLeft,
                         phase: eventToDelete.phase || [],
                         categories: eventToDelete.categories || [],
                         totalRevenue: eventToDelete.totalRevenue || "0",
                         totalAttendees: eventToDelete.totalAttendees || "0",
                    };

                    // Step 3: Save to expiredEvents first
                    await databases.createDocument(
                         import.meta.env.VITE_APPWRITE_DATABASE_ID,
                         "expiredEvents", // Make sure this collection exists!
                         ID.unique(),
                         expiredEventData
                    );

                    // Step 4: Only if save is successful, delete from main collection
                    await databases.deleteDocument(
                         import.meta.env.VITE_APPWRITE_DATABASE_ID,
                         import.meta.env.VITE_APPWRITE_COLLECTION_ID,
                         eventId
                    );

                    alert("Event moved to expired events successfully!");
                    await fetchEvents(); // Refresh the list
               } catch (error) {
                    console.error("Error moving event to expired:", error);
                    alert(`Failed to move event. Error: ${error.message}`);
               } finally {
                    setLoading(false);
               }
          }
     };

     const addCategory = () => {
          setCategories([...categories, { name: "", price: "", quantity: "" }]);
     };

     const removeCategory = (index) => {
          const newCategories = [...categories];
          newCategories.splice(index, 1);
          setCategories(newCategories);
     };

     const handleCategoryChange = (index, field, value) => {
          const newCategories = [...categories];
          newCategories[index] = {
               ...newCategories[index],
               [field]: value
          };
          setCategories(newCategories);
     };

     const formatTime = (time) => {
          const [hours, minutes] = time.split(":");
          const formattedHours = (hours % 12) || 12;
          const ampm = hours >= 12 ? "PM" : "AM";
          return `${formattedHours}:${minutes} ${ampm}`;
     };


     // Update the handleSubmit function to properly format phases and categories
     const handleSubmit = async (e) => {
          e.preventDefault();

          if (!eventData.name.trim() ||
               !eventData.organiserId.trim() ||
               !eventData.date || !eventData.time) {
               alert("All required fields must be filled!");
               return;
          }

          setLoading(true);

          try {
               let imageFileId = null;
               let imageUrl = eventData.existingImage;

               if (eventData.image) {
                    imageFileId = ID.unique();
                    await storage.createFile(
                         import.meta.env.VITE_APPWRITE_BUCKET_ID,
                         imageFileId,
                         eventData.image,
                    );
                    imageUrl = storage.getFilePreview(
                         import.meta.env.VITE_APPWRITE_BUCKET_ID,
                         imageFileId
                    ).href;
               }

               // Process phases - ensure proper formatting
               const formatToCustomReadable = (dateStr) => {
                    const parsed = new Date(dateStr);
                    const options = { month: 'long', day: 'numeric', year: 'numeric' };
                    return !isNaN(parsed) ? parsed.toLocaleDateString('en-US', options) : "";
               };

               const processedPhases = phases
                    .filter(p => p.name && p.name.trim() !== "")
                    .map((phase, index) => {
                         const startDate = index === 0 && !phase.startDate
                              ? eventData.date
                              : phase.startDate || "";

                         const adjustedStartDate = index > 0 && !phase.startDate && phases[index - 1].endDate
                              ? phases[index - 1].endDate
                              : startDate;

                         const readableStart = formatToCustomReadable(adjustedStartDate);
                         const readableEnd = phase.endDate ? formatToCustomReadable(phase.endDate) : "";

                         return `${phase.name.trim()}: ${readableStart}:${readableEnd}`;
                    });

               // Get current phase name
               const currentPhase = processedPhases.length > 0
                    ? processedPhases[processedPhases.length - 1].split(":")[0].trim()
                    : "";

               // Format NEW categories for current phase
               const newCategories = categories
                    .filter(cat => cat.name && cat.name.trim() !== "")
                    .map(cat =>
                         `${cat.name.trim()}:${cat.price}:${cat.quantity}${currentPhase ? `:${currentPhase}` : ''}`
                    );

               // Calculate total tickets from current categories
               const totalTickets = categories.reduce((sum, cat) => {
                    const quantity = parseInt(cat.quantity) || 0;
                    return sum + quantity;
               }, 0);

               let allCategoriesCombined = [];
               let ticketsLeft = totalTickets; // Initialize with total tickets

               if (editingIndex !== null) {
                    const existingCategories = events[editingIndex].categories || [];

                    // Check if we're adding a completely new phase
                    const isNewPhase = phases.some(p => {
                         const existingPhases = events[editingIndex].phases || [];
                         return !existingPhases.some(ep => ep.startsWith(p.name.trim() + ":"));
                    });

                    if (isNewPhase) {
                         // For a completely new phase, reset ticketsLeft to the new total
                         ticketsLeft = totalTickets;
                    } else {
                         // For existing phase updates, calculate based on previous sales
                         const originalTotal = parseInt(events[editingIndex].totalTickets) || 0;
                         const currentTicketsLeft = parseInt(events[editingIndex].ticketsLeft) || 0;
                         const ticketsSold = originalTotal - currentTicketsLeft;
                         ticketsLeft = Math.max(0, totalTickets - ticketsSold);
                    }

                    allCategoriesCombined = [
                         ...existingCategories.filter(existingCat => {
                              const existingCatParts = existingCat.split(':');
                              return existingCatParts[3] !== currentPhase;
                         }),
                         ...newCategories
                    ];
               } else {
                    allCategoriesCombined = newCategories;
               }

               const eventPayload = {
                    name: eventData.name,
                    sub_name: eventData.sub_name,
                    price: eventData.price.toString(),
                    eventInfo: eventData.eventInfo,
                    categories: allCategoriesCombined,
                    location: eventData.location,
                    eventLocation_Lat_Lng_VenueName: eventData.eventLocation_Lat_Lng_VenueName,
                    organiserId: eventData.organiserId.toString(),
                    tags: Array.isArray(eventData.tags)
                         ? eventData.tags
                         : eventData.tags.split(",").map(tag => tag.trim()),
                    totalTickets: totalTickets.toString(),
                    ticketsLeft: ticketsLeft.toString(), // Will be updated by your system
                    phase: processedPhases,
                    imageField: imageUrl,
                    imageFileId,
                    date: eventData.date,
                    time: formatTime(eventData.time),
                    termsAndConditions: termsAndConditions
               };

               if (editingIndex !== null) {
                    await databases.updateDocument(
                         import.meta.env.VITE_APPWRITE_DATABASE_ID,
                         import.meta.env.VITE_APPWRITE_COLLECTION_ID,
                         events[editingIndex].$id,
                         eventPayload
                    );
                    alert("Event Updated Successfully!");
               } else {
                    await databases.createDocument(
                         import.meta.env.VITE_APPWRITE_DATABASE_ID,
                         import.meta.env.VITE_APPWRITE_COLLECTION_ID,
                         ID.unique(),
                         eventPayload
                    );
                    alert("Event Added Successfully!");
               }


               await fetchEvents();
               setShowEventList(true);
               setEditingIndex(null); // Reset editing state
               setEventData({
                    name: "",
                    sub_name: "",
                    price: "",
                    eventInfo: "",
                    location: "",
                    eventLocation_Lat_Lng_VenueName: "",
                    organiserId: "",
                    tags: "",
                    totalTickets: "",
                    ticketsLeft: "",
                    image: null,
                    existingImage: null,
                    date: "",
                    time: ""
               });
               setCategories([]);
               setPhases([]);
          } catch (error) {
               console.error("Error saving event:", error);
               alert(`Error saving event: ${error.message}`);
          } finally {
               setLoading(false);
          }
     };
     useEffect(() => {
          if (eventData.eventLocation_Lat_Lng_VenueName) {
               const [lat, lng, venueName] = eventData.eventLocation_Lat_Lng_VenueName.split(",");
               if (lat && lng) {
                    const location = `${lat.trim()},${lng.trim()}`;
                    // Updated URL with zoom parameter and proper formatting
                    const url = `https://www.google.com/maps/embed/v1/view?key=${MAPS_CONFIG.apiKey}&center=${location}&zoom=15&maptype=roadmap`;
                    setMapUrl(url);
               }
          }
     }, [eventData.eventLocation_Lat_Lng_VenueName]);

     return (
          <div className="flex flex-col md:flex-row min-h-screen bg-gray-900">
               {/* Sidebar - remains unchanged */}
               <aside className="w-full md:w-1/4 bg-gray-800 p-4 md:p-5">
                    <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-4">
                         {admin && (
                              <button
                                   onClick={() => { setShowEventList(false); }}
                                   className="w-full md:w-full bg-blue-500 hover:bg-blue-600 text-white p-2 md:p-3 rounded-md"
                              >
                                   {editingIndex !== null ? "Edit Event" : "Add Event"}
                              </button>
                         )}
                         <button
                              onClick={() => setShowEventList(true)}
                              className="w-full md:w-full bg-green-500 hover:bg-green-600 text-white p-2 md:p-3 rounded-md"
                         >
                              Event List
                         </button>
                    </div>
               </aside>

               {/* Main Content */}
               <div className="w-full md:w-3/4 p-4 md:p-5">
                    {loading ? (
                         <div className="flex justify-center items-center h-full">
                              <div className="text-white text-xl">Loading...</div>
                         </div>
                    ) : showEventList ? (
                         <EventList events={events} onEdit={handleEdit} onDelete={handleDelete} />
                    ) : (
                         <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {Object.keys(eventData).map((key, index) => (
                                        key !== "image" && key !== "existingImage" && key !== "eventLocation_Lat_Lng_VenueName" && key !== "location" && (
                                             <div key={index} className="bg-gray-700 p-3 rounded-md">
                                                  <label className="block text-gray-300 text-sm mb-1 capitalize">{key}</label>
                                                  <textarea
                                                       type={key === "date" ? "date" : key === "time" ? "time" : "text"}
                                                       placeholder={key}
                                                       value={eventData[key]}
                                                       onChange={(e) => setEventData({ ...eventData, [key]: e.target.value })}
                                                       className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                       required={["name", "price", "organiserId", "totalTickets", "date", "time"].includes(key)}
                                                  />
                                             </div>
                                        )
                                   ))}

                                   {/* Location Section - Modified */}
                                   <div className="bg-gray-700 p-3 rounded-md">
                                        <label className="block text-gray-300 text-sm mb-1">Event Location</label>

                                        {/* Button to open map modal */}
                                        <button
                                             type="button"
                                             onClick={() => setShowMapModal(true)}
                                             className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md mb-3"
                                        >
                                             📍 Select Location on Map
                                        </button>

                                        {/* Display selected location details */}
                                        <textarea
                                             readOnly
                                             rows={4}
                                             value={
                                                  location
                                                       ? `Venue: ${venueName}\nLatitude: ${location.lat}\nLongitude: ${location.lng}\nAddress: ${location.address}`
                                                       : "No location selected"
                                             }
                                             className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-600 resize-none"
                                        />

                                        {/* Venue Name Input */}
                                        <input
                                             type="text"
                                             placeholder="Venue Name"
                                             value={venueName}
                                             onChange={(e) => setVenueName(e.target.value)}
                                             className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 mt-3"
                                        />

                                        {/* Map Preview */}
                                        {location && (
                                             <div className="mt-4">
                                                  <h4 className="text-gray-300 text-sm mb-2">Location Preview</h4>
                                                  <div
                                                       ref={resultMapRef}
                                                       className="w-full h-64 rounded-md border border-gray-600"
                                                  />
                                             </div>
                                        )}
                                   </div>
                              </div>

                              {/* Map Modal */}
                              {showMapModal && (
                                   <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                                        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-3xl relative">
                                             <button
                                                  onClick={() => setShowMapModal(false)}
                                                  className="absolute top-4 right-4 text-white text-xl"
                                             >
                                                  ❌
                                             </button>

                                             <h3 className="text-white text-xl mb-4">Select Event Location</h3>

                                             {/* Autocomplete Search */}
                                             <div ref={autocompleteRef} className="mb-4" />

                                             {/* Map Container */}
                                             <div
                                                  ref={modalMapRef}
                                                  className="w-full h-96 rounded-md"
                                             />

                                             {/* Confirm Selection Button */}
                                             <button
                                                  onClick={() => setShowMapModal(false)}
                                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md mt-4"
                                             >
                                                  Confirm Location
                                             </button>
                                        </div>
                                   </div>
                              )}

                              {/* Phases Section - remains unchanged */}
                              <div className="mt-4 bg-gray-700 p-3 rounded-md">
                                   <label className="block text-gray-300 text-sm mb-1">Event Phases</label>
                                   <button type="button" onClick={addPhase} className="bg-blue-500 text-white p-2 rounded-md">Add Phase</button>
                                   <div className="mt-2 space-y-2">
                                        {phases.map((phase, index) => (
                                             <div key={index} className="bg-gray-600 p-4 rounded-md space-y-2">
                                                  <input
                                                       type="text"
                                                       value={phase.name || ""}
                                                       onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                                                       placeholder={`Phase ${index + 1} Name`}
                                                       className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                  />
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                       <div>
                                                            <label className="block text-gray-300 text-sm mb-1">Start Date</label>
                                                            <input
                                                                 type="date"
                                                                 value={phase.startDate || ""}
                                                                 onChange={(e) => handlePhaseChange(index, 'startDate', e.target.value)}
                                                                 className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                                 disabled={index > 0}
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-gray-300 text-sm mb-1">End Date</label>
                                                            <input
                                                                 type="date"
                                                                 value={phase.endDate || ""}
                                                                 onChange={(e) => handlePhaseChange(index, 'endDate', e.target.value)}
                                                                 className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>

                              {/* Categories Selection - remains unchanged */}
                              <div className="mt-4 bg-gray-700 p-3 rounded-md">
                                   <div className="flex justify-between items-center mb-2">
                                        <label className="block text-gray-300 text-sm">Event Categories</label>
                                        <button
                                             type="button"
                                             onClick={addCategory}
                                             className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                                        >
                                             Add Category
                                        </button>
                                   </div>
                                   <div className="space-y-4">
                                        {categories.map((category, index) => (
                                             <div key={index} className="bg-gray-600 p-3 rounded-md">
                                                  <div className="flex justify-between items-center mb-2">
                                                       <div className="flex-1">
                                                            <label className="block text-gray-300 text-sm mb-1">Category Name</label>
                                                            <input
                                                                 type="text"
                                                                 value={category.name}
                                                                 onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                                                                 placeholder="Category Name"
                                                                 className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                            />
                                                       </div>
                                                       <button
                                                            type="button"
                                                            onClick={() => removeCategory(index)}
                                                            className="ml-2 bg-red-500 text-white p-2 rounded-md text-xs"
                                                       >
                                                            Remove
                                                       </button>
                                                  </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                       <div>
                                                            <label className="block text-gray-300 text-sm mb-1">Price</label>
                                                            <input
                                                                 type="text"
                                                                 value={category.price}
                                                                 onChange={(e) => handleCategoryChange(index, 'price', e.target.value)}
                                                                 placeholder="Price"
                                                                 className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-gray-300 text-sm mb-1">Quantity</label>
                                                            <input
                                                                 type="text"
                                                                 value={category.quantity}
                                                                 onChange={(e) => handleCategoryChange(index, 'quantity', e.target.value)}
                                                                 placeholder="Quantity"
                                                                 className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>

                              {/* Simplified Terms & Conditions Section */}
                              <div className="mt-4 bg-gray-700 p-3 rounded-md">
                                   <label className="block text-gray-300 text-sm font-bold mb-2">
                                        Terms & Conditions
                                   </label>
                                   <textarea
                                        value={termsAndConditions}
                                        onChange={(e) => setTermsAndConditions(e.target.value)}
                                        placeholder="Enter terms and conditions (one per line or as paragraphs)"
                                        className="w-full h-40 p-3 bg-gray-800 text-white rounded-md border border-gray-600"
                                   />
                              </div>

                              {/* Image Upload Section - remains unchanged */}
                              <div className="mt-4 bg-gray-700 p-3 rounded-md">
                                   <label className="block text-gray-300 text-sm mb-1">Upload Image</label>
                                   <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setEventData({ ...eventData, image: e.target.files[0] })}
                                        className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600"
                                   />
                                   {eventData.existingImage && (
                                        <div className="mt-3">
                                             <p className="text-gray-300 text-sm mb-1">Current Image:</p>
                                             <img
                                                  src={eventData.existingImage}
                                                  alt="Event"
                                                  className="max-h-32 rounded-md"
                                             />
                                        </div>
                                   )}
                              </div>

                              {/* Submit Button - remains unchanged */}
                              <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                   <button
                                        type="submit"
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-md w-full"
                                        disabled={loading}
                                   >
                                        {loading ? "Processing..." : editingIndex !== null ? "Update Event" : "Add Event"}
                                   </button>
                              </div>
                         </form>
                    )}
               </div>
          </div>
     );
};

export default AdminPanel;