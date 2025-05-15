import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useNavigate } from "react-router-dom";
import TwoArrows from "../assets/TwoArrows.png";
import Arrows from "../assets/Arrows.png";
import Users from "../assets/Users.png";
import Map from "../assets/Map.png";
import DecorativeConcert from "../assets/DecorativeConcert.jpg";
import Transfer from "../assets/transfer.gif";
import Group from "../assets/group.gif";
import Sell from "../assets/sell.gif";
import EventBackground from "../assets/event_bkg_image.jpg";
import AnimatedButton from "../components/AnimatedButton";
import { fetchEvents, storage, subscribeToEvents } from "../api/appwriteConfig";

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

  useEffect(() => {
    const getEvents = async () => {
      const eventData = await fetchEvents();

      const updatedEvents = eventData.map((event) => {
        let imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/66dd97eb0009f68104ef/files/${event.imageFileId}/view?project=67699acf002ecc80c89f&mode=admin`;

        return { ...event, imageField: imageUrl };
      });

      setEvents(updatedEvents);
    };

    getEvents();
    const unsubscribe = subscribeToEvents(getEvents);
    return () => unsubscribe();
  }, []);

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
          className="fixed inset-0 w-full h-full bg-no-repeat bg-cover bg-center z-0 opacity-60"
          style={{
            backgroundImage: `url(${EventBackground})`,
            filter: 'blur(30px) brightness(0.4) saturate(1.1)',
          }}
        ></div>
        
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

          <div className="min-h-screen w-full px-4 py-12 flex flex-col xl:flex-row items-center justify-center gap-10 relative">
            {/* White Background Container */}
            <div className="absolute inset-0 bg-white rounded-3xl mx-4 shadow-2xl overflow-hidden z-0">
              {/* Subtle Pattern Overlay */}
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-orange-100 to-purple-100"></div>
            </div>
            
            {/* Map Image */}
            <img
              src={Map}
              alt="Map"
              className="w-[375px] h-[626px] rounded-[20px] object-cover shadow-lg z-10 border border-gray-200"
            />

            {/* Text Content */}
            <div className="flex flex-col items-end justify-center z-10">
              {/* Title */}
              <h2
                className="font-anton text-[64px] leading-[112.9999999999999%] tracking-[0.18em] text-right text-gray-900"
                style={{ width: '355px', height: '360px', top: '838px', left: '429px' }}
              >
                Discover<br />
                Concerts<br />
                Tailored<br />
                Just for<br />
                You!
              </h2>

              {/* Description */}
              <p
                className="font-Cantarell text-[20px] leading-[171%] tracking-[-1%] text-right mt-4 text-gray-700"
                style={{
                  width: '378px',
                  height: '124px',
                }}
              >
                Connect your Spotify account, and<br />
                receive concert recommendations<br />
                based on the artists you listen<br />
                to the most.
              </p>
            </div>

            {/* Concert Image */}
            <img
              src={DecorativeConcert}
              alt="Concert illustration"
              className="w-[375px] h-[626px] rounded-[20px] object-cover shadow-lg z-10 border border-gray-200"
            />
          </div>

          {/* Trending Events Section with Carousel */}
          <div className="w-full px-4 md:px-12 py-8">
            <h1 className="text-white font-inter font-[400] text-[24px] leading-[38px] tracking-[0.17em] sm:text-[28px] sm:leading-[30px] md:text-[32px] md:leading-[32px] mb-6 pl-4 sm:pl-8 md:pl-12">
              Trending Events:
            </h1>

            <div className="px-2 sm:px-4 md:px-8">
              <Slider {...carouselSettings}>
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <div
                      key={index}
                      className="px-2 sm:px-4 focus:outline-none cursor-pointer"
                      onClick={() => handleEventClick(event.$id)}
                    >
                      <div className="w-full max-w-[280px] sm:max-w-[335px] mx-auto bg-[#1a1a1a] text-white rounded-lg shadow-lg overflow-hidden">
                        <div className="aspect-w-4 aspect-h-3">
                          <img
                            src={event.imageField}
                            alt={event.name}
                            className="w-full h-[200px] sm:h-[250px] object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2 min-h-[120px] flex flex-col justify-center">
                          <h3 className="text-lg font-semibold line-clamp-1">
                            {event.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Date: {event.date || "Not Available"}
                          </p>
                          <p className="text-md text-white">
                            Rs. {event.price || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <h2 className="text-white text-xl sm:text-2xl">
                      No Trending Events Available
                    </h2>
                  </div>
                )}
              </Slider>
            </div>
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
    </>
  );
};

export default Home;