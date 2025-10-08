import { Submission, StoredComplianceStatus, DisplayComplianceStatus } from '../types';

export const getDisplayStatus = (submission: Submission | undefined, reportDeadline: string): DisplayComplianceStatus => {
    const now = new Date();
    const deadline = new Date(reportDeadline);

    if (!submission) {
        return now > deadline ? DisplayComplianceStatus.OVERDUE : DisplayComplianceStatus.PENDING;
    }

    if (submission.status === StoredComplianceStatus.NOT_APPLICABLE) {
        return DisplayComplianceStatus.NOT_APPLICABLE;
    }

    if (submission.status === StoredComplianceStatus.SUBMITTED && submission.submissionDate) {
        const submissionDate = new Date(submission.submissionDate);
        return submissionDate <= deadline ? DisplayComplianceStatus.SUBMITTED_ON_TIME : DisplayComplianceStatus.SUBMITTED_LATE;
    }
    
    return now > deadline ? DisplayComplianceStatus.OVERDUE : DisplayComplianceStatus.PENDING;
};
