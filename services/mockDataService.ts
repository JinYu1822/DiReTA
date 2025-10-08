import { User, UserRole, School, Report, Submission, StoredComplianceStatus } from '../types';

const today = new Date();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

const schoolNames = [
    "Alpaco Elementary School", "Bairan Elementary School", "Balirong Elementary School",
    "Cabuan Elementary School", "Cabungahan Elementary School", "Calavera Elementary School",
    "Cantao-an Elementary School", "Cepoc Central Elementary School", "Cogon Elementary School",
    "Inayagan Elementary School", "Inoburan Elementary School", "Jaguimit Elementary School",
    "Lanas Elementary School", "Langtad Elementary School", "Lutac Elementary School",
    "Mainit Elementary School", "Mayana Elementary School", "Naalad Elementary School",
    "Naga Central Elementary School", "Pangdan Elementary School", "Patag Elementary School",
    "South Poblacion Elementary School", "Tagjaguimit Elementary School", "Tangke Elementary School",
    "Tuyan Central Elementary School", "Uling Elementary School", "City of Naga Integrated Center for Science, Technology, Culture and Arts",
    "Naga Special Education Center", "NPC-Colon Integrated School", "Alpaco National High School",
    "Antonio R. Lapiz National High School", "Bairan National High School", "Balirong National High School",
    "Cabuan National High School", "Cabungahan National High School", "Calavera National High School",
    "Cantao-an National High School", "Cogon National High School", "Don Emilio Canonigo Memorial National High School",
    "Inayagan National High School", "Lanas National High School", "Lutac National High School",
    "Mainit National High School", "Mayana National High School", "Naalad National High School",
    "Naga National High School", "Patag National High School", "Placido L. Señor National High School",
    "South Poblacion National High School", "Tagjaguimit National High School", "Tangke National High School",
    "Tina-an National High School", "Tuyan National High School", "Uling National High School",
    "Uling Senior High School"
];

const schools: School[] = schoolNames.map((name, index) => ({
    id: `school-${index + 1}`,
    name: name,
}));


const users: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@deped.gov.ph', role: UserRole.ADMIN },
  { id: 'user-2', name: 'Moderator User', email: 'moderator@deped.gov.ph', role: UserRole.MODERATOR, assignedReportIds: ['report-1', 'report-3'] },
  { id: 'user-3', name: 'Alpaco Contact 1', email: 'contact1@deped.gov.ph', schoolName: 'Alpaco Elementary School', role: UserRole.SCHOOL },
  { id: 'user-4', name: 'Alpaco Contact 2', email: 'contact2@deped.gov.ph', schoolName: 'Alpaco Elementary School', role: UserRole.SCHOOL },
  { id: 'user-5', name: 'Bairan Contact', email: 'contact@deped.gov.ph', schoolName: 'Bairan Elementary School', role: UserRole.SCHOOL },
  { id: 'user-6', name: 'Balirong Principal', email: 'principal@deped.gov.ph', schoolName: 'Balirong Elementary School', role: UserRole.SCHOOL },
  { id: 'user-7', name: 'Cabuan Admin', email: 'admin.cabuan@deped.gov.ph', schoolName: 'Cabuan Elementary School', role: UserRole.SCHOOL },
];

const reports: Report[] = [
  { id: 'report-1', title: 'Q1 Enrollment Report', focalPerson: 'J. Doe', deadline: addDays(today, -15), modeOfSubmission: 'https://forms.gle/enrollment' },
  { id: 'report-2', title: 'Annual Budget Proposal', focalPerson: 'A. Smith', deadline: addDays(today, -5), modeOfSubmission: 'Email to a.smith@deped.gov.ph' },
  { id: 'report-3', title: 'Safety Drill Log', focalPerson: 'S. Lee', deadline: addDays(today, 1), modeOfSubmission: 'Hardcopy to Division Office' },
  { id: 'report-4', title: 'IT Inventory Check', focalPerson: 'M. Garcia', deadline: addDays(today, 10), modeOfSubmission: 'https://forms.gle/inventory' },
  { id: 'report-5', title: 'Monthly Attendance Summary', focalPerson: 'C. Brown', deadline: addDays(today, 20), modeOfSubmission: 'Email to c.brown@deped.gov.ph' },
];

const submissions: Submission[] = [
  // Alpaco Elementary School
  { schoolId: 'school-1', reportId: 'report-1', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -20), remarks: '' }, // On time
  { schoolId: 'school-1', reportId: 'report-2', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -2), remarks: 'Approved' }, // Late
  // Bairan Elementary School
  { schoolId: 'school-2', reportId: 'report-1', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -16), remarks: '' }, // On time
  { schoolId: 'school-2', reportId: 'report-2', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -6), remarks: '' }, // On time
  { schoolId: 'school-2', reportId: 'report-4', status: StoredComplianceStatus.NOT_APPLICABLE, submissionDate: null, remarks: 'Exempted' },
  // Balirong Elementary School
  { schoolId: 'school-3', reportId: 'report-1', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -10), remarks: 'Submitted late' }, // Late
  // report-2 is overdue for school-3
  // Cabuan Elementary School
  { schoolId: 'school-4', reportId: 'report-1', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -15), remarks: '' }, // On time
  { schoolId: 'school-4', reportId: 'report-2', status: StoredComplianceStatus.SUBMITTED, submissionDate: addDays(today, -5), remarks: '' }, // On time
];

const simulateApi = <T,>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 500));

export const getMockUsers = () => simulateApi(users);
export const getMockSchools = () => simulateApi(schools);
export const getMockReports = () => simulateApi(reports);
export const getMockSubmissions = () => simulateApi(submissions);