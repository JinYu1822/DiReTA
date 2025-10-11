import React from 'react';
import { User, School } from '../types';

interface SchoolSelectorProps {
  user: User;
  schools: School[];
  onSelect: (schoolName: string) => void;
  onLogout: () => void;
}

const SchoolSelector: React.FC<SchoolSelectorProps> = ({ user, schools, onSelect, onLogout }) => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="mt-2 text-sm text-gray-600">
            You have access to multiple schools. Please select one to continue.
          </p>
        </div>
        
        <div className="space-y-3 pt-4">
          {schools.length > 0 ? (
            schools.map(school => (
              <button
                key={school.id}
                onClick={() => onSelect(school.name)}
                className="w-full text-left p-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50 hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <p className="font-semibold text-gray-800">{school.name}</p>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No schools are currently assigned to your account. Please contact an administrator.</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="text-sm font-medium text-brand-blue hover:text-brand-blue-light"
          >
            Sign Out
          </button>
        </div>
      </div>
       <footer className="absolute bottom-0 left-0 right-0 text-center py-4 text-xs text-gray-500">
        Developed by Kyle L. with AI assistance
      </footer>
    </div>
  );
};

export default SchoolSelector;