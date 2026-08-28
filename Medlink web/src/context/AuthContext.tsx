import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { fetchUserByUid, saveUser } from "../firebase/firestoreService";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth as firebaseAuth } from "../firebase/config";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, selectedRole: "DOCTOR" | "ADMIN") => Promise<boolean>;
  loginAsDemoUser: () => void;
  register: (
    accountData: { email: string; role?: string },
    profileData: Partial<User>,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  toggleAvailability: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_DOCTOR: User = {
  id: "demo_doc_101",
  uid: "demo_doc_101",
  email: "dr.sarah.jenkins@medlink.org",
  name: "Dr. Sarah Jenkins",
  fullName: "Dr. Sarah Jenkins",
  role: "DOCTOR",
  phoneNumber: "+1 (555) 234-5678",
  phone: "+1 (555) 234-5678",
  avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
  photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
  verified: true,
  isPractitionerVerified: true,
  specialty: "Cardiology",
  licenseNumber: "MED-884920",
  registrationNumber: "REG-993821",
  governmentId: "GOV-88210-DOC",
  location: "Metropolitan Hospital, NY",
  clinicName: "Cardiovascular Care Suite",
  averageRating: 4.9,
  totalReviews: 128,
  experience: 12,
  experienceYears: 12,
  fees: 150,
  clinicStatus: "Available",
  isAvailableForCoverage: true,
  hospitalIds: ["hosp_01"],
  department: "Cardiology & Intensive Care",
  hospitalName: "Metropolitan General Hospital",
  hospital: "Metropolitan General Hospital",
  hospitalId: "hosp_01",
  qualification: "MD, FACC - Senior Cardiologist",
  gender: "Female",
  dob: "1984-06-15",
  govIdUrl: null,
  hospitalAddress: "500 Medical Center Way",
  city: "New York",
  state: "New York",
  country: "United States",
  pinCode: "10001",
  joinedDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
  coverageScore: 98,
  readNoticeIds: [],
  licenseStatus: "Verified",
  bio: "Senior Clinical Attending & Board Verified Cardiologist specializing in acute coronary care.",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem("medlink_active_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateActiveUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("medlink_active_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("medlink_active_user");
    }
  };

  // Sync with Firebase Auth state asynchronously with a 1.5s safety timeout
  useEffect(() => {
    let timer: any = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const loadedUser = await fetchUserByUid(firebaseUser.uid);
          if (loadedUser) {
            const userRole = (loadedUser.role || "").trim().toUpperCase();
            if (userRole !== "ADMIN" && userRole !== "DOCTOR") {
              await signOut(firebaseAuth);
              updateActiveUser(null);
            } else {
              // Ensure we don't accidentally load an unknown role.
              updateActiveUser({ ...loadedUser, role: userRole });
            }
          } else {
            // Profile missing
            await signOut(firebaseAuth);
            updateActiveUser(null);
          }
        }
      } catch (err) {
        console.error("Auth state sync error:", err);
      } finally {
        clearTimeout(timer);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string, selectedRole: "DOCTOR" | "ADMIN"): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      const loadedUser = await fetchUserByUid(userCred.user.uid);
      if (loadedUser) {
        const userRole = (loadedUser.role || "").trim().toUpperCase();
        
        if (selectedRole === "ADMIN" && userRole !== "ADMIN") {
          await signOut(firebaseAuth);
          throw new Error("This account is not authorized as an Admin.");
        }
        
        if (selectedRole === "DOCTOR" && userRole === "ADMIN") {
          await signOut(firebaseAuth);
          throw new Error("Account type mismatch. Admin accounts cannot log in as Doctors.");
        }
        
        if (userRole !== "ADMIN" && userRole !== "DOCTOR") {
          await signOut(firebaseAuth);
          throw new Error("Invalid Account Role.");
        }

        updateActiveUser({ ...loadedUser, role: userRole });
      } else {
        await signOut(firebaseAuth);
        throw new Error("Clinical Profile Not Found.");
      }
      return true;
    } catch (err: any) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = () => {
    setIsLoading(true);
    updateActiveUser(DEMO_DOCTOR);
    setIsLoading(false);
  };

  const register = async (
    accountData: { email: string; role?: string },
    profileData: Partial<User>,
    password: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, accountData.email, password);
      const uid = userCredential.user.uid;

      const newUser: User = {
        id: uid,
        uid: uid,
        email: accountData.email,
        name: profileData.name || profileData.fullName || "Doctor",
        fullName: profileData.name || profileData.fullName || "Doctor",
        role: accountData.role || "DOCTOR",
        phoneNumber: profileData.phoneNumber || profileData.phone || "",
        phone: profileData.phoneNumber || profileData.phone || "",
        avatarUrl: profileData.profilePhotoUrl || profileData.photoUrl || profileData.avatarUrl || null,
        photoUrl: profileData.profilePhotoUrl || profileData.photoUrl || profileData.avatarUrl || null,
        verified: true,
        isPractitionerVerified: true,
        specialty: profileData.specialty || "General Medicine",
        licenseNumber: profileData.licenseNumber || "MED-884920",
        registrationNumber: profileData.registrationNumber || "REG-993821",
        governmentId: null,
        location: profileData.location || null,
        clinicName: profileData.clinicName || null,
        averageRating: 5.0,
        totalReviews: 10,
        experience: profileData.experience || profileData.experienceYears || 5,
        experienceYears: profileData.experience || profileData.experienceYears || 5,
        fees: 100,
        clinicStatus: "Available",
        isAvailableForCoverage: true,
        hospitalIds: [],
        department: profileData.department || "General Care",
        hospitalName: profileData.hospitalName || profileData.hospital || "MedLink Hospital",
        hospital: profileData.hospitalName || profileData.hospital || "MedLink Hospital",
        hospitalId: profileData.hospitalId || null,
        qualification: profileData.qualification || "MD, Physician",
        gender: profileData.gender || null,
        dob: profileData.dob || null,
        govIdUrl: profileData.governmentIdUrl || profileData.govIdUrl || null,
        hospitalAddress: profileData.hospitalAddress || null,
        city: profileData.city || null,
        state: profileData.state || null,
        country: profileData.country || null,
        pinCode: profileData.pinCode || null,
        joinedDate: Date.now(),
        coverageScore: 100,
        readNoticeIds: [],
        licenseStatus: "Verified",
        bio: profileData.bio || "Newly registered medical practitioner.",
        approvalStatus: accountData.role === "ADMIN" ? "APPROVED" : "PENDING",
        medicalCertificateUrl: profileData.medicalCertificateUrl || null,
        medicalCertificateStatus: profileData.medicalCertificateStatus || "NOT_REVIEWED",
      };

      await saveUser(newUser);
      updateActiveUser(newUser);
    } catch (err: any) {
      console.error("Registration error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (err) {
      console.error("Logout error:", err);
    }
    updateActiveUser(null);
  };

  const toggleAvailability = async () => {
    if (!user) return;
    const newStatus = user.clinicStatus === "Available" ? "Offline" : "Available";
    const updated: User = {
      ...user,
      clinicStatus: newStatus,
      isAvailableForCoverage: newStatus === "Available",
    };
    updateActiveUser(updated);
    await saveUser(updated);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updatedName = data.name || data.fullName || user.name;
    const updatedPhoto = data.avatarUrl || data.photoUrl || user.avatarUrl;
    const updatedHospital = data.hospitalName || data.hospital || user.hospitalName;
    const updatedPhone = data.phoneNumber || data.phone || user.phoneNumber;

    const updated: User = {
      ...user,
      ...data,
      name: updatedName,
      fullName: updatedName,
      avatarUrl: updatedPhoto,
      photoUrl: updatedPhoto,
      hospitalName: updatedHospital,
      hospital: updatedHospital,
      phoneNumber: updatedPhone,
      phone: updatedPhone,
    };
    updateActiveUser(updated);
    await saveUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemoUser,
        register,
        logout,
        toggleAvailability,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
