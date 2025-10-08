import React, { useMemo } from 'react';
import { User, AppData, Submission, StoredComplianceStatus, DisplayComplianceStatus } from '../types';
import StatCard from './StatCard';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentMinusIcon, ExclamationTriangleIcon } from './icons/StatusIcons';
import { getDisplayStatus } from '../utils/complianceUtils';

interface SchoolDashboardProps {
  currentUser: User;
  data: AppData;
}

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

const SchoolDashboard: React.FC<SchoolDashboardProps> = ({ currentUser, data }) => {
  const { schools, reports, submissions } = data;
  const school = schools.find(s => s.name === currentUser.schoolName);

  const isUrl = (text: string) => {
    if (typeof text !== 'string') return false;
    const trimmedText = text.trim();
    return trimmedText.startsWith('http://') || trimmedText.startsWith('https://');
  };

  const schoolData = useMemo(() => {
    if (!school) return { performance: null, reportList: [], overdueReports: [], overdueAverage: 0 };

    const schoolSubmissions = submissions.filter(s => s.schoolId === school.id);
    
    const applicableReports = reports.filter(report => {
        const sub = schoolSubmissions.find(s => s.reportId === report.id);
        return !sub || sub.status !== StoredComplianceStatus.NOT_APPLICABLE;
    });

    let onTimeCount = 0;
    let nonCompliantCount = 0;
    let totalDaysOverdue = 0;
    const now = new Date();
    
    applicableReports.forEach(report => {
        const submission = schoolSubmissions.find(s => s.reportId === report.id);
        const status = getDisplayStatus(submission, report.deadline);
        if (status === DisplayComplianceStatus.SUBMITTED_ON_TIME) {
            onTimeCount++;
        }
        if (status === DisplayComplianceStatus.SUBMITTED_LATE || status === DisplayComplianceStatus.OVERDUE) {
            nonCompliantCount++;
        }
        if (status === DisplayComplianceStatus.OVERDUE) {
            const deadline = new Date(report.deadline);
            if (now > deadline) {
                const daysDiff = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 3600 * 24));
                totalDaysOverdue += daysDiff;
            }
        }
    });

    const performance = {
        onTimeRate: applicableReports.length > 0 ? (onTimeCount / applicableReports.length) * 100 : 0,
        nonComplianceRate: applicableReports.length > 0 ? (nonCompliantCount / applicableReports.length) * 100 : 0,
    };
    
    const overdueAverage = applicableReports.length > 0 ? totalDaysOverdue / applicableReports.length : 0;
    
    const reportList = reports.map(report => {
        const submission = schoolSubmissions.find(s => s.reportId === report.id);
        return {
            ...report,
            status: getDisplayStatus(submission, report.deadline),
            submissionDate: submission?.submissionDate,
            remarks: submission?.remarks
        };
    }).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const overdueReports = reportList.filter(r => r.status === DisplayComplianceStatus.OVERDUE);

    return { performance, reportList, overdueReports, overdueAverage };
  }, [school, reports, submissions]);

  if (!school) {
    return <div className="text-red-500">Error: School data not found for user.</div>;
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {school.name}</h1>
        <p className="text-gray-600">This is your personalized compliance dashboard.</p>
      </div>
      
      {schoolData.overdueReports.length > 0 && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                          Urgent Action Required: {schoolData.overdueReports.length} Report(s) Overdue
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                          <p>The following reports have passed their submission deadline. Please submit them as soon as possible.</p>
                          <ul className="list-disc pl-5 space-y-1 mt-2">
                              {schoolData.overdueReports.map(report => (
                                  <li key={report.id}>
                                      <strong>{report.title}</strong> - Deadline was {new Date(report.deadline).toLocaleDateString()}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            title="On-Time Compliance Rate" 
            value={`${schoolData.performance?.onTimeRate.toFixed(0) || 0}%`}
            description="Reports submitted by the deadline"
            color="green"
        />
        <StatCard 
            title="Non-Compliance Rate" 
            value={`${schoolData.performance?.nonComplianceRate.toFixed(0) || 0}%`}
            description="Reports submitted late or overdue"
            color="red"
        />
        <StatCard 
            title="Average Days Overdue" 
            value={schoolData.overdueAverage.toFixed(1)}
            description="For all applicable reports"
            icon={<ClockIcon />}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800">Report Compliance List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Focal Person</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode of Submission</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schoolData.reportList.map(report => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.focalPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isUrl(report.modeOfSubmission) ? (
                        <a href={report.modeOfSubmission} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Submission Link
                        </a>
                    ) : (
                        report.modeOfSubmission
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.deadline).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><StatusBadge status={report.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.submissionDate ? new Date(report.submissionDate).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;