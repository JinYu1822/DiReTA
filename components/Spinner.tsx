import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = 'h-12 w-12 border-b-2 border-brand-blue' }) => {
  return (
    <div className={`animate-spin rounded-full ${className}`}></div>
  );
};

export default Spinner;