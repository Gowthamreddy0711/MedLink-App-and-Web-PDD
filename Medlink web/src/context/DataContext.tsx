import React, { createContext, useContext, useState, useEffect } from "react";
import {
  LeaveRequest,
  Volunteer,
  User,
  ChatRoom,
  Message,
  HospitalNotice,
  CoverageFeedback,
} from "../types";
import { useAuth } from "./AuthContext";
import {
  createLeaveRequest,
  updateLeaveRequestStatus,
  submitVolunteerOffer,
  sendChatMessage,
  createNotification,
  markNotificationRead,
  createHospitalNotice,
  subscribeLeaveRequests,
  subscribeVolunteers,
  subscribeChatRooms,
  subscribeNotifications,
  subscribeHospitalNotices,
  subscribeUsers,
  rejectVolunteerOffer as fsRejectVolunteerOffer,
  submitCoverageFeedback,
  getDoctorFeedbacks,
  subscribeDoctorFeedbacks,
  getCoverageFeedback,
  subscribeCoverageFeedback,
  startCoverageSession as fsStartCoverageSession,
  completeCoverageSession as fsCompleteCoverageSession,
} from "../firebase/firestoreService";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
}

interface DataContextType {
  leaveRequests: LeaveRequest[];
  volunteers: Volunteer[];
  doctors: User[];
  chatRooms: ChatRoom[];
  notifications: Notification[];
  notices: HospitalNotice[];
  toasts: ToastMessage[];
  addToast: (type: ToastMessage["type"], title: string, message: string) => void;
  removeToast: (id: string) => void;
  submitRequest: (data: Partial<LeaveRequest>) => Promise<LeaveRequest>;
  volunteer: (requestId: string, notes?: string) => Promise<Volunteer | null>;
  approveVolunteerOffer: (requestId: string, volunteerId: string) => Promise<void>;
  rejectVolunteerOffer: (requestId: string, volunteerId: string) => Promise<void>;
  sendDirectMessage: (receiverId: string, text: string) => Promise<Message | null>;
  getOrCreateChatRoom: (peerDoctor: User) => Promise<ChatRoom>;
  markAsRead: (notificationId: string) => Promise<void>;
  postNotice: (data: Partial<HospitalNotice>) => Promise<HospitalNotice>;
  fetchVolunteersForRequest: (requestId: string) => void;
  submitFeedback: (feedback: CoverageFeedback) => Promise<void>;
  getDoctorFeedbackList: (doctorId: string) => Promise<CoverageFeedback[]>;
  subscribeDoctorFeedbackList: (doctorId: string, onData: (feedbacks: CoverageFeedback[]) => void) => () => void;
  getCoverageFeedback: (requestId: string) => Promise<CoverageFeedback | null>;
  subscribeCoverageFeedback: (requestId: string, onData: (feedback: CoverageFeedback | null) => void) => () => void;
  startCoverageSession: (requestId: string, requestingDoctorId: string) => Promise<void>;
  completeCoverageSession: (requestId: string, requestingDoctorId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notices, setNotices] = useState<HospitalNotice[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Subscribe to real-time Firestore collections
  useEffect(() => {
    const unsubUsers = subscribeUsers((data) => setDoctors(data.filter((u) => u.role === "DOCTOR" && u.approvalStatus === "APPROVED")));
    const unsubReqs = subscribeLeaveRequests((data) => setLeaveRequests(data));
    const unsubNotices = subscribeHospitalNotices((data) => setNotices(data));

    let unsubRooms = () => {};
    let unsubNotifs = () => {};

    if (user) {
      unsubRooms = subscribeChatRooms(user.id, (data) => setChatRooms(data));
      unsubNotifs = subscribeNotifications(user.id, (data) => setNotifications(data));
    }

    return () => {
      unsubUsers();
      unsubReqs();
      unsubNotices();
      unsubRooms();
      unsubNotifs();
    };
  }, [user]);

  const addToast = (type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const submitRequest = async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    if (!user) throw new Error("Doctor authentication required.");

    let leaveStart = data.leaveStartDate || (data.shiftDate ? new Date(data.shiftDate).getTime() : Date.now());
    let leaveEnd = data.leaveEndDate;
    
    if (!leaveEnd) {
      if (data.shiftType) {
        const dateObj = new Date(leaveStart);
        dateObj.setHours(0, 0, 0, 0);
        
        if (data.shiftType.includes("Day Shift")) {
          leaveStart = dateObj.getTime() + 8 * 60 * 60 * 1000;
          leaveEnd = dateObj.getTime() + 16 * 60 * 60 * 1000;
        } else if (data.shiftType.includes("Night Shift")) {
          leaveStart = dateObj.getTime() + 19 * 60 * 60 * 1000;
          leaveEnd = dateObj.getTime() + (24 + 7) * 60 * 60 * 1000;
        } else if (data.shiftType.includes("ICU") || data.shiftType.includes("ER")) {
          leaveStart = dateObj.getTime() + 8 * 60 * 60 * 1000;
          leaveEnd = dateObj.getTime() + 20 * 60 * 60 * 1000;
        } else if (data.shiftType.includes("24hr") || data.shiftType.includes("On-Call")) {
          leaveStart = dateObj.getTime() + 8 * 60 * 60 * 1000;
          leaveEnd = dateObj.getTime() + 32 * 60 * 60 * 1000;
        } else {
          leaveEnd = leaveStart + 24 * 60 * 60 * 1000;
        }
      } else {
        leaveEnd = leaveStart + 24 * 60 * 60 * 1000;
      }
    }

    const newReq = await createLeaveRequest({
      doctorId: user.id,
      doctorName: user.name || user.fullName || "Doctor",
      doctorEmail: user.email,
      doctorPhone: user.phoneNumber || user.phone || "",
      doctorProfilePhoto: user.avatarUrl || user.photoUrl,
      doctorLicense: user.licenseNumber || "",
      specialization: user.specialty || "",
      leaveStartDate: leaveStart,
      leaveEndDate: leaveEnd,
      leaveDuration: data.leaveDuration || data.shiftType || "Full Day",
      reason: data.reason || "",
      coverageType: data.coverageType || data.shiftType || "Full Day",
      priority: data.priority || data.urgency || "Normal",
      notes: data.notes || "",
      status: "PENDING",
      createdAt: Date.now(),
      approvedDoctorId: null,
      approvedDoctorName: null,
      approvedDoctorEmail: null,
      approvedDoctorPhone: null,
      approvalTime: null,
      leaveType: data.leaveType || "Sick Leave",
      clinicAddress: user.hospitalAddress || null,
      clinicCity: user.city || null,
      clinicState: user.state || null,
      clinicPin: user.pinCode || null,
      hospital: data.hospital || user.hospital || "St. Jude Metropolitan Medical Center",
      location: data.location || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    });

    addToast("success", "Coverage Request Submitted", `Your request is now published to Firestore.`);
    return newReq;
  };

  const volunteer = async (requestId: string, notes?: string): Promise<Volunteer | null> => {
    if (!user) throw new Error("Doctor authentication required.");

    const targetReq = leaveRequests.find((r) => r.id === requestId);
    if (!targetReq) return null;

    try {
      const offer = await submitVolunteerOffer(requestId, {
        id: user.id,
        doctorId: user.id,
        name: user.name || user.fullName || "Doctor",
        email: user.email,
        phone: user.phoneNumber || user.phone || "",
        profilePhoto: user.avatarUrl || user.photoUrl,
        experience: typeof user.experience === "number" ? user.experience : parseInt(user.experience as any) || 0,
        specialization: user.specialty || "",
        availability: "Available",
        timestamp: Date.now(),
        notes: notes || "",
      });

      // Notify requester doctor in Firestore
      await createNotification({
        userId: targetReq.doctorId,
        title: "New Volunteer Coverage Offer",
        message: `${user.name || user.fullName} offered to cover your request.`,
        type: "volunteer_offer",
      });

      addToast("success", "Volunteer Offer Submitted", `Your offer to cover ${targetReq.doctorName}'s shift has been sent.`);
      return offer;
    } catch (e: any) {
      addToast("error", "Offer Failed", e.message || "Failed to submit volunteer offer.");
      throw e;
    }
  };

  const fetchVolunteersForRequest = (requestId: string) => {
    subscribeVolunteers(requestId, (data) => setVolunteers(data));
  };

  const approveVolunteerOffer = async (requestId: string, volunteerId: string) => {
    // Instead of relying on local context state which might be empty, fetch the volunteer directly
    const volRef = doc(db, "leaveRequests", requestId, "volunteers", volunteerId);
    const volSnap = await getDoc(volRef);
    if (!volSnap.exists()) {
      addToast("error", "Error", "Volunteer offer not found.");
      return;
    }
    const vol = { id: volSnap.id, ...volSnap.data() } as Volunteer;

    try {
      await updateLeaveRequestStatus(requestId, "APPROVED", vol);

      await createNotification({
        userId: vol.doctorId,
        title: "Coverage Offer Approved!",
        message: `Your coverage offer has been approved. You are assigned for duty.`,
        type: "volunteer_approval",
      });

      addToast("success", "Volunteer Approved", `${vol.name} has been assigned to cover your shift.`);
    } catch (e: any) {
      addToast("error", "Accept Failed", e.message || "Failed to accept the volunteer offer.");
      throw e;
    }
  };

  const rejectVolunteerOffer = async (requestId: string, volunteerId: string) => {
    const volRef = doc(db, "leaveRequests", requestId, "volunteers", volunteerId);
    const volSnap = await getDoc(volRef);
    if (!volSnap.exists()) {
      addToast("error", "Error", "Volunteer offer not found.");
      return;
    }
    const vol = { id: volSnap.id, ...volSnap.data() } as Volunteer;

    await fsRejectVolunteerOffer(requestId, volunteerId);

    await createNotification({
      userId: vol.doctorId,
      title: "Coverage Offer Rejected",
      message: `Your coverage request for ${user?.name || "a colleague"} was rejected.`,
      type: "volunteer_rejection",
    });

    addToast("info", "Volunteer Rejected", `You have rejected the offer from ${vol.name}.`);
  };

  const sendDirectMessage = async (receiverId: string, text: string): Promise<Message | null> => {
    if (!user || !text.trim()) return null;

    const msg = await sendChatMessage(user.id, receiverId, text.trim());
    return msg;
  };

  const getOrCreateChatRoom = async (peerDoctor: User): Promise<ChatRoom> => {
    if (!user) throw new Error("User must be logged in");

    const participants = [user.id, peerDoctor.id].sort();
    const roomId = `${participants[0]}_${participants[1]}`;

    const roomRef = doc(db, "chatRooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() } as ChatRoom;
    }

    const newRoom: ChatRoom = {
      id: roomId,
      participants,
      lastMessage: "Conversation started",
      lastMessageTimestamp: Date.now(),
      unreadCounts: { [user.id]: 0, [peerDoctor.id]: 0 },
    };

    await setDoc(roomRef, newRoom);
    return newRoom;
  };

  const markAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
  };

  const postNotice = async (data: Partial<HospitalNotice>): Promise<HospitalNotice> => {
    const notice = await createHospitalNotice(data);
    addToast("success", "Notice Published", `Hospital notice "${notice.title}" posted successfully.`);
    return notice;
  };

  const submitFeedback = async (feedback: CoverageFeedback) => {
    await submitCoverageFeedback(feedback);
    addToast("success", "Feedback Submitted", "Your coverage rating and feedback have been saved.");
  };

  const getDoctorFeedbackList = async (doctorId: string) => {
    return await getDoctorFeedbacks(doctorId);
  };

  const subscribeDoctorFeedbackList = (doctorId: string, onData: (feedbacks: CoverageFeedback[]) => void) => {
    return subscribeDoctorFeedbacks(doctorId, onData);
  };

  const startCoverageSession = async (requestId: string, requestingDoctorId: string) => {
    if (!user) throw new Error("Not authenticated");
    const name = user.name || user.fullName || "Doctor";
    await fsStartCoverageSession(requestId, user.id, requestingDoctorId, name);
  };

  const completeCoverageSession = async (requestId: string, requestingDoctorId: string) => {
    if (!user) throw new Error("Not authenticated");
    const name = user.name || user.fullName || "Doctor";
    await fsCompleteCoverageSession(requestId, user.id, requestingDoctorId, name);
  };

  return (
    <DataContext.Provider
      value={{
        leaveRequests,
        volunteers,
        doctors,
        chatRooms,
        notifications,
        notices,
        toasts,
        addToast,
        removeToast,
        submitRequest,
        volunteer,
        approveVolunteerOffer,
        rejectVolunteerOffer,
        sendDirectMessage,
        getOrCreateChatRoom,
        markAsRead,
        postNotice,
        fetchVolunteersForRequest,
        submitFeedback,
        getDoctorFeedbackList,
        subscribeDoctorFeedbackList,
        getCoverageFeedback,
        subscribeCoverageFeedback,
        startCoverageSession,
        completeCoverageSession,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
};

