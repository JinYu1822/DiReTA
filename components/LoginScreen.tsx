import React, { useState } from 'react';
import { GoogleIcon } from './icons/GoogleIcon';

interface LoginScreenProps {
  onLogin: () => void;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLoginClick = async () => {
        setIsLoggingIn(true);
        try {
            await onLogin();
        } catch (err) {
            console.error("Login failed:", err);
            // Error is handled by the onAuthStateChanged listener in App.tsx
        } finally {
            setIsLoggingIn(false);
        }
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Division Report Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">Secure Sign In Required</p>
        </div>
        
        <div className="space-y-4">
            <button
              type="button"
              onClick={handleLoginClick}
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light disabled:opacity-50 disabled:cursor-wait"
            >
              <GoogleIcon className="w-5 h-5 mr-2" />
              {isLoggingIn ? 'Signing In...' : 'Sign in with Google'}
            </button>
            <p className="text-xs text-center text-gray-500">
              Only pre-registered @deped.gov.ph accounts have access.
            </p>
        </div>
        
        {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default LoginScreen;