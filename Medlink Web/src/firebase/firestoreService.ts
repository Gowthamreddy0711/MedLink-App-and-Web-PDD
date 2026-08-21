import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  writeBatch,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./config";
import {
  User,
  LeaveRequest,
  Volunteer,
  ChatRoom,
  Message,
  Notification,
  HospitalNotice,
  Hospital,
  CoverageAnalytics,
  AdminActivityLog,
  AdminNotification,
  CoverageFeedback,
} from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2500, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

// ================= USER PROFILES =================

export async function fetchUserByUid(uid: string): Promise<User | null> {
  try {
    const snap = await withTimeout(getDoc(doc(db, "users", uid)), 2500, null);
    if (snap && snap.exists()) {
      const data = snap.data();
      return mapDocToUser(snap.id, data);
    }
  } catch (e) {
    console.warn("Firestore fetchUserByUid error:", e);
  }
  return null;
}

export async function saveUser(user: Partial<User> & { id: string }): Promise<void> {
  const path = `users/${user.id}`;
  try {
    // Strip frontend getter aliases while preserving avatarUrl, photoUrl, bio, and phone
    const cleanUser: Record<string, any> = { ...user };
    delete cleanUser.uid;
    delete cleanUser.isAvailableForCoverage;
    delete cleanUser.experienceYears;
    delete cleanUser.licenseStatus;
    delete cleanUser.isAvailable;

    // Ensure photoUrl and avatarUrl are synchronized
    const photo = cleanUser.avatarUrl || cleanUser.photoUrl;
    if (photo) {
      cleanUser.avatarUrl = photo;
      cleanUser.photoUrl = photo;
    }

    await setDoc(doc(db, "users", user.id), cleanUser, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

export function subscribeUsers(onData: (users: User[]) => void): () => void {
  try {
    const q = collection(db, "users");
    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((docSnap) => mapDocToUser(docSnap.id, docSnap.data()));
        onData(users);
      },
      (error) => {
        console.warn("subscribeUsers snapshot error:", error.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeUsers setup error:", err);
    onData([]);
    return () => {};
  }
}

function mapDocToUser(id: string, data: any): User {
  const clinStat = data.clinicStatus || "Available";
  return {
    id,
    uid: id,
    email: data.email || "",
    name: data.name || "",
    fullName: data.name || "Doctor",
    role: data.role ? String(data.role).trim().toUpperCase() : "DOCTOR",
    phoneNumber: data.phoneNumber || "",
    phone: data.phoneNumber || "",
    avatarUrl: data.avatarUrl || null,
    photoUrl: data.avatarUrl || null,
    verified: !!data.verified,
    isPractitionerVerified: !!data.isPractitionerVerified,
    specialty: data.specialty || "General Medicine",
    licenseNumber: data.licenseNumber || "MED-884920",
    registrationNumber: data.registrationNumber || "REG-993821",
    governmentId: data.governmentId || null,
    location: data.location || null,
    clinicName: data.clinicName || null,
    averageRating: typeof data.averageRating === "number" ? data.averageRating : 5.0,
    totalReviews: typeof data.totalReviews === "number" ? data.totalReviews : 12,
    experience: typeof data.experience === "number" ? data.experience : parseInt(data.experience) || 5,
    experienceYears: typeof data.experience === "number" ? data.experience : parseInt(data.experience) || 5,
    fees: typeof data.fees === "number" ? data.fees : 100,
    clinicStatus: clinStat,
    isAvailableForCoverage: clinStat === "Available",
    hospitalIds: data.hospitalIds || [],
    department: data.department || "General Care",
    hospitalName: data.hospitalName || "MedLink Network Hospital",
    hospital: data.hospitalName || "MedLink Network Hospital",
    hospitalId: data.hospitalId || null,
    qualification: data.qualification || "MD, Physician",
    gender: data.gender || null,
    dob: data.dob || null,
    govIdUrl: data.govIdUrl || null,
    hospitalAddress: data.hospitalAddress || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    pinCode: data.pinCode || null,
    joinedDate: data.joinedDate?.toDate ? data.joinedDate.toDate().getTime() : (Number(data.joinedDate) || Date.now()),
    coverageScore: typeof data.coverageScore === "number" ? data.coverageScore : 100,
    coverageRating: typeof data.coverageRating === "number" ? data.coverageRating : 0,
    coverageRatingCount: typeof data.coverageRatingCount === "number" ? data.coverageRatingCount : 0,
    readNoticeIds: data.readNoticeIds || [],
    licenseStatus: "Verified",
    bio: data.bio || "Registered medical practitioner.",
    approvalStatus: data.approvalStatus || (data.role && String(data.role).trim().toUpperCase() === "ADMIN" ? "APPROVED" : "PENDING"),
    medicalCertificateUrl: data.medicalCertificateUrl || null,
    medicalCertificateStatus: data.medicalCertificateStatus || (data.medicalCertificateUrl ? 'NOT_REVIEWED' : null),
    medicalCertificateReason: data.medicalCertificateReason || null,
  };
}

export async function updateDoctorApprovalStatus(
  doctorId: string,
  doctorName: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  adminUid: string,
  adminName: string,
  reason?: string
): Promise<void> {
  try {
    const docRef = doc(db, "users", doctorId);
    
    const updates: any = {
      approvalStatus: status,
    };
    
    if (status === "APPROVED") {
      updates.verified = true;
      updates.isPractitionerVerified = true;
    } else if (status === "REJECTED") {
      updates.verified = false;
      updates.isPractitionerVerified = false;
      updates.rejectionReason = reason || "No reason provided";
      updates.rejectedAt = Date.now();
      updates.rejectedBy = adminUid;
    }

    await updateDoc(docRef, updates);

    await createAdminActivityLog({
      action: status === "APPROVED" ? "DOCTOR_APPROVED" : "DOCTOR_REJECTED",
      doctorUid: doctorId,
      doctorName: doctorName,
      adminUid: adminUid,
      adminName: adminName,
      reason: reason || "",
      timestamp: Date.now()
    });

  } catch (err) {
    console.error("updateDoctorApprovalStatus error:", err);
    throw err;
  }
}

export async function updateMedicalCertificateStatus(
  doctorId: string,
  doctorName: string,
  status: "VERIFIED" | "INVALID",
  adminUid: string,
  adminName: string,
  reason?: string
): Promise<void> {
  try {
    const docRef = doc(db, "users", doctorId);
    
    const updates: any = {
      medicalCertificateStatus: status,
    };
    
    if (status === "INVALID") {
      updates.medicalCertificateReason = reason || "No reason provided";
    } else {
      updates.medicalCertificateReason = null;
    }

    await updateDoc(docRef, updates);

    await createAdminActivityLog({
      action: status === "VERIFIED" ? "MEDICAL_DOCUMENT_VERIFIED" : "MEDICAL_DOCUMENT_REJECTED",
      doctorUid: doctorId,
      doctorName: doctorName,
      adminUid: adminUid,
      adminName: adminName,
      reason: reason || "",
      timestamp: Date.now()
    });

  } catch (err) {
    console.error("updateMedicalCertificateStatus error:", err);
    throw err;
  }
}

// ================= ADMIN FUNCTIONS =================

export function subscribeAllDoctors(onData: (users: User[]) => void): () => void {
  try {
    const q = collection(db, "users");
    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((docSnap) => mapDocToUser(docSnap.id, docSnap.data()));
        onData(users.filter((u) => u.role !== "ADMIN")); // Keep only doctors/patients
      },
      (error) => {
        console.warn("subscribeAllDoctors snapshot error:", error.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeAllDoctors setup error:", err);
    onData([]);
    return () => {};
  }
}

export function subscribeAllLeaveRequests(onData: (items: LeaveRequest[]) => void, onError?: (err: Error) => void): () => void {
  try {
    const q = collection(db, "leaveRequests");
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => mapDocToLeaveRequest(docSnap.id, docSnap.data()));
        items.sort((a, b) => b.createdAt - a.createdAt);
        onData(items);
      },
      (err) => {
        console.warn("subscribeAllLeaveRequests snapshot error:", err.message);
        if (onError) onError(err);
        else onData([]);
      }
    );
  } catch (err: any) {
    console.error("subscribeAllLeaveRequests error:", err);
    if (onError) onError(err);
    else onData([]);
    return () => {};
  }
}

// ================= LEAVE REQUESTS & COVERAGE =================

export async function createLeaveRequest(request: Omit<LeaveRequest, "id">): Promise<string> {
  try {
    const colRef = collection(db, "leaveRequests");
    const docRef = await addDoc(colRef, request);
    
    await createAdminNotification({
      title: "New Leave Request",
      message: `Dr. ${request.doctorName} has submitted a new leave request.`,
      timestamp: Date.now(),
      isRead: false,
      type: "NEW_LEAVE_REQUEST",
      targetId: docRef.id
    });
    
    return docRef.id;
  } catch (err) {
    console.error("createLeaveRequest error:", err);
    throw err;
  }
}

export function subscribeLeaveRequests(onData: (items: LeaveRequest[]) => void): () => void {
  try {
    const q = collection(db, "leaveRequests");
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => mapDocToLeaveRequest(docSnap.id, docSnap.data()));
        items.sort((a, b) => b.createdAt - a.createdAt);
        
        // Auto-expire requests whose end time has passed
        const now = Date.now();
        items.forEach(req => {
          if ((req.status === "OPEN" || req.status === "PENDING" || req.status === "Open") && req.leaveEndDate <= now) {
            req.status = "EXPIRED";
            // Fire-and-forget background update to persist the status
            const reqRef = doc(db, "leaveRequests", req.id);
            updateDoc(reqRef, { status: "EXPIRED" }).catch(console.error);
          }
        });

        onData(items);
      },
      (err) => {
        console.warn("subscribeLeaveRequests snapshot error:", err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeLeaveRequests error:", err);
    onData([]);
    return () => {};
  }
}

function mapDocToLeaveRequest(id: string, data: any): LeaveRequest {
  const startDate = data.leaveStartDate?.toDate
    ? data.leaveStartDate.toDate().getTime()
    : Number(data.leaveStartDate) || Date.now();
  const endDate = data.leaveEndDate?.toDate
    ? data.leaveEndDate.toDate().getTime()
    : Number(data.leaveEndDate) || Date.now();
  const created = data.createdAt?.toDate
    ? data.createdAt.toDate().getTime()
    : Number(data.createdAt) || Date.now();
  const dateStr = new Date(startDate).toISOString().split("T")[0];

  return {
    id,
    doctorId: data.doctorId || data.requestingDoctorId || data.userId || data.createdBy || "",
    doctorName: data.doctorName || data.requesterName || "",
    doctorEmail: data.doctorEmail || "",
    doctorPhone: data.doctorPhone || "",
    doctorProfilePhoto: data.doctorProfilePhoto || data.requesterPhoto || null,
    doctorLicense: data.doctorLicense || "",
    specialization: data.specialization || "",
    leaveStartDate: startDate,
    leaveEndDate: endDate,
    leaveDuration: data.leaveDuration || "Full Day",
    reason: data.reason || "",
    coverageType: data.coverageType || "Full Day",
    priority: data.priority || "Normal",
    notes: data.notes || "",
    status: data.status || "PENDING",
    createdAt: created,
    approvedDoctorId: data.approvedDoctorId || data.assignedDoctorId || data.coveringDoctorId || null,
    approvedDoctorName: data.approvedDoctorName || data.assignedDoctor || data.coveringDoctorName || null,
    approvedDoctorEmail: data.approvedDoctorEmail || null,
    approvedDoctorPhone: data.approvedDoctorPhone || null,
    approvalTime: data.approvalTime || null,
    leaveType: data.leaveType || "Sick Leave",
    rejectedDoctorIds: data.rejectedDoctorIds || [],
    hasFeedback: !!data.hasFeedback,
    startedAt: data.startedAt || undefined,
    completedAt: data.completedAt || undefined,
    requesterUid: data.doctorId || data.requestingDoctorId || data.userId || data.createdBy || "",
    requesterName: data.doctorName || data.requesterName || "",
    requesterSpecialty: data.specialization || "",
    requesterPhoto: data.doctorProfilePhoto || data.requesterPhoto || null,
    shiftDate: dateStr,
    shiftType: data.coverageType || data.leaveType || "Full Day",
    urgency: data.priority || "Normal",
    assignedVolunteerUid: data.approvedDoctorId || data.assignedDoctorId || data.coveringDoctorId || null,
    assignedVolunteerName: data.approvedDoctorName || data.assignedDoctor || data.coveringDoctorName || null,
    hospital: data.hospitalName || "Hospital",
    clinicAddress: data.clinicAddress || null,
    clinicCity: data.clinicCity || null,
    clinicState: data.clinicState || null,
    clinicPin: data.clinicPin || null,
  };
}

export async function updateLeaveRequestStatus(
  requestId: string,
  status: LeaveRequest["status"],
  approvedVolunteer?: Volunteer
): Promise<void> {
  const reqRef = doc(db, "leaveRequests", requestId);

  try {
    await runTransaction(db, async (transaction) => {
      const reqSnap = await transaction.get(reqRef);
      if (!reqSnap.exists()) {
        throw new Error("Leave request does not exist.");
      }

      const data = reqSnap.data();
      if (approvedVolunteer && data.status !== "OPEN" && data.status !== "PENDING" && data.status !== "Open") {
        throw new Error("This coverage request has already been accepted by another doctor.");
      }

      const updates: Record<string, any> = { status };

      if (approvedVolunteer) {
        updates.approvedDoctorId = approvedVolunteer.doctorId;
        updates.approvedDoctorName = approvedVolunteer.name;
        updates.approvedDoctorEmail = approvedVolunteer.email;
        updates.approvedDoctorPhone = approvedVolunteer.phone;
        updates.approvalTime = Date.now();

        const volRef = doc(db, "leaveRequests", requestId, "volunteers", approvedVolunteer.doctorId);
        transaction.update(volRef, { status: "ACCEPTED" });
      }

      transaction.update(reqRef, updates);
    });
  } catch (e: any) {
    if (e.message === "This coverage request has already been accepted by another doctor.") {
      throw e; 
    }
    handleFirestoreError(e, OperationType.UPDATE, `leaveRequests/${requestId}`);
  }
}

export async function startCoverageSession(
  requestId: string,
  coveringDoctorId: string,
  requestingDoctorId: string,
  coveringDoctorName: string
): Promise<void> {
  const reqRef = doc(db, "leaveRequests", requestId);
  try {
    await runTransaction(db, async (transaction) => {
      const reqSnap = await transaction.get(reqRef);
      if (!reqSnap.exists()) {
        throw new Error("Leave request does not exist.");
      }
      const data = reqSnap.data();
      if (data.approvedDoctorId !== coveringDoctorId && data.assignedVolunteerUid !== coveringDoctorId) {
        throw new Error("Only the assigned covering doctor can start the session.");
      }
      if (data.status === "IN_PROGRESS" || data.status === "COMPLETED" || data.status === "REJECTED" || data.status === "CANCELLED") {
        throw new Error(`Cannot start session from status: ${data.status}`);
      }
      transaction.update(reqRef, {
        status: "IN_PROGRESS",
        startedAt: Date.now(),
      });
    });

    await createNotification({
      userId: requestingDoctorId,
      title: "Coverage Started",
      message: `Dr. ${coveringDoctorName} has started your coverage session.`,
      type: "COVERAGE_STARTED"
    });
  } catch (e) {
    console.error("startCoverageSession error:", e);
    throw e;
  }
}

export async function completeCoverageSession(
  requestId: string,
  coveringDoctorId: string,
  requestingDoctorId: string,
  coveringDoctorName: string
): Promise<void> {
  const reqRef = doc(db, "leaveRequests", requestId);
  try {
    await runTransaction(db, async (transaction) => {
      const reqSnap = await transaction.get(reqRef);
      if (!reqSnap.exists()) {
        throw new Error("Leave request does not exist.");
      }
      const data = reqSnap.data();
      if (data.approvedDoctorId !== coveringDoctorId && data.assignedVolunteerUid !== coveringDoctorId) {
        throw new Error("Only the assigned covering doctor can complete the session.");
      }
      if (data.status !== "IN_PROGRESS") {
        throw new Error(`Cannot complete session from status: ${data.status}. Must be IN_PROGRESS.`);
      }
      transaction.update(reqRef, {
        status: "COMPLETED",
        completedAt: Date.now(),
      });
    });

    await createNotification({
      userId: requestingDoctorId,
      title: "Coverage Completed",
      message: `Dr. ${coveringDoctorName} has completed your coverage session. You can now provide feedback.`,
      type: "COVERAGE_COMPLETED"
    });
  } catch (e) {
    console.error("completeCoverageSession error:", e);
    throw e;
  }
}

export async function rejectVolunteerOffer(
  requestId: string,
  volunteerId: string
): Promise<void> {
  const reqRef = doc(db, "leaveRequests", requestId);
  const volRef = doc(db, "leaveRequests", requestId, "volunteers", volunteerId);
  const path = `leaveRequests/${requestId}/volunteers/${volunteerId}`;
  
  try {
    const batch = writeBatch(db);
    batch.update(volRef, { status: "REJECTED" });
    batch.update(reqRef, { rejectedDoctorIds: arrayUnion(volunteerId) });
    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
}

// ================= VOLUNTEERS =================

export function subscribeVolunteers(requestId: string, onData: (items: Volunteer[]) => void): () => void {
  try {
    const q = collection(db, "leaveRequests", requestId, "volunteers");
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts = data.timestamp?.toDate
            ? data.timestamp.toDate().getTime()
            : Number(data.timestamp) || Date.now();
          return {
            id: docSnap.id,
            doctorId: data.doctorId || docSnap.id,
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            profilePhoto: data.profilePhoto || null,
            experience: data.experience || 0,
            specialization: data.specialization || "",
            availability: data.availability || "Available",
            timestamp: ts,
            requestId,
            volunteerUid: data.doctorId || docSnap.id,
            volunteerName: data.name || "",
            volunteerSpecialty: data.specialization || "",
            volunteerPhoto: data.profilePhoto || null,
            notes: data.notes || "",
            status: data.status || "Offered",
          } as Volunteer;
        });
        onData(items.sort((a, b) => b.timestamp - a.timestamp));
      },
      (err) => {
        console.warn("subscribeVolunteers error:", err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeVolunteers error:", err);
    onData([]);
    return () => {};
  }
}

export async function submitVolunteerOffer(
  requestId: string,
  volunteer: Volunteer
): Promise<Volunteer> {
  const authUid = auth.currentUser?.uid || volunteer.doctorId;
  const reqRef = doc(db, "leaveRequests", requestId);
  const reqSnap = await getDoc(reqRef);
  if (reqSnap.exists()) {
    const data = reqSnap.data();
    if (data.rejectedDoctorIds?.includes(authUid)) {
      throw new Error("You have already been rejected for this request and cannot submit another offer.");
    }
    
    // Convert leaveEndDate properly based on how it's stored
    const leaveEndDate = data.leaveEndDate?.toDate
      ? data.leaveEndDate.toDate().getTime()
      : Number(data.leaveEndDate) || Date.now();
      
    if (leaveEndDate <= Date.now()) {
      throw new Error("This coverage request has already expired and is no longer accepting volunteers.");
    }
  }

  const docRef = doc(db, "leaveRequests", requestId, "volunteers", authUid);
  const volData = {
    id: authUid,
    doctorId: authUid,
    name: volunteer.name,
    email: volunteer.email,
    phone: volunteer.phone,
    profilePhoto: volunteer.profilePhoto,
    experience: volunteer.experience,
    specialization: volunteer.specialization,
    availability: "Available",
    timestamp: Date.now(),
    notes: volunteer.notes || "",
  };

  try {
    await setDoc(docRef, volData);
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `leaveRequests/${requestId}/volunteers/${authUid}`);
  }
  return { ...volData, requestId, volunteerUid: authUid, volunteerName: volunteer.name };
}

// ================= CHAT ROOMS & MESSAGES =================

export function subscribeChatRooms(userId: string, onData: (rooms: ChatRoom[]) => void): () => void {
  try {
    const q = query(collection(db, "chatRooms"), where("participants", "array-contains", userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const rooms = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const lastTs = data.lastMessageTimestamp?.toDate
            ? data.lastMessageTimestamp.toDate().getTime()
            : Number(data.lastMessageTimestamp) || Date.now();
          const parts: string[] = data.participants || [];
          const partNames: Record<string, string> = data.participantNames || {};
          const partPhotos: Record<string, string> = data.participantPhotos || {};

          parts.forEach((pUid) => {
            if (!partNames[pUid]) partNames[pUid] = "Doctor";
            if (!partPhotos[pUid]) {
              partPhotos[pUid] = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
            }
          });

          return {
            id: docSnap.id,
            participants: parts,
            lastMessage: data.lastMessage || "",
            lastMessageTimestamp: lastTs,
            unreadCounts: data.unreadCounts || {},
            participantUids: parts,
            participantNames: partNames,
            participantPhotos: partPhotos,
            lastMessageTime: lastTs,
          } as ChatRoom;
        });

        rooms.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        onData(rooms);
      },
      (err) => {
        console.warn("subscribeChatRooms error:", err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeChatRooms error:", err);
    onData([]);
    return () => {};
  }
}

export function subscribeMessages(roomId: string, onData: (messages: Message[]) => void): () => void {
  if (!roomId) {
    onData([]);
    return () => {};
  }
  try {
    const q = query(collection(db, "messages"), where("roomId", "==", roomId));
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts = data.timestamp?.toDate
            ? data.timestamp.toDate().getTime()
            : Number(data.timestamp) || Date.now();
          return {
            id: docSnap.id,
            roomId: data.roomId || roomId,
            senderId: data.senderId || "",
            receiverId: data.receiverId || "",
            text: data.text || "",
            timestamp: ts,
            isRead: !!data.isRead,
            chatRoomId: data.roomId || roomId,
            senderUid: data.senderId || "",
            receiverUid: data.receiverId || "",
          } as Message;
        });
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        onData(msgs);
      },
      (err) => {
        console.warn("subscribeMessages error:", err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeMessages error:", err);
    onData([]);
    return () => {};
  }
}

export async function sendChatMessage(
  senderId: string,
  receiverId: string,
  text: string
): Promise<Message> {
  const participants = [senderId, receiverId].sort();
  const roomId = `${participants[0]}_${participants[1]}`;
  const newMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = Date.now();

  const msg: Message = {
    id: newMsgId,
    roomId,
    senderId,
    receiverId,
    text,
    timestamp,
    isRead: false,
    chatRoomId: roomId,
    senderUid: senderId,
    receiverUid: receiverId,
  };

  try {
    await setDoc(doc(db, "messages", newMsgId), {
      id: newMsgId,
      roomId,
      senderId,
      receiverId,
      text,
      timestamp,
      isRead: false,
    });

    const roomRef = doc(db, "chatRooms", roomId);
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        transaction.set(roomRef, {
          id: roomId,
          participants,
          lastMessage: text,
          lastMessageTimestamp: timestamp,
          unreadCounts: { [receiverId]: 1, [senderId]: 0 },
        });
      } else {
        const roomData = roomSnap.data();
        const unread = { ...(roomData.unreadCounts || {}) };
        unread[receiverId] = (unread[receiverId] || 0) + 1;
        transaction.update(roomRef, {
          lastMessage: text,
          lastMessageTimestamp: timestamp,
          unreadCounts: unread,
        });
      }
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `messages/${newMsgId}`);
  }

  return msg;
}

export async function markMessagesAsRead(myId: string, otherId: string): Promise<void> {
  const participants = [myId, otherId].sort();
  const roomId = `${participants[0]}_${participants[1]}`;

  try {
    const q = query(
      collection(db, "messages"),
      where("senderId", "==", otherId),
      where("receiverId", "==", myId),
      where("isRead", "==", false)
    );
    const snaps = await getDocs(q);
    snaps.forEach((docSnap) => {
      updateDoc(docSnap.ref, { isRead: true });
    });

    await updateDoc(doc(db, "chatRooms", roomId), {
      [`unreadCounts.${myId}`]: 0,
    });
  } catch (e) {
    console.warn("markMessagesAsRead error:", e);
  }
}

// ================= NOTIFICATIONS =================

export function subscribeNotifications(userId: string, onData: (items: Notification[]) => void): () => void {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts = data.timestamp?.toDate
            ? data.timestamp.toDate().getTime()
            : Number(data.timestamp) || Date.now();
          return {
            id: docSnap.id,
            userId: data.userId || "",
            title: data.title || "",
            message: data.message || "",
            timestamp: ts,
            isRead: !!data.isRead,
            type: data.type || "",
            read: !!data.isRead,
          } as Notification;
        });
        items.sort((a, b) => b.timestamp - a.timestamp);
        onData(items);
      },
      (err) => {
        console.warn("subscribeNotifications error:", err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeNotifications error:", err);
    onData([]);
    return () => {};
  }
}

export async function createNotification(
  notif: Omit<Notification, "id" | "timestamp" | "isRead">
): Promise<Notification> {
  const newId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const item: Notification = {
    ...notif,
    id: newId,
    isRead: false,
    timestamp: Date.now(),
    read: false,
  };

  try {
    await setDoc(doc(db, "notifications", newId), {
      id: newId,
      userId: item.userId,
      title: item.title,
      message: item.message,
      timestamp: item.timestamp,
      isRead: false,
      type: item.type || "",
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `notifications/${newId}`);
  }
  return item;
}

export async function markNotificationRead(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "notifications", notifId), { isRead: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `notifications/${notifId}`);
  }
}

// ================= COVERAGE FEEDBACK =================

export async function submitCoverageFeedback(feedback: CoverageFeedback): Promise<void> {
  const reqRef = doc(db, "leaveRequests", feedback.coverageRequestId);
  const fbRef = doc(db, "coverageFeedback", feedback.coverageRequestId);
  const userRef = doc(db, "users", feedback.coveringDoctorId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verify coverage request exists and is completed/approved.
      const reqSnap = await transaction.get(reqRef);
      if (!reqSnap.exists()) {
        throw new Error("Coverage request does not exist.");
      }
      const reqData = reqSnap.data();
      if (reqData.doctorId !== feedback.requestingDoctorId && reqData.requesterUid !== feedback.requestingDoctorId) {
        throw new Error("Only the requesting doctor can submit feedback.");
      }
      
      const leaveEnd = reqData.leaveEndDate?.toDate ? reqData.leaveEndDate.toDate().getTime() : Number(reqData.leaveEndDate);
      if (leaveEnd > Date.now() && reqData.status !== "COMPLETED") {
        throw new Error("Cannot submit feedback before the coverage duty has ended.");
      }

      // 2. Ensure feedback doesn't already exist to prevent duplicates
      const fbSnap = await transaction.get(fbRef);
      if (fbSnap.exists()) {
        throw new Error("Feedback has already been submitted for this coverage request.");
      }

      // 3. Get the doctor profile to update their aggregate rating safely
      const userSnap = await transaction.get(userRef);
      let currentRating = 0;
      let currentCount = 0;
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        currentRating = typeof userData.coverageRating === "number" ? userData.coverageRating : 0;
        currentCount = typeof userData.coverageRatingCount === "number" ? userData.coverageRatingCount : 0;
      }

      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + feedback.rating) / newCount;

      // Execute all writes
      transaction.set(fbRef, feedback);
      transaction.update(reqRef, { hasFeedback: true, status: "COMPLETED" });
      transaction.update(userRef, {
        coverageRating: Number(newRating.toFixed(1)),
        coverageRatingCount: newCount
      });
    });
  } catch (err) {
    console.error("submitCoverageFeedback error:", err);
    throw err;
  }
}

export async function getDoctorFeedbacks(doctorId: string): Promise<CoverageFeedback[]> {
  try {
    const q = query(
      collection(db, "coverageFeedback"),
      where("coveringDoctorId", "==", doctorId)
    );
    const snaps = await getDocs(q);
    const feedbacks = snaps.docs.map(docSnap => docSnap.data() as CoverageFeedback);
    // Sort descending by date locally (since we might not have a composite index)
    feedbacks.sort((a, b) => b.createdAt - a.createdAt);
    return feedbacks;
  } catch (err) {
    console.error("getDoctorFeedbacks error:", err);
    return [];
  }
}

export async function getCoverageFeedback(requestId: string): Promise<CoverageFeedback | null> {
  try {
    const fbRef = doc(db, "coverageFeedback", requestId);
    const snap = await getDoc(fbRef);
    if (snap.exists()) {
      return snap.data() as CoverageFeedback;
    }
    return null;
  } catch (err) {
    console.error("getCoverageFeedback error:", err);
    return null;
  }
}


// ============================================================================
// ADMIN SERVICES
// ============================================================================

export async function createAdminActivityLog(logData: Omit<AdminActivityLog, "id">): Promise<void> {
  try {
    const colRef = collection(db, "adminActivityLogs");
    await addDoc(colRef, logData);
  } catch (err) {
    console.error("createAdminActivityLog error:", err);
  }
}

export function subscribeAdminActivityLogs(onData: (logs: AdminActivityLog[]) => void, onError?: (err: Error) => void): () => void {
  try {
    const q = query(collection(db, "adminActivityLogs"), orderBy("timestamp", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as AdminActivityLog[];
        onData(items);
      },
      (err) => {
        console.warn("subscribeAdminActivityLogs error:", err);
        if (onError) onError(err);
        else onData([]);
      }
    );
  } catch (err: any) {
    console.error("subscribeAdminActivityLogs catch:", err);
    if (onError) onError(err);
    else onData([]);
    return () => {};
  }
}

export async function createAdminNotification(notifData: Omit<AdminNotification, "id">): Promise<void> {
  try {
    const colRef = collection(db, "adminNotifications");
    await addDoc(colRef, notifData);
  } catch (err) {
    console.error("createAdminNotification error:", err);
  }
}

export function subscribeAdminNotifications(onData: (notifs: AdminNotification[]) => void, onError?: (err: Error) => void): () => void {
  try {
    const q = query(collection(db, "adminNotifications"), orderBy("timestamp", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as AdminNotification[];
        onData(items);
      },
      (err) => {
        console.warn("subscribeAdminNotifications error:", err);
        if (onError) onError(err);
        else onData([]);
      }
    );
  } catch (err: any) {
    console.error("subscribeAdminNotifications catch:", err);
    if (onError) onError(err);
    else onData([]);
    return () => {};
  }
}

export async function markAdminNotificationRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, "adminNotifications", notificationId);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.error("markAdminNotificationRead error:", err);
  }
}

// ============================================================================
// DOCTOR SERVICES
// ============================================================================

export function subscribeHospitalNotices(onData: (items: HospitalNotice[]) => void): () => void {
  try {
    const q = collection(db, "hospitalNotices");
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts = data.timestamp?.toDate
            ? data.timestamp.toDate().getTime()
            : Number(data.timestamp) || Date.now();
          return {
            id: docSnap.id,
            title: data.title || "",
            content: data.content || "",
            type: data.type || "INFO",
            priority: data.priority || "NORMAL",
            timestamp: ts,
            hospitalId: data.hospitalId || "",
            isRead: !!data.isRead,

            // Aliases
            category: data.type || "Policy Update",
            department: data.department || "Clinical Administration",
            author: data.author || "Hospital Admin",
            date: new Date(ts).toISOString().split("T")[0],
            isImportant: data.priority === "HIGH" || data.priority === "CRITICAL" || data.type === "ALERT",
          } as HospitalNotice;
        });
        items.sort((a, b) => b.timestamp - a.timestamp);
        onData(items);
      },
      (err) => {
        console.warn("subscribeHospitalNotices error:", err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.error("subscribeHospitalNotices error:", err);
    onData([]);
    return () => {};
  }
}

export async function createHospitalNotice(noticeData: Partial<HospitalNotice>): Promise<HospitalNotice> {
  const newId = `notice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ts = Date.now();
  const notice: HospitalNotice = {
    id: newId,
    title: noticeData.title || "",
    content: noticeData.content || "",
    type: noticeData.type || noticeData.category || "INFO",
    priority: noticeData.priority || (noticeData.isImportant ? "HIGH" : "NORMAL"),
    timestamp: ts,
    hospitalId: noticeData.hospitalId || "",
    isRead: false,
    category: noticeData.category || noticeData.type || "Policy Update",
    department: noticeData.department || "Clinical Administration",
    author: noticeData.author || "Hospital Admin",
    date: new Date(ts).toISOString().split("T")[0],
    isImportant: !!noticeData.isImportant,
  };

  try {
    await setDoc(doc(db, "hospitalNotices", newId), {
      id: newId,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      priority: notice.priority,
      timestamp: notice.timestamp,
      hospitalId: notice.hospitalId,
      isRead: false,
      department: notice.department,
      author: notice.author,
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `hospitalNotices/${newId}`);
  }
  return notice;
}


