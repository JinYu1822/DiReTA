import React, { useState } from 'react';
import { AppData, DisplayComplianceStatus, UserRole, StoredComplianceStatus } from '../types';
import { getDisplayStatus } from '../utils/complianceUtils';
import { PaperAirplaneIcon } from './icons/DashboardIcons';
import { sendManualReminders } from '../services/mockDataService';
import Spinner from './Spinner';
import { CheckCircleIcon, XCircleIcon } from './icons/StatusIcons';

interface EmailAutomationSimulatorProps {
    data: AppData;
}

const EmailAutomationSimulator: React.FC<EmailAutomationSimulatorProps> = ({ data }) => {
    const { users, schools, reports, submissions } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [simulationLog, setSimulationLog] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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
                        const schoolUsers = users.filter(u => u.role === UserRole.SCHOOL && u.schoolNames?.includes(school.name));
                        if (schoolUsers.length === 0) {
                            logs.push(`[SKIPPED] ${school.name} has a pending report ("${report.title}") but no registered users to notify.`);
                            return;
                        }
                        schoolUsers.forEach(user => {
                            emailsPrepared++;
                            logs.push(`[REMINDER] Email prepared for ${user.email} (${school.name}) for report: "${report.title}".`);
                        });
                    }
                });
            });
        }
        if (logs.length === 1) {
            logs.push("No pending reports are due tomorrow. No deadline reminders will be sent.");
        }


        // --- 2. Overdue Summaries ---
        const isMonday = now.getDay() === 1;
        logs.push('');
        logs.push(`--- Checking for Overdue Report Summaries (Today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}) ---`);

        if (isMonday) {
            let summaryEmailsSent = 0;
            schools.forEach(school => {
                const schoolOverdueReports = reports.filter(report => {
                    const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
                    return getDisplayStatus(submission, report.deadline) === DisplayComplianceStatus.OVERDUE;
                });

                if (schoolOverdueReports.length > 0) {
                    const schoolUsers = users.filter(u => u.role === UserRole.SCHOOL && u.schoolNames?.includes(school.name));
                    if (schoolUsers.length === 0) {
                        logs.push(`[SKIPPED] ${school.name} has ${schoolOverdueReports.length} overdue report(s) but no registered users to notify.`);
                        return;
                    }
                    summaryEmailsSent++;
                    schoolUsers.forEach(user => {
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

    const handleSendOverdueNotices = async () => {
        setIsSending(true);
        setSendResult(null);

        const overduePayload: { schoolId: string; reportIds: string[]; schoolName: string; reportTitles: string[] }[] = [];
        const skippedSchools: string[] = [];

        schools.forEach(school => {
            const overdueReports = reports.filter(report => {
                const submission = submissions.find(s => s.schoolId === school.id && s.reportId === report.id);
                return getDisplayStatus(submission, report.deadline) === DisplayComplianceStatus.OVERDUE;
            });
            
            if (overdueReports.length === 0) {
                return;
            }

            const schoolUsers = users.filter(u => u.role === UserRole.SCHOOL && u.schoolNames?.includes(school.name));
            if (schoolUsers.length === 0) {
                skippedSchools.push(school.name);
                return;
            }

            overduePayload.push({
                schoolId: school.id,
                schoolName: school.name,
                reportIds: overdueReports.map(r => r.id),
                reportTitles: overdueReports.map(r => r.title)
            });
        });

        if (overduePayload.length === 0) {
            let message = 'No schools have overdue reports. No notices sent.';
            if (skippedSchools.length > 0) {
                message = `No notices sent. ${skippedSchools.length} school(s) with overdue reports were skipped because they have no registered users.`;
            }
            setSendResult({ type: 'info', message });
            setIsSending(false);
            return;
        }

        const schoolCount = overduePayload.length;
        const totalReports = overduePayload.reduce((sum, item) => sum + item.reportIds.length, 0);
        
        const schoolListPreview = overduePayload.slice(0, 5).map(p => `\n- ${p.schoolName} (${p.reportTitles.length} report(s))`).join('');
        const moreSchoolsMessage = overduePayload.length > 5 ? `\n...and ${overduePayload.length - 5} more school(s).` : '';
        
        let skippedMessage = '';
        if (skippedSchools.length > 0) {
            skippedMessage = `\n\nNote: ${skippedSchools.length} school(s) were also skipped because they have no registered users.`;
        }

        const confirmationMessage = `This will trigger an email to ${schoolCount} school(s) about ${totalReports} total overdue report(s). Do you want to proceed?\n\nPreview:${schoolListPreview}${moreSchoolsMessage}${skippedMessage}`;
        
        if (window.confirm(confirmationMessage)) {
            try {
                const payloadForApi = overduePayload.map(({ schoolId, reportIds }) => ({ schoolId, reportIds }));
                await sendManualReminders(payloadForApi);
                setSendResult({ type: 'success', message: 'Overdue notices have been successfully queued for sending.' });
            } catch (error) {
                console.error("Failed to send manual reminders:", error);
                setSendResult({ type: 'error', message: 'An error occurred while sending notices. Please check the console and try again.' });
            } finally {
                setIsSending(false);
            }
        } else {
            setIsSending(false);
            setSendResult({ type: 'info', message: 'Action cancelled.' });
        }
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

            <h3 className="text-lg font-semibold mb-2 text-gray-800">Automation Simulation</h3>
            <p className="mb-4 text-gray-600">
                Click the button below to run a simulation based on the current data and see which automated emails would be dispatched right now.
            </p>
            <button 
                onClick={runSimulation} 
                className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light flex items-center gap-2"
            >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>Run Email Dispatch Simulation</span>
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Manual Actions</h3>
                <p className="mb-4 text-gray-600">
                    Instantly send email notices to all schools with overdue reports. This action bypasses the regular Monday schedule.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                    <button 
                        onClick={handleSendOverdueNotices} 
                        disabled={isSending}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <Spinner className="h-5 w-5 border-b-2 border-white" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <PaperAirplaneIcon className="w-5 h-5" />
                                <span>Send Overdue Notices Now</span>
                            </>
                        )}
                    </button>
                    {sendResult && (
                        <div className={`flex items-center gap-2 text-sm ${
                            sendResult.type === 'success' ? 'text-green-600' :
                            sendResult.type === 'error' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                            {sendResult.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                            {sendResult.type === 'error' && <XCircleIcon className="w-5 h-5" />}
                            <span>{sendResult.message}</span>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Email Automation Simulation Log</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="flex-grow overflow-y-auto bg-gray-900 text-white font-mono text-sm p-4 rounded-md">
                            {simulationLog.map((log, index) => (
                                <p key={index} className="whitespace-pre-wrap leading-relaxed">{log || ' '}</p>
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