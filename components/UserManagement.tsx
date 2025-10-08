import React, { useState } from 'react';
import { User, School, Report, UserRole } from '../types';
import UserForm from './UserForm';
import { UserPlusIcon, PencilSquareIcon, TrashIcon } from './icons/DashboardIcons';

interface UserManagementProps {
    currentUser: User;
    users: User[];
    schools: School[];
    reports: Report[];
    onUsersUpdate: (updatedUsers: User[]) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, schools, reports, onUsersUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (userId: string) => {
        if (userId === currentUser.id) {
            alert("You cannot remove your own account.");
            return;
        }
        
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        // Prevent deleting the last user for a school
        if (userToDelete.role === UserRole.SCHOOL && userToDelete.schoolName) {
            const schoolUsers = users.filter(
                u => u.role === UserRole.SCHOOL && u.schoolName === userToDelete.schoolName
            );
            if (schoolUsers.length === 1) {
                alert(`Cannot remove ${userToDelete.name}. This is the last user assigned to ${userToDelete.schoolName}.\n\nPlease assign another user to this school before removing this one.`);
                return;
            }
        }

        if (window.confirm(`Are you sure you want to remove the user "${userToDelete.name}"? This action cannot be undone.`)) {
            onUsersUpdate(users.filter(u => u.id !== userId));
        }
    };

    const handleSaveUser = (userToSave: User) => {
        if (editingUser) {
            onUsersUpdate(users.map(u => u.id === userToSave.id ? userToSave : u));
        } else {
            onUsersUpdate([...users, { ...userToSave, id: `user-${new Date().getTime()}` }]);
        }
        setIsModalOpen(false);
        setEditingUser(null);
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Administration</h2>
                <button
                    onClick={handleAddUser}
                    className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center gap-2"
                >
                    <UserPlusIcon className="w-5 h-5"/>
                    <span>Add User</span>
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.schoolName || (user.assignedReportIds ? `${user.assignedReportIds.length} Reports` : '—')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                                    <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-900" title="Edit User">
                                        <PencilSquareIcon />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900" title="Delete User">
                                        <TrashIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserForm
                    userToEdit={editingUser}
                    onSave={handleSaveUser}
                    onCancel={() => setIsModalOpen(false)}
                    schools={schools}
                    reports={reports}
                    existingUsers={users}
                />
            )}
        </div>
    );
};

export default UserManagement;