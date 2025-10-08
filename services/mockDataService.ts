import { User, School, Report, Submission } from '../types';
import { SCRIPT_URL } from './apiConfig';

// Helper function for GET requests to the Google Apps Script
const fetchData = async <T,>(action: string): Promise<T> => {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=${action}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok for action: ${action}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`API Error from Google Sheet: ${data.error}`);
        }
        return data as T;
    } catch (error) {
        console.error(`Failed to fetch data for ${action}:`, error);
        throw new Error(`Could not load data. Please check your connection and API setup in apiConfig.ts.`);
    }
};

// Helper function for POST requests to the Google Apps Script
const saveData = async <T,>(action: string, payload: T): Promise<void> => {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action, payload }),
            redirect: 'follow', // Required for Google Apps Script web apps
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok for saving action: ${action}`);
        }
        const result = await response.json();
        if (result.error || !result.success) {
            throw new Error(`API Error on save: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Failed to save data for ${action}:`, error);
        throw new Error(`Could not save data. Please check your connection and API setup.`);
    }
};

// --- API Implementation ---
export const getSchools = () => fetchData<School[]>('getSchools');
export const getUsers = () => fetchData<User[]>('getUsers');
export const getReports = () => fetchData<Report[]>('getReports');
export const getSubmissions = () => fetchData<Submission[]>('getSubmissions');

export const saveUsers = (updatedUsers: User[]) => saveData('saveUsers', updatedUsers);
export const saveReports = (updatedReports: Report[]) => saveData('saveReports', updatedReports);
export const saveSubmissions = (updatedSubmissions: Submission[]) => saveData('saveSubmissions', updatedSubmissions);