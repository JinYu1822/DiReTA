import React, { useState, useEffect } from 'react';
import { User as AppUser, UserRole, AppData } from './types';
import { auth, getAppData, signOutGoogle, signInWithGoogle, db } from './services/firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import SchoolDashboard from './components/SchoolDashboard';
import Header from './components/Header';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [appData, setAppData] = useState<AppData>({ users: [], schools: [], reports: [], submissions: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in, now get their app-specific profile
        const userDocRef = doc(db, "users", user.uid);
        onSnapshot(userDocRef, (doc) => {
             if (doc.exists()) {
                const appUser = { id: doc.id, ...doc.data() } as AppUser;
                setCurrentUser(appUser);
            } else {
                // This user signed in with Google but is not in our users collection.
                setError("Access Denied. Your email is not registered for this application.");
                setCurrentUser(null);
                signOutGoogle();
            }
        });
      } else {
        setCurrentUser(null);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      getAppData()
        .then(data => {
            setAppData(data);
            setError(null);
        })
        .catch(err => {
            console.error("Failed to fetch app data:", err);
            setError("Could not load application data. Please try again later.");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false); // Not logged in, no data to load
    }
  }, [currentUser]);


  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={signInWithGoogle} error={error} />;
  }
  
  // While currentUser is set, data might still be loading
  if (isLoading) {
     return (
       <div className="min-h-screen bg-gray-100">
         <Header user={currentUser} onLogout={signOutGoogle} />
         <div className="flex items-center justify-center p-8">
           <Spinner />
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={currentUser} onLogout={signOutGoogle} />
      <main className="p-4 sm:p-6 lg:p-8">
        {currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR ? (
          <AdminDashboard 
            currentUser={currentUser} 
            data={appData} 
          />
        ) : (
          <SchoolDashboard currentUser={currentUser} data={appData} />
        )}
      </main>
    </div>
  );
};

export default App;