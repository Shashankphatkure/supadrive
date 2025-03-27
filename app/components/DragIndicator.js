'use client';

import { useEffect, useState } from 'react';

export function DragIndicator({ isVisible }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!isVisible) return;
    
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed pointer-events-none z-50 transition-opacity duration-200"
      style={{ 
        left: `${position.x + 15}px`, 
        top: `${position.y + 15}px`, 
        opacity: isVisible ? 1 : 0
      }}
    >
      <div className="bg-blue-500 text-white px-2 py-1 rounded shadow-lg text-sm">
        <span>Release to reorder</span>
      </div>
    </div>
  );
} 