import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, School, Report, Submission } from './types';
import { getUsers, getSchools, getReports, getSubmissions, saveUsers, saveReports, saveSubmissions } from './services/mockDataService';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import SchoolDashboard from './components/SchoolDashboard';
import Header from './components/Header';
import Spinner from './components/Spinner';
import Notification from './components/Notification';
import { ExclamationTriangleIcon } from './components/icons/StatusIcons';
import { ArrowPathIcon } from './components/icons/DashboardIcons';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);


  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [fetchedUsers, fetchedSchools, fetchedReports, fetchedSubmissions] = await Promise.all([
        getUsers(),
        getSchools(),
        getReports(),
        getSubmissions(),
      ]);
      setUsers(fetchedUsers);
      setSchools(fetchedSchools);
      setReports(fetchedReports);
      setSubmissions(fetchedSubmissions);

      // Check for logged in user in sessionStorage
      const loggedInUserId = sessionStorage.getItem('loggedInUserId');
      if (loggedInUserId) {
          const user = fetchedUsers.find((u) => u.id === loggedInUserId);
          if (user) {
              setCurrentUser(user);
          } else {
              // If user is not found (e.g., deleted), clear session
              sessionStorage.removeItem('loggedInUserId');
          }
      }
    } catch (err) {
      setError('Failed to load application data.');
      console.error(err);
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  }, []);
  
  const schedulePoll = useCallback((delay: number = 30000) => {
    if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
    }
    pollTimeoutRef.current = window.setTimeout(async () => {
        console.log('Polling for new data...');
        await fetchData(true);
        schedulePoll(); // Schedules the next one for 30s
    }, delay);
  }, [fetchData]);
  
  useEffect(() => {
    fetchData().then(() => {
        schedulePoll(); // Start polling after initial fetch succeeds
    });
    return () => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
        }
    }
  }, [fetchData, schedulePoll]);


  const handleLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      sessionStorage.setItem('loggedInUserId', user.id);
      setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUserId');
    setCurrentUser(null);
  };
  
  const handleManualRefresh = async () => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); // Pause polling
    console.log('Manual data refresh triggered.');
    await fetchData(false); // Use false to show the main loading spinner
    schedulePoll(30000); // Reschedule polling
  };

  const updateSubmissions = async (updatedSubmissions: Submission[]) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); // Pause polling
    setIsSaving(true);
    setNotification(null);
    try {
        await saveSubmissions(updatedSubmissions);
        setSubmissions(updatedSubmissions);
        setNotification({ message: 'Submissions saved successfully!', type: 'success' });
    } catch (error) {
        setNotification({ message: 'Failed to save submissions. Data has been refreshed.', type: 'error' });
        console.error("Failed to save submissions:", error);
        fetchData(true); // Refresh data on failure to sync with server
        throw error; // Re-throw to let the component know about the failure
    } finally {
        setIsSaving(false);
        schedulePoll(5000); // Reschedule polling, with a short delay to get confirmation
    }
  };

  const updateUsers = async (updatedUsers: User[]) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); // Pause polling
    setIsSaving(true);
    setNotification(null);
    try {
      await saveUsers(updatedUsers);
      setUsers(updatedUsers);
      setNotification({ message: 'User data saved successfully!', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Failed to save user data. Data has been refreshed.', type: 'error' });
      console.error("Failed to save users:", error);
      fetchData(true);
      throw error;
    } finally {
      setIsSaving(false);
      schedulePoll(5000); // Reschedule polling, with a short delay to get confirmation
    }
  };
  
  const updateReports = async (updatedReports: Report[]) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); // Pause polling
    setIsSaving(true);
    setNotification(null);
     try {
      await saveReports(updatedReports);
      setReports(updatedReports);
      setNotification({ message: 'Report data saved successfully!', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Failed to save report data. Data has been refreshed.', type: 'error' });
      console.error("Failed to save reports:", error);
      fetchData(true);
      throw error;
    } finally {
      setIsSaving(false);
      schedulePoll(5000); // Reschedule polling, with a short delay to get confirmation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-red-600 mb-6 max-w-md">{error}</p>
          <button
            onClick={() => fetchData(false)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Try Again
          </button>
        </div>
      );
  }

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }
  
  const data = { users, schools, reports, submissions };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <Header user={currentUser} onLogout={handleLogout} />
        <main className="p-4 sm:p-6 lg:p-8">
          {currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR ? (
            <AdminDashboard 
              currentUser={currentUser} 
              data={data} 
              onSubmissionsUpdate={updateSubmissions}
              onUsersUpdate={updateUsers}
              onReportsUpdate={updateReports}
              onRefreshData={handleManualRefresh}
            />
          ) : (
            <SchoolDashboard 
                currentUser={currentUser} 
                data={data} 
                onRefreshData={handleManualRefresh}
            />
          )}
        </main>
      </div>
      <footer className="text-center py-4 text-xs text-gray-500">
        Developed by Kyle L. with AI assistance
      </footer>
    </div>
  );
};

export default App;