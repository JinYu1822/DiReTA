import React from 'react';
import { User, UserRole } from '../types';
import { ChevronDownIcon } from './icons/DashboardIcons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  selectedSchoolName: string | null;
  onSwitchSchool: (schoolName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, selectedSchoolName, onSwitchSchool }) => {
  const isMultiSchoolUser = user.role === UserRole.SCHOOL && user.schoolNames && user.schoolNames.length > 1;

  return (
    <header className="bg-brand-blue shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:py-0 sm:h-16">
          <div className="flex-shrink-0 mb-2 sm:mb-0">
            <h1 className="text-xl font-bold text-white text-center sm:text-left">Division Report Tracker</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <div className="hidden sm:flex items-center justify-end text-xs text-indigo-200">
                <span>{user.role}</span>
                {selectedSchoolName && <span>&nbsp;-&nbsp;</span>}
                {isMultiSchoolUser ? (
                  <div className="relative">
                    <select
                      value={selectedSchoolName || ''}
                      onChange={(e) => onSwitchSchool(e.target.value)}
                      className="bg-transparent border-0 text-indigo-200 text-xs p-0 pr-5 focus:ring-0 appearance-none cursor-pointer"
                      aria-label="Switch school"
                    >
                      {user.schoolNames?.map(name => <option key={name} value={name} className="bg-brand-blue text-white">{name}</option>)}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <span>{selectedSchoolName}</span>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex-shrink-0 px-3 py-2 text-sm font-medium text-white bg-brand-blue-light rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;