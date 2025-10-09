import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, School, Report, Submission } from './types';
import { getUsers, getSchools, getReports, getSubmissions, saveUsers, saveReports, saveSubmissions } from './services/mockDataService';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import SchoolDashboard from './components/SchoolDashboard';
import Header from './components/Header';
import Spinner from './components/Spinner';
import Notification from './components/Notification';

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

  useEffect(() => {
    fetchData(); // Initial data fetch
  }, [fetchData]);

  // Polling for data updates every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Polling for new data...');
      fetchData(true);
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [fetchData]);


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

  const updateSubmissions = async (updatedSubmissions: Submission[]) => {
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
    }
  };

  const updateUsers = async (updatedUsers: User[]) => {
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
    }
  };
  
  const updateReports = async (updatedReports: Report[]) => {
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
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }
  
  const data = { users, schools, reports, submissions };

  return (
    <div className="min-h-screen bg-gray-100">
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
          />
        ) : (
          <SchoolDashboard currentUser={currentUser} data={data} />
        )}
      </main>
    </div>
  );
};

export default App;
