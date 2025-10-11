export enum UserRole {
  ADMIN = 'Admin',
  MODERATOR = 'Moderator',
  SCHOOL = 'School',
}

export interface User {
  id: string;
  name: string;
  email: string;
  schoolNames?: string[];
  role: UserRole;
  assignedReportIds?: string[];
  password?: string;
}

export interface School {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  title: string;
  focalPerson: string;
  deadline: string; // ISO 8601 date string
  modeOfSubmission: string;
}

export enum StoredComplianceStatus {
  SUBMITTED = 'Submitted',
  NOT_APPLICABLE = 'Not Applicable',
}

export interface Submission {
  schoolId: string;
  reportId: string;
  status: StoredComplianceStatus;
  submissionDate: string | null;
  remarks: string;
}

export enum DisplayComplianceStatus {
  SUBMITTED_ON_TIME = 'Submitted (On Time)',
  SUBMITTED_LATE = 'Submitted (Late)',
  OVERDUE = 'Overdue',
  PENDING = 'Pending',
  NOT_APPLICABLE = 'Not Applicable',
}

export interface AppData {
  users: User[];
  schools: School[];
  reports: Report[];
  submissions: Submission[];
}