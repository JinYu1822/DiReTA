import React, { useState, useEffect, useMemo } from 'react';
import { AppData, User, UserRole, DisplayComplianceStatus } from '../types';
import { getDisplayStatus } from '../utils/complianceUtils';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentMinusIcon } from './icons/StatusIcons';

interface ReportTaggingToolProps {
    currentUser: User;
    data: AppData;
}

const StatusCounter: React.FC<{ icon: React.ReactNode; text: string; count: number; colorClass: string; }> = ({ icon, text, count, colorClass }) => (
    <div className="flex items-center gap-2 text-sm">
        <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-gray-700">{text}:</span>
            <span className="font-bold text-lg text-gray-900">{count}</span>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: DisplayComplianceStatus }> = ({ status }) => {
    const styles = {
      [DisplayComplianceStatus.SUBMITTED_ON_TIME]: { text: 'Submitted (On Time)', color: 'text-green-800 bg-green-100', icon: <CheckCircleIcon /> },
      [DisplayComplianceStatus.SUBMITTED_LATE]: { text: 'Submitted (Late)', color: 'text-yellow-800 bg-yellow-100', icon: <CheckCircleIcon /> },
      [DisplayComplianceStatus.OVERDUE]: { text: 'Overdue', color: 'text-red-800 bg-red-100', icon: <XCircleIcon /> },
      [DisplayComplianceStatus.PENDING]: { text: 'Pending', color: 'text-blue-800 bg-blue-100', icon: <ClockIcon /> },
      [DisplayComplianceStatus.NOT_APPLICABLE]: { text: 'Not Applicable', color: 'text-gray-800 bg-gray-100', icon: <DocumentMinusIcon /> },
    };
    const style = styles[status];
  
    return (
      <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${style.color}`}>
        {style.icon}
        {style.text}
      </span>
    );
  };

const ReportTaggingTool: React.FC<ReportTaggingToolProps> = ({ currentUser, data }) => {
    const { schools, reports, submissions } = data;

    const visibleReports = useMemo(() => {
        if (currentUser.role === UserRole.MODERATOR) {
            return reports.filter(r => currentUser.assignedReportIds?.includes(r.id));
        }
        return reports;
    }, [reports, currentUser]);

    const [selectedReportId, setSelectedReportId] = useState<string>('');

    useEffect(() => {
        const isSelectedVisible = visibleReports.some(r => r.id === selectedReportId);

        // If there are visible reports but none is selected, or the selected one is no longer visible,
        // default to the first one in the list.
        if (visibleReports.length > 0 && (!selectedReportId || !isSelectedVisible)) {
            setSelectedReportId(visibleReports[0].id);
        } 
        // If there are no longer any visible reports, clear the selection.
        else if (visibleReports.length === 0 && selectedReportId !== '') {
            setSelectedReportId('');
        }
    }, [visibleReports, selectedReportId]);
    
    const reportStatusCounts = useMemo(() => {
        if (!selectedReportId) return null;

        const selectedReport = reports.find(r => r.id === selectedReportId);
        if (!selectedReport) return null;

        const counts: Record<DisplayComplianceStatus, number> = {
            [DisplayComplianceStatus.SUBMITTED_ON_TIME]: 0,
            [DisplayComplianceStatus.SUBMITTED_LATE]: 0,
            [DisplayComplianceStatus.OVERDUE]: 0,
            [DisplayComplianceStatus.PENDING]: 0,
            [DisplayComplianceStatus.NOT_APPLICABLE]: 0,
        };

        schools.forEach(school => {
            const submission = submissions.find(s => s.schoolId === school.id && s.reportId === selectedReportId);
            const status = getDisplayStatus(submission, selectedReport.deadline);
            if (counts[status] !== undefined) {
                counts[status]++;
            }
        });

        return counts;
    }, [selectedReportId, schools, reports, submissions]);


    const schoolStatuses = useMemo(() => {
        if (!selectedReportId) return [];

        const selectedReport = reports.find(r => r.id === selectedReportId);
        if (!selectedReport) return [];

        return schools.map(school => {
            const submission = submissions.find(s => s.schoolId === school.id && s.reportId === selectedReportId);
            return {
                schoolId: school.id,
                schoolName: school.name,
                status: getDisplayStatus(submission, selectedReport.deadline),
                submissionDate: submission?.submissionDate || null,
                remarks: submission?.remarks || ''
            };
        }).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
    }, [selectedReportId, schools, submissions, reports]);
    
    const selectedReport = reports.find(r => r.id === selectedReportId);

    const renderContent = () => {
        if (reports.length === 0) {
            return <div className="text-center p-8 border-t">
                <h3 className="text-lg font-medium text-gray-800">No Reports Found</h3>
                <p className="mt-2 text-sm text-gray-500">The application could not find any reports in the database. Please add report data to the "Reports" sheet in your Google Sheet.</p>
            </div>;
        }

        if (currentUser.role === UserRole.MODERATOR && visibleReports.length === 0) {
            return <div className="text-center p-8 border-t">
                <h3 className="text-lg font-medium text-gray-800">No Reports Assigned</h3>
                <p className="mt-2 text-sm text-gray-500">Your account has not been assigned any reports to manage. Please contact an administrator.</p>
            </div>;
        }

        if (schools.length === 0) {
            return <div className="text-center p-8 border-t">
                <h3 className="text-lg font-medium text-gray-800">No Schools Found</h3>
                <p className="mt-2 text-sm text-gray-500">The application could not find any schools in the database. Please add school data to the "Schools" sheet in your Google Sheet.</p>
            </div>;
        }

        if (!selectedReportId) {
            return (
                 <div className="text-center p-8 border-t text-gray-500">
                    Loading submission data...
                </div>
            )
        }

        return (
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
                        {schoolStatuses.map((schoolStatus) => (
                            <tr key={schoolStatus.schoolId}>
                                <td className="px-4 py-3 font-medium text-gray-900">{schoolStatus.schoolName}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    <StatusBadge status={schoolStatus.status} />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {schoolStatus.submissionDate ? new Date(schoolStatus.submissionDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{schoolStatus.remarks || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Report Submission Viewer</h2>
                <p className="text-sm text-gray-600 mt-1">This is a read-only view of the submission data from the Google Sheet.</p>
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
                    )) : <option>No reports available to view.</option>}
                </select>
                {selectedReport && <span className="text-sm text-gray-500 flex-shrink-0">Deadline: {new Date(selectedReport.deadline).toLocaleDateString()}</span>}
            </div>
            
            {selectedReportId && reportStatusCounts && (
                <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">Current Status Overview</h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center">
                        <StatusCounter icon={<CheckCircleIcon className="w-5 h-5"/>} text="On Time" count={reportStatusCounts[DisplayComplianceStatus.SUBMITTED_ON_TIME]} colorClass="text-green-500" />
                        <StatusCounter icon={<CheckCircleIcon className="w-5 h-5"/>} text="Late" count={reportStatusCounts[DisplayComplianceStatus.SUBMITTED_LATE]} colorClass="text-yellow-500" />
                        <StatusCounter icon={<XCircleIcon className="w-5 h-5"/>} text="Overdue" count={reportStatusCounts[DisplayComplianceStatus.OVERDUE]} colorClass="text-red-500" />
                        <StatusCounter icon={<ClockIcon className="w-5 h-5"/>} text="Pending" count={reportStatusCounts[DisplayComplianceStatus.PENDING]} colorClass="text-blue-500" />
                        <StatusCounter icon={<DocumentMinusIcon className="w-5 h-5"/>} text="N/A" count={reportStatusCounts[DisplayComplianceStatus.NOT_APPLICABLE]} colorClass="text-gray-500" />
                    </div>
                </div>
            )}

            {renderContent()}
        </div>
    );
};

export default ReportTaggingTool;