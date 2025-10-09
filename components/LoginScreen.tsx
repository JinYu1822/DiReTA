import React, { useState } from 'react';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './Spinner';

interface LoginScreenProps {
  users: User[];
  onLogin: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userToLogin, setUserToLogin] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    // Simulate a brief delay for better user feedback
    setTimeout(() => {
      const foundUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      if (foundUser) {
        setUserToLogin(foundUser);
        setStep('password');
      } else {
        setError('Account not registered. Please contact an administrator.');
      }
      setIsProcessing(false);
    }, 300);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    // Simulate a brief delay for better user feedback
    setTimeout(() => {
        if (userToLogin && userToLogin.password && password.trim() === userToLogin.password.trim()) {
            onLogin(userToLogin.id);
            // No need to set isProcessing to false, as the component will unmount on successful login
        } else {
            setError('Invalid password. Please try again.');
            setIsProcessing(false);
        }
    }, 500);
  };
  
  const handleGoBack = () => {
    setError(null);
    setPassword('');
    setStep('email');
    setUserToLogin(null);
  }

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="sr-only">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`relative block w-full appearance-none rounded-md border px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`}
          placeholder="Email address"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={isProcessing}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-brand-blue py-3 px-4 text-sm font-medium text-white hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-brand-blue-light focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Spinner className="h-5 w-5 border-b-2 border-white" /> : 'Continue'}
        </button>
      </div>
       <p className="text-xs text-center text-gray-500">
         Only pre-registered accounts have access.
       </p>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
       <div className="text-sm text-gray-600">
        <p>Signing in as</p>
        <p className="font-medium text-gray-900">{userToLogin?.email}</p>
      </div>
      <div>
        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`relative block w-full appearance-none rounded-md border px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`}
          placeholder="Password"
        />
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={isProcessing}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-brand-blue py-3 px-4 text-sm font-medium text-white hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-brand-blue-light focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Spinner className="h-5 w-5 border-b-2 border-white" /> : 'Sign In'}
        </button>
      </div>
       <div className="text-center">
            <button
              type="button"
              onClick={handleGoBack}
              className="font-medium text-sm text-brand-blue hover:text-brand-blue-light flex items-center gap-1 mx-auto"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to email
            </button>
        </div>
    </form>
  );

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Division Report Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' ? 'Secure Sign In Required' : 'Enter Your Password'}
          </p>
        </div>
        
        {step === 'email' ? renderEmailStep() : renderPasswordStep()}
        
      </div>
      <footer className="absolute bottom-0 left-0 right-0 text-center py-4 text-xs text-gray-500">
        Developed by: Kyle L. • Powered by AI
      </footer>
    </div>
  );
};

export default LoginScreen;