import React, { useState } from 'react';
import { User } from '../types';
import { GoogleIcon } from './icons/GoogleIcon';

interface LoginScreenProps {
  users: User[];
  onLogin: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      setIsAccessDenied(false);
      onLogin(selectedUserId);
    } else {
      // This case would be handled by Google Auth in a real app.
      // If the email returned by Google isn't in our system, they get access denied.
      setIsAccessDenied(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Division Report Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">Secure Sign In Required</p>
        </div>
        
        <div className="space-y-4">
            <button
              type="button"
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light"
            >
              <GoogleIcon className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>
            <p className="text-xs text-center text-gray-500">
              Only pre-registered @deped.gov.ph accounts have access.
            </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              For Demo Purposes
            </span>
          </div>
        </div>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
              <p className="text-sm text-center text-gray-600 mb-2">
                Simulate login by selecting a registered user profile.
              </p>
              <label htmlFor="user-select" className="sr-only">
                Select User Profile
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setIsAccessDenied(false);
                }}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light focus:z-10 sm:text-sm"
              >
                <option value="" disabled>
                  Select a user profile...
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            
            {isAccessDenied && (
                <p className="text-sm text-red-600 text-center">
                    Access Denied. This email is not registered in the system.
                </p>
            )}

          <div>
            <button
              type="submit"
              disabled={!selectedUserId}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Proceed to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;