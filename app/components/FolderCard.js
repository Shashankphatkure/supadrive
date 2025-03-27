'use client';

import { Button } from './Button';

export function FolderCard({ name, onClick, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-16 w-16 text-blue-500 mb-2" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      <p className="text-sm font-medium text-center truncate w-full">{name}</p>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          onClick={handleDelete}
          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
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
    </div>
  );
} 