import React from "react";

/**
 * PageLayout - A component that provides a standardized layout pattern for all pages
 * with the navbar overlapping at the top
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.className - Additional class names for the container
 * @param {string} props.heroClassName - Additional class names for the hero section
 * @param {React.ReactNode} props.heroContent - Content to display in the hero section
 * @param {string} props.bgImageUrl - Optional background image URL
 * @param {boolean} props.hasHero - Whether the page has a hero section (default true)
 */
const PageLayout = ({ 
  children, 
  className = "", 
  heroClassName = "",
  heroContent,
  bgImageUrl,
  hasHero = true
}) => {
  // Generate background style if bgImageUrl is provided
  const bgStyle = bgImageUrl ? {
    backgroundImage: `url(${bgImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div className={`min-h-screen bg-black relative ${className}`}>
      {/* Hero Section (Optional) */}
      {hasHero && (
        <div 
          className={`relative flex items-center justify-center min-h-[60vh] pt-[99px] ${heroClassName}`}
          style={bgStyle}
        >
          <div className="container mx-auto px-4 z-10">
            {heroContent}
          </div>
          
          {/* Overlay for darker backgrounds if needed */}
          {bgImageUrl && (
            <div className="absolute inset-0 bg-black/50 z-0"></div>
          )}
        </div>
      )}
      
      {/* Main Content */}
      <div className={`relative z-10 ${!hasHero ? 'pt-[99px]' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout; 