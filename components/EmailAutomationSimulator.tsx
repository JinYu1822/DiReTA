import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { DisplayComplianceStatus, UserRole, StoredComplianceStatus } from '../types';
import { getDisplayStatus } from '../utils/complianceUtils';
import { PaperAirplaneIcon } from './icons/DashboardIcons';

const EmailAutomationSimulator: React.FC = () => {
    const { users, schools, reports, submissions } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [simulationLog, setSimulationLog] = useState<string[]>([]);

    const runSimulation = () => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowDateString = tomorrow.toISOString().split('T')[0];

        const logs: string[] = [];
        let emailsPrepared = 0;

        // --- 1. Deadline Reminders ---
        const reportsDueTomorrow = reports.filter(r => r.deadline === tomorrowDateString);
        
        logs.push(`--- Checking for Deadline Reminders (Due: ${tomorrow.toLocaleDateString()}) ---`);
        if (reportsDueTomorrow.length > 0) {
            reportsDueTomorrow.forEach(report => {
                schools.forEach(school => {
                    const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
                    if (!submission || (submission.status !== StoredComplianceStatus.SUBMITTED && submission.status !== StoredComplianceStatus.NOT_APPLICABLE)) {
                         const schoolUsers = users.filter(u => u.role === UserRole.SCHOOL && u.schoolName === school.name);
                        schoolUsers.forEach(user => {
                            emailsPrepared++;
                            logs.push(`[REMINDER] Email prepared for ${user.email} (${school.name}) for report: "${report.title}".`);
                        });
                    }
                });
            });
        }
        if (logs.length === 1) { // Only the header was added
            logs.push("No pending reports are due tomorrow. No deadline reminders will be sent.");
        }


        // --- 2. Overdue Summaries ---
        const isMonday = now.getDay() === 1; // 0=Sun, 1=Mon
        logs.push(''); // Separator
        logs.push(`--- Checking for Overdue Report Summaries (Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}) ---`);

        if (isMonday) {
            let summaryEmailsSent = 0;
            schools.forEach(school => {
                const schoolOverdueReports = reports.filter(report => {
                    const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
                    return getDisplayStatus(submission, report.deadline) === DisplayComplianceStatus.OVERDUE;
                });

                if (schoolOverdueReports.length > 0) {
                    const schoolUsers = users.filter(u => u.role === UserRole.SCHOOL && u.schoolName === school.name);
                    schoolUsers.forEach(user => {
                        summaryEmailsSent++;
                        emailsPrepared++;
                        logs.push(`[OVERDUE SUMMARY] Email prepared for ${user.email} (${school.name}) with ${schoolOverdueReports.length} overdue report(s): ${schoolOverdueReports.map(r => `"${r.title}"`).join(', ')}.`);
                    });
                }
            });
             if (summaryEmailsSent === 0) {
                logs.push("No schools have overdue reports. No summary emails will be sent.");
            }
        } else {
            logs.push("Today is not Monday. No overdue summary emails will be sent.");
        }

        if(emailsPrepared === 0) {
            logs.push('');
            logs.push('SIMULATION COMPLETE: No emails need to be dispatched at this time.');
        }
        
        setSimulationLog(logs);
        setIsModalOpen(true);
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Email Automation Setup</h2>
            <p className="mb-4 text-gray-600">
                The system is configured to send two types of automated alerts to school users:
            </p>
            <ul className="list-disc list-inside mb-6 space-y-2 text-gray-600">
                <li><strong className="text-gray-800">Deadline Reminders:</strong> Sent daily to schools for any reports that are due the following day.</li>
                <li><strong className="text-gray-800">Overdue Summaries:</strong> Sent every Monday morning, compiling a list of all reports that are currently overdue for each school.</li>
            </ul>
            <p className="mb-4 text-gray-600">
                Click the button below to run a simulation based on the current data and see which emails would be dispatched right now.
            </p>
            <button 
                onClick={runSimulation} 
                className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center gap-2"
            >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>Run Email Dispatch Simulation</span>
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Email Automation Simulation Log</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="flex-grow overflow-y-auto bg-gray-900 text-white font-mono text-sm p-4 rounded-md">
                            {simulationLog.map((log, index) => (
                                <p key={index} className="whitespace-pre-wrap leading-relaxed">{log || '\u00A0'}</p>
                            ))}
                        </div>
                        <div className="mt-6 text-right">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailAutomationSimulator;