import { twMerge } from 'tailwind-merge';

export function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium text-sm transition-colors';
  
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-800 dark:text-gray-200 dark:hover:bg-gray-800',
    outline: 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200',
  };

  return (
    <button
      className={twMerge(baseClasses, variants[variant], className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
} 