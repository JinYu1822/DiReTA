import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, Submission, StoredComplianceStatus, Report, User, UserRole } from '../types';
import { PencilSquareIcon } from './icons/DashboardIcons';
import { saveSubmissionsBatch, saveReport } from '../services/firebaseService';


interface ReportTaggingToolProps {
    currentUser: User;
    data: AppData;
}

interface SchoolStatusUpdate {
    schoolId: string;
    schoolName: string;
    status: StoredComplianceStatus | '';
    submissionDate: string;
    remarks: string;
}

const ReportTaggingTool: React.FC<ReportTaggingToolProps> = ({ currentUser, data }) => {
    const { schools, reports, submissions } = data;

    const visibleReports = useMemo(() => {
        if (currentUser.role === UserRole.MODERATOR) {
            return reports.filter(r => currentUser.assignedReportIds?.includes(r.id));
        }
        return reports;
    }, [reports, currentUser]);

    const [selectedReportId, setSelectedReportId] = useState<string>(visibleReports[0]?.id || '');
    const [schoolStatuses, setSchoolStatuses] = useState<SchoolStatusUpdate[]>([]);
    const [initialSchoolStatuses, setInitialSchoolStatuses] = useState<SchoolStatusUpdate[]>([]);
    const [lastUpdatedTimestamps, setLastUpdatedTimestamps] = useState<{ [schoolId: string]: number }>({});
    const [isSaving, setIsSaving] = useState(false);
    
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<Report | null>(null);
    const [reportFormData, setReportFormData] = useState({ title: '', focalPerson: '', deadline: '', modeOfSubmission: '' });

    const hideTimestampTimeoutRef = useRef<{ [schoolId: string]: number }>({});

    useEffect(() => {
        // Cleanup all timeouts on component unmount
        return () => {
            Object.values(hideTimestampTimeoutRef.current).forEach(clearTimeout);
        };
    }, []);

    // Effect to select the first report by default
    useEffect(() => {
        if (!selectedReportId && visibleReports.length > 0) {
            setSelectedReportId(visibleReports[0].id);
        }
    }, [visibleReports, selectedReportId]);

    // Effect to load school statuses when the report changes or submissions data is updated
    useEffect(() => {
        if (selectedReportId) {
            const statuses = schools.map((school): SchoolStatusUpdate => {
                const submission = submissions.find(s => s.schoolId === school.id && s.reportId === selectedReportId);
                return {
                    schoolId: school.id,
                    schoolName: school.name,
                    status: submission?.status || '',
                    submissionDate: submission?.submissionDate || new Date().toISOString().split('T')[0],
                    remarks: submission?.remarks || ''
                };
            });
            setSchoolStatuses(statuses);
            setInitialSchoolStatuses(JSON.parse(JSON.stringify(statuses))); // Deep copy for comparison
        }
    }, [selectedReportId, schools, submissions]);

    // Effect to clear "Updated" statuses when the selected report changes
    useEffect(() => {
        setLastUpdatedTimestamps({});
    }, [selectedReportId]);

    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(schoolStatuses) !== JSON.stringify(initialSchoolStatuses);
    }, [schoolStatuses, initialSchoolStatuses]);

    const handleStatusChange = <K extends keyof SchoolStatusUpdate>(schoolId: string, field: K, value: SchoolStatusUpdate[K]) => {
        setSchoolStatuses(prev =>
            prev.map(s => (s.schoolId === schoolId ? { ...s, [field]: value } : s))
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        const updatesToSave = schoolStatuses.filter((current, index) => 
            JSON.stringify(current) !== JSON.stringify(initialSchoolStatuses[index])
        );

        if (updatesToSave.length === 0) {
            setIsSaving(false);
            return;
        }

        try {
            await saveSubmissionsBatch(updatesToSave, selectedReportId);
            setInitialSchoolStatuses(JSON.parse(JSON.stringify(schoolStatuses))); // Resync initial state
            
            const now = Date.now();
            const newTimestamps = { ...lastUpdatedTimestamps };
            updatesToSave.forEach(update => {
                newTimestamps[update.schoolId] = now;
                 if (hideTimestampTimeoutRef.current[update.schoolId]) {
                    clearTimeout(hideTimestampTimeoutRef.current[update.schoolId]);
                }
                hideTimestampTimeoutRef.current[update.schoolId] = window.setTimeout(() => {
                    setLastUpdatedTimestamps(prev => {
                        const freshTimestamps = { ...prev };
                        delete freshTimestamps[update.schoolId];
                        return freshTimestamps;
                    });
                }, 3600000); // 1 hour
            });
            setLastUpdatedTimestamps(newTimestamps);
            
        } catch (error) {
            console.error("Failed to save submissions:", error);
            alert("An error occurred while saving. Please check the console and try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingReport(null);
        setReportFormData({ title: '', focalPerson: '', deadline: '', modeOfSubmission: '' });
        setIsReportModalOpen(true);
    };

    const handleOpenEditModal = () => {
        const reportToEdit = reports.find(r => r.id === selectedReportId);
        if (reportToEdit) {
            setEditingReport(reportToEdit);
            setReportFormData({
                title: reportToEdit.title,
                focalPerson: reportToEdit.focalPerson,
                deadline: reportToEdit.deadline, // Assumes YYYY-MM-DD format
                modeOfSubmission: reportToEdit.modeOfSubmission,
            });
            setIsReportModalOpen(true);
        }
    };
    
    const handleSaveReport = async () => {
        if (!reportFormData.title || !reportFormData.focalPerson || !reportFormData.deadline || !reportFormData.modeOfSubmission) {
            alert('Please fill out all fields for the report.');
            return;
        }
        
        try {
            let reportToSave: Partial<Report> & {id?: string} = { ...reportFormData };
            if (editingReport) {
                reportToSave.id = editingReport.id;
            }
            const savedReport = await saveReport(reportToSave as Report);
            
            if (!editingReport) { // If it was a new report
                setSelectedReportId(savedReport.id);
            }

            alert(`Report ${editingReport ? 'updated' : 'added'} successfully!`);
            setIsReportModalOpen(false);
            setEditingReport(null);
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Failed to save the report. Please try again.");
        }
    };

    const selectedReport = reports.find(r => r.id === selectedReportId);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-semibold">Report-Centric Tagging</h2>
                 <div className="flex items-center gap-2">
                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) && selectedReportId && (
                        <button
                            onClick={handleOpenEditModal}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 text-sm font-medium flex items-center gap-2"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                            <span>Edit Report</span>
                        </button>
                    )}
                    {currentUser.role === UserRole.ADMIN && (
                        <button
                            onClick={handleOpenAddModal}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                        >
                            Add Report
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <label htmlFor="report-select" className="font-medium text-gray-700">Select Report:</label>
                <select
                    id="report-select"
                    value={selectedReportId}
                    onChange={e => setSelectedReportId(e.target.value)}
                    className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={visibleReports.length === 0}
                >
                    {visibleReports.length > 0 ? visibleReports.map(report => (
                        <option key={report.id} value={report.id}>{report.title}</option>
                    )) : <option>No reports assigned or available.</option>}
                </select>
                {selectedReport && <span className="text-sm text-gray-500">Deadline: {new Date(selectedReport.deadline).toLocaleDateString()}</span>}
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24 text-center">Update Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schoolStatuses.map((status) => {
                            const isUpdated = !!lastUpdatedTimestamps[status.schoolId];
                            return (
                            <tr key={status.schoolId}>
                                <td className="px-4 py-3 font-medium text-gray-900">{status.schoolName}</td>
                                <td className="px-4 py-3 text-center">
                                    {isUpdated && (
                                        <span className="text-xs font-semibold text-green-600">
                                            Updated
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <select 
                                     value={status.status} 
                                     onChange={(e) => handleStatusChange(status.schoolId, 'status', e.target.value as StoredComplianceStatus | '')}
                                     className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">Pending</option>
                                        {Object.values(StoredComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input 
                                     type="date"
                                     value={status.submissionDate}
                                     onChange={(e) => handleStatusChange(status.schoolId, 'submissionDate', e.target.value)}
                                     disabled={status.status !== StoredComplianceStatus.SUBMITTED}
                                     className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input 
                                     type="text"
                                     value={status.remarks}
                                     onChange={(e) => handleStatusChange(status.schoolId, 'remarks', e.target.value)}
                                     placeholder="Add remarks..."
                                     className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {hasUnsavedChanges && (
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_5px_rgba(0,0,0,0.1)] border-t border-gray-200 flex justify-center items-center z-40">
                    <div className="max-w-7xl w-full flex justify-end px-4 sm:px-6 lg:px-8">
                         <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-brand-blue text-white px-8 py-2 rounded-md hover:bg-brand-blue-light font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                         >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
            
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">{editingReport ? 'Edit Report' : 'Add New Report'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Report Title</label>
                                <input type="text" value={reportFormData.title} onChange={e => setReportFormData({...reportFormData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Focal Person</label>
                                <input type="text" value={reportFormData.focalPerson} onChange={e => setReportFormData({...reportFormData, focalPerson: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Deadline</label>
                                <input type="date" value={reportFormData.deadline} onChange={e => setReportFormData({...reportFormData, deadline: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mode of Submission</label>
                                <input type="text" value={reportFormData.modeOfSubmission} onChange={e => setReportFormData({...reportFormData, modeOfSubmission: e.target.value})} placeholder="e.g., Google Form link or email address" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setIsReportModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSaveReport} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{editingReport ? 'Save Changes' : 'Add Report'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportTaggingTool;