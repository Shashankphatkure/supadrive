'use client';

import { useState, useRef } from 'react';
import { Button } from './Button';

export function DropZone({ onFilesAccepted }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const extractImagesFromFileList = async (fileList) => {
    const validFiles = [];
    
    // Process each item in the file list
    for (let i = 0; i < fileList.length; i++) {
      const item = fileList[i];
      
      if (item.type.startsWith('image/')) {
        // Direct image file
        validFiles.push(item);
      } else if (item.webkitGetAsEntry && item.webkitGetAsEntry().isDirectory) {
        // It's a directory
        const entry = item.webkitGetAsEntry();
        if (entry.isDirectory) {
          const dirFiles = await readDirectoryContents(entry);
          validFiles.push(...dirFiles);
        }
      }
    }
    
    return validFiles;
  };

  const readDirectoryContents = (dirEntry) => {
    return new Promise((resolve) => {
      const dirReader = dirEntry.createReader();
      const imageFiles = [];

      // Recursive function to read all directory contents
      const readEntries = () => {
        dirReader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve(imageFiles);
            return;
          }

          for (const entry of entries) {
            if (entry.isFile) {
              // Get file
              const file = await getFileFromEntry(entry);
              if (file && file.type.startsWith('image/')) {
                // Only add image files
                imageFiles.push(file);
              }
            } else if (entry.isDirectory) {
              // Process subdirectory
              const subDirFiles = await readDirectoryContents(entry);
              imageFiles.push(...subDirFiles);
            }
          }

          // Continue reading (some browsers limit the entries returned in a single call)
          readEntries();
        });
      };

      readEntries();
    });
  };

  const getFileFromEntry = (fileEntry) => {
    return new Promise((resolve) => {
      fileEntry.file(file => {
        resolve(file);
      }, error => {
        console.error('Error getting file:', error);
        resolve(null);
      });
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const extractedImages = await extractImagesFromFileList(e.dataTransfer.items);
      
      if (extractedImages.length > 0) {
        onFilesAccepted(extractedImages);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fallback for browsers that don't support items
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
  
  const handleFolderButtonClick = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    }
  };

  const handleFolderChange = async (e) => {
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
        Drag and drop images or folders here
      </p>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Supports: JPG, PNG, GIF, SVG, WEBP
      </p>
      <div className="flex gap-3">
        <Button
          onClick={handleButtonClick}
          variant="outline"
          className="text-sm"
        >
          Select files
        </Button>
        <Button
          onClick={handleFolderButtonClick}
          variant="outline"
          className="text-sm"
        >
          Select folder
        </Button>
      </div>
      <input 
        ref={inputRef}
        type="file" 
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input 
        ref={folderInputRef}
        type="file" 
        directory="true"
        webkitdirectory="true"
        mozdirectory="true"
        className="hidden"
        onChange={handleFolderChange}
      />
    </div>
  );
} 