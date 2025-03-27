'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { Button } from './Button';

export function ImageCard({ name, url, onDelete, index, onDragStart, onDragOver, onDrop, isDragging }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRef = useRef(null);
  
  const handleCopyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };
  
  const handleViewImage = (e) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleViewImage(e);
    } else if (e.key === 'Delete') {
      handleDelete(e);
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      handleCopyLink(e);
    }
  };

  const handleDragStart = (e) => {
    if (onDragStart) {
      // Set a preview image for better drag experience
      if (e.dataTransfer.setDragImage && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        e.dataTransfer.setDragImage(cardRef.current, rect.width / 2, rect.height / 2);
      }
      onDragStart(e, index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e, index);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(e, index);
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`group relative bg-white dark:bg-gray-800 border-2 ${
        isDragging 
          ? 'border-blue-500 opacity-70 scale-[0.98] shadow-lg' 
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400'
      } rounded-lg overflow-hidden flex flex-col transition-all duration-200 ease-in-out`}
      tabIndex={0}
      role="button"
      aria-label={`Image: ${name}`}
      onKeyDown={handleKeyDown}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleViewImage}
      onDoubleClick={handleViewImage}
    >
      <div className={`aspect-square relative bg-gray-100 dark:bg-gray-900 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
        <Image
          src={url}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-blue-500" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M5 9l2 2 4-4"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">{name}</p>
      </div>
      
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          onClick={handleCopyLink}
          className="p-1 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
          aria-label="Copy image link"
          title="Copy link"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleViewImage}
          className="p-1 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
          aria-label="View image"
          title="View image"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </Button>
        <Button 
          variant="danger"
          onClick={handleDelete}
          className="p-1"
          aria-label="Delete image"
          title="Delete"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </Button>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
          Link copied!
        </div>
      )}
    </div>
  );
} 