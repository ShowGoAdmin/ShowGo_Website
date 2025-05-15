import React, { useState, useEffect } from "react";
import { fetchEvents, getImageUrl, subscribeToEvents } from "../api/appwriteConfig";

const EventList = ({ onEdit, onDelete }) => {
     const [events, setEvents] = useState([]);

     useEffect(() => {
          const getEvents = async () => {
               const eventData = await fetchEvents();
               const updatedEvents = eventData.map((event) => {
                    const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/66dd97eb0009f68104ef/files/${event.imageFileId}/view?project=67699acf002ecc80c89f`;
                    return { ...event, imageField: imageUrl };
               });
               setEvents(updatedEvents);
          };

          getEvents();

          const unsubscribe = subscribeToEvents(getEvents);
          return () => unsubscribe();
     }, []);


     return (
          <div className="min-h-screen bg-gray-900 p-4 md:p-6 lg:p-8">
               <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-6 md:mb-8 text-white uppercase tracking-wide bg-gray-800 py-3 px-4 sm:px-6 rounded-lg shadow-md">
                         Event List
                    </h2>

                    <div className="bg-gray-100 p-4 sm:p-6 rounded-lg shadow-xl w-full border-2 sm:border-4 border-gray-500">
                         {events.length === 0 ? (
                              <p className="text-center text-gray-600 text-lg py-8">No events found.</p>
                         ) : (
                              <div className="overflow-x-auto">
                                   <table className="w-full border-collapse text-xs sm:text-sm md:text-base border border-gray-400">
                                        <thead className="bg-gray-700 text-white uppercase border-b border-gray-400">
                                             <tr>
                                                  <th className="p-2 sm:p-3 md:p-4 text-left border-r border-gray-400">ID</th>
                                                  <th className="p-2 sm:p-3 md:p-4 text-left border-r border-gray-400">Name</th>
                                                  <th className="p-2 sm:p-3 md:p-4 text-left border-r border-gray-400">Price</th>
                                                  <th className="p-2 sm:p-3 md:p-4 text-left border-r border-gray-400 hidden sm:table-cell">Description</th>
                                                  <th className="p-2 sm:p-3 md:p-4 text-left border-r border-gray-400">Image</th>
                                                  <th className="p-2 sm:p-3 md:p-4 text-left">Actions</th>
                                             </tr>
                                        </thead>

                                        <tbody className="bg-white">
                                             {events.map((event, index) => (
                                                  <tr key={event.$id} className="border-b border-gray-400 hover:bg-gray-200 transition-all">
                                                       <td className="p-2 sm:p-3 md:p-4 font-bold text-gray-700 border-r border-gray-400">#{index + 1}</td>
                                                       <td className="p-2 sm:p-3 md:p-4 border-r border-gray-400 max-w-[100px] sm:max-w-none truncate">
                                                            {event.name || "No Event Name"}
                                                       </td>
                                                       <td className="p-2 sm:p-3 md:p-4 border-r border-gray-400">
                                                            {event.price || "N/A"}
                                                       </td>
                                                       <td className="p-2 sm:p-3 md:p-4 border-r border-gray-400">
                                                            {event.totalTickets}
                                                       </td>
                                                       <td className="p-2 sm:p-3 md:p-4 border-r border-gray-400">
                                                            {event.ticketsLeft}
                                                       </td>
                                                       <td className="p-2 sm:p-3 md:p-4 border-r border-gray-400 hidden sm:table-cell max-w-[200px] truncate">
                                                            {event.eventInfo || "No Description"}
                                                       </td>
                                                       <td className="p-2 sm:p-3 md:p-4 border-r border-gray-400">
                                                            {event.imageField ? (
                                                                 <img
                                                                      src={event.imageField}
                                                                      alt="Event"
                                                                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-md mx-auto shadow-md"
                                                                 />
                                                            ) : (
                                                                 <img
                                                                      src="https://marketplace.canva.com/EAGBUWcZJF4/1/0/1280w/canva-pink-and-black-modern-music-event-instagram-post-QHvqXDVWAn8.jpg"
                                                                      alt="No Image"
                                                                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-md mx-auto shadow-md"
                                                                 />
                                                            )}
                                                       </td>
                                                       <td className="p-2 sm:p-3 md:p-4 flex justify-center space-x-1 sm:space-x-2">
                                                            <button
                                                                 onClick={() => onEdit(index)}
                                                                 className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg font-semibold shadow-md text-xs sm:text-sm"
                                                            >
                                                                 Edit
                                                            </button>
                                                            <button
                                                                 onClick={() => onDelete(event.$id)}
                                                                 className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg font-semibold shadow-md text-xs sm:text-sm"
                                                            >
                                                                 Delete
                                                            </button>
                                                       </td>
                                                  </tr>
                                             ))}
                                        </tbody>
                                   </table>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default EventList;