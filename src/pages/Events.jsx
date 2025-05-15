import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaCalendarAlt, FaFilter, FaSearch, FaChevronDown, FaChevronUp, FaCircle } from "react-icons/fa";
import { databases } from "../api/appwriteConfig";
import eventBkgImage from "../assets/event_bkg_image.jpg"; // Import the background image
import PageLayout from "../components/PageLayout";

// Noise texture SVG
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

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    city: "",
    priceRange: [0, 10000],
    dateRange: "",
    sort: "newest"
  });

  // Filter accordions state
  const [expandedFilters, setExpandedFilters] = useState({
    sortBy: true,
    day: false,
    dateFilter: false,
    citySearch: false,
    price: false,
    moreFilters: false
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Log environment variables for debugging
        console.log("Database ID:", import.meta.env.VITE_APPWRITE_DATABASE_ID);
        console.log("Events Collection ID:", import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID);
        
        // Fetch events from Appwrite database
        const response = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COLLECTION_ID
        );

        console.log("Database response:", response);

        if (response && response.documents) {
          // Map the documents to include image URLs
          const eventsWithImages = response.documents.map(event => {
            const imageUrl = event.imageFileId 
              ? `https://cloud.appwrite.io/v1/storage/buckets/66dd97eb0009f68104ef/files/${event.imageFileId}/view?project=67699acf002ecc80c89f&mode=admin`
              : null;
            
            return {
              ...event,
              imageUrl
            };
          });
          
          console.log(`Processed ${eventsWithImages.length} events from database`);
          setEvents(eventsWithImages);
        } else {
          console.warn("No documents found in database response");
          setEvents([]);
          setError("No events found in the database");
        }
      } catch (error) {
        console.error("Error fetching events from database:", error);
        setError("Failed to fetch events: " + error.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Toggle filter accordions
  const toggleFilter = (filterName) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Clear a specific filter
  const clearFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: filterName === "priceRange" ? [0, 10000] : ""
    }));
  };

  // Helper to get minimum price from categories
  const getMinPrice = (event) => {
    if (!event.categories?.length) return 0;
    
    return event.categories.reduce((min, category) => {
      const parts = category.split(':');
      if (parts.length >= 2) {
        const price = parseFloat(parts[1]);
        return price < min && price > 0 ? price : min;
      }
      return min;
    }, Infinity) || 0;
  };

  // Apply filtering logic
  const filteredEvents = events.filter(event => {
    // Apply category filter
    if (filters.category && !event.category?.includes(filters.category)) {
      return false;
    }
    
    // Apply city filter - case insensitive
    if (filters.city && !event.location?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }

    // Apply price filter if we have categories with prices
    if (event.categories?.length > 0 && filters.priceRange[0] > 0) {
      // Extract minimum price from categories
      const minPrice = event.categories.reduce((min, category) => {
        const parts = category.split(':');
        if (parts.length >= 2) {
          const price = parseFloat(parts[1]);
          return price < min ? price : min;
        }
        return min;
      }, Infinity);

      if (minPrice < filters.priceRange[0] || minPrice > filters.priceRange[1]) {
        return false;
      }
    }

    return true;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (filters.sort === "newest") {
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    } else if (filters.sort === "oldest") {
      return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
    } else if (filters.sort === "priceAsc") {
      return getMinPrice(a) - getMinPrice(b);
    } else if (filters.sort === "priceDesc") {
      return getMinPrice(b) - getMinPrice(a);
    }
    return 0;
  });

  // Hero content for the page
  const heroContent = (
    <div className="text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
        Discover Amazing Events
      </h1>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        Find the perfect concerts, festivals, and performances tailored just for you
      </p>
    </div>
  );

  return (
    <PageLayout
      heroContent={heroContent}
      bgImageUrl={eventBkgImage}
      className="overflow-x-hidden"
    >
      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Explore Events
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter sidebar */}
          <div className="w-full md:w-1/4 lg:w-1/5">
            <div className="sticky top-24 space-y-4">
              {/* Filter header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Filter Options</h2>
                <button 
                  onClick={() => setFilters({
                    category: "",
                    city: "",
                    priceRange: [0, 10000],
                    dateRange: "",
                    sort: "newest"
                  })}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  clear
                </button>
              </div>
              
              {/* Sort by filter */}
              <div className="filter-group border border-gray-800 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/50"
                  onClick={() => toggleFilter('sortBy')}
                >
                  <h3 className="font-medium text-white">Sort By</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter('sort');
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      clear
                    </button>
                    {expandedFilters.sortBy ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                </div>
                
                {expandedFilters.sortBy && (
                  <div className="p-4 border-t border-gray-800 bg-black/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="newest" 
                        name="sort" 
                        value="newest"
                        checked={filters.sort === "newest"}
                        onChange={() => setFilters(prev => ({ ...prev, sort: "newest" }))}
                        className="accent-yellow-500"
                      />
                      <label htmlFor="newest" className="text-sm cursor-pointer text-white">Newest First</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="oldest" 
                        name="sort" 
                        value="oldest"
                        checked={filters.sort === "oldest"}
                        onChange={() => setFilters(prev => ({ ...prev, sort: "oldest" }))}
                        className="accent-yellow-500"
                      />
                      <label htmlFor="oldest" className="text-sm cursor-pointer text-white">Oldest First</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="priceAsc" 
                        name="sort" 
                        value="priceAsc"
                        checked={filters.sort === "priceAsc"}
                        onChange={() => setFilters(prev => ({ ...prev, sort: "priceAsc" }))}
                        className="accent-yellow-500"
                      />
                      <label htmlFor="priceAsc" className="text-sm cursor-pointer text-white">Price: Low to High</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="priceDesc" 
                        name="sort" 
                        value="priceDesc"
                        checked={filters.sort === "priceDesc"}
                        onChange={() => setFilters(prev => ({ ...prev, sort: "priceDesc" }))}
                        className="accent-yellow-500"
                      />
                      <label htmlFor="priceDesc" className="text-sm cursor-pointer text-white">Price: High to Low</label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Day filter */}
              <div className="filter-group border border-gray-800 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/50"
                  onClick={() => toggleFilter('day')}
                >
                  <h3 className="font-medium text-white">Day</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter('dateRange');
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      clear
                    </button>
                    {expandedFilters.day ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                </div>
                
                {expandedFilters.day && (
                  <div className="p-4 border-t border-gray-800 bg-black/50">
                    <div className="flex flex-wrap gap-2">
                      {['Today', 'Tomorrow', 'This Weekend', 'Next Week'].map(day => (
                        <button 
                          key={day}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            filters.dateRange === day 
                              ? 'bg-white/20 border-white/50 text-white' 
                              : 'border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                          onClick={() => setFilters(prev => ({ ...prev, dateRange: day }))}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Filter by Month and Date */}
              <div className="filter-group border border-gray-800 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/50"
                  onClick={() => toggleFilter('dateFilter')}
                >
                  <h3 className="font-medium text-white">Filter By Month and Date</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter('dateRange');
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      clear
                    </button>
                    {expandedFilters.dateFilter ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                </div>
                
                {expandedFilters.dateFilter && (
                  <div className="p-4 border-t border-gray-800 bg-black/50">
                    <input 
                      type="date" 
                      className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white"
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              
              {/* Search by your city */}
              <div className="filter-group border border-gray-800 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/50"
                  onClick={() => toggleFilter('citySearch')}
                >
                  <h3 className="font-medium text-white">Search by your city</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter('city');
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      clear
                    </button>
                    {expandedFilters.citySearch ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                </div>
                
                {expandedFilters.citySearch && (
                  <div className="p-4 border-t border-gray-800 bg-black/50">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Enter city name"
                        className="w-full bg-black/50 border border-gray-700 rounded p-2 pl-8 text-white"
                        value={filters.city}
                        onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-500" />
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'].map(city => (
                        <button 
                          key={city}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            filters.city === city 
                              ? 'bg-white/20 border-white/50 text-white' 
                              : 'border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                          onClick={() => setFilters(prev => ({ ...prev, city }))}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Price filter */}
              <div className="filter-group border border-gray-800 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/50"
                  onClick={() => toggleFilter('price')}
                >
                  <h3 className="font-medium text-white">Price</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter('priceRange');
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      clear
                    </button>
                    {expandedFilters.price ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                </div>
                
                {expandedFilters.price && (
                  <div className="p-4 border-t border-gray-800 bg-black/50">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Free', value: [0, 0] },
                        { label: '₹0 - ₹500', value: [0, 500] },
                        { label: '₹501 - ₹2000', value: [501, 2000] },
                        { label: 'Above ₹2000', value: [2001, 10000] }
                      ].map(range => (
                        <button 
                          key={range.label}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            filters.priceRange[0] === range.value[0] && filters.priceRange[1] === range.value[1]
                              ? 'bg-white/20 border-white/50 text-white' 
                              : 'border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                          onClick={() => setFilters(prev => ({ ...prev, priceRange: range.value }))}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* More Filters */}
              <div className="filter-group border border-gray-800 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/50"
                  onClick={() => toggleFilter('moreFilters')}
                >
                  <h3 className="font-medium text-white">More Filters</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter('category');
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      clear
                  </button>
                    {expandedFilters.moreFilters ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                </div>
                
                {expandedFilters.moreFilters && (
                  <div className="p-4 border-t border-gray-800 bg-black/50">
                    <h4 className="font-medium mb-2 text-sm text-white">Categories</h4>
                    <div className="space-y-2">
                      {['Music Concerts', 'Music Festivals', 'Theatre & Arts', 'Stand-up Comedy', 'Workshops'].map(category => (
                        <div key={category} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id={category} 
                            checked={filters.category === category}
                            onChange={() => setFilters(prev => ({ 
                              ...prev, 
                              category: prev.category === category ? "" : category 
                            }))}
                            className="accent-yellow-500"
                          />
                          <label htmlFor={category} className="text-sm cursor-pointer text-white">{category}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Events grid */}
          <div className="w-full md:w-3/4 lg:w-4/5">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="bg-black/30 backdrop-blur-sm border border-red-800/50 rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold mb-2 text-red-400">Error Loading Events</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <p className="text-gray-500 mb-4 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold mb-2">No events found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your filters or check back later for new events.</p>
                <button 
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                  onClick={() => setFilters({
                    category: "",
                    city: "",
                    priceRange: [0, 10000],
                    dateRange: "",
                    sort: "newest"
                  })}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((event) => (
                  <div 
                    key={event.$id}
                    className="bg-black/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-gray-600/70 transition-all transform hover:translate-y-[-4px] duration-300 shadow-lg cursor-pointer"
                    onClick={() => navigate(`/event-details/${event.$id}`)}
                  >
                    <div className="h-48 relative overflow-hidden">
                      {event.imageUrl ? (
                        <img 
                          src={event.imageUrl} 
                          alt={event.name} 
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex justify-center items-center">
                          <span className="text-2xl font-bold text-gray-700">{event.name?.charAt(0) || 'E'}</span>
                        </div>
                      )}
                      
                      {/* Age restriction badge if present */}
                      {event.ageRestriction && (
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                          For Age(s) {event.ageRestriction}+
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      
                      {/* Event category */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-xs px-3 py-1 rounded-full border border-gray-700/50 text-white">
                        {event.category || "Event"}
                      </div>
                      
                      {/* Event date */}
                      {event.date && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-gray-700/50">
                          {new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold line-clamp-1 text-white">{event.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-1 mt-1">{event.sub_name || event.tagline || ""}</p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        {event.location && (
                          <div className="flex items-center text-gray-400 text-xs">
                            <FaMapMarkerAlt className="text-red-500 mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{event.location}</span>
                          </div>
                        )}
                        
                        {event.date && (
                          <div className="flex items-center text-gray-400 text-xs">
                            <FaCalendarAlt className="text-gray-400 mr-1 flex-shrink-0" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Event tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.eventTags ? (
                          // If event has tags property, map through them
                          event.eventTags.split(',').map((tag, index) => (
                            <span 
                              key={index} 
                              className="inline-block bg-black/40 px-2 py-1 rounded-md text-xs text-gray-300"
                            >
                              {tag.trim()}
                            </span>
                          ))
                        ) : (
                          // Otherwise, create tags based on the category or event type
                          <>
                            {event.category === "Music Concerts" && (
                              <>
                                <span className="inline-block bg-black/40 px-2 py-1 rounded-md text-xs text-gray-300">Live Concert</span>
                                <span className="inline-block bg-black/40 px-2 py-1 rounded-md text-xs text-gray-300">Music</span>
                              </>
                            )}
                            {event.name.toLowerCase().includes('festival') && (
                              <span className="inline-block bg-black/40 px-2 py-1 rounded-md text-xs text-gray-300">Festival</span>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between items-center">
                        <span className="text-yellow-500 font-semibold">
                          {event.categories?.length > 0 && event.categories[0].includes(':') ? 
                            `₹${event.categories[0].split(':')[1].trim()}` : 
                            "₹TBA"}
                          <span className="text-xs text-gray-500 ml-1">onwards</span>
                        </span>
                        <button className="text-xs bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-white transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
      )}
    </div>
        </div>
      </div>
      
      {/* Add styles using standard style tag, not with jsx attribute */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        `}
      </style>
    </PageLayout>
  ); 
};

export default Events;