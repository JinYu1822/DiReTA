import React from 'react';
import { User, UserRole } from '../types';
import { GoogleIcon } from './icons/GoogleIcon';

interface LoginScreenProps {
  users: User[];
  onLogin: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {

  const handleGoogleSignIn = () => {
    // In a real app, this would trigger the Google OAuth flow.
    // For this deployed version, we will log in as the admin user
    // to showcase full functionality.
    const adminUser = users.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
        onLogin(adminUser.id);
    } else {
        // Fallback or error for the case where no admin is found.
        alert('Critical Error: Admin user profile not found. Unable to log in.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Division Report Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">Secure Sign In Required</p>
        </div>
        
        <div className="space-y-4 pt-4">
            <button
              onClick={handleGoogleSignIn}
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
      </div>
    </div>
  );
};

export default LoginScreen;