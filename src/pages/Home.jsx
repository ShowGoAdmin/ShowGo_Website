import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useNavigate } from "react-router-dom";
import TwoArrows from "../assets/TwoArrows.png";
import Arrows from "../assets/Arrows.png";
import Users from "../assets/Users.png";
import DecorativeConcert from "../assets/DecorativeConcert.jpg";
import Transfer from "../assets/transfer.gif";
import Group from "../assets/group.gif";
import Sell from "../assets/sell.gif";
import EventBackground from "../assets/event_bkg_image.jpg";
import AnimatedButton from "../components/AnimatedButton";
import { fetchEvents, storage, subscribeToEvents } from "../api/appwriteConfig";
import { FaArrowRight, FaMapMarkerAlt, FaClock } from "react-icons/fa";

// Get Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY;

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

const Home = () => {
  const sliderRef = useRef(null);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  const [eventLocations, setEventLocations] = useState([]);
  const [mapUrl, setMapUrl] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
  const [mapZoom, setMapZoom] = useState(5); // Default zoom level for country view
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isEventListCollapsed, setIsEventListCollapsed] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null); // Track which marker is active/clicked
  const customInfoRef = useRef(null); // Reference to custom info window element

  useEffect(() => {
    const getEvents = async () => {
      const eventData = await fetchEvents();

      const updatedEvents = eventData.map((event) => {
        let imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/66dd97eb0009f68104ef/files/${event.imageFileId}/view?project=67699acf002ecc80c89f&mode=admin`;

        // Calculate cheapest ticket price if categories exist
        let cheapestPrice = null;
        if (event.categories && Array.isArray(event.categories) && event.categories.length > 0) {
          // Get the current phase for this event
          const currentPhase = event.phase && Array.isArray(event.phase) && event.phase.length > 0
            ? event.phase[event.phase.length - 1].split(':')[0]?.trim()
            : null;

          console.log(`Event: ${event.name}, Current Phase: ${currentPhase}`);
          
          // Filter valid categories and find the cheapest price
          const validPrices = event.categories
            .filter(cat => {
              try {
                const parts = cat.split(':').map(item => item.trim());
                if (parts.length < 3) return false; // Need at least name:price:qty
                
                // If there's a phase tag (4th part), check if it matches current phase
                const phaseTag = parts.length >= 4 ? parts[3] : null;
                
                // If the category has a phase tag, it must match current phase
                // If no phase tag, include it regardless of current phase
                const phaseMatch = phaseTag ? phaseTag === currentPhase : true;
                
                return phaseMatch;
              } catch (err) {
                console.log(`Invalid category format for event ${event.name}:`, cat);
                return false;
              }
            })
            .map(cat => {
              try {
                const [name, price, qty] = cat.split(':').map(item => item.trim());
                return {
                  price: parseFloat(price),
                  available: parseInt(qty) || 0
                };
              } catch (err) {
                console.log(`Error parsing price for event ${event.name}:`, cat);
                return { price: Infinity, available: 0 };
              }
            })
            .filter(ticket => ticket.available >= 0 && !isNaN(ticket.price));

          if (validPrices.length > 0) {
            cheapestPrice = validPrices.reduce(
              (min, ticket) => ticket.price < min ? ticket.price : min,
              validPrices[0].price
            );
            console.log(`Event: ${event.name}, Cheapest Price in current phase: ₹${cheapestPrice}`);
          } else {
            console.log(`Event: ${event.name}, No valid prices found in current phase`);
          }
        }

        return { 
          ...event, 
          imageField: imageUrl,
          cheapestPrice: cheapestPrice
        };
      });

      setEvents(updatedEvents);
      
      // Extract location data from events for the map
      const locations = [];
      updatedEvents.forEach(event => {
        if (event.eventLocation_Lat_Lng_VenueName) {
          try {
            // Check if the string uses colons or commas as separators
            const useColons = event.eventLocation_Lat_Lng_VenueName.includes(':');
            const separator = useColons ? ':' : ',';
            
            // Split using the appropriate separator
            const [lat, lng, venueName] = event.eventLocation_Lat_Lng_VenueName.split(separator).map(item => item.trim());
            const parsedLat = parseFloat(lat);
            const parsedLng = parseFloat(lng);
            
            // Only add locations with valid coordinates
            if (isFinite(parsedLat) && isFinite(parsedLng)) {
              locations.push({
                lat: parsedLat,
                lng: parsedLng,
                name: event.name,
                id: event.$id,
                venue: venueName || 'Venue',
                imageUrl: event.imageField // Include the event image URL for the info window
              });
              console.log(`Valid location for "${event.name}": ${parsedLat},${parsedLng} (${venueName})`);
            } else {
              console.warn(`Skipping event '${event.name}' due to invalid coordinates: ${lat},${lng}`);
            }
          } catch (err) {
            console.error(`Error parsing location for event '${event.name}':`, err, 
                          `Raw value: "${event.eventLocation_Lat_Lng_VenueName}"`);
          }
        }
      });
      
      setEventLocations(locations);
      
      // Calculate map center and set zoom only if we have valid locations
      if (locations.length > 0) {
        // Calculate the average lat/lng to center the map
        let totalLat = 0;
        let totalLng = 0;
        let validLocations = 0;
        
        locations.forEach(loc => {
          if (isFinite(loc.lat) && isFinite(loc.lng)) {
            totalLat += loc.lat;
            totalLng += loc.lng;
            validLocations++;
          }
        });
        
        // Only calculate average if we have valid locations
        if (validLocations > 0) {
          const centerLat = totalLat / validLocations;
          const centerLng = totalLng / validLocations;
          
          // Verify the calculated values are valid
          if (isFinite(centerLat) && isFinite(centerLng)) {
            // Set map center and appropriate zoom
            setMapCenter({ lat: centerLat, lng: centerLng });
            setMapZoom(locations.length > 1 ? 9 : 13);
            
            // Generate Google Maps URL for iframe fallback with API key
            let embedUrl;
            
            if (locations.length === 1) {
              // For a single location, use place mode
              embedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${centerLat},${centerLng}&zoom=13`;
            } else if (locations.length <= 10) {
              // For up to 10 locations, use directions mode with waypoints to show all markers
              embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}`;
              
              // Find first valid location for origin
              const firstValidLoc = locations.find(loc => isFinite(loc.lat) && isFinite(loc.lng));
              // Find last valid location for destination
              const validLocs = locations.filter(loc => isFinite(loc.lat) && isFinite(loc.lng));
              const lastValidLoc = validLocs[validLocs.length - 1];
              
              if (firstValidLoc && lastValidLoc) {
                embedUrl += `&origin=${firstValidLoc.lat},${firstValidLoc.lng}`;
                embedUrl += `&destination=${lastValidLoc.lat},${lastValidLoc.lng}`;
                
                // Add waypoints for locations in between (only valid ones)
                const waypoints = validLocs.slice(1, -1);
                if (waypoints.length > 0) {
                  embedUrl += '&waypoints=';
                  embedUrl += waypoints.map(loc => `${loc.lat},${loc.lng}`).join('|');
                }
                
                // Set the mode to walking to make it more natural for event locations
                embedUrl += '&mode=walking&avoid=highways';
              } else {
                // Fallback if we don't have valid origin/destination
                embedUrl = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${centerLat},${centerLng}&zoom=9`;
              }
            } else {
              // For more than 10 locations, use view mode as fallback
              embedUrl = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${centerLat},${centerLng}&zoom=9`;
            }
            
            setMapUrl(embedUrl);
          } else {
            console.error("Invalid center coordinates calculated:", centerLat, centerLng);
            // Set a default center as fallback
            setMapCenter({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
            setMapZoom(5);
          }
        } else {
          console.warn("No valid locations found for map centering");
          // Set a default center as fallback
          setMapCenter({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
          setMapZoom(5);
        }
      } else {
        console.warn("No locations available for map");
      }
    };

    getEvents();
    const unsubscribe = subscribeToEvents(getEvents);
    return () => unsubscribe();
  }, []);

  // Effect to initialize the map with markers after component mounts
  useEffect(() => {
    // Skip if no locations or map already loaded
    if (eventLocations.length === 0 || !mapRef.current || mapLoaded) return;
    
    // Function to initialize map
    const initializeMap = () => {
      // Check if Google Maps is loaded
      if (window.google && window.google.maps) {
        // Validate map center coordinates to prevent NaN errors
        const center = {
          lat: isFinite(mapCenter.lat) ? mapCenter.lat : 0,
          lng: isFinite(mapCenter.lng) ? mapCenter.lng : 0
        };
        
        // If coordinates are invalid, use a default center point
        if (center.lat === 0 && center.lng === 0) {
          // Default to a central location (e.g., center of country)
          center.lat = 20.5937;  // Center of India (example)
          center.lng = 78.9629;
          console.log("Using default map center due to invalid coordinates");
        }
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: mapZoom,
          mapTypeId: 'roadmap',
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER
          }
        });
        
        // Create custom info window div
        const customInfoWindow = document.createElement('div');
        customInfoWindow.className = 'custom-info-window';
        customInfoWindow.style.cssText = `
          position: absolute;
          display: none;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 8px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.5);
          max-width: 300px;
          width: 300px;
          padding: 0;
          z-index: 1000;
          overflow: hidden;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -105%);
          transition: all 0.3s ease;
        `;
        mapRef.current.appendChild(customInfoWindow);
        customInfoRef.current = customInfoWindow;
        
        // Add close button click handler
        const closeInfoWindow = () => {
          customInfoWindow.style.display = 'none';
          customInfoWindow.innerHTML = '';
          setActiveMarker(null);
        };
        
        // Close info window when clicking on the map
        map.addListener('click', closeInfoWindow);
        
        // Add markers for each location - only for valid coordinates
        const bounds = new window.google.maps.LatLngBounds();
        let validMarkersAdded = 0;
        let totalLocations = 0;
        
        eventLocations.forEach((location, index) => {
          // Skip invalid coordinates
          if (!isFinite(location.lat) || !isFinite(location.lng)) {
            console.warn(`Skipping marker #${index+1} due to invalid coordinates`);
            return;
          }
          
          totalLocations++;
          console.log(`Adding marker #${totalLocations} at ${location.lat},${location.lng} for ${location.name}`);
          
          // Create marker position
          const position = { lat: location.lat, lng: location.lng };
          
          let marker;
          
          // Check if Advanced Marker API is available
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            // Use AdvancedMarkerElement (new API)
            try {
              // First, create a custom marker element
              const markerElement = document.createElement("div");
              markerElement.className = "custom-marker";
              markerElement.style.display = "flex";
              markerElement.style.alignItems = "center";
              markerElement.style.justifyContent = "center";
              markerElement.style.width = "30px";
              markerElement.style.height = "30px";
              markerElement.style.borderRadius = "50%";
              markerElement.style.background = "#f84464";
              markerElement.style.color = "white";
              markerElement.style.fontWeight = "bold";
              markerElement.style.fontSize = "14px";
              markerElement.style.border = "2px solid white";
              markerElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
              markerElement.innerHTML = String(index + 1);
              
              // Create the advanced marker
              marker = new window.google.maps.marker.AdvancedMarkerElement({
                map,
                position,
                title: location.name,
                content: markerElement,
              });
              
              console.log("Using AdvancedMarkerElement for marker", index + 1);
            } catch (error) {
              console.error("Error creating advanced marker:", error);
              // Fall back to traditional marker
              marker = createTraditionalMarker(map, position, location.name, index);
            }
          } else {
            // Fall back to traditional marker if Advanced Marker API is not available
            console.log("Advanced Marker API not available, using traditional marker");
            marker = createTraditionalMarker(map, position, location.name, index);
          }
          
          // Extend bounds to include this marker
          bounds.extend(position);
          validMarkersAdded++;
          
          // Create showCustomInfoWindow function for this marker
          const showCustomInfoWindow = () => {
            // Set this marker as active
            setActiveMarker(location.id);
            
            // Create content for the custom info window
            const content = `
              <div class="event-popup">
                <div class="event-popup-image" style="height: 150px; overflow: hidden; position: relative;">
                  <img src="${location.imageUrl}" alt="${location.name}" 
                       style="width: 100%; height: 100%; object-fit: cover; display: block;">
                  <div class="event-popup-badge" style="position: absolute; top: 10px; left: 10px; background: #f84464; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${index + 1}</div>
                  <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
                  <button class="event-close-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; font-weight: bold;">✕</button>
                </div>
                <div class="event-popup-content" style="padding: 15px;">
                  <h3 style="margin: 0 0 8px; font-size: 18px; line-height: 1.3;">${location.name}</h3>
                  <p style="margin: 0 0 12px; font-size: 13px; color: #cccccc; display: flex; align-items: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right: 5px; color: #f84464;">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    ${location.venue}
                  </p>
                  <a href="/event-details/${location.id}" 
                     style="display: block; padding: 8px 16px; background: #f84464; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold; text-align: center; margin-top: 12px; transition: background 0.2s;">
                     View Event Details
                  </a>
                </div>
              </div>
            `;
            
            // Set content and show the custom info window
            customInfoWindow.innerHTML = content;
            customInfoWindow.style.display = 'block';
            
            // Calculate position to place the custom info window - position it above the marker
            const markerPosition = marker.position;
            const markerPixelPosition = fromLatLngToPixel(markerPosition, map);
            
            // Position the div relative to the marker
            customInfoWindow.style.left = `${markerPixelPosition.x}px`;
            customInfoWindow.style.top = `${markerPixelPosition.y}px`;
            
            // Add listener to close button
            const closeButton = customInfoWindow.querySelector('.event-close-btn');
            if (closeButton) {
              closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                closeInfoWindow();
              });
            }
          };
          
          // Add click listener to open custom info window
          if (marker instanceof window.google.maps.Marker) {
            marker.addListener("click", showCustomInfoWindow);
          } else {
            // Advanced marker click handler
            try {
              marker.addListener("click", showCustomInfoWindow);
            } catch (error) {
              console.error("Error adding click listener to advanced marker:", error);
            }
          }
        });
        
        // Helper function to create traditional marker
        function createTraditionalMarker(map, position, title, index) {
          return new window.google.maps.Marker({
            position,
            map,
            title,
            label: {
              text: String(index + 1),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            },
            animation: window.google.maps.Animation.DROP,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#f84464',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10,
            }
          });
        }
        
        // Helper function to convert LatLng to pixel position
        function fromLatLngToPixel(latLng, map) {
          const projection = map.getProjection();
          const bounds = map.getBounds();
          
          if (!projection || !bounds) {
            // Fall back to center of map container if projection isn't ready
            const mapDiv = map.getDiv();
            return {
              x: mapDiv.offsetWidth / 2,
              y: mapDiv.offsetHeight / 2
            };
          }
          
          const scale = Math.pow(2, map.getZoom());
          const worldPoint = projection.fromLatLngToPoint(latLng);
          const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
          const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
          const p = map.getDiv();
          
          return {
            x: (worldPoint.x - bottomLeft.x) * scale,
            y: (worldPoint.y - topRight.y) * scale
          };
        }
        
        // Add event listener for map changes to update custom info window position
        map.addListener('zoom_changed', () => {
          if (activeMarker && customInfoWindow.style.display === 'block') {
            // Find the location for the active marker
            const location = eventLocations.find(loc => loc.id === activeMarker);
            if (location) {
              const position = { lat: location.lat, lng: location.lng };
              const pixelPosition = fromLatLngToPixel(position, map);
              
              // Update position
              customInfoWindow.style.left = `${pixelPosition.x}px`;
              customInfoWindow.style.top = `${pixelPosition.y}px`;
            }
          }
        });
        
        map.addListener('center_changed', () => {
          if (activeMarker && customInfoWindow.style.display === 'block') {
            // Find the location for the active marker
            const location = eventLocations.find(loc => loc.id === activeMarker);
            if (location) {
              const position = { lat: location.lat, lng: location.lng };
              const pixelPosition = fromLatLngToPixel(position, map);
              
              // Update position
              customInfoWindow.style.left = `${pixelPosition.x}px`;
              customInfoWindow.style.top = `${pixelPosition.y}px`;
            }
          }
        });
        
        console.log(`Successfully added ${validMarkersAdded} markers out of ${eventLocations.length} locations`);
        
        // Only adjust bounds if we added valid markers
        if (validMarkersAdded > 0) {
          try {
            console.log("Fitting map to bounds of all markers");
            map.fitBounds(bounds);
            
            // Add a small padding to bounds and limit maximum zoom
            const boundsListener = window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
              // Check if we're zoomed too far out or if we have very few markers
              const currentZoom = map.getZoom();
              
              // If we have 3 or fewer markers or the zoom is smaller than 4 (too zoomed out)
              if (validMarkersAdded <= 3 || currentZoom < 4) {
                // Reset to default India view if the map is zoomed out too far
                map.setCenter({ lat: 20.5937, lng: 78.9629 }); // Center of India
                map.setZoom(validMarkersAdded <= 1 ? 5 : 4); // Country-level view
                console.log("Resetting to default India view - markers were too spread out");
              }
              else if (currentZoom > 12) {
                map.setZoom(12); // Don't zoom in too far
              }
            });
          } catch (error) {
            console.error("Error adjusting map bounds:", error);
            // In case of bounds error, reset to default India view
            map.setCenter({ lat: 20.5937, lng: 78.9629 }); // Center of India
            map.setZoom(5); // Country-level view
          }
        } else {
          // No valid markers, set to default India view
          console.warn("No valid markers, using default India view");
          map.setCenter({ lat: 20.5937, lng: 78.9629 }); // Center of India
          map.setZoom(5); // Country-level view
        }
        
        setMapLoaded(true);
        console.log("Map initialization complete");
      } else {
        // Google Maps not yet loaded, load it with API key and required libraries
        const script = document.createElement('script');
        // Include both marker and maps libraries
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&v=weekly`;
        script.async = true;
        script.defer = true;
        
        // Add error handler for API key issues
        script.onerror = () => {
          console.error("Failed to load Google Maps JavaScript API");
          // Show fallback UI
          if (mapRef.current) {
            mapRef.current.innerHTML = `
              <div class="flex flex-col items-center justify-center w-full h-full text-white/70 text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="font-semibold">Unable to load map</p>
                <p class="text-sm mt-2 max-w-xs">The map could not be loaded. This might be due to an authorization issue with the API key or network connectivity.</p>
              </div>
            `;
          }
        };
        
        // Define callback for when Maps loads
        window.initMap = function() {
          try {
            initializeMap();
          } catch (error) {
            console.error("Error initializing map:", error);
            
            // Handle RefererNotAllowedMapError specifically
            if (error.message?.includes("RefererNotAllowedMapError")) {
              if (mapRef.current) {
                mapRef.current.innerHTML = `
                  <div class="flex flex-col items-center justify-center w-full h-full text-white/70 text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p class="font-semibold">API Key Not Configured for This Domain</p>
                    <p class="text-sm mt-2 max-w-xs">The Google Maps API key is not authorized for this domain. Please add "${window.location.hostname}" to the allowed domains in the Google Cloud Console.</p>
                    <p class="text-sm mt-2">API Key: ${GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.substring(0, 8) + '...' : 'Not found'}</p>
                  </div>
                `;
              }
            }
          }
        };
        
        document.head.appendChild(script);
      }
    };
    
    // Try to initialize map
    initializeMap();
  }, [eventLocations, mapCenter, mapZoom, mapLoaded]);

  const handleDiveInClick = () => {
    navigate("/events");
  };

  const handleEventClick = (eventId) => {
    navigate(`/event-details/${eventId}`);
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 200,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 2500,
    cssEase: "ease-in-out",
    swipeToSlide: true,
    draggable: true,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: "15%",
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: "10%",
        },
      },
    ],
  };

  return (
    <>
      <div className="overflow-x-hidden bg-black relative">
        {/* Fixed background image with adjusted settings for better visibility */}
        
        
        <div 
          className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;base64,${noiseSvgBase64}")`,
            backgroundRepeat: 'repeat',
          }}
        ></div>
        
        {/* Content with higher z-index to appear above backgrounds */}
        <div className="relative z-10">
          {/* Heading Section - Adjusted top padding to account for navbar */}
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-white text-5xl md:text-7xl mt-25 font-bold text-center tracking-wide leading-tight max-w-[885px] font-inter">
            Snap Tickets, <br /> Share Moments
          </h1>
            
            {/* "Dive In" Button - using AnimatedButton */}
            <div className="mt-8">
              <AnimatedButton
                text="Dive In"
                to="/events"
                className="text-lg"
              />
        </div>
          </div>

          {/* Feature Section - Now in its own section */}
          <div className="text-white p-4 w-full flex flex-col md:flex-row gap-8 md:gap-4 lg:gap-8 justify-center items-center mb-12">
            <div className="flex-1 flex flex-col items-center gap-3 text-center max-w-[350px]">
              <img
                src={TwoArrows}
                alt="TransferIcon"
                className="w-[35px] h-[45px] sm:w-[41.43px] sm:h-[53px]"
              />
              <h1 className="font-inter text-[28px] sm:text-[32px] md:text-[36px] leading-[35px] sm:leading-[39px] tracking-[0.07em]">
                Transfer Your Ticket
              </h1>
              <p className="text-sm sm:text-base">
                Can't make it to the show? Easily transfer your ticket to a
                friend and let them enjoy the event in your place.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-3 text-center max-w-[350px]">
              <img
                src={Arrows}
                alt="SellTicketIcon"
                className="w-[35px] h-[45px] sm:w-[41.43px] sm:h-[53px]"
              />
              <h1 className="font-inter text-[28px] sm:text-[32px] md:text-[36px] leading-[35px] sm:leading-[39px] tracking-[0.07em]">
                Sell Your Ticket
              </h1>
              <p className="text-sm sm:text-base">
                If plans change, sell your ticket directly through our platform,
                and find a new buyer quickly and securely.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-3.5 text-center max-w-[350px]">
              <img
                src={Users}
                alt="UserIcon"
                className="w-[35px] h-[45px] sm:w-[41.43px] sm:h-[53px]"
              />
              <h1 className="font-inter text-[28px] sm:text-[32px] md:text-[36px] leading-[35px] sm:leading-[39px] tracking-[0.07em]">
                Group Bookings
              </h1>
              <p className="text-sm sm:text-base">
                Book with friends and keep track of everyone's plans.
              </p>
            </div>
          </div>

          <div className="min-h-[70vh] w-full px-4 py-8 flex flex-col xl:flex-row items-center justify-center gap-6 relative">
            {/* Background Container - Changed from white to black */}
            <div className="absolute inset-0 bg-black rounded-3xl mx-4 shadow-2xl overflow-hidden z-0">
              {/* Subtle Pattern Overlay */}
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-900 to-purple-900"></div>
            </div>
            
            {/* Replace iframe with Google Maps JavaScript API implementation */}
            <div className="w-[500px] h-[500px] rounded-[20px] overflow-hidden shadow-lg z-10 border border-gray-800 relative bg-gray-900 flex items-center justify-center">
              {/* Map container that will hold the Google Map */}
              <div 
                ref={mapRef} 
                className="absolute inset-0 rounded-[20px]" 
                id="event-map"
              ></div>
              
              {/* Fallback iframe in case JS map doesn't load */}
              {!mapLoaded && mapUrl && (
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  className="rounded-[20px]"
                  title="Event Locations Map"
                ></iframe>
              )}
              
              {/* Loading state when no map is ready */}
              {!mapLoaded && !mapUrl && (
                <div className="flex flex-col items-center justify-center w-full h-full text-white/70 text-center p-4">
                  <FaMapMarkerAlt className="text-red-500 text-4xl mb-3" />
                  <p>Loading event locations...</p>
                  <p className="text-sm mt-1">Discover concerts near you</p>
                </div>
              )}
              
              {/* Event location list tooltip - collapsable */}
              <div className={`absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-lg border border-gray-700/50 transition-all duration-300 ${isEventListCollapsed ? 'w-10 h-10 overflow-hidden' : 'max-w-[250px] max-h-[200px] overflow-y-auto scrollbar-hide'}`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold ${isEventListCollapsed ? 'hidden' : 'mb-2'} text-center`}>Event Locations</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEventListCollapsed(!isEventListCollapsed);
                    }}
                    className={`text-gray-400 hover:text-white transition-colors ${isEventListCollapsed ? 'ml-auto mr-auto' : ''}`}
                    aria-label={isEventListCollapsed ? "Expand event list" : "Collapse event list"}
                  >
                    {isEventListCollapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
        </div>

                {!isEventListCollapsed && (
                  <>
                    <ul className="space-y-2">
                      {eventLocations.map((loc, index) => (
                        <li 
                          key={loc.id} 
                          className="flex items-start p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                          onClick={() => handleEventClick(loc.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] mr-2 flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{loc.name}</p>
                            <p className="text-gray-400 text-[10px]">{loc.venue}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-center mt-2 text-[10px] text-gray-400">Click on an event to view details</p>
                  </>
                )}
              </div>

              {/* Badge indicating number of events - visible when list is collapsed */}
              {isEventListCollapsed && eventLocations.length > 0 && (
                <div 
                  className="absolute bottom-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full border border-white/30 shadow-lg cursor-pointer z-20"
                  onClick={() => setIsEventListCollapsed(false)}
                >
                  {eventLocations.length}
                </div>
              )}

              {/* Overlay for better visibility of map controls */}
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
              
              {/* Event count badge */}
              <div className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full border border-gray-700/50 backdrop-blur-sm">
                {eventLocations.length} {eventLocations.length === 1 ? 'Event' : 'Events'} Available
              </div>
            </div>

            {/* Text Content - Changed text color to white */}
            <div className="flex flex-col items-end justify-center z-10">
              {/* Title - Updated size and colors */}
              <h2
                className="font-anton text-[56px] leading-[110%] tracking-[0.18em] text-right text-white"
                style={{ width: '320px', height: '320px' }}
            >
              Discover<br />
              Concerts<br />
              Tailored<br />
              Just for<br />
              You!
            </h2>

              {/* Description - Updated colors */}
            <p
                className="font-Cantarell text-[18px] leading-[170%] tracking-[-1%] text-right mt-4 text-gray-300"
              style={{
                  width: '350px',
              }}
            >
              Connect your Spotify account, and<br />
              receive concert recommendations<br />
              based on the artists you listen<br />
              to the most.
            </p>
          </div>

            {/* Concert Image - Made wider */}
          <img
            src={DecorativeConcert}
            alt="Concert illustration"
              className="w-[500px] h-[500px] rounded-[20px] object-cover shadow-lg z-10 border border-gray-800"
          />
        </div>

          {/* Trending Events Section with Carousel - Updated to match Event Details page style */}
          <div className="w-full px-4 md:px-12 py-8 mt-8">
            <h2 className="text-4xl font-bold mb-6 flex items-center justify-between">
              <div className="flex items-center text-white">
                Trending Events
              </div>
              <button 
                onClick={() => navigate("/events")} 
                className="text-sm flex items-center text-gray-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                View all events <FaArrowRight className="ml-2" />
              </button>
            </h2>

            {events.length === 0 ? (
              <div className="text-gray-400 text-center py-16 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-800/50">
                <p>No trending events found.</p>
                <button 
                  onClick={() => navigate("/events")}
                  className="mt-4 inline-block px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors cursor-pointer"
                >
                  Browse all events
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* Shadow Indicator for scrollable content */}
                <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
                
                {/* Scrollable Container */}
                <div className="overflow-x-auto pb-6 scrollbar-hide">
                  <div className="flex space-x-6" style={{ minWidth: 'max-content' }}>
                    {events.map((event) => (
                      <div 
                        key={event.$id} 
                        className="w-72 flex-shrink-0 bg-black/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all transform hover:translate-y-[-4px] duration-300 shadow-lg"
                    onClick={() => handleEventClick(event.$id)}
                        role="button"
                        tabIndex={0}
                  >
                        <div className="h-40 w-full relative overflow-hidden">
                        <img
                          src={event.imageField}
                          alt={event.name}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                          />
                          
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          
                          {/* Event date chip */}
                          {event.date && (
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-gray-700/50">
                              {new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-lg font-semibold line-clamp-1 text-white">{event.name}</h3>
                          <p className="text-gray-400 text-sm line-clamp-1 mt-1">{event.sub_name || event.tagline || "Event"}</p>
                          
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex items-center text-gray-400 text-xs">
                              <FaMapMarkerAlt className="text-red-500 mr-1" />
                              <span className="truncate max-w-[120px]">{event.location || "TBA"}</span>
                            </div>
                            
                            {event.time && (
                              <div className="flex items-center text-gray-400 text-xs">
                                <FaClock className="mr-1" />
                                <span>{event.time}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between items-center">
                            <span className="text-yellow-500 font-semibold">
                              {event.cheapestPrice ? `₹${event.cheapestPrice} onwards` : event.price ? `₹${event.price}` : "TBA"}
                            </span>
                            <button className="text-xs bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-white transition-colors">
                              View
                            </button>
                          </div>
                      </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              )}
        </div>

        {/* Transfer Ticket Section */}
        <div className="w-full flex flex-col justify-center items-center gap-8 md:flex-row md:justify-between md:items-center py-8 px-4 md:px-8 lg:px-12">
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start gap-6 md:pl-8 lg:pl-12">
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center md:text-left">
              Last-minute change? <br /> No problem! <br /> Easily transfer your{" "}
              <br /> ticket to a friend!
            </h1>
              <AnimatedButton
                text="Explore"
                to="/events"
                className="text-sm"
              />
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src={Transfer}
              alt="Transfer"
              className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-[20px]"
            />
          </div>
        </div>

        {/* Sell Ticket Section */}
        <div className="w-full flex flex-col-reverse md:flex-row justify-center items-center gap-8 md:gap-12 px-4 md:px-8 lg:px-12 py-8">
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src={Sell}
              alt="Sell"
              className="w-full max-w-md md:max-w-lg lg:max-w-xl"
            />
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start gap-6 md:pr-8 lg:pr-12">
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center md:text-left">
              Need to sell your ticket? <br /> Our platform makes it <br />{" "}
              quick and secure!
            </h1>
              <AnimatedButton
                text="Explore"
                to="/events"
                className="text-sm"
              />
          </div>
        </div>

        {/* Group Booking Section */}
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 px-4 md:px-8 lg:px-12 py-8 pb-16">
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start gap-6 md:pl-8 lg:pl-12">
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center md:text-left">
              Book with friends <br /> and enjoy events <br /> together!
            </h1>
              <AnimatedButton
                text="Explore"
                to="/events"
                className="text-sm"
              />
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src={Group}
              alt="Group"
              className="w-full max-w-md md:max-w-lg lg:max-w-xl"
            />
          </div>
          </div>

          {/* Add a spacer at the end to ensure there's room for the footer */}
          <div className="h-16"></div>
        </div>
      </div>

      {/* Add styles for scrollbar hiding */}
      <style>
        {`
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
        `}
      </style>
    </>
  );
};

export default Home;