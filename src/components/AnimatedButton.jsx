import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AnimatedButton.css';

const AnimatedButton = ({ text, to, onClick, className = '' }) => {
  const navigate = useNavigate();
  
  // Special styling for specific button texts
  const getStyle = () => {
    if (text === "Get Started") {
      return { fontSize: '0.85em', letterSpacing: '-0.02em' };
    }
    return {};
  };
  
  const textStyle = getStyle();

  // Handle navigation 
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      e.preventDefault();
      navigate(to);
    }
  };

  // If a "to" prop is provided, render as a button with onClick handler
  // Otherwise, render as whatever was specified (button or Link)
  return (
    <button 
      className={`animated-btn ${className}`} 
      onClick={handleClick}
      type="button"
    >
      <span className="text" style={textStyle}>{text}</span>
      <span aria-hidden className="marquee" style={textStyle}>{text}</span>
    </button>
  );
};

export default AnimatedButton; 