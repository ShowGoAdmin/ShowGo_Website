import React, { useState } from "react";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  // Function to handle social media clicks
  const handleSocialClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Newsletter subscription state and handler
  const [email, setEmail] = useState('');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubscribeMessage('Please enter a valid email');
      return;
    }
    
    // In a real app, this would call an API to subscribe
    console.log('Subscribing email:', email);
    setSubscribeMessage('Thanks for subscribing!');
    setEmail('');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSubscribeMessage('');
    }, 3000);
  };

  return (
    <div className="w-full min-h-[400px] bg-black flex flex-col items-center justify-center relative z-20">
      <footer className="w-full text-white">
        <div className="container mx-auto flex flex-wrap justify-center items-start gap-8 pt-10 px-6 md:px-12 lg:px-16">
          {/* Contact Section */}
          <div className="flex flex-col gap-3 w-full sm:w-[45%] md:w-[30%] lg:w-[20%] min-w-[160px] text-center sm:text-left">
            <Link
              to="/contact"
              className="text-lg font-semibold hover:underline cursor-pointer"
              onClick={() => window.scrollTo(0, 0)}
            >
              Contact Us
            </Link>
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              📧{" "}
              <a href="mailto:admin@showgo.in" className="hover:underline cursor-pointer">
                admin@showgo.in
              </a>
            </p>
            <p className="flex items-center gap-2 justify-center sm:justify-start">
              📞{" "}
              <a href="tel:+918146331455" className="hover:underline cursor-pointer">
                +91 81463 31455
              </a>
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col gap-2 w-full sm:w-[45%] md:w-[30%] lg:w-[16%] min-w-[160px] text-center sm:text-left">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <Link to="/about" className="hover:underline cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              About Us
            </Link>
            <Link to="/faq" className="hover:underline cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              FAQ
            </Link>
            <Link to="/terms" className="hover:underline cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              Terms & Conditions
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:underline cursor-pointer"
              onClick={() => window.scrollTo(0, 0)}
            >
              Privacy Policy
            </Link>
          </div>

          {/* Account Section */}
          <div className="flex flex-col gap-2 w-full sm:w-[45%] md:w-[30%] lg:w-[10%] min-w-[160px] text-center sm:text-left">
            <h3 className="text-lg font-semibold">Account</h3>
            <Link
              to="/account-delete"
              className="hover:underline"
              onClick={() => window.scrollTo(0, 0)}
            >
              Request Account Deletion
            </Link>
          </div>

          {/* Follow Us Section */}
          <div className="flex flex-col gap-2 w-full sm:w-[45%] md:w-[30%] lg:w-[16%] min-w-[160px] text-center">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <div className="flex gap-3 justify-center">
              <FaFacebookF 
                onClick={() => handleSocialClick('https://facebook.com/showgo')} 
                className="cursor-pointer hover:text-gray-400 text-xl"
              />
              <FaTwitter 
                onClick={() => handleSocialClick('https://twitter.com/showgo')} 
                className="cursor-pointer hover:text-gray-400 text-xl"
              />
              <FaInstagram 
                onClick={() => handleSocialClick('https://instagram.com/showgo')} 
                className="cursor-pointer hover:text-gray-400 text-xl"
              />
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="flex flex-col gap-4 w-full sm:w-[45%] md:w-[60%] lg:w-[20%] text-center sm:text-left">
            <h3 className="text-lg font-semibold">Newsletter</h3>
            <p>Stay updated with our latest events</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 w-full">
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-[#27272A] text-white rounded-lg outline-none w-full px-4 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button 
                  type="submit"
                  className="bg-white text-black rounded-lg cursor-pointer text-sm px-6 py-3 font-semibold hover:bg-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto"
                >
                  Subscribe
                </button>
              </div>
              {subscribeMessage && (
                <p className={`text-sm ${subscribeMessage.includes('valid') ? 'text-red-400' : 'text-green-400'}`}>
                  {subscribeMessage}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="container mx-auto flex justify-center items-center text-center pt-10 px-6 md:px-12 lg:px-16">
          © 2025 ShowGo. All rights reserved
        </div>
      </footer>
    </div>
  );
};

export default Footer;