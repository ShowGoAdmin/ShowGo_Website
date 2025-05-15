import React, { useRef, useState } from "react";
import { AiFillApple, AiFillWindows } from "react-icons/ai";
import { useLocation, useParams, Link } from "react-router-dom";
import Ticket from "./bookings/ticket";
import { toPng } from "html-to-image";
import Android from "../assets/Android.jpeg"; // Adjust the path as necessary

const BookingConfirmation = () => {
  const { orderId } = useParams();
  const { state } = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);

  // Access the passed data
  const orderDetails = state?.orderDetails;
  const eventDetails = state?.eventDetails;

  // Ref for the ticket element
  const ticketRef = useRef();

  // Function to handle download
  const handleDownload = async () => {
    if (!ticketRef.current) return;

    setIsDownloading(true);
    try {
      // Add white background to ensure visibility
      const originalBg = ticketRef.current.style.backgroundColor;
      ticketRef.current.style.backgroundColor = 'white';

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for style application

      const dataUrl = await toPng(ticketRef.current, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 2 // Higher quality
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `ticket-${orderId}.png`;
      link.click();

      // Reset background
      ticketRef.current.style.backgroundColor = originalBg;
    } catch (error) {
      console.error("Failed to download ticket:", error);
      alert("Failed to download ticket. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 xl:gap-16 py-6 sm:py-8">
        {/* Left Section - Ticket Image */}
        <div className="w-full lg:w-1/2 flex justify-center mb-8 lg:mb-0">
          <div
            ref={ticketRef}
            className="bg-white text-black rounded-lg shadow-xl overflow-hidden w-full max-w-md"
          >
            <Ticket />
          </div>
        </div>

        {/* Right Section - Booking Confirmation */}
        <div className="w-full lg:w-1/2 text-center lg:text-left px-4 max-w-xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal mb-4 sm:mb-6">
            Booking Confirmed! <span className="text-primary">#{orderId}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 leading-relaxed">
            Your ticket for <span className="font-medium text-white">{eventDetails?.name}</span> has been booked successfully.
            <br className="hidden sm:block" />
            An email with the ticket and invoice has been sent to your registered email address.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-8 sm:mb-12">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`${isDownloading ? 'bg-gray-400' : 'bg-white hover:bg-gray-100'
                } text-black font-semibold px-6 py-3 rounded-2xl transition-all duration-200`}
            >
              {isDownloading ? 'Downloading...' : 'Download Ticket'}
            </button>
            <Link to="/" className="block sm:inline-block">
              <button className="w-full bg-transparent hover:bg-white/10 border-2 border-white text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200">
                Go Back Home
              </button>
            </Link>
          </div>

          {/* Mobile App Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white backdrop-blur-sm text-black rounded-2xl p-4 sm:p-6 gap-4 sm:gap-6 border border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-lg">ⓘ</span>
              <p className="text-xs sm:text-sm">
                Download our mobile app for easy access
              </p>
            </div>
            <div className="hidden sm:block border-l border-white/30 h-10 mx-2"></div>
            <div className="flex gap-4 sm:gap-6">
              <a
                href="https://play.google.com/store/apps/details?id=com.showgo.showgoapp&hl=en_IN"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={Android} // 👈 replace with actual path
                  alt="Android Logo"
                  style={{ width: '19.36px', height: '15px' }}
                />
                <span className="text-sm font-medium">Android</span>
              </a>
              <a
                href="https://apps.apple.com/in/app/showgo/id6741115239"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <AiFillApple className="text-xl" />
                <span className="text-sm font-medium">iOS</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;