import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, School, Report, Submission, AppData } from '../types';
import { getUsers, getSchools, getReports, getSubmissions, saveUsers, saveReports, saveSubmissions } from '../services/mockDataService';
import Spinner from '../components/Spinner';

interface DataContextType extends AppData {
  isLoading: boolean;
  error: string | null;
  fetchData: () => void;
  updateSubmissions: (updatedSubmissions: Submission[]) => void;
  updateUsers: (updatedUsers: User[]) => void;
  updateReports: (updatedReports: Report[]) => void;
  setCurrentUser: (user: User | null) => void;
  currentUser: User | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
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

      const loggedInUserId = sessionStorage.getItem('loggedInUserId');
      if (loggedInUserId) {
        const user = fetchedUsers.find((u) => u.id === loggedInUserId);
        if (user) {
          setCurrentUser(user);
        } else {
          sessionStorage.removeItem('loggedInUserId');
        }
      }
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

  const updateSubmissions = (updatedSubmissions: Submission[]) => {
    setSubmissions(updatedSubmissions);
    saveSubmissions(updatedSubmissions);
  };

  const updateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  const updateReports = (updatedReports: Report[]) => {
    setReports(updatedReports);
    saveReports(updatedReports);
  };

  const handleSetCurrentUser = (user: User | null) => {
    if (user) {
      sessionStorage.setItem('loggedInUserId', user.id);
    } else {
      sessionStorage.removeItem('loggedInUserId');
    }
    setCurrentUser(user);
  };

  const value = {
    users,
    schools,
    reports,
    submissions,
    isLoading,
    error,
    fetchData,
    updateSubmissions,
    updateUsers,
    updateReports,
    currentUser,
    setCurrentUser: handleSetCurrentUser,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};