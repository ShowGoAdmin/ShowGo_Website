import React from 'react';
import { Link } from 'react-router-dom';
import './AnimatedButton.css';

const AnimatedButton = ({ text, to, onClick, className = '' }) => {
  // Check if this button is being used inside a Link or <a> tag
  const isWrappedInLink = typeof to === 'string';
  
  // If a "to" prop is provided but we're not using it for routing (because parent is already handling it),
  // render a div instead of another Link to avoid nested <a> tags
  const ButtonTag = isWrappedInLink ? 'div' : (to ? Link : 'button');
  
  // Only pass routing props if we're actually using them
  const buttonProps = isWrappedInLink ? {} : (to ? { to } : { onClick });
  
  // Special styling for specific button texts
  const getStyle = () => {
    if (text === "Get Started") {
      return { fontSize: '0.85em', letterSpacing: '-0.02em' };
    }
    return {};
  };
  
  const textStyle = getStyle();

  return (
    <ButtonTag 
      className={`animated-btn ${className}`} 
      {...buttonProps}
    >
      <span className="text" style={textStyle}>{text}</span>
      <span aria-hidden className="marquee" style={textStyle}>{text}</span>
    </ButtonTag>
  );
};

export default AnimatedButton; 