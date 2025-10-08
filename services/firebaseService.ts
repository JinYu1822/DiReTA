import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    doc, 
    setDoc, 
    deleteDoc,
    writeBatch,
    addDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebaseConfig';
import { AppData, User, Report, School, Submission, StoredComplianceStatus } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// --- AUTHENTICATION ---

export const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
};

export const signOutGoogle = () => {
    return signOut(auth);
};


// --- DATA FETCHING ---

const fetchDataFromCollection = async <T>(collectionName: string): Promise<T[]> => {
    const q = query(collection(db, collectionName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const getAppData = async (): Promise<AppData> => {
    const [users, schools, reports, submissions] = await Promise.all([
        fetchDataFromCollection<User>('users'),
        fetchDataFromCollection<School>('schools'),
        fetchDataFromCollection<Report>('reports'),
        fetchDataFromCollection<Submission>('submissions'),
    ]);
    return { users, schools, reports, submissions };
};


// --- DATA MUTATION ---

interface SchoolStatusUpdate {
    schoolId: string;
    schoolName: string;
    status: StoredComplianceStatus | '';
    submissionDate: string;
    remarks: string;
}

export const saveSubmissionsBatch = async (updates: SchoolStatusUpdate[], reportId: string) => {
    const batch = writeBatch(db);

    updates.forEach(update => {
        const docId = `${update.schoolId}_${reportId}`;
        const submissionRef = doc(db, 'submissions', docId);

        if (update.status) {
            const submissionData: Submission = {
                schoolId: update.schoolId,
                reportId: reportId,
                status: update.status as StoredComplianceStatus,
                submissionDate: update.status === 'Submitted' ? update.submissionDate : null,
                remarks: update.remarks
            };
            batch.set(submissionRef, submissionData);
        } else {
            // If status is empty, it means we should remove the submission
            batch.delete(submissionRef);
        }
    });

    await batch.commit();
};

export const saveReport = async (report: Partial<Report> & {id?: string}): Promise<Report> => {
    if (report.id) {
        // Update existing report
        const reportRef = doc(db, 'reports', report.id);
        await setDoc(reportRef, report, { merge: true });
        return report as Report;
    } else {
        // Add new report
        const docRef = await addDoc(collection(db, 'reports'), report);
        return { ...report, id: docRef.id } as Report;
    }
};

export const saveUser = async (user: User) => {
    // Note: Firebase Auth users are created on sign-in. This only manages the user profile in Firestore.
    // A real production app would use Cloud Functions to create this doc upon first sign-up.
    // For this app, we assume an admin creates the user doc *before* the user signs in.
    // The document ID *must* match the user's Firebase Auth UID. Since we can't know that
    // in advance, we'll store by email and have the auth listener find the doc.
    // A more robust solution would be to create a user with a temp password, get the UID, and save.
    // For simplicity here, we will use the user id IF it exists, or add a new doc if not.
    // The 'id' for new users will be arbitrary, but for existing Google-signed-in users, it IS the UID.
    if(user.id && user.id.startsWith('user-')){
        // This is a brand new user being added manually
        // We can't know their google UID yet, so we'll add them to the collection
        // They won't be able to log in until an admin updates their ID to their UID post-login
        // Or we use a cloud function to link email to uid on first login.
        // For now, let's just add it.
        const newUserRef = await addDoc(collection(db, 'users'), user);
        return { ...user, id: newUserRef.id };
    } else {
        // This is an existing user
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, user, { merge: true });
        return user;
    }
};

export const deleteUser = (userId: string) => {
    // This only deletes the Firestore user profile, not the Firebase Auth user.
    // Deleting the auth user requires Admin SDK on a backend.
    const userRef = doc(db, 'users', userId);
    return deleteDoc(userRef);
};
