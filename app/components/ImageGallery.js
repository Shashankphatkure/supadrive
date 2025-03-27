'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from './Button';

export function ImageGallery({ images, initialIndex, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex || 0);
      
      // Add keyboard event listeners
      const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
          handlePrevious();
        } else if (e.key === 'ArrowRight') {
          handleNext();
        } else if (e.key === 'Escape') {
          onClose();
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setIsZoomed(prev => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, initialIndex, currentIndex, images.length]);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsLoading(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
  };

  const handleZoom = () => {
    setIsZoomed(prev => !prev);
  };

  const currentImage = images[currentIndex];
  
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
        aria-label="Close gallery"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Image container */}
      <div 
        className="h-full w-full flex items-center justify-center overflow-hidden"
        onClick={handleZoom}
      >
        <div className={`relative transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}>
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
            <Image
              src={currentImage.url}
              alt={currentImage.name}
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto"
              onLoad={() => setIsLoading(false)}
              onClick={(e) => {
                e.stopPropagation();
                handleZoom();
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="bg-black/30 hover:bg-black/50 text-white p-3 m-2 rounded-full transition-colors"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="bg-black/30 hover:bg-black/50 text-white p-3 m-2 rounded-full transition-colors"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Image info bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 flex justify-between items-center">
        <div>
          <p className="font-medium">{currentImage.name}</p>
          <p className="text-sm text-gray-300">{currentIndex + 1} of {images.length}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(currentImage.url);
            }}
            className="text-white hover:bg-white/20"
            aria-label="Copy image link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Copy Link
          </Button>
          <Button 
            variant="ghost" 
            onClick={(e) => {
              e.stopPropagation();
              window.open(currentImage.url, '_blank');
            }}
            className="text-white hover:bg-white/20"
            aria-label="Open in new tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Open in New Tab
          </Button>
        </div>
      </div>
    </div>
  );
} 