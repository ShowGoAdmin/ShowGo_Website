import { FiSend, FiMail, FiPhone, FiMessageCircle } from "react-icons/fi";
import Footer from "../components/Footer";

const Contact = () => {
  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 md:px-16 gap-8"
      style={{ paddingTop: "60px" }}
    >
      {/* Title */}
      <h1 className="text-4xl font-bold text-center">Quick Support</h1>
      <p
        className="text-gray-400 text-xl md:text-2xl text-center"
        style={{ paddingBottom: "45px" }}
      >
        Need help? We're here for you 24/7
      </p>

      {/* Main Content (Same Row on Desktop) */}
      <div className="flex flex-col md:flex-row items-stretch w-full max-w-5xl gap-6">
        {/* Left - Contact Form */}
        <div
          className="bg-gray-900 p-6 rounded-lg w-full md:w-1/2 flex flex-col justify-between h-auto md:h-[700px]"
          style={{
            paddingTop: "30px",
            paddingLeft: "30px",
            paddingRight: "30px",
          }}
        >
          <h2
            className="text-xl font-semibold mb-4 text-center"
            style={{ paddingBottom: "15px" }}
          >
            Send us a Message
          </h2>
          <div className="flex flex-col gap-4 flex-grow">
            <div>
              <label className="text-gray-400 text-sm">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full p-3 mt-1 rounded bg-black text-white focus:outline-none"
                style={{
                  paddingBottom: "8px",
                  paddingLeft: "15px",
                  paddingTop: "8px",
                }}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Message</label>
              <textarea
                rows="4"
                placeholder="How can we help you?"
                className="w-full p-3 mt-1 rounded bg-black text-white focus:outline-none"
                style={{ paddingTop: "4px", paddingLeft: "10px" }}
              />
            </div>
            <button
              className="w-full bg-white text-black py-2 rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer"
              style={{ paddingBottom: "10px", paddingTop: "10px" }}
            >
              <FiSend size={20} /> Send Message
            </button>
          </div>
        </div>

        {/* Right - Support Options */}
        <div className="flex flex-col gap-4 w-full md:w-1/2 h-auto md:h-[700px]">
          {/* Email Support */}
          <div className="bg-gray-900 rounded-lg flex flex-col items-center justify-center text-center flex-grow gap-3 p-4">
            <FiMail size={30} />
            <h3 className="text-base md:text-lg font-semibold">
              Email Support
            </h3>
            <p className="text-gray-400 text-sm">
              Get in touch with our support team
            </p>
            <a
              href="mailto:admin@showgo.in"
              className="mt-1 text-white underline text-sm"
            >
              admin@showgo.in
            </a>
          </div>

          {/* Phone Support */}
          <div className="bg-gray-900 p-4 rounded-lg flex flex-col items-center justify-center flex-grow gap-3 text-center">
            <FiPhone size={30} />
            <h3 className="text-base md:text-lg font-semibold">
              Phone Support
            </h3>
            <p className="text-gray-400 text-sm">
              Call us for immediate assistance
            </p>
            <a
              href="tel:+918146331455"
              className="mt-1 text-white underline text-sm"
            >
              +91 81463 31455
            </a>
          </div>

          {/* WhatsApp Support */}
          <div className="bg-gray-900 p-4 rounded-lg flex flex-col items-center justify-center flex-grow gap-3 text-center">
            <FiMessageCircle size={30} />
            <h3 className="text-base md:text-lg font-semibold">
              WhatsApp Support
            </h3>
            <p className="text-gray-400 text-sm">Chat with us on WhatsApp</p>
            <a
              href="https://wa.me/918146331455"
              className="mt-1 text-white underline text-sm"
            >
              Message us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
