'use client';

import { useState, useRef } from 'react';
import { Button } from './Button';

export function DropZone({ onFilesAccepted }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-12 w-12 text-gray-400 mb-3" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
        <path d="M12 12v9"></path>
        <path d="m16 16-4-4-4 4"></path>
      </svg>
      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Drag and drop images here
      </p>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Supports: JPG, PNG, GIF, SVG, WEBP
      </p>
      <Button
        onClick={handleButtonClick}
        variant="outline"
        className="text-sm"
      >
        Select files
      </Button>
      <input 
        ref={inputRef}
        type="file" 
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
} 