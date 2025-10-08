import React, { useState } from 'react';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface LoginScreenProps {
  users: User[];
  onLogin: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userToLogin, setUserToLogin] = useState<User | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUserToLogin(foundUser);
      setStep('code');
    } else {
      setError('Account not registered. Please contact an administrator.');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // In a real app, this code would be verified against a backend service.
    // For this simulation, we'll use a static code.
    if (code === '123456' && userToLogin) {
      onLogin(userToLogin.id);
    } else {
      setError('Invalid code. Please try again.');
    }
  };
  
  const handleGoBack = () => {
    setError(null);
    setCode('');
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
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-brand-blue py-3 px-4 text-sm font-medium text-white hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-brand-blue-light focus:ring-offset-2"
        >
          Continue
        </button>
      </div>
       <p className="text-xs text-center text-gray-500">
         Only pre-registered accounts have access.
       </p>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleCodeSubmit} className="space-y-6">
       <div className="text-sm text-gray-600">
        <p>A login code has been sent to</p>
        <p className="font-medium text-gray-900">{userToLogin?.email}</p>
      </div>
      <div>
        <label htmlFor="code" className="sr-only">Login Code</label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`relative block w-full appearance-none rounded-md border px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`}
          placeholder="6-digit code"
        />
        <p className="mt-2 text-xs text-gray-500">For simulation, use code: <strong className="font-mono">123456</strong></p>
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="submit"
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-brand-blue py-3 px-4 text-sm font-medium text-white hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-brand-blue-light focus:ring-offset-2"
        >
          Sign In
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Division Report Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' ? 'Secure Sign In Required' : 'Check Your Email'}
          </p>
        </div>
        
        {step === 'email' ? renderEmailStep() : renderCodeStep()}
        
      </div>
    </div>
  );
};

export default LoginScreen;