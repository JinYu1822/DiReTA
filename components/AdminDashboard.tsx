import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DisplayComplianceStatus, UserRole } from '../types';
import ComplianceTable from './ComplianceTable';
import ReportTaggingTool from './ReportTaggingTool';
import UserManagement from './UserManagement';
import StatCard from './StatCard';
import EmailAutomationSimulator from './EmailAutomationSimulator';
import { DocumentChartBarIcon, PresentationChartLineIcon, StarIcon, ExclamationTriangleIcon as ExclamationTriangleIconDashboard, ChevronDownIcon, ArrowDownTrayIcon } from './icons/DashboardIcons';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentMinusIcon } from './icons/StatusIcons';
import { getDisplayStatus } from '../utils/complianceUtils';

const AdminDashboard: React.FC = () => {
  const { currentUser, schools, reports, submissions } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPromptSubmittersOpen, setIsPromptSubmittersOpen] = useState(false);
  const [isFrequentLateOpen, setIsFrequentLateOpen] = useState(false);

  const performanceData = useMemo(() => {
    if (!schools || !reports || !submissions) {
      return { schoolMetrics: [], promptSubmitters: [], frequentLate: [] };
    }

    const schoolMetrics = schools.map(school => {
      const schoolSubmissions = submissions.filter(s => s.schoolId === school.id);
      const applicableReports = reports.filter(report => {
        const sub = schoolSubmissions.find(s => s.reportId === report.id);
        return !sub || sub.status !== 'Not Applicable';
      });

      if (applicableReports.length === 0) {
        return { schoolId: school.id, name: school.name, onTimeRate: 0, nonComplianceRate: 0, lateOrOverdueCount: 0, reportCount: 0, overdueAverage: 0 };
      }

      let onTimeCount = 0;
      let lateOrOverdueCount = 0;
      let totalDaysPastDeadline = 0;
      let reportsPastDeadlineCount = 0;
      const now = new Date();

      applicableReports.forEach(report => {
        const submission = schoolSubmissions.find(s => s.reportId === report.id);
        const status = getDisplayStatus(submission, report.deadline);

        if (status === DisplayComplianceStatus.SUBMITTED_ON_TIME) {
          onTimeCount++;
        } else if (status === DisplayComplianceStatus.SUBMITTED_LATE || status === DisplayComplianceStatus.OVERDUE) {
          lateOrOverdueCount++;
        }

        const deadline = new Date(report.deadline);
        if (status === DisplayComplianceStatus.SUBMITTED_LATE && submission?.submissionDate) {
          const submissionDate = new Date(submission.submissionDate);
          const daysDiff = Math.ceil((submissionDate.getTime() - deadline.getTime()) / (1000 * 3600 * 24));
          totalDaysPastDeadline += daysDiff > 0 ? daysDiff : 0;
          reportsPastDeadlineCount++;
        } else if (status === DisplayComplianceStatus.OVERDUE) {
          const daysDiff = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 3600 * 24));
          totalDaysPastDeadline += daysDiff > 0 ? daysDiff : 0;
          reportsPastDeadlineCount++;
        }
      });

      const onTimeRate = (onTimeCount / applicableReports.length) * 100;
      const nonComplianceRate = (lateOrOverdueCount / applicableReports.length) * 100;
      const overdueAverage = reportsPastDeadlineCount > 0 ? totalDaysPastDeadline / reportsPastDeadlineCount : 0;

      return { schoolId: school.id, name: school.name, onTimeRate, nonComplianceRate, lateOrOverdueCount, reportCount: applicableReports.length, overdueAverage };
    });

    const promptSubmitters = schoolMetrics
      .filter(s => s.onTimeRate >= 80 && s.reportCount >= 3)
      .sort((a, b) => b.onTimeRate - a.onTimeRate);

    const frequentLate = schoolMetrics
      .filter(s => s.lateOrOverdueCount >= 2)
      .sort((a, b) => b.lateOrOverdueCount - a.lateOrOverdueCount);

    return { schoolMetrics, promptSubmitters, frequentLate };
  }, [schools, reports, submissions]);

  const handleExportCSV = () => {
    const escapeCsvCell = (cell: string | number) => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    };

    const headers = [
      'School Name', 'On-Time %', 'Non-Comp %', 'Overdue Avg.',
      ...reports.map(r => r.title)
    ];

    const sortedSchoolsForExport = [...schools].sort((a, b) => a.name.localeCompare(b.name));

    const rows = sortedSchoolsForExport.map(school => {
      const perf = performanceData.schoolMetrics.find(p => p.schoolId === school.id);
      const reportStatuses = reports.map(report => {
        const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
        return getDisplayStatus(submission, report.deadline);
      });

      return [
        school.name,
        perf ? perf.onTimeRate.toFixed(0) : 'N/A',
        perf ? perf.nonComplianceRate.toFixed(0) : 'N/A',
        perf ? perf.overdueAverage.toFixed(1) : 'N/A',
        ...reportStatuses
      ].map(escapeCsvCell);
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map(row => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'report-compliance-overview.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (!currentUser) {
    return null;
  }

  const availableTabs = [
    { id: 'dashboard', label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { id: 'tagging', label: 'Report Tagging Tool', roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { id: 'userManagement', label: 'User Management', roles: [UserRole.ADMIN] },
    { id: 'automation', label: 'Automation', roles: [UserRole.ADMIN] }
  ];

  const tabs = availableTabs.filter(tab => tab.roles.includes(currentUser.role));

  const renderContent = () => {
    switch (activeTab) {
      case 'tagging':
        return <ReportTaggingTool />;
      case 'userManagement':
        return currentUser.role === UserRole.ADMIN ? <UserManagement /> : null;
      case 'automation':
        return <EmailAutomationSimulator />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Schools" value={schools.length.toString()} icon={<PresentationChartLineIcon />} />
              <StatCard title="Total Reports Tracked" value={reports.length.toString()} icon={<DocumentChartBarIcon />} />
              <StatCard title="Top Performers" value={performanceData.promptSubmitters.length.toString()} icon={<StarIcon />} description="On-Time Rate (>=80%)" color="green" />
              <StatCard title="Needs Attention" value={performanceData.frequentLate.length.toString()} icon={<ExclamationTriangleIconDashboard />} description="Late/Overdue (>=2)" color="red" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md">
                <button
                  onClick={() => setIsPromptSubmittersOpen(!isPromptSubmittersOpen)}
                  className="w-full flex justify-between items-center p-6 text-left"
                  aria-expanded={isPromptSubmittersOpen}
                  aria-controls="prompt-submitters-list"
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    Prompt Submitters
                    <span className="ml-2 font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-sm">
                      {performanceData.promptSubmitters.length}
                    </span>
                  </h3>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isPromptSubmittersOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPromptSubmittersOpen && (
                  <div id="prompt-submitters-list" className="px-6 pb-6">
                    <ul className="space-y-2 border-t pt-4">
                      {performanceData.promptSubmitters.length > 0 ? performanceData.promptSubmitters.map(s => (
                        <li key={s.schoolId} className="flex justify-between items-center text-sm">
                          <span>{s.name}</span>
                          <span className="font-semibold text-green-600">{s.onTimeRate.toFixed(0)}% On-Time</span>
                        </li>
                      )) : <p className="text-sm text-gray-500">No schools meet the criteria yet.</p>}
                    </ul>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-md">
                <button
                  onClick={() => setIsFrequentLateOpen(!isFrequentLateOpen)}
                  className="w-full flex justify-between items-center p-6 text-left"
                  aria-expanded={isFrequentLateOpen}
                  aria-controls="frequent-late-list"
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    Frequent Late/Overdue
                    <span className="ml-2 font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-sm">
                      {performanceData.frequentLate.length}
                    </span>
                  </h3>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isFrequentLateOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFrequentLateOpen && (
                  <div id="frequent-late-list" className="px-6 pb-6">
                    <ul className="space-y-2 border-t pt-4">
                      {performanceData.frequentLate.length > 0 ? performanceData.frequentLate.map(s => (
                        <li key={s.schoolId} className="flex justify-between items-center text-sm">
                          <span>{s.name}</span>
                          <span className="font-semibold text-red-600">{s.lateOrOverdueCount} Late/Overdue</span>
                        </li>
                      )) : <p className="text-sm text-gray-500">No schools are frequently late.</p>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md overflow-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Report Compliance Overview</h2>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mb-4 text-xs text-gray-600">
                <span className="font-semibold">Legend:</span>
                <div className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4 text-green-500" /> On Time</div>
                <div className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4 text-yellow-500" /> Late</div>
                <div className="flex items-center gap-1"><XCircleIcon className="w-4 h-4 text-red-500" /> Overdue</div>
                <div className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-blue-500" /> Pending</div>
                <div className="flex items-center gap-1"><DocumentMinusIcon className="w-4 h-4 text-gray-500" /> N/A</div>
              </div>
              <ComplianceTable performanceData={performanceData.schoolMetrics} getDisplayStatus={getDisplayStatus} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {currentUser.name}</h1>
        <p className="text-gray-600">Here's the overview of the division's report compliance.</p>
      </div>
      <div className="border-b border-gray-200">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>
        <nav className="-mb-px hidden sm:flex sm:space-x-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${activeTab === tab.id
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;