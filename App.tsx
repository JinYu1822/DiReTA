import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, School, Report, Submission } from './types';
import { getUsers, getSchools, getReports, getSubmissions } from './services/mockDataService';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import SchoolDashboard from './components/SchoolDashboard';
import Header from './components/Header';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
    } catch (err) {
      setError('Failed to load application data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const updateSubmissions = (updatedSubmissions: Submission[]) => {
    setSubmissions(updatedSubmissions);
  };

  const updateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };
  
  const updateReports = (updatedReports: Report[]) => {
    setReports(updatedReports);
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