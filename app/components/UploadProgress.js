'use client';

import { useEffect, useState } from 'react';

export function UploadProgress({ progress }) {
  const { total, processed, uploading, folders } = progress;
  const [visible, setVisible] = useState(false);
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const folderCount = folders ? folders.size : 0;
  
  useEffect(() => {
    if (uploading) {
      setVisible(true);
    } else {
      // Delay hiding to show completion
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [uploading]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm w-full animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">
          {uploading ? 'Uploading files...' : 'Upload complete!'}
        </h3>
        {folderCount > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
            {folderCount} folder{folderCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full ${uploading ? 'bg-blue-500' : 'bg-green-500'}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{processed} of {total} files</span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
} 