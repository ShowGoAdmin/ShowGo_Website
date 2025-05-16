import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaHeart, FaShareAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaTicketAlt, FaCircle, FaPlus, FaMinus, FaArrowRight } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { getEventDetails, createOrder, databases, ID, createTransaction, getRazorpayKey, updateTicketQuantity, storage } from "../api/appwriteConfig";
import QRCode from 'qrcode';
import { MAPS_CONFIG } from "../config/config";
import { useAuth } from "../context/AuthContext";

// Add this CSS for noise texture
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

const EventDetails = ({ }) => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { quantity, selectedTicket, increment, decrement, updateSelectedTicket } = useCart();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [ticketsAvailable, setTicketsAvailable] = useState({});
  const [mapUrl, setMapUrl] = useState("");
  const [paymentSuccessLoading, setPaymentSuccessLoading] = useState(false);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [relatedEventsLoading, setRelatedEventsLoading] = useState(true);
  const [isRelatedEventsCollapsed, setIsRelatedEventsCollapsed] = useState(false);


  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError("No event ID found in URL");
        setLoading(false);
        navigate('/events');
        return;
      }

      try {
        setLoading(true);
        const eventData = await getEventDetails(eventId);
        const terms = eventData.termsAndConditions || "";

        if (!eventData) throw new Error("Event data not found");

        const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/66dd97eb0009f68104ef/files/${eventData.imageFileId}/view?project=67699acf002ecc80c89f&mode=admin`;

        // Tickets available calculate karna
        const ticketsData = {};
        if (eventData.categories && Array.isArray(eventData.categories)) {
          eventData.categories.forEach(cat => {
            try {
              const parts = cat.split(':').map(item => item.trim());
              if (parts.length >= 3) { // At least name:price:qty
                const [name, price, qty] = parts;
                ticketsData[name] = parseInt(qty) || 0;
              }
            } catch (err) {
              console.error("Error processing category:", cat, err);
            }
          });
        }

        // Debug log
        console.log("Processed tickets data:", ticketsData);

        setTicketsAvailable(ticketsData);
        setEvent({ ...eventData, imageField: imageUrl, termsAndConditions: terms });

        // Initialize selected ticket
        if (eventData.categories?.length > 0) {
          const activeTickets = eventData.categories
            .filter(cat => {
              try {
                const [name] = cat.split(':').map(item => item.trim());
                return ticketsData[name] > 0;
              } catch (err) {
                return false;
              }
            })
            .map(cat => {
              const [name, price, qty] = cat.split(':').map(item => item.trim());
              return {
                name,
                price: parseFloat(price),
                display: `${name} - Rs. ${price}`,
                category: name,
                available: parseInt(qty) || 0
              };
            });

          if (activeTickets.length > 0 && !selectedTicket) {
            // Find the cheapest ticket
            const cheapestTicket = activeTickets.reduce((min, ticket) => 
              ticket.price < min.price ? ticket : min, 
              activeTickets[0]
            );
            updateSelectedTicket(cheapestTicket);
          } else {
            updateSelectedTicket(null);
          }
        }

        // Generate map URL if coordinates exist
        if (eventData.eventLocation_Lat_Lng_VenueName) {
          try {
          const [lat, lng, venueName] = eventData.eventLocation_Lat_Lng_VenueName.split(",").map(item => item.trim());
          if (lat && lng) {
              // Use a static map URL with a fallback if the API key isn't available
              // For privacy, we're using a non-API key alternative
              const staticLocation = `${lat.trim()},${lng.trim()}`;
              // Create a fallback static URL that doesn't need an API key
              const fallbackUrl = `https://maps.google.com/maps?q=${encodeURIComponent(staticLocation)}&z=15&output=embed`;
              setMapUrl(fallbackUrl);
            }
          } catch (mapErr) {
            console.error("Error setting up map:", mapErr);
            // Map errors shouldn't break the entire page
          }
        }

        // After fetching the main event, fetch related events
        if (eventData) {
          try {
            setRelatedEventsLoading(true);
            console.log("Fetching real events from collection:", import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID);
            
            // Direct query without any filters to maximize chance of getting real events
            const response = await databases.listDocuments(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              import.meta.env.VITE_APPWRITE_COLLECTION_ID
            );
            
            console.log("Raw database response:", response);
            
            if (response && response.documents && response.documents.length > 0) {
              console.log("Found", response.documents.length, "events in the database");
              
              // Filter out the current event only if there are multiple events
              const filteredEvents = response.documents.length > 1 
                ? response.documents.filter(eventDoc => eventDoc.$id !== eventId)
                : response.documents;
              
              // Map the documents to include image URLs
              const eventsWithImages = filteredEvents.map(event => {
                const imageUrl = event.imageFileId ? 
                  `https://cloud.appwrite.io/v1/storage/buckets/66dd97eb0009f68104ef/files/${event.imageFileId}/view?project=67699acf002ecc80c89f&mode=admin` :
                  null;
                  
                return {
                  ...event,
                  imageUrl
                };
              });
              
              console.log("Processed events for carousel:", eventsWithImages.length);
              setRelatedEvents(eventsWithImages);
            } else {
              console.log("No events found in database response");
              setRelatedEvents([]);
            }
          } catch (err) {
            console.error("Error fetching events from database:", err);
            setRelatedEvents([]);
          } finally {
            setRelatedEventsLoading(false);
          }
        }
      } catch (err) {
        console.error("Event fetch failed:", err);
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, navigate]);

  const getTicketOptions = () => {
    if (!event?.categories || !Array.isArray(event.categories)) return [];

    // Current phase nikalne ka better way
    const currentPhase = event.phase?.length > 0
      ? event.phase[event.phase.length - 1].split(':')[0]?.trim()
      : null;

    return event.categories
      .filter(cat => {
        try {
          const parts = cat.split(':').map(item => item.trim());
          if (parts.length < 3) return false; // At least name:price:qty required

          const [name, price, qty, phaseTag] = parts;
          const availableQty = parseInt(qty) || 0;

          // Debugging logs - remove after fixing
          console.log(`Ticket: ${name}, Qty: ${availableQty}, Phase: ${phaseTag}, CurrentPhase: ${currentPhase}`);

          // Phase check only if phaseTag exists
          const phaseMatch = phaseTag ? phaseTag === currentPhase : true;

          return availableQty > 0 && phaseMatch;
        } catch (err) {
          console.error("Error processing category:", cat, err);
          return false;
        }
      })
      .map(cat => {
        const [name, price, qty] = cat.split(':').map(item => item.trim());
        return {
          name,
          price: parseFloat(price),
          display: `${name} - Rs. ${price}`,
          category: name,
          available: parseInt(qty) || 0
        };
      });
  };

  const ticketOptions = getTicketOptions();
  const currentTicket = selectedTicket || ticketOptions[0];
  const isSoldOut = ticketOptions.length === 0 ||
    (currentTicket && ticketsAvailable[currentTicket.category] <= 0);

  const calculateTotals = () => {
    if (!currentTicket) return {
      gst: "0.00",
      internetHandlingFee: "0.00",
      subtotal: "0.00",
      totalAmount: "0.00"
    };

    const subtotal = (currentTicket.price * quantity).toFixed(2);
    const gst = (currentTicket.price * quantity * 0.18).toFixed(2);
    const internetHandlingFee = (currentTicket.price * quantity * 0.07).toFixed(2);
    const totalAmount = (parseFloat(subtotal) + parseFloat(gst) + parseFloat(internetHandlingFee)).toFixed(2);

    return { gst, internetHandlingFee, subtotal, totalAmount };
  };

  const { gst, internetHandlingFee, subtotal, totalAmount } = calculateTotals();

  const handleBookNow = async () => {
    if (isSoldOut) {
      alert("This ticket is sold out!");
      return;
    }

    if (!isAuthenticated || !user) {
      navigate('/login-signup', { state: { from: `/events/${eventId}` } });
      return;
    }

    if (!currentTicket || !user?.name || !eventId || !event) {
      alert("Please select a ticket and ensure all details are filled");
      return;
    }

    setBookingLoading(true);

    try {
      // Generate IDs
      const ticketId = eventId;
      const transactionId = `TXN-${Date.now()}`;

      // Check ticket availability again and create lock
      const ticketCategory = currentTicket.name.split(' - ')[0];
      const availableTickets = ticketsAvailable[ticketCategory];

      if (availableTickets <= 0) {
        alert("This ticket is now sold out!");
        setBookingLoading(false);
        return;
      }

      // Create a lock for this ticket
      const lockId = ID.unique();
      const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      try {
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_LOCK_COLLECTION_ID,
          lockId,
          {
            ticketId: ticketId,
          }
        );
      } catch (lockError) {
        console.error("Failed to create lock:", lockError);
        alert("This ticket is currently being processed by another user. Please try again in a few moments.");
        setBookingLoading(false);
        return;
      }

      // Cleanup function for lock
      const cleanupLock = async () => {
        try {
          await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_LOCK_COLLECTION_ID,
            lockId
          );
        } catch (deleteError) {
          console.error("Failed to delete lock:", deleteError);
        }
      };

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = async () => {
        // Verify ticket availability once more after lock is acquired
        const updatedEvent = await getEventDetails(eventId);
        const updatedTickets = {};

        if (updatedEvent.categories && Array.isArray(updatedEvent.categories)) {
          updatedEvent.categories.forEach(cat => {
            try {
              const [name, price, qty] = cat.split(':').map(item => item.trim());
              updatedTickets[name] = parseInt(qty) || 0;
            } catch (err) {
              console.error("Error processing category:", cat, err);
            }
          });
        }

        const updatedAvailable = updatedTickets[ticketCategory] || 0;

        if (updatedAvailable < quantity) {
          await cleanupLock();
          alert("Sorry, there are not enough tickets available. Please try with a smaller quantity.");
          setBookingLoading(false);
          return;
        }


        const options = {
          key: getRazorpayKey(),
          amount: parseFloat(totalAmount) * 100,
          currency: 'INR',
          name: event.name,
          description: `Booking for ${event.name}`,
          image: event.imageField,
          order_id: null,
          handler: async function (response) {
            try {
              setPaymentSuccessLoading(true);

              // Payment success - verify ticket availability one final time
              const finalEvent = await getEventDetails(eventId);
              const finalTickets = {};

              if (finalEvent.categories && Array.isArray(finalEvent.categories)) {
                finalEvent.categories.forEach(cat => {
                  try {
                    const [name, price, qty] = cat.split(':').map(item => item.trim());
                    finalTickets[name] = parseInt(qty) || 0;
                  } catch (err) {
                    console.error("Error processing category:", cat, err);
                  }
                });
              }

              const finalAvailable = finalTickets[ticketCategory] || 0;

              if (finalAvailable < quantity) {
                await cleanupLock();
                alert("Sorry, the tickets are no longer available. Your payment will be refunded.");
                return;
              }
              // If tickets are available, proceed with the original flow
              const transactionData = {
                userId: user.$id,
                ticketId,
                paymentId: response.razorpay_payment_id,
                totalAmount: totalAmount.toString(),
                gateway: 'razorpay',
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };

              // Save to transactions collection
              await createTransaction(transactionData);

              // Update ticket quantity in database
              await updateTicketQuantity(eventId, ticketCategory, quantity);

              const ticketDocId = ID.unique();

              // Create ticket document in tickets collection
              const ticketData = {
                userId: user.$id,
                eventId,
                eventName: event.name,
                eventSub_name: event.sub_name || "",
                eventDate: event.date,
                eventTime: event.time,
                eventLocation: event.location,
                totalAmountPaid: totalAmount.toString(),
                imageFileId: event.imageFileId,
                category: ticketCategory,
                quantity: quantity.toString(),
                qrCodeFileId: `${ticketDocId}_ticket_qr.png`,
                pricePerTicket: currentTicket.price.toString(),
                isListedForSale: "false",
                checkedIn: "false"
              };

              // Create the ticket document
              await databases.createDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_TICKETS_COLLECTION_ID,
                ticketDocId,
                ticketData
              );

              try {
                // Create QR data using the ticketDocId
                const qrData = ticketDocId;

                // Generate QR code as canvas
                const canvas = document.createElement('canvas');
                await QRCode.toCanvas(canvas, qrData, {
                  width: 256,
                  margin: 2,
                  color: {
                    dark: '#000000',
                    light: '#ffffff'
                  }
                });

                // Convert canvas to blob
                const blob = await new Promise((resolve) => {
                  canvas.toBlob(resolve, 'image/png');
                });

                if (!blob) {
                  throw new Error("Failed to convert QR code to blob");
                }

                // Use consistent filename format
                const qrFilename = `${ticketDocId}_ticket_qr.png`;

                // Create File object
                const file = new File([blob], qrFilename, {
                  type: 'image/png',
                  lastModified: Date.now()
                });

                // Store the QR code
                await storage.createFile(
                  import.meta.env.VITE_APPWRITE_TICKET_QRs_BUCKET_ID,
                  qrFilename,
                  file
                );

                // Update the ticket document with QR code filename
                await databases.updateDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  import.meta.env.VITE_APPWRITE_TICKETS_COLLECTION_ID,
                  ticketDocId,
                  {
                    qrCodeFileId: qrFilename
                  }
                );

              } catch (qrError) {
                console.error("QR Code generation/upload failed:", qrError);
                // Update with fallback pattern
                await databases.updateDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  import.meta.env.VITE_APPWRITE_TICKETS_COLLECTION_ID,
                  ticketDocId,
                  {
                    qrCodeFileId: `${ticketDocId}_ticket_qr_fallback`
                  }
                );
              }

              // Create order record
              const orderData = {
                userId: user.$id,
                ticketId: ticketDocId,
                ticketName: currentTicket.name,
                eventId,
                transactionId,
                quantity: quantity.toString(),
                singleTicketPrice: currentTicket.price.toString(),
                subtotal,
                taxGST: gst,
                internetHandlingFee,
                totalAmount,
                name: user.name,
                ticketCategory,
                paymentStatus: 'completed',
                razorpayPaymentId: response.razorpay_payment_id
              };

              const order = await createOrder(orderData);

              // Delete the lock after successful booking
              try {
                await databases.deleteDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  import.meta.env.VITE_APPWRITE_LOCK_COLLECTION_ID,
                  lockId,
                );
              } catch (deleteError) {
                console.error("Failed to delete lock:", deleteError);
              }

              await new Promise(resolve => setTimeout(resolve, 500)); // Optional delay

              navigate(`/booking-confirmation/${order.$id}`, {
                state: {
                  orderDetails: {
                    name: user.name,
                    selectedTicketType: currentTicket.name,
                    selectedQuantity: quantity,
                    singleTicketPrice: currentTicket.price.toString(),
                    ticketId: ticketDocId,
                    paymentId: response.razorpay_payment_id,
                    quantity: quantity.toString(),
                    totalAmountPaid: totalAmount, // This should be the final amount with taxes
                    ticketCategory: ticketCategory // Make sure this is the exact category name
                  },
                  eventDetails: {
                    name: event.name,
                    sub_name: event.sub_name || "",
                    tagline: event.tagline,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                    imageField: event.imageField
                  }
                }
              });
            } catch (error) {
              setPaymentSuccessLoading(false);
              console.error("Post-payment processing failed:", error);
              try {
                await databases.deleteDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  import.meta.env.VITE_APPWRITE_LOCK_COLLECTION_ID,
                  lockId
                );
              } catch (deleteError) {
                console.error("Failed to delete lock:", deleteError);
              }
              alert("Booking completed but there was an issue with confirmation. Please check your orders.");
            }
          },
          prefill: {
            name: user.name,
            email: user.email || '',
            contact: user.phone || ''
          },
          theme: {
            color: '#3399cc'
          }
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', async function (response) {
          // Payment failed - create failed transaction record
          const transactionData = {
            userId: user.$id,
            ticketId,
            paymentId: response.error.metadata.payment_id || 'none',
            totalAmount: totalAmount.toString(),
            gateway: 'razorpay',
            status: 'failed',
            error: response.error.description
          };

          await createTransaction(transactionData);

          // Delete the lock after failed payment
          try {
            await databases.deleteDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              import.meta.env.VITE_APPWRITE_LOCK_COLLECTION_ID,
              lockId
            );
          } catch (deleteError) {
            console.error("Failed to delete lock:", deleteError);
          }

          alert(`Payment failed: ${response.error.description}`);
        });

        rzp.open();
      };

      script.onerror = () => {
        databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_LOCK_COLLECTION_ID,
          lockId
        ).catch(console.error);
        throw new Error('Failed to load Razorpay script');
      };

    } catch (error) {
      console.error("Booking failed:", error);
      alert(`Booking failed: ${error.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  // Get event description for paragraph display
  const getEventDescription = () => {
    // First check if description exists
    if (event.description && event.description.trim()) {
      return event.description.trim();
    }
    
    // Fallback to eventInfo if description is not available
    if (event.eventInfo && event.eventInfo.trim()) {
      // Convert bullet points to paragraph by joining lines
      return event.eventInfo
        .split('\n')
        .map(line => line.trim().replace(/^[•\-*]\s*/, ''))
        .filter(line => line && line.length > 0)
        .join('. ');
    }
    
    return "No event details available";
  };

  // Prepare terms and conditions items for bullet points
  const getTermsItems = () => {
    if (event.termsAndConditions && event.termsAndConditions.trim()) {
      // Split by newline and filter out empty lines
      return event.termsAndConditions
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0);
    }
    
    return ["No terms and conditions specified for this event."];
  };

  if (loading) return (
    <div className="bg-black min-h-screen flex justify-center items-center">
      <div className="text-white text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl font-medium">Loading event details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="bg-black min-h-screen flex justify-center items-center">
      <div className="text-white text-center p-8 max-w-md bg-red-900/20 rounded-lg">
        <div className="text-red-400 text-5xl mb-4">!</div>
        <p className="text-xl font-medium mb-2">Error</p>
        <p className="text-gray-300">{error}</p>
      </div>
    </div>
  );
  
  if (!event) return (
    <div className="bg-black min-h-screen flex justify-center items-center">
      <div className="text-white text-center p-8 max-w-md">
        <p className="text-xl font-medium">Event not found</p>
        <button 
          onClick={() => navigate('/events')}
          className="mt-4 px-6 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-opacity-90 transition-all"
        >
          Browse Events
        </button>
      </div>
    </div>
  );

  // Extract venue name from the event location data
  const venueName = event.eventLocation_Lat_Lng_VenueName?.split(",")[2]?.trim() || "Venue";
  
  // Get complete venue information (all text after lat/lng coordinates)
  const getCompleteVenue = () => {
    if (!event.eventLocation_Lat_Lng_VenueName) return "Venue details not available";
    
    const parts = event.eventLocation_Lat_Lng_VenueName.split(",");
    if (parts.length <= 2) return venueName;

    // Return all text after the lat/lng coordinates, joined back together
    return parts.slice(2).join(",").trim();
  };

  const completeVenueInfo = getCompleteVenue();
  
  // Create a truncated venue display for the venue card
  const getTruncatedVenue = (venueText) => {
    if (!venueText || venueText.length <= 25) return venueText;
    return venueText.substring(0, 25) + "...";
  };

  // Get venue from event.location as per requirement
  const venueFromLocation = event.location || "Venue not specified";
  const truncatedVenue = getTruncatedVenue(venueFromLocation);
  
  // Format date for display
  const formattedDate = event.date ? new Date(event.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  }) : '';
  
  // Get the current phase
  const currentPhase = event.phase?.length > 0
    ? event.phase[event.phase.length - 1].split(':')[0]?.trim()
    : "I";

  // Get pricing information for display - find the minimum price from all available tickets
  const startingPrice = ticketOptions.length > 0 
    ? ticketOptions.reduce((min, ticket) => Math.min(min, ticket.price), ticketOptions[0].price)
    : currentTicket?.price || 15000;

  return (
    <div className="relative bg-black text-white min-h-screen overflow-hidden">
      {/* Full-screen blurred background image */}
      {event && event.imageField && (
        <div 
          className="fixed inset-0 w-full h-full bg-no-repeat bg-cover bg-center z-0 opacity-35"
          style={{
            backgroundImage: `url(${event.imageField})`,
            filter: 'blur(8px) brightness(0.35) saturate(1.1)',
          }}
        ></div>
      )}
      
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,${noiseSvgBase64}")`,
          backgroundRepeat: 'repeat',
        }}
      ></div>
      
      {/* Main Content */}
      <div className="px-6 py-12 mt-16 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Event Details */}
          <div className="w-full lg:w-2/3 space-y-8">
            <div className="animate-fadeIn">
              <h1 className="text-6xl md:text-7xl font-bold uppercase tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {event.name}
              </h1>
              <h2 className="text-2xl md:text-3xl uppercase mt-3 tracking-wider text-gray-200">
                {event.sub_name || "THE TAKEOVER TOUR"}
              </h2>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center bg-gray-800/60 rounded-full px-4 py-2 max-w-full">
                  <FaMapMarkerAlt className="text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-gray-200 text-sm sm:text-base break-words">{truncatedVenue}</p>
          </div>
                
                <div className="flex items-center bg-gray-800/60 rounded-full px-4 py-2">
                  <FaCalendarAlt className="text-gray-400 mr-2" />
                  <p className="text-gray-200">
                    {formattedDate && event.time
                      ? `${formattedDate}`
                      : event.date || "Date TBD"}
                  </p>
                </div>
                
                {event.time && (
                  <div className="flex items-center bg-gray-800/60 rounded-full px-4 py-2">
                    <FaClock className="text-gray-400 mr-2" />
                    <p className="text-gray-200">{event.time}</p>
                  </div>
                )}
              </div>
            </div>

            {/* About Section as Paragraph */}
            <div className="mb-2">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="w-10 h-[2px] bg-red-500 inline-block mr-3"></span>
                About
              </h2>
              
              <p className="text-gray-300 leading-relaxed">
                {getEventDescription()}
              </p>
            </div>

            {/* Phase */}
            <div className="flex items-center gap-3">
              <span className="inline-block bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-2 rounded-full text-sm font-medium border border-gray-700 shadow-lg">
                PHASE - {currentPhase}
                </span>
              {event.phase?.length > 1 && (
                <span className="text-xs text-gray-500">Previous phases completed</span>
              )}
              </div>
            
            {/* Pricing Section */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold flex items-center">
                <FaTicketAlt className="mr-2 text-gray-400" />
                Starting From <span className="text-yellow-500 ml-1">RS.{startingPrice.toFixed(2)}</span>
              </h3>
              
              {/* Ticket Categories */}
              <div className="mt-4 mb-5">
                <h4 className="text-sm uppercase text-gray-400 mb-2">Available Tickets</h4>
                <div className="space-y-2">
                  {ticketOptions.length > 0 ? (
                    ticketOptions.map((ticket, index) => (
                      <div 
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg border backdrop-blur-md ${currentTicket && currentTicket.name === ticket.name 
                          ? 'border-white/40 bg-white/10' 
                          : 'border-gray-700/40 bg-black/30 hover:bg-black/40 hover:border-gray-500/60'
                        } transition-all cursor-pointer shadow-sm`}
                        onClick={() => updateSelectedTicket(ticket)}
                      >
                        <div>
                          <p className="font-medium">{ticket.name}</p>
                          <p className="text-xs text-gray-400">
                            {ticket.available} {ticket.available === 1 ? 'ticket' : 'tickets'} remaining
                          </p>
                        </div>
                        <p className="font-bold text-yellow-500">₹{ticket.price.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">No tickets available</p>
                  )}
              </div>
            </div>

              {/* Quantity Selector */}
              {currentTicket && (
                <div className="mt-5 mb-5 w-full max-w-md">
                  <div className="flex items-center justify-between backdrop-blur-md bg-black/30 border border-gray-700/40 rounded-lg p-3 shadow-sm">
                    <span className="text-white">Quantity</span>
                    <div className="flex items-center space-x-4">
                  <button
                    onClick={decrement}
                        disabled={quantity <= 1}
                        className={`p-2 rounded-full ${quantity <= 1 ? 'bg-black/70 text-gray-500' : 'bg-black/70 text-white hover:bg-black/80'} transition-colors backdrop-blur-sm`}
                  >
                        <FaMinus size={12} />
                  </button>
                      
                      <span className="font-medium text-white w-6 text-center">{quantity}</span>
                      
                  <button
                        onClick={() => {
                          const maxAllowed = Math.min(10, currentTicket.available || 0);
                          if (quantity < maxAllowed) increment();
                        }} 
                        disabled={quantity >= Math.min(10, currentTicket.available || 0)}
                        className={`p-2 rounded-full backdrop-blur-sm ${
                          quantity >= Math.min(10, currentTicket.available || 0) 
                            ? 'bg-black/70 text-gray-500' 
                            : 'bg-black/70 text-white hover:bg-black/80'
                        } transition-colors`}
                      >
                        <FaPlus size={12} />
                  </button>
                    </div>
                  </div>
                  {currentTicket.available > 0 && (
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {quantity >= 10 ? 'Maximum 10 tickets per order' : ''}
                      {quantity >= currentTicket.available && currentTicket.available < 10 
                        ? 'Maximum available tickets selected' 
                        : ''}
                    </p>
                  )}
                </div>
              )}

                <button
                  onClick={handleBookNow}
                  disabled={bookingLoading || isSoldOut || !currentTicket}
                className={`mt-2 w-full max-w-md py-4 font-bold rounded-full transform transition-all duration-200
                  ${bookingLoading || isSoldOut || !currentTicket 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-opacity-90 hover:shadow-xl active:scale-95'
                  }`}
              >
                {bookingLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isSoldOut ? (
                  'SOLD OUT'
                ) : !isAuthenticated && !authLoading ? (
                  'LOGIN'
                ) : (
                  'BOOK TICKETS'
                )}
              </button>
              </div>
            </div>

          {/* Right Column - Event Card */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
              <div className="relative">
                <img 
                  src={event.imageField} 
                  alt={event.name} 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute top-0 right-0 m-4 flex space-x-2">
                  <button className="bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors duration-200">
                    <FaHeart className="text-red-500" />
                  </button>
                  <button className="bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors duration-200">
                    <FaShareAlt className="text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Payment Summary Card */}
            {currentTicket && (
              <div className="mt-6 bg-black/30 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-gray-700/50">
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="w-6 h-[2px] bg-red-500 inline-block mr-2"></span>
                    Payment Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Selected Ticket</span>
                      <span className="font-medium">{currentTicket.name}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Quantity</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price per ticket</span>
                      <span className="font-medium">₹{currentTicket.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="font-medium">₹{subtotal}</span>
                    </div>
                    
                    {/* Expandable Other Charges Section */}
                    <div className="mt-1">
                      <div 
                        className="flex justify-between items-center py-2 cursor-pointer hover:bg-black/40 px-2 rounded-lg transition-colors"
                onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
              >
                        <span className="text-gray-400 text-sm flex items-center">
                          Other Charges
                          {showPriceBreakdown ? <FaChevronUp className="ml-2" size={12} /> : <FaChevronDown className="ml-2" size={12} />}
                        </span>
                        <span className="font-medium text-sm">₹{(parseFloat(gst) + parseFloat(internetHandlingFee)).toFixed(2)}</span>
              </div>

              {showPriceBreakdown && (
                        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 mt-2 space-y-2 text-sm border border-gray-700/30">
                          <div className="flex justify-between">
                            <span className="text-gray-400">GST (18%)</span>
                            <span className="font-medium">₹{gst}</span>
                  </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-400">Internet Handling Fee</span>
                            <span className="font-medium">₹{internetHandlingFee}</span>
                  </div>
                </div>
              )}
                    </div>
                    
                    <div className="h-px bg-gray-700/50 my-3"></div>
                    
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-yellow-500">₹{totalAmount}</span>
              </div>
            </div>
                  </div>
                
                <div className="bg-black/40 backdrop-blur-sm p-4 text-xs text-gray-400">
                  <p>All prices are inclusive of taxes and fees.</p>
                </div>
              </div>
            )}
        </div>
      </div>

        {/* Map Section */}
        <div className="mt-16">
          {/* Venue Heading - Similar to other section headings */}
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-10 h-[2px] bg-red-500 inline-block mr-3"></span>
            Venue
          </h2>
          
          {/* Venue location text */}
          <p className="text-gray-300 mb-4 flex items-start">
            <FaMapMarkerAlt className="text-red-500 mt-1 mr-2 flex-shrink-0" />
            <span>{venueFromLocation}</span>
          </p>
          
          {/* Map Container */}
          <div className="w-full rounded-xl overflow-hidden relative shadow-2xl border border-gray-800">
            {mapUrl ? (
                <iframe
                  className="w-full h-96 rounded-xl"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={mapUrl}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onError={(e) => {
                    console.error("Map iframe error:", e);
                    // Fallback handling if iframe fails to load
                    e.target.style.display = 'none';
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = "bg-gray-800 w-full h-96 flex items-center justify-center rounded-xl";
                    fallbackDiv.innerHTML = `<p class="text-gray-400">Map temporarily unavailable</p>`;
                    e.target.parentNode.appendChild(fallbackDiv);
                  }}
                ></iframe>
            ) : (
              <div className="bg-gray-800 w-full h-96 flex items-center justify-center rounded-xl">
                <p className="text-gray-400">
                  {event?.eventLocation_Lat_Lng_VenueName ? "Loading map..." : "Map not available"}
                </p>
                </div>
            )}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg max-w-[80%] overflow-hidden">
            <span className="text-white text-sm font-medium truncate block">{completeVenueInfo}</span>
              </div>
        </div>
        </div>

        {/* Terms and Conditions Section */}
        <div className="mt-16 mb-2">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="w-10 h-[2px] bg-red-500 inline-block mr-3"></span>
            Terms & Conditions
          </h2>
          
          <ul className="text-gray-300 space-y-2 pl-1 max-w-4xl">
            {getTermsItems().map((item, index) => (
              <li key={index} className="flex items-start">
                <FaCircle className="text-red-500 mt-1.5 mr-2 text-[0.35rem] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* More Events Section - Changed from "More Events You May Like" */}
        <div className="mt-20 mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-10 h-[2px] bg-red-500 inline-block mr-3"></span>
              Explore More Events
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsRelatedEventsCollapsed(!isRelatedEventsCollapsed)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={isRelatedEventsCollapsed ? "Expand events" : "Collapse events"}
              >
                {isRelatedEventsCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button 
                onClick={() => navigate("/events")} 
                className="text-sm flex items-center text-gray-400 hover:text-white transition-colors"
              >
                View all events <FaArrowRight className="ml-2" />
              </button>
            </div>
          </h2>

          {relatedEventsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : relatedEvents.length === 0 ? (
            <div className="text-gray-400 text-center py-16 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-800/50">
              <p>No other events found.</p>
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
              <div className={`absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none ${isRelatedEventsCollapsed ? 'hidden' : ''}`}></div>
              
              
              
              {/* Scrollable Container */}
              <div className={`overflow-x-auto pb-6 scrollbar-hide transition-all duration-300 ${isRelatedEventsCollapsed ? 'h-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
                <div className="flex space-x-6" style={{ minWidth: 'max-content' }}>
                  {relatedEvents.map((event) => (
                    <div 
                      key={event.$id} 
                      className="w-72 flex-shrink-0 bg-black/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all transform hover:translate-y-[-4px] duration-300 shadow-lg"
                      onClick={() => navigate(`/event-details/${event.$id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="h-40 w-full relative overflow-hidden">
                        {event.imageUrl ? (
                          <img 
                            src={event.imageUrl} 
                            alt={event.name} 
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="bg-gray-800 h-full w-full flex items-center justify-center">
                            <span className="text-gray-600">No image</span>
              </div>
            )}
                        
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
                            {event.categories?.length > 0 && event.categories[0].includes(':') ? 
                              `₹${event.categories[0].split(':')[1].trim()}` : 
                              "₹TBA"}
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
      </div>

      {/* Payment Success Loading Overlay */}
      {paymentSuccessLoading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-white text-center p-8 max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold mb-2">Processing your booking</h3>
            <p className="text-gray-300">Please wait while we secure your tickets...</p>
      </div>
        </div>
      )}

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
    </div>
  );
};

export default EventDetails;