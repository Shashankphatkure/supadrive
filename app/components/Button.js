import { twMerge } from 'tailwind-merge';

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  isLoading = false,
  icon,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none';
  
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-5 py-2.5 text-base rounded-md',
    icon: 'p-2 rounded-full',
  };

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm',
    secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-800 dark:text-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700',
    outline: 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700 text-gray-800 dark:text-gray-200',
    link: 'bg-transparent text-blue-600 dark:text-blue-400 hover:underline p-0',
  };

  return (
    <button
      className={twMerge(
        baseClasses, 
        sizes[size], 
        variants[variant], 
        isLoading && 'relative text-transparent transition-none hover:text-transparent',
        className
      )}
      onClick={onClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="animate-spin h-5 w-5 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
    </button>
  );
} 