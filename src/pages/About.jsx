import React from "react";
import PageLayout from "../components/PageLayout";

const AboutShowGo = () => {
  // Hero content for the About page
  const heroContent = (
    <div className="text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
        About ShowGo
      </h1>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        Your premier destination for event ticketing and management
      </p>
    </div>
  );

  return (
    <PageLayout
      heroContent={heroContent}
      className="text-white"
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-20 py-12">
        {/* About Section */}
        <div className="text-center w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Our Story</h2>
          <p className="text-gray-400 w-full text-[14px] relative leading-relaxed mb-8">
            ShowGo is a comprehensive ticketing platform designed to streamline the way events are organized, attended, and managed. Whether you're an attendee searching for exciting events or an organizer looking to host your next big show, ShowGo makes the entire process simple, efficient, and enjoyable.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            Our mission is to revolutionize the event industry by providing a seamless and secure ticketing experience for everyone. From small local gatherings to large-scale international events, ShowGo is your one-stop solution for all your ticketing needs.
          </p>
        </div>

        {/* Main Description */}
        <div className="text-center w-full max-w-4xl mx-auto">
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            Our platform is built with the goal of providing seamless and secure ticketing solutions for both attendees and event organizers. From easy event browsing to straightforward ticket booking, ShowGo aims to enhance the way people experience live events.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            We are committed to delivering a user-friendly experience that prioritizes security, convenience, and accessibility. With ShowGo, you can trust that your event journey is in safe hands.
          </p>
        </div>

        {/* Attendees Section */}
        <div className="w-full max-w-4xl mx-auto text-center mt-12">
          <h3 className="text-2xl font-semibold mb-8 relative top-1">For Attendees</h3>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            ShowGo makes it easy for attendees to find and book tickets for events they love. Whether it's a concert, a sports match, or a theatre performance, our platform offers a wide variety of events across different genres.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            We prioritize providing a seamless and user-friendly experience, allowing you to find the best events near you and make bookings effortlessly. Stay updated on new events and offers by subscribing to our newsletter.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            With ShowGo, you can also manage your tickets, transfer them to friends, or resell them securely if your plans change. We ensure that your event experience is hassle-free from start to finish.
          </p>
        </div>

        {/* Event Organizers Section */}
        <div className="w-full max-w-4xl mx-auto text-center mt-12">
          <h3 className="text-2xl font-semibold mb-8 relative top-1">For Event Organizers</h3>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            Organizing an event with ShowGo is straightforward and stress-free. Our platform allows organizers to create, manage, and promote events with ease. You can set up event pages, manage ticket listings, and track sales in real-time.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            ShowGo also provides tools to help you reach a wider audience by offering features like event promotion and social media sharing. We aim to help you build a successful event with maximum attendance.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            With ShowGo, you can focus on the creative and logistical aspects of your event while we take care of the ticketing. Our platform ensures that ticket sales and attendee management are seamless, so you can provide a smooth experience for your audience.
          </p>
          <p className="text-gray-400 text-[14px] relative leading-relaxed mb-8">
            Additionally, ShowGo offers analytics and insights to help you understand your audience better and improve future events. We are here to support you every step of the way.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default AboutShowGo;