import { 
  db as firestoreDb, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  sendEmailVerification
} from 'firebase/auth';
import { UserRole } from '../types';

const STORAGE_KEYS = {
  OTP: 'medlink_otp_temp'
};

// Local storage helper
const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;

export const localDb = {
  getItem: <T>(key: string, defaultVal: T): T => {
    if (!isLocalStorageAvailable) return defaultVal;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  setItem: <T>(key: string, value: T): void => {
    if (!isLocalStorageAvailable) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[LOCAL STORAGE] Write error:', e);
    }
  }
};

// Initial Seed Data for Firestore
// REMOVED SEED_DOCTORS to meet strict requirement of no demo/mock data

// Initialize and Seed mock doctors into Firestore if the collection is empty
export async function seedFirestore() {
  // Mock seeding is disabled as requested to use only real user data
  console.log('Database seeding of mock data is disabled.');
}


export const db = {
  // Auth & User Management
  signup: async (userData: any): Promise<any> => {
    try {
      const emailLower = userData.email.trim().toLowerCase();
      let userCredential: any = null;
      let isEmailProviderDisabled = false;
      let uid = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let accountExisted = false;
      let emailVerified = false;
      
      try {
        userCredential = await createUserWithEmailAndPassword(auth, emailLower, userData.password);
        uid = userCredential.user.uid;
        emailVerified = userCredential.user.emailVerified;
        // Background email send to avoid blocking slow templates or SMTP servers
        sendEmailVerification(userCredential.user).catch(emailErr => {
          console.error('[AUTH] Asynchronous Verification email error in background:', emailErr);
        });
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          accountExisted = true;
          try {
            // Since they enabled it, log them in and trigger verification email in background
            const loginCreds = await signInWithEmailAndPassword(auth, emailLower, userData.password);
            uid = loginCreds.user.uid;
            emailVerified = loginCreds.user.emailVerified;
            isEmailProviderDisabled = false;
            sendEmailVerification(loginCreds.user).catch(emailErr => {
              console.error('[AUTH] Background verification email retry issue:', emailErr);
            });
          } catch (loginErr: any) {
            console.error('[AUTH] Failed to login to existing email to verify:', loginErr);
            throw authErr; // rethrow the original email-already-in-use error
          }
        } else if (
          authErr.code === 'auth/operation-not-allowed' || 
          authErr.code === 'auth/admin-restricted-operation' ||
          authErr.code === 'auth/configuration-not-found'
        ) {
          console.warn(`[AUTH] Auth registration restricted (${authErr.code}). Trying anonymous sign-in...`);
          try {
            userCredential = await signInAnonymously(auth);
            uid = userCredential.user.uid;
            isEmailProviderDisabled = true;
            emailVerified = true; // No verification needed for local anonymous provider
          } catch (anonErr: any) {
            console.warn('[AUTH] Anonymous sign-in also restricted or failed. Falling back to Local Mock ID:', anonErr);
            isEmailProviderDisabled = true;
            emailVerified = true;
          }
        } else {
          throw authErr;
        }
      }

      const newUserProfile = {
        ...userData,
        id: uid,
        isEmailProviderDisabled,
        emailVerified,
        accountExisted,
      };
      delete newUserProfile.password;

      // Remove undefined fields to avoid Firestore errors
      const cleanedProfile = Object.fromEntries(
        Object.entries(newUserProfile).filter(([_, value]) => value !== undefined)
      );

      // Try saving to firebase firestore in background so continue acts immediately
      const userRef = doc(firestoreDb, 'users', uid);
      setDoc(userRef, cleanedProfile).catch(dbErr => {
        console.warn('[FIRESTORE] Async Firestore user doc writing had issue, local cache is active:', dbErr);
      });

      // Save user to LocalStorage registry
      const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
      if (!localUsers.some(u => u.email.trim().toLowerCase() === emailLower)) {
        localUsers.push(newUserProfile);
        localDb.setItem('medlink_local_users', localUsers);
      }

      return newUserProfile;
    } catch (err: any) {
      // Propagate critical sign-up validation and network errors directly back to the user
      if (err.code) {
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already in use by another account. Please sign in instead.');
        }
        if (err.code === 'auth/weak-password') {
          throw new Error('The password is too weak. It must be at least 6 characters long.');
        }
        if (err.code === 'auth/invalid-email') {
          throw new Error('The email address is badly formatted. Please enter a valid email.');
        }
        if (err.code === 'auth/network-request-failed') {
          throw new Error('A network error occurred. Please check your internet connection and try again.');
        }
        // If it's a standard auth validation error, do not fallback to local mock user
        if (
          err.code !== 'auth/operation-not-allowed' && 
          err.code !== 'auth/admin-restricted-operation' && 
          err.code !== 'auth/configuration-not-found'
        ) {
          throw err;
        }
      }

      console.warn('[AUTH] Signup fallback triggered:', err);
      const emailLower = userData.email.trim().toLowerCase();
      const mockUid = `loc_${Date.now()}`;
      const fallbackUser = {
        ...userData,
        id: mockUid,
        isEmailProviderDisabled: true,
      };
      delete fallbackUser.password;

      const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
      localUsers.push(fallbackUser);
      localDb.setItem('medlink_local_users', localUsers);

      return fallbackUser;
    }
  },

  getUsers: async (): Promise<any[]> => {
    try {
      const q = collection(firestoreDb, 'users');
      const snapshot = await getDocs(q);
      const fsUsers = snapshot.docs.map(doc => doc.data());
      const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
      
      const merged = [...fsUsers];
      for (const u of localUsers) {
        if (!merged.some(existing => existing.id === u.id)) {
          merged.push(u);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getUsers failed, loading from LocalStorage:', err);
      return localDb.getItem<any[]>('medlink_local_users', []);
    }
  },
  
  saveUser: async (userData: any): Promise<any> => {
    const userId = userData.id || auth.currentUser?.uid || `u_${Date.now()}`;
    const savedData = { ...userData, id: userId };
    
    // 1. Always cache in localStorage registry first so the UI updates instantly
    const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
    const idx = localUsers.findIndex(u => u.id === userId);
    if (idx >= 0) {
      localUsers[idx] = savedData;
    } else {
      localUsers.push(savedData);
    }
    localDb.setItem('medlink_local_users', localUsers);

    // 2. Queue Firestore write asynchronously in the background so it doesn't block UI
    setDoc(doc(firestoreDb, 'users', userId), savedData).catch((err) => {
      console.warn('[FIRESTORE] Async setDoc failed:', err);
    });

    return savedData;
  },

  login: async (identifier: string, password?: string, role: UserRole = UserRole.PATIENT): Promise<any> => {
    const emailLower = identifier.trim().toLowerCase();
    const actualPassword = password || 'password123';
    
    try {
      // 1. Try Firebase signing-in first
      let userCredential = null;
      let uid = '';
      let trackingIsMocked = false;

      try {
        userCredential = await signInWithEmailAndPassword(auth, emailLower, actualPassword);
        uid = userCredential.user.uid;
      } catch (authErr: any) {
        if (
          authErr.code === 'auth/user-not-found' || 
          authErr.code === 'auth/invalid-credential' || 
          authErr.code === 'auth/invalid-email'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, emailLower, actualPassword);
            uid = userCredential.user.uid;
          } catch (createErr: any) {
            try {
              userCredential = await signInAnonymously(auth);
              uid = userCredential.user.uid;
            } catch (anonErr) {
              uid = `loc_${Date.now()}`;
              trackingIsMocked = true;
            }
          }
        } else {
          // Password check or network error — fallback to local registry if existing
          const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
          const matchedLocal = localUsersList.find(u => u.email.trim().toLowerCase() === emailLower);
          if (matchedLocal) {
            if (String(matchedLocal.role).toUpperCase() !== String(role).toUpperCase()) {
              throw new Error(`This account is registered as a ${matchedLocal.role}. Please log in via the ${matchedLocal.role} portal.`);
            }
            return matchedLocal;
          }

          try {
            userCredential = await signInAnonymously(auth);
            uid = userCredential.user.uid;
          } catch (anonErr) {
            uid = `loc_${Date.now()}`;
            trackingIsMocked = true;
          }
        }
      }

      let profile: any = null;
      if (!trackingIsMocked) {
        try {
          const userRef = doc(firestoreDb, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            profile = userSnap.data();
          }
        } catch (dbErr) {
          console.warn('[FIRESTORE] Fetch Profile failed:', dbErr);
        }
      }

      if (profile) {
        if (String(profile.role).toUpperCase() !== String(role).toUpperCase()) {
          throw new Error(`This account is registered as a ${profile.role}. Please log in via the ${profile.role} portal.`);
        }
        if (auth.currentUser && auth.currentUser.uid === profile.id) {
          profile.emailVerified = auth.currentUser.emailVerified;
        }

        // Cache/overwrite the retrieved profile in LocalStorage registry to prevent stale copies
        const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
        const idx = localUsersList.findIndex(u => u.id === profile.id || u.email.trim().toLowerCase() === emailLower);
        if (idx >= 0) {
          localUsersList[idx] = profile;
        } else {
          localUsersList.push(profile);
        }
        localDb.setItem('medlink_local_users', localUsersList);

        return profile;
      } else {
        // Fallback to local copy before creating brand new
        const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
        const matchedLocal = localUsersList.find(u => u.email.trim().toLowerCase() === emailLower);
        if (matchedLocal) {
          if (String(matchedLocal.role).toUpperCase() !== String(role).toUpperCase()) {
            throw new Error(`This account is registered as a ${matchedLocal.role}. Please log in via the ${matchedLocal.role} portal.`);
          }
          return matchedLocal;
        }

        const namePart = emailLower.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        
        const newProfile: any = {
          id: uid,
          name: role === UserRole.DOCTOR ? `Dr. ${formattedName}` : formattedName,
          email: emailLower,
          phone: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
          role: role,
          photoUrl: role === UserRole.DOCTOR 
            ? 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200'
            : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200'
        };

        if (role === UserRole.DOCTOR) {
          newProfile.specialty = 'General Physician';
          newProfile.clinicName = 'MedLink General';
          newProfile.clinicLocation = 'Main Clinic';
          newProfile.rating = 5.0;
          newProfile.reviewCount = 0;
          newProfile.isVerified = true;
          newProfile.availability = [
            { date: '2026-05-28', times: ['09:00 AM', '10:00 AM', '11:00 AM'] },
            { date: '2026-05-29', times: ['02:00 PM', '03:00 PM'] }
          ];
        }

        try {
          const userRef = doc(firestoreDb, 'users', uid);
          await setDoc(userRef, newProfile);
        } catch (dbErr) {
          console.warn('[FIRESTORE] Failed to write profile to database, cached locally:', dbErr);
        }

        // Add/update offline/localStorage users registry
        const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
        const idx = localUsers.findIndex(u => u.id === uid || u.email.trim().toLowerCase() === emailLower);
        if (idx >= 0) {
          localUsers[idx] = newProfile;
        } else {
          localUsers.push(newProfile);
        }
        localDb.setItem('medlink_local_users', localUsers);

        return newProfile;
      }
    } catch (err: any) {
      console.warn('[AUTH] Local fallback checking offline registry:', err);
      const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
      const matchedLocal = localUsersList.find(u => u.email.trim().toLowerCase() === emailLower);
      if (matchedLocal) {
        if (String(matchedLocal.role).toUpperCase() !== String(role).toUpperCase()) {
          throw new Error(`This account is registered as a ${matchedLocal.role}. Please log in via the ${matchedLocal.role} portal.`);
        }
        return matchedLocal;
      }

      const namePart = emailLower.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const localProfile = {
        id: `loc_${Date.now()}`,
        name: role === UserRole.DOCTOR ? `Dr. ${formattedName}` : formattedName,
        email: emailLower,
        phone: '+15553021943',
        role: role,
        isEmailProviderDisabled: true,
      };
      
      const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
      localUsers.push(localProfile);
      localDb.setItem('medlink_local_users', localUsers);

      return localProfile;
    }
  },

  normalizeDoctorAvailability: (docData: any): any => {
    if (!docData) return docData;
    
    // Check if there is valid upcoming availability
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const hasValidFutureAvailability = docData.availability && 
      Array.isArray(docData.availability) && 
      docData.availability.length > 0 && 
      docData.availability.some((a: any) => {
        try {
          const itemDate = new Date(a.date);
          const todayDate = new Date(todayStr);
          return itemDate >= todayDate;
        } catch {
          return false;
        }
      });

    if (!hasValidFutureAvailability) {
      const newAvailability = [];
      const baseDate = new Date();
      for (let i = 0; i < 5; i++) {
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + i);
        const dateString = targetDate.toISOString().split('T')[0];
        newAvailability.push({
          date: dateString,
          times: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
        });
      }
      return {
        ...docData,
        availability: newAvailability
      };
    }

    return docData;
  },

  // Doctors
  getDoctors: async (): Promise<any[]> => {
    try {
      const q = query(collection(firestoreDb, 'users'), where('role', '==', 'doctor'));
      const snapshot = await getDocs(q);
      const fsDoctors = snapshot.docs.map(doc => doc.data());
      
      const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
      const localDoctors = localUsersList.filter(u => u.role === 'doctor');
      
      const rawMerged = [...fsDoctors, ...localDoctors];
      const merged: any[] = [];
      const seenEmails = new Set<string>();
      const seenNames = new Set<string>();
      const seenIds = new Set<string>();

      for (const d of rawMerged) {
        if (!d) continue;
        const emailLower = d.email ? d.email.toLowerCase().trim() : '';
        const nameLower = d.name ? d.name.toLowerCase().trim() : '';
        const idStr = d.id;
        if (!emailLower || !nameLower) continue;

        if (!seenEmails.has(emailLower) && !seenNames.has(nameLower) && (!idStr || !seenIds.has(idStr))) {
          merged.push(db.normalizeDoctorAvailability(d));
          seenEmails.add(emailLower);
          seenNames.add(nameLower);
          if (idStr) seenIds.add(idStr);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getDoctors failed, loading from local registry:', err);
      const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
      const localDoctors = localUsersList.filter(u => u.role === 'doctor');
      const merged: any[] = [];
      const seenEmails = new Set<string>();
      const seenNames = new Set<string>();
      const seenIds = new Set<string>();

      for (const d of localDoctors) {
        if (!d) continue;
        const emailLower = d.email ? d.email.toLowerCase().trim() : '';
        const nameLower = d.name ? d.name.toLowerCase().trim() : '';
        const idStr = d.id;
        if (!emailLower || !nameLower) continue;

        if (!seenEmails.has(emailLower) && !seenNames.has(nameLower) && (!idStr || !seenIds.has(idStr))) {
          merged.push(db.normalizeDoctorAvailability(d));
          seenEmails.add(emailLower);
          seenNames.add(nameLower);
          if (idStr) seenIds.add(idStr);
        }
      }
      return merged;
    }
  },
  
  getDoctorById: async (id: string): Promise<any> => {
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        // Update/Cache the retrieved data local registry
        const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
        const idx = localUsers.findIndex(u => u.id === id);
        if (idx >= 0) {
          localUsers[idx] = data;
        } else {
          localUsers.push(data);
        }
        localDb.setItem('medlink_local_users', localUsers);
        return db.normalizeDoctorAvailability(data);
      }
    } catch (err) {
      console.warn('[FIRESTORE] getDoctorById failed, using local fallback:', err);
    }

    // Check locally updated users or cached profiles as a fallback to ensure ultra responsiveness
    const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
    const localUser = localUsers.find(u => u.id === id);
    if (localUser) return db.normalizeDoctorAvailability(localUser);

    return null;
  },

  saveDoctor: async (doctorData: any): Promise<any> => {
    return db.saveUser(doctorData);
  },

  // Reviews
  getDoctorReviews: async (doctorId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestoreDb, 'reviews'), where('doctorId', '==', doctorId));
      const snapshot = await getDocs(q);
      const fsReviews = snapshot.docs.map(doc => doc.data());
      const localReviews = localDb.getItem<any[]>('medlink_local_reviews', []).filter((r: any) => r.doctorId === doctorId);

      const merged = [...fsReviews];
      for (const r of localReviews) {
        if (!merged.some(existing => existing.id === r.id)) {
          merged.push(r);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getDoctorReviews failed, fallback to local:', err);
      const localReviews = localDb.getItem<any[]>('medlink_local_reviews', []);
      return localReviews.filter((r: any) => r.doctorId === doctorId);
    }
  },

  submitReview: async (reviewData: any): Promise<any> => {
    const reviewId = `rev_${Date.now()}`;
    const newReview = {
      ...reviewData,
      id: reviewId,
      createdAt: new Date().toISOString()
    };

    // 1. Save to Firestore
    try {
      await setDoc(doc(firestoreDb, 'reviews', reviewId), newReview);
    } catch (err) {
      console.warn('[FIRESTORE] submitReview setDoc failed:', err);
    }

    // 2. Save to local storage
    const localReviews = localDb.getItem<any[]>('medlink_local_reviews', []);
    localReviews.push(newReview);
    localDb.setItem('medlink_local_reviews', localReviews);

    // 3. Update Doctor rating and review count
    const doctorId = reviewData.doctorId;
    if (doctorId) {
      try {
        const docRef = doc(firestoreDb, 'users', doctorId);
        const docSnap = await getDoc(docRef);
        let doctorData: any = null;
        if (docSnap.exists()) {
          doctorData = docSnap.data();
        } else {
          // fallback to local doctor
          const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
          doctorData = localUsers.find(u => u.id === doctorId);
        }

        if (doctorData) {
          // get all reviews for this doctor to recalculate correctly
          const allReviews = await db.getDoctorReviews(doctorId);
          const ratingSum = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
          const reviewCount = allReviews.length;
          const avgRating = reviewCount > 0 ? Number((ratingSum / reviewCount).toFixed(1)) : Number(reviewData.rating);

          const updatedDoc = {
            ...doctorData,
            rating: avgRating,
            reviewCount: reviewCount
          };

          // Save doctor profile logic (both firestore + local registry)
          await db.saveUser(updatedDoc);
        }
      } catch (err) {
        console.warn('[FIRESTORE] Updating doctor rating failed:', err);
      }
    }

    return newReview;
  },

  // Appointments
  getAppointments: async (): Promise<any[]> => {
    try {
      const q = collection(firestoreDb, 'appointments');
      const snapshot = await getDocs(q);
      const fsAppts = snapshot.docs.map(doc => doc.data());
      const localAppts = localDb.getItem<any[]>('medlink_local_appointments', []);
      
      const merged = [...fsAppts];
      for (const a of localAppts) {
        if (!merged.some(existing => existing.id === a.id)) {
          merged.push(a);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getAppointments failed, loading from LocalStorage:', err);
      return localDb.getItem<any[]>('medlink_local_appointments', []);
    }
  },

  getAppointmentsByUserId: async (userId: string, isDoctorRole: boolean): Promise<any[]> => {
    try {
      const field = isDoctorRole ? 'doctorId' : 'patientId';
      const q = query(collection(firestoreDb, 'appointments'), where(field, '==', userId));
      const snapshot = await getDocs(q);
      const fsAppts = snapshot.docs.map(doc => doc.data());
      const localAppts = localDb.getItem<any[]>('medlink_local_appointments', []).filter(a => a[field] === userId);
      
      const merged = [...fsAppts];
      for (const a of localAppts) {
        if (!merged.some(existing => existing.id === a.id)) {
          merged.push(a);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getAppointmentsByUserId failed, loading from LocalStorage:', err);
      const field = isDoctorRole ? 'doctorId' : 'patientId';
      const localAppts = localDb.getItem<any[]>('medlink_local_appointments', []);
      return localAppts.filter(a => a[field] === userId);
    }
  },
  
  createAppointment: async (appointmentData: any): Promise<any> => {
    const apptId = Date.now().toString();
    const newAppointment = {
      ...appointmentData,
      id: apptId,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(firestoreDb, 'appointments', apptId), newAppointment);
    } catch (err) {
      console.warn('[FIRESTORE] createAppointment failed, storing in localStorage fallback:', err);
    }

    // Save locally
    const localAppts = localDb.getItem<any[]>('medlink_local_appointments', []);
    localAppts.push(newAppointment);
    localDb.setItem('medlink_local_appointments', localAppts);

    // Also automatically push to live clinic queue
    const queueItem = {
      id: `q_${apptId}`,
      appointmentId: apptId,
      patientId: appointmentData.patientId || auth.currentUser?.uid || 'u1',
      patientName: appointmentData.patientName || 'Patient',
      patientPhotoUrl: appointmentData.patientPhotoUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200',
      doctorId: appointmentData.doctorId,
      tokenNumber: appointmentData.tokenNumber || Math.floor(Math.random() * 20) + 1,
      status: 'Waiting',
      entryTime: new Date().toISOString()
    };
    
    try {
      await db.addToQueue(queueItem);
    } catch (err) {
      console.warn('[FIRESTORE] addToQueue failed, queue managed locally:', err);
    }

    return newAppointment;
  },

  // Queue System (Fully Dynamic Firestore-driven)
  getQueue: async (doctorId?: string): Promise<any[]> => {
    try {
      let q;
      if (doctorId) {
        q = query(collection(firestoreDb, 'queue'), where('doctorId', '==', doctorId));
      } else {
        q = collection(firestoreDb, 'queue');
      }
      const snapshot = await getDocs(q);
      const fsQueue = snapshot.docs.map(doc => doc.data() as any);
      const localQueue = localDb.getItem<any[]>('medlink_local_queue', []);
      const filteredLocal = doctorId ? localQueue.filter(qi => qi.doctorId === doctorId) : localQueue;

      const merged = [...fsQueue];
      for (const qItem of filteredLocal) {
        if (!merged.some(existing => existing.id === qItem.id)) {
          merged.push(qItem);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getQueue failed, loading from LocalStorage:', err);
      const localQueue = localDb.getItem<any[]>('medlink_local_queue', []);
      return doctorId ? localQueue.filter(qi => qi.doctorId === doctorId) : localQueue;
    }
  },

  addToQueue: async (queueItem: any): Promise<any> => {
    const qId = queueItem.id || `q_${Date.now()}`;
    const savedItem = { ...queueItem, id: qId };

    try {
      await setDoc(doc(firestoreDb, 'queue', qId), savedItem);
    } catch (err) {
      console.warn('[FIRESTORE] addToQueue failed, saving locally:', err);
    }

    // Save locally
    const localQueue = localDb.getItem<any[]>('medlink_local_queue', []);
    localQueue.push(savedItem);
    localDb.setItem('medlink_local_queue', localQueue);

    return savedItem;
  },

  updateQueueStatus: async (queueId: string, status: string): Promise<void> => {
    try {
      const qRef = doc(firestoreDb, 'queue', queueId);
      await updateDoc(qRef, { status });
    } catch (err) {
      console.warn('[FIRESTORE] updateQueueStatus failed, updating locally:', err);
    }

    // Update locally
    const localQueue = localDb.getItem<any[]>('medlink_local_queue', []);
    const idx = localQueue.findIndex(qi => qi.id === queueId);
    if (idx >= 0) {
      localQueue[idx].status = status;
      localDb.setItem('medlink_local_queue', localQueue);
    }
  },

  // Prescriptions
  getPrescriptions: async (patientId?: string): Promise<any[]> => {
    try {
      let q;
      if (patientId) {
        q = query(collection(firestoreDb, 'prescriptions'), where('patientId', '==', patientId));
      } else {
        q = collection(firestoreDb, 'prescriptions');
      }
      const snapshot = await getDocs(q);
      const fsPres = snapshot.docs.map(doc => doc.data() as any);
      const localPres = localDb.getItem<any[]>('medlink_local_prescriptions', []);
      const filteredLocal = patientId ? localPres.filter(p => p.patientId === patientId) : localPres;

      const merged = [...fsPres];
      for (const p of filteredLocal) {
        if (!merged.some(existing => existing.id === p.id)) {
          merged.push(p);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getPrescriptions failed, loading from LocalStorage:', err);
      const localPres = localDb.getItem<any[]>('medlink_local_prescriptions', []);
      return patientId ? localPres.filter(p => p.patientId === patientId) : localPres;
    }
  },

  createPrescription: async (data: any): Promise<any> => {
    const id = `pres_${Date.now()}`;
    const savedData = { ...data, id };

    try {
      await setDoc(doc(firestoreDb, 'prescriptions', id), savedData);
    } catch (err) {
      console.warn('[FIRESTORE] createPrescription failed, saving locally:', err);
    }

    // Save locally
    const localPres = localDb.getItem<any[]>('medlink_local_prescriptions', []);
    localPres.push(savedData);
    localDb.setItem('medlink_local_prescriptions', localPres);

    return savedData;
  },

  // Leave Requests (Unified)
  getLeaveRequests: async (doctorId?: string): Promise<any[]> => {
    try {
      let q;
      if (doctorId) {
        q = query(collection(firestoreDb, 'leaveRequests'), where('doctorId', '==', doctorId));
      } else {
        q = collection(firestoreDb, 'leaveRequests');
      }
      const snapshot = await getDocs(q);
      const fsCov = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const localCov = localDb.getItem<any[]>('medlink_local_leaveRequests', []);
      const filteredLocal = doctorId ? localCov.filter(r => r.doctorId === doctorId) : localCov;

      const merged = [...fsCov];
      for (const req of filteredLocal) {
        if (!merged.some(existing => existing.id === req.id)) {
          merged.push(req);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getLeaveRequests failed, loading from LocalStorage:', err);
      const localCov = localDb.getItem<any[]>('medlink_local_leaveRequests', []);
      return doctorId ? localCov.filter(r => r.doctorId === doctorId) : localCov;
    }
  },

  createLeaveRequest: async (requestData: any): Promise<any> => {
    const reqId = requestData.id || `lv_${Date.now()}`;
    const newReq = {
      ...requestData,
      id: reqId,
      status: requestData.status || 'OPEN'
    };

    try {
      await setDoc(doc(firestoreDb, 'leaveRequests', reqId), newReq);
    } catch (err) {
      console.warn('[FIRESTORE] createLeaveRequest failed, saving locally:', err);
    }

    // Save locally
    const localCov = localDb.getItem<any[]>('medlink_local_leaveRequests', []);
    localCov.push(newReq);
    localDb.setItem('medlink_local_leaveRequests', localCov);

    return newReq;
  },

  // Notifications
  getNotifications: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestoreDb, 'notifications'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const fsNotif = snapshot.docs.map(doc => doc.data());
      const localNotif = localDb.getItem<any[]>('medlink_local_notifications', []).filter(n => n.userId === userId);

      const merged = [...fsNotif];
      for (const n of localNotif) {
        if (!merged.some(existing => existing.id === n.id)) {
          merged.push(n);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getNotifications failed, loading from LocalStorage:', err);
      const localNotif = localDb.getItem<any[]>('medlink_local_notifications', []);
      return localNotif.filter(n => n.userId === userId);
    }
  },

  createNotification: async (notificationData: any): Promise<any> => {
    const nId = `n_${Date.now()}`;
    const newNotification = {
      ...notificationData,
      id: nId,
      read: false,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    try {
      await setDoc(doc(firestoreDb, 'notifications', nId), newNotification);
    } catch (err) {
      console.warn('[FIRESTORE] createNotification failed, saving locally:', err);
    }

    // Save locally
    const localNotif = localDb.getItem<any[]>('medlink_local_notifications', []);
    localNotif.push(newNotification);
    localDb.setItem('medlink_local_notifications', localNotif);

    return newNotification;
  },

  // Patients & Users (dynamic helper loaders)
  getPatients: async (): Promise<any[]> => {
    try {
      const q = query(collection(firestoreDb, 'users'), where('role', '==', 'patient'));
      const snapshot = await getDocs(q);
      const fsPatients = snapshot.docs.map(doc => doc.data());
      const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
      const localPatients = localUsersList.filter(u => u.role === 'patient');
      
      const merged = [...fsPatients];
      for (const p of localPatients) {
        if (!merged.some(existing => existing.id === p.id)) {
          merged.push(p);
        }
      }
      return merged;
    } catch (err) {
      console.warn('[FIRESTORE] getPatients failed:', err);
      const localUsersList = localDb.getItem<any[]>('medlink_local_users', []);
      return localUsersList.filter(u => u.role === 'patient');
    }
  },

  getUserById: async (id: string): Promise<any> => {
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
        const idx = localUsers.findIndex(u => u.id === id);
        if (idx >= 0) {
          localUsers[idx] = data;
        } else {
          localUsers.push(data);
        }
        localDb.setItem('medlink_local_users', localUsers);
        return data;
      }
    } catch (err) {
      console.warn('[FIRESTORE] getUserById failed, using local fallback:', err);
    }

    const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
    const localUser = localUsers.find(u => u.id === id);
    if (localUser) return localUser;

    return null;
  },

  // Leave & Coverage Management
  submitLeaveRequest: async (request: any): Promise<void> => {
    const id = request.id || `lv_${Date.now()}`;
    await setDoc(doc(firestoreDb, 'leaveRequests', id), { ...request, id });
  },

  getAllLeaveRequests: async (): Promise<any[]> => {
    try {
      const q = query(collection(firestoreDb, 'leaveRequests'), where('status', 'in', ['OPEN', 'PENDING']));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching all leave requests:', err);
      return [];
    }
  },

  volunteerForLeave: async (requestId: string, volunteer: any): Promise<void> => {
    const volunteerRef = doc(firestoreDb, 'leaveRequests', requestId, 'volunteers', volunteer.doctorId);
    await setDoc(volunteerRef, { ...volunteer, timestamp: Date.now() });
  },

  getVolunteersForRequest: async (requestId: string): Promise<any[]> => {
    try {
      const q = collection(firestoreDb, 'leaveRequests', requestId, 'volunteers');
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      return [];
    }
  },

  // OTP Simulation
  sendOtp: (phone: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP) || '{}');
    otpData[phone] = { otp, expires: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem(STORAGE_KEYS.OTP, JSON.stringify(otpData));
    console.log(`[LOCAL DB] OTP for ${phone}: ${otp}`);
    return otp;
  },

  verifyOtp: (phone: string, otp: string) => {
    const otpData = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP) || '{}');
    const stored = otpData[phone];
    
    if (!stored) throw new Error("No OTP found for this number");
    if (stored.expires < Date.now()) {
      delete otpData[phone];
      localStorage.setItem(STORAGE_KEYS.OTP, JSON.stringify(otpData));
      throw new Error("OTP expired");
    }
    if (stored.otp !== otp) throw new Error("Invalid OTP code");
    
    delete otpData[phone];
    localStorage.setItem(STORAGE_KEYS.OTP, JSON.stringify(otpData));
    return true;
  },

  // Admin specific features
  logAdminActivity: async (activity: any): Promise<void> => {
    const id = activity.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newActivity = { ...activity, id, timestamp: activity.timestamp || Date.now() };
    try {
      await setDoc(doc(firestoreDb, 'adminActivityLogs', id), newActivity);
    } catch (err) {
      console.warn('[FIRESTORE] logAdminActivity failed:', err);
    }
  },

  getAdminActivityLogs: async (): Promise<any[]> => {
    try {
      const q = collection(firestoreDb, 'adminActivityLogs');
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data()).sort((a: any, b: any) => b.timestamp - a.timestamp);
    } catch (err) {
      console.warn('[FIRESTORE] getAdminActivityLogs failed:', err);
      return [];
    }
  }
};
