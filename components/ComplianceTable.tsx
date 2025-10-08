

import React, { useState, useMemo } from 'react';
import { AppData, Submission, DisplayComplianceStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentMinusIcon, ExclamationTriangleIcon } from './icons/StatusIcons';
import { ChevronDownIcon } from './icons/DashboardIcons';
import { ChevronUpDownIcon } from './icons/DashboardIcons';


interface ComplianceTableProps {
  data: AppData;
  performanceData: { schoolId: string; name: string; onTimeRate: number; nonComplianceRate: number; overdueAverage: number; }[];
  getDisplayStatus: (submission: Submission | undefined, reportDeadline: string) => DisplayComplianceStatus;
}

const StatusCell: React.FC<{ status: DisplayComplianceStatus }> = ({ status }) => {
    const styles = {
        [DisplayComplianceStatus.SUBMITTED_ON_TIME]: { text: 'On Time', icon: <CheckCircleIcon className="w-4 h-4 text-green-500"/>, title: 'Submitted On Time' },
        [DisplayComplianceStatus.SUBMITTED_LATE]: { text: 'Late', icon: <CheckCircleIcon className="w-4 h-4 text-yellow-500"/>, title: 'Submitted Late' },
        [DisplayComplianceStatus.OVERDUE]: { text: 'Overdue', icon: <XCircleIcon className="w-4 h-4 text-red-500"/>, title: 'Overdue' },
        [DisplayComplianceStatus.PENDING]: { text: 'Pending', icon: <ClockIcon className="w-4 h-4 text-blue-500"/>, title: 'Pending' },
        [DisplayComplianceStatus.NOT_APPLICABLE]: { text: 'N/A', icon: <DocumentMinusIcon className="w-4 h-4 text-gray-500"/>, title: 'Not Applicable' },
    };
    const style = styles[status];
  
    return (
      <div className="flex justify-center items-center" title={style.title}>
        {style.icon}
      </div>
    );
  };
  

const ComplianceTable: React.FC<ComplianceTableProps> = ({ data, performanceData, getDisplayStatus }) => {
  const { schools, reports, submissions } = data;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'schoolName', direction: 'ascending' });

  const activeReports = useMemo(() => {
    return reports.filter(report => {
        // A report is considered "active" and should be displayed if at least one school
        // has a status of Pending or Overdue for it.
        const isStillActive = schools.some(school => {
            const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
            const status = getDisplayStatus(submission, report.deadline);
            return status === DisplayComplianceStatus.PENDING || status === DisplayComplianceStatus.OVERDUE;
        });
        return isStillActive;
    });
  }, [reports, schools, submissions, getDisplayStatus]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    // Default to descending for numeric columns for better initial view
    if (['onTimeRate', 'nonComplianceRate', 'overdueAverage'].includes(key)) {
      direction = 'descending';
    }

    if (sortConfig.key === key) {
      // Toggle direction if same key is clicked
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedSchools = useMemo(() => {
    const statusOrder: Record<DisplayComplianceStatus, number> = {
        [DisplayComplianceStatus.OVERDUE]: 1,
        [DisplayComplianceStatus.PENDING]: 2,
        [DisplayComplianceStatus.SUBMITTED_LATE]: 3,
        [DisplayComplianceStatus.SUBMITTED_ON_TIME]: 4,
        [DisplayComplianceStatus.NOT_APPLICABLE]: 5,
    };
    
    let sortableSchools = [...schools];
    
    sortableSchools.sort((a, b) => {
        if (sortConfig.key === 'schoolName') {
            return a.name.localeCompare(b.name);
        }
        if (['onTimeRate', 'nonComplianceRate', 'overdueAverage'].includes(sortConfig.key)) {
            const perfA = performanceData.find(p => p.schoolId === a.id);
            const perfB = performanceData.find(p => p.schoolId === b.id);
            const key = sortConfig.key as 'onTimeRate' | 'nonComplianceRate' | 'overdueAverage';
            const valA = perfA ? perfA[key] : -1;
            const valB = perfB ? perfB[key] : -1;
            return valA - valB;
        }
        
        // Handle sorting by report status
        const report = reports.find(r => r.id === sortConfig.key);
        if (report) {
            const submissionA = submissions.find(s => s.schoolId === a.id && s.reportId === report.id);
            const submissionB = submissions.find(s => s.schoolId === b.id && s.reportId === report.id);
            const statusA = getDisplayStatus(submissionA, report.deadline);
            const statusB = getDisplayStatus(submissionB, report.deadline);
            const orderA = statusOrder[statusA];
            const orderB = statusOrder[statusB];
            return orderA - orderB;
        }

        return 0;
    });

    return sortConfig.direction === 'descending' ? sortableSchools.reverse() : sortableSchools;
  }, [schools, reports, submissions, performanceData, sortConfig, getDisplayStatus]);


  const SortableHeader: React.FC<{ sortKey: string; title: string; className?: string; titleAttribute?: string }> = ({ sortKey, title, className, titleAttribute }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <th scope="col" className={`px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50 ${className}`} title={titleAttribute}>
        <button onClick={() => requestSort(sortKey)} className="group flex items-center justify-center w-full gap-2">
            <span>{title}</span>
            <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                {isSorted ? (
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${sortConfig.direction === 'ascending' ? 'rotate-180' : ''}`} />
                ) : (
                    <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
                )}
            </span>
        </button>
      </th>
    );
  };


  return (
    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
      <thead className="sticky top-0 z-30 bg-gray-50 shadow-[inset_0_-1px_0_#e5e7eb]">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-40 w-40 sm:w-64">
            <button onClick={() => requestSort('schoolName')} className="group flex items-center gap-2">
              <span>School Name</span>
              <span className={sortConfig.key === 'schoolName' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                  {sortConfig.key === 'schoolName' ? (
                      <ChevronDownIcon className={`w-4 h-4 transition-transform ${sortConfig.direction === 'ascending' ? 'rotate-180' : ''}`} />
                  ) : (
                      <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
                  )}
              </span>
            </button>
          </th>
          <SortableHeader sortKey="onTimeRate" title="On-Time %" className="text-center" titleAttribute="On-Time Compliance Rate" />
          <SortableHeader sortKey="nonComplianceRate" title="Non-Comp %" className="text-center" titleAttribute="Non-Compliance Rate" />
          <SortableHeader sortKey="overdueAverage" title="Overdue Avg." className="text-center" titleAttribute="Average Days Overdue" />

          {activeReports.map(report => (
             <SortableHeader key={report.id} sortKey={report.id} title={report.title} className="text-center" titleAttribute={`Deadline: ${new Date(report.deadline).toLocaleDateString()}`}/>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {sortedSchools.map(school => {
            const perf = performanceData.find(p => p.schoolId === school.id);
            return (
          <tr key={school.id}>
            <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 truncate max-w-40 sm:max-w-64" title={school.name}>{school.name}</td>
            <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-semibold text-green-600">{perf ? perf.onTimeRate.toFixed(0) + '%' : 'N/A'}</td>
            <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-600">{perf ? perf.nonComplianceRate.toFixed(0) + '%' : 'N/A'}</td>
            <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-700">{perf ? perf.overdueAverage.toFixed(1) : 'N/A'}</td>
            {activeReports.map(report => {
              const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
              const status = getDisplayStatus(submission, report.deadline);
              return (
                <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <StatusCell status={status} />
                </td>
              );
            })}
          </tr>
        )})}
      </tbody>
    </table>
  );
};

export default ComplianceTable;