
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  color?: 'green' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    default: 'bg-blue-50 text-brand-blue',
  };
  
  const textColorClasses = {
    green: 'text-green-700',
    red: 'text-red-700',
    default: 'text-gray-900',
  }

  const selectedColorClass = color ? colorClasses[color] : colorClasses.default;
  const selectedTextColorClass = color ? textColorClasses[color] : textColorClasses.default;

  return (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-start space-x-4">
      {icon && (
        <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${selectedColorClass}`}>
          <div className="h-6 w-6">{icon}</div>
        </div>
      )}
      <div className="flex-1">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold leading-9 text-gray-900">{value}</dd>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
