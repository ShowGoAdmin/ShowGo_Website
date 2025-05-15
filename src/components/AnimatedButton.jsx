import React from 'react';
import { Link } from 'react-router-dom';
import './AnimatedButton.css';

const AnimatedButton = ({ text, to, onClick, className = '' }) => {
  // If a "to" prop is provided, render a Link, otherwise render a button
  const ButtonTag = to ? Link : 'button';
  const buttonProps = to ? { to } : { onClick };
  
  // Special styling for specific button texts
  const getStyle = () => {
    if (text === "Get Started") {s
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