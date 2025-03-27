'use client';

import { Button } from './Button';

export function FolderCard({ name, onClick, onDelete, children }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    } else if (e.key === 'Delete') {
      onDelete();
    }
  };

  return (
    <div 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Folder: ${name}`}
      className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-16 w-16 text-blue-500 mb-2 transition-transform duration-300 group-hover:scale-110" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        {children || (
          <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Button 
              variant="danger" 
              size="sm"
              onClick={handleDelete}
              className="rounded-full shadow-md"
              aria-label="Delete folder"
              title="Delete folder"
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
        )}
      </div>
      <p className="text-sm font-medium text-center truncate w-full">{name}</p>
    </div>
  );
} 