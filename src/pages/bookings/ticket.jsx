import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toDataURL } from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { Client, Storage, ID } from "appwrite";

const Ticket = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("Guest");
  const [qrData, setQrData] = useState("");
  const [eventDetails, setEventDetails] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  // Initialize Appwrite client once
  const client = useMemo(() => {
    return new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT);
  }, []);

  const storage = useMemo(() => new Storage(client), [client]);

  useEffect(() => {
    const initializeTicket = async () => {
      try {
        setLoading(true);

        if (!state?.eventDetails || !state?.orderDetails?.ticketId) {
          throw new Error("Ticket data not found in state");
        }

        setEventDetails(state.eventDetails);
        setOrderDetails(state.orderDetails);

        // Set user name
        const name = state.orderDetails?.name || "Guest";
        setUserName(name);

        // Get ticket ID from order details
        const ticketId = state.orderDetails.ticketId;
        setQrData(ticketId);

        // Try to load QR code from storage - use the correct filename format
        try {
          const qrFilename = state.orderDetails.qrCodeFileId || `${ticketId}_ticket_qr.png`;
          const previewUrl = storage.getFileView(
            import.meta.env.VITE_APPWRITE_TICKET_QRs_BUCKET_ID,
            qrFilename
          );

          // Verify the URL is valid before setting it
          const response = await fetch(previewUrl);
          if (response.ok) {
            setQrCodeUrl(previewUrl);
          } else {
            throw new Error("QR file not found in storage");
          }
        } catch (err) {
          console.warn("Failed to load stored QR, generating new one:", err);
          const localQrUrl = await generateQRCode(ticketId);
          setQrCodeUrl(localQrUrl || "");
        }

      } catch (err) {
        console.error("Ticket initialization error:", err);
        setError(err.message || "Failed to initialize ticket");
      } finally {
        setLoading(false);
      }
    };

    initializeTicket();
  }, [state]);

  const generateQRCode = async (data) => {
    try {
      return await toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch (err) {
      console.error("QR generation error:", err);
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    }
  };

  if (!state?.eventDetails) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-black text-lg p-4 text-center">
          Ticket data not found. <br />
          <button
            onClick={() => navigate("/events")}
            className="mt-4 px-4 py-2 bg-black text-white rounded"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const quantity = useMemo(() => {
    // Try different possible field names
    return (
      parseInt(orderDetails?.quantity) ||
      parseInt(orderDetails?.selectedQuantity) ||
      1
    );
  }, [orderDetails]);

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-black">
      <div className="font-serif w-[340px] h-[640px] bg-white rounded-[50px] flex flex-col overflow-hidden">
        {/* Top White Padding - Reduced height */}
        <div className="h-6 bg-white flex-none"></div>

        {/* Header - Made more compact */}
        <div className="bg-gradient-to-b from-black to-black w-full flex-none flex flex-col justify-center items-center py-3 px-2 text-white">
          <div className="text-lg line-clamp-2 text-center">
            {eventDetails?.name}
          </div>
        </div>
        {eventDetails?.sub_name && (
              <p className="text-[10px] mb-1 text-gray-500 text-center">
                {eventDetails.sub_name}
              </p>
            )}

        {/* Main Content - Added overflow control */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Info Section - Reduced padding and gaps */}
          <div className="w-full flex px-4 py-2">
            <div className="w-1/2 flex flex-col gap-3">
              <div>
                <div className="text-xs text-black">Venue</div>
                <div className="text-[10px] text-gray-600 line-clamp-2">
                  {eventDetails?.location || "Not specified"}
                </div>
              </div>
              <div>
                <div className="text-xs text-black">Quantity</div>
                <div className="text-[10px] text-gray-600">
                  {quantity} {quantity > 1 ? 'tickets' : 'ticket'}
                </div>
              </div>
              <div>
                <div className="text-xs text-black">Name</div>
                <div className="text-[10px] text-gray-600 line-clamp-1">
                  {userName && userName.length > 20
                    ? userName.slice(0, 17) + "..."
                    : userName}
                </div>
              </div>
            </div>

            <div className="w-1/2 flex flex-col gap-3">
              <div>
                <div className="text-xs text-black">Date</div>
                <div className="text-[10px] text-gray-600">
                  {eventDetails?.date
                    ? new Date(eventDetails.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : "Not specified"}
                </div>
              </div>
              <div>
                <div className="text-xs text-black">Time</div>
                <div className="text-[10px] text-gray-600">
                  {eventDetails?.time || "8:00 PM"}
                </div>
              </div>
              <div>
                <div className="text-xs text-black">Access</div>
                <div className="text-[10px] text-gray-600">
                  {orderDetails?.ticketCategory || "VIP"}: ₹
                  {orderDetails?.totalAmountPaid
                    ? parseFloat(orderDetails.totalAmountPaid).toFixed(2)
                    : (parseInt(orderDetails?.quantity || 1) *
                      parseFloat(orderDetails?.singleTicketPrice || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Dotted Line + Circles - Updated to match design */}
          <div className="relative py-4">
            <div className="absolute top-1/2 left-8 right-8 border-t-2 border-dotted border-gray-300"></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-[14px] bg-black border-[4px] border-white rounded-full"
              style={{
                width: "28.08px",
                height: "32.93px",
              }}
            ></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-[14px] bg-black border-[4px] border-white rounded-full"
              style={{
                width: "28.08px",
                height: "32.93px",
              }}
            ></div>
          </div>


          {/* QR Section - Made more compact */}
          {/* QR Section - Adjusted spacing */}
          <div className="flex flex-col items-center px-4 pb-2">
            <p className="text-xs mb-4 text-gray-600 text-center">
              {eventDetails?.name}
            </p>
            {eventDetails?.sub_name && (
              <p className="text-[10px] mb-1 text-gray-500 text-center">
                {eventDetails.sub_name}
              </p>
            )}
            <div className="bg-white border border-gray-300 p-2 rounded-lg mb-3">
              {error ? (
                <p className="text-red-500 text-xs text-center">{error}</p>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-34 h-34 object-contain"
                  onError={() => setError("Failed to load QR image")}
                />
              ) : (
                <QRCodeSVG
                  value={qrData || "temporary-data"}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>

            {/* Event ID + Quantity - tightened spacing */}
            <div className="w-full flex flex-col items-center justify-center space-y-1 px-2">
              <p className="text-gray-600 text-[10px] font-mono text-center break-words">
                {qrData || "Event ID not available"}
              </p>
              <p className="text-lg text-center">x{quantity}</p>
            </div>
          </div>

        </div>

        {/* Footer - Made more compact */}
        <div className="bg-gradient-to-b from-black to-black w-full flex-none flex flex-col justify-center items-center py-3 px-2 text-white">
          <div className="text-[10px] text-gray-400">booked on</div>
          <div className="text-lg ">Show GO.</div>
          <div className="bg-gray-400 w-20 h-[1px] my-1"></div>
        </div>

        {/* Bottom White Padding - Reduced height */}
        <div className="h-6 bg-white flex-none"></div>
      </div>
    </div>
  );
};

export default Ticket;