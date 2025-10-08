import React, { useState, useEffect } from 'react';
import { User, School, Report, UserRole } from '../types';

interface UserFormProps {
    userToEdit: User | null;
    onSave: (user: User) => void;
    onCancel: () => void;
    schools: School[];
    reports: Report[];
    existingUsers: User[];
}

const UserForm: React.FC<UserFormProps> = ({ userToEdit, onSave, onCancel, schools, reports, existingUsers }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: UserRole.SCHOOL,
        schoolName: '',
        assignedReportIds: []
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userToEdit) {
            setFormData({ ...userToEdit });
        } else {
            setFormData({
                name: '', email: '', role: UserRole.SCHOOL, schoolName: schools[0]?.name || '', assignedReportIds: []
            });
        }
        setPassword('');
        setConfirmPassword('');
        setError(null);
    }, [userToEdit, schools]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Reset assignments when role changes
            if(name === 'role') {
                newState.schoolName = value === UserRole.SCHOOL ? (schools[0]?.name || '') : '';
                newState.assignedReportIds = [];
            }
            return newState;
        });
    };

    const handleReportSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = [...e.target.selectedOptions].map(option => option.value);
        setFormData(prev => ({...prev, assignedReportIds: selectedIds }));
    };

    const validateForm = (): boolean => {
        setError(null);
        if (!formData.name || !formData.email || !formData.role) {
            setError('Please fill in all required fields: Name, Email, and Role.');
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(formData.email as string)) {
            setError('Please enter a valid email address.');
            return false;
        }
        const isEmailTaken = existingUsers.some(user => user.email === formData.email && user.id !== formData.id);
        if (isEmailTaken) {
            setError('This email address is already in use.');
            return false;
        }
        if (formData.role === UserRole.SCHOOL && !formData.schoolName) {
            setError('Please assign a school for this user.');
            return false;
        }
        // Password validation
        if (!userToEdit && !password) {
            setError('Password is required for new users.');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return false;
        }
        return true;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const finalUserData = { ...formData };
            if (password) {
                finalUserData.password = password;
            }
            onSave(finalUserData as User);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-medium mb-6">{userToEdit ? 'Edit User' : 'Add New User'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="user@example.com" required/>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Role</label>
                         <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                         </select>
                    </div>
                    {formData.role === UserRole.SCHOOL && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Assign School</label>
                            <select name="schoolName" value={formData.schoolName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                                {schools.map(school => <option key={school.id} value={school.name}>{school.name}</option>)}
                            </select>
                        </div>
                    )}
                     {formData.role === UserRole.MODERATOR && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Assign Reports (Ctrl/Cmd to select multiple)</label>
                            <select name="assignedReportIds" multiple value={formData.assignedReportIds} onChange={handleReportSelection} className="mt-1 block w-full h-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white">
                                {reports.map(report => <option key={report.id} value={report.id}>{report.title}</option>)}
                            </select>
                        </div>
                    )}

                    <hr className="my-2" />
                    <p className="text-sm text-gray-500">{userToEdit ? 'Leave password fields blank to keep the current password.' : 'Set a password for the new user.'}</p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" autoComplete="new-password" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input type="password" name="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" autoComplete="new-password" />
                    </div>


                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-medium">Cancel</button>
                        <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light font-medium">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;