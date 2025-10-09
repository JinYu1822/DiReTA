import React, { useState, useEffect, useMemo } from 'react';
import { AppData, StoredComplianceStatus, User, UserRole } from '../types';

interface ReportTaggingToolProps {
    currentUser: User;
    data: AppData;
}

const ReportTaggingTool: React.FC<ReportTaggingToolProps> = ({ currentUser, data }) => {
    const { schools, reports, submissions } = data;

    const visibleReports = useMemo(() => {
        if (currentUser.role === UserRole.MODERATOR) {
            return reports.filter(r => currentUser.assignedReportIds?.includes(r.id));
        }
        return reports;
    }, [reports, currentUser]);

    const [selectedReportId, setSelectedReportId] = useState<string>('');

    // Effect to select the first report by default or if the selected one is no longer visible
    useEffect(() => {
        const isSelectedVisible = visibleReports.some(r => r.id === selectedReportId);
        if ((!selectedReportId || !isSelectedVisible) && visibleReports.length > 0) {
            setSelectedReportId(visibleReports[0].id);
        }
    }, [visibleReports, selectedReportId]);

    const schoolStatuses = useMemo(() => {
        if (!selectedReportId) return [];
        return schools.map(school => {
            const submission = submissions.find(s => s.schoolId === school.id && s.reportId === selectedReportId);
            return {
                schoolId: school.id,
                schoolName: school.name,
                status: submission?.status || 'Pending',
                submissionDate: submission?.submissionDate || null,
                remarks: submission?.remarks || ''
            };
        });
    }, [selectedReportId, schools, submissions]);
    
    const selectedReport = reports.find(r => r.id === selectedReportId);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Report Submission Viewer</h2>
                <p className="text-sm text-gray-600 mt-1">This is a read-only view of the submission data from the Google Sheet.</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Update Submission Data</h3>
                <div className="text-sm text-blue-700 space-y-2">
                    <p>All data for report submissions must now be updated directly in the Google Sheet database. Changes will automatically appear here within a minute.</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                        <li>Open the Google Sheet and navigate to the <strong>"Submissions"</strong> sheet.</li>
                        <li>To add or update an entry, find or create the correct row and fill in the columns:
                            <ul className="list-disc list-inside pl-6 mt-1 text-xs">
                                <li><strong>schoolId & reportId:</strong> Copy these IDs from the "Schools" and "Reports" sheets. They must be an exact match.</li>
                                <li><strong>status:</strong> Must be either <code className="bg-blue-100 p-1 rounded">Submitted</code> or <code className="bg-blue-100 p-1 rounded">Not Applicable</code>. Leave the cell blank for "Pending".</li>
                                <li><strong>submissionDate:</strong> Must be in <code className="bg-blue-100 p-1 rounded">YYYY-MM-DD</code> format. This is only required if the status is "Submitted".</li>
                                <li><strong>remarks:</strong> Add any relevant notes here.</li>
                            </ul>
                        </li>
                         <li>To revert a submission to "Pending", simply delete the entire row for that school/report combination from the "Submissions" sheet.</li>
                    </ol>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label htmlFor="report-select" className="font-medium text-gray-700 flex-shrink-0">Select Report to View:</label>
                <select
                    id="report-select"
                    value={selectedReportId}
                    onChange={e => setSelectedReportId(e.target.value)}
                    className="w-full md:w-auto flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={visibleReports.length === 0}
                >
                    {visibleReports.length > 0 ? visibleReports.map(report => (
                        <option key={report.id} value={report.id}>{report.title}</option>
                    )) : <option>No reports assigned or available.</option>}
                </select>
                {selectedReport && <span className="text-sm text-gray-500 flex-shrink-0">Deadline: {new Date(selectedReport.deadline).toLocaleDateString()}</span>}
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schoolStatuses.map((status) => (
                            <tr key={status.schoolId}>
                                <td className="px-4 py-3 font-medium text-gray-900">{status.schoolName}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{status.status}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {status.submissionDate ? new Date(status.submissionDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{status.remarks || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {schoolStatuses.length === 0 && (
                    <div className="text-center p-4 text-gray-500">
                        Please select a report to view its submission statuses.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportTaggingTool;