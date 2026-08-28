export type LicenseStatus = 'Active' | 'Suspended' | 'Expired' | 'Pending' | 'Verified';
export type RequestStatus = 'OPEN' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'IN_PROGRESS' | 'REJECTED' | 'COMPLETED' | 'Open' | 'Assigned' | 'Volunteer Offered' | 'EXPIRED';
export type ShiftType = 'Day Shift' | 'Night Shift' | 'On-Call' | 'ICU Shift' | 'ER Shift' | '24hr Duty' | string;
export type RequestUrgency = 'Normal' | 'Urgent' | 'Emergency' | string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // "DOCTOR", "ADMIN", "patient"
  phoneNumber: string;
  avatarUrl: string | null;
  verified: boolean;
  isPractitionerVerified: boolean;
  
  // Doctor specific fields
  specialty: string | null;
  licenseNumber: string | null;
  registrationNumber: string | null;
  governmentId: string | null;
  location: string | null;
  clinicName: string | null;
  averageRating: number;
  totalReviews: number;
  experience: number;
  fees: number;
  clinicStatus: string; // "Available", "Busy", "Away", "Offline"
  hospitalIds: string[];
  department: string | null;

  // New Professional Fields
  hospitalName: string | null;
  hospitalId: string | null;
  qualification: string | null;
  gender: string | null;
  dob: string | null;
  govIdUrl: string | null;
  hospitalAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  joinedDate: number;
  coverageScore: number;
  readNoticeIds: string[];
  coverageRating?: number;
  coverageRatingCount?: number;
  sentimentScoreSum?: number;
  sentimentScoreCount?: number;

  // Compatibility Property Aliases
  uid?: string;
  fullName?: string;
  photoUrl?: string | null;
  hospital?: string | null;
  phone?: string;
  bio?: string | null;
  isAvailableForCoverage?: boolean;
  experienceYears?: number;
  licenseStatus?: LicenseStatus;
  isAvailable?: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  rejectedAt?: number;
  rejectedBy?: string;
  medicalCertificateUrl?: string | null;
  medicalCertificateStatus?: 'NOT_REVIEWED' | 'VERIFIED' | 'INVALID' | null;
  medicalCertificateReason?: string | null;
}

export type UserProfile = User;

export interface AdminActivityLog {
  id: string;
  action: "DOCTOR_APPROVED" | "DOCTOR_REJECTED" | "DOCTOR_PROFILE_REVIEWED" | "DOCTOR_REAPPLICATION_REVIEWED" | string;
  doctorUid: string;
  doctorName: string;
  adminUid: string;
  adminName: string;
  reason?: string;
  timestamp: number;
  metadata?: any;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: "NEW_REGISTRATION" | "NEW_LEAVE_REQUEST" | "DOCTOR_REAPPLICATION" | string;
  targetId?: string; // e.g. Doctor UID or Leave Request ID
}

export interface UserAccount {
  id: string;
  email: string;
  role: string;
  verified?: boolean;
  verificationStatus?: string;
  createdAt?: string;
}

export interface DoctorProfile {
  userId: string;
  fullName: string;
  mobileNumber: string;
  gender: string;
  dateOfBirth: string;
  hospitalName: string;
  hospitalId?: string;
  medicalLicenseNumber: string;
  registrationNumber: string;
  specialization: string;
  department: string;
  qualification: string;
  experience: number;
  hospitalAddress: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  profilePhotoUrl?: string;
  governmentIdUrl?: string;
  medicalCertificateUrl?: string;
  medicalCertificateStatus?: 'NOT_REVIEWED' | 'VERIFIED' | 'INVALID';
  medicalCertificateReason?: string;
  createdAt?: string;
  coverageRating?: number;
  coverageRatingCount?: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  type: string;
  specialties: string[];
  location: string | null;
  distanceKm: number;
  availableShiftsCount: number;
  priority: string;
}

export interface LeaveRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string;
  doctorProfilePhoto: string | null;
  doctorLicense: string;
  specialization: string;
  leaveStartDate: number;
  leaveEndDate: number;
  leaveDuration: string;
  reason: string;
  coverageType: string;
  priority: string; // Normal, Urgent
  notes: string;
  status: RequestStatus;
  createdAt: number;
  approvedDoctorId: string | null;
  approvedDoctorName: string | null;
  approvedDoctorEmail: string | null;
  approvedDoctorPhone: string | null;
  approvalTime: number | null;
  leaveType: string;
  rejectedDoctorIds?: string[];
  hasFeedback?: boolean;
  startedAt?: number;
  completedAt?: number;

  // Compatibility Aliases
  requesterUid?: string;
  requesterName?: string;
  requesterSpecialty?: string;
  requesterPhoto?: string | null;
  shiftDate?: string;
  shiftType?: string;
  urgency?: string;
  assignedVolunteerUid?: string | null;
  assignedVolunteerName?: string | null;
  hospital?: string;
  clinicAddress?: string | null;
  clinicCity?: string | null;
  clinicState?: string | null;
  clinicPin?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Volunteer {
  id: string;
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  experience: number;
  specialization: string;
  availability: string;
  timestamp: number;

  // Compatibility Aliases
  requestId?: string;
  volunteerUid?: string;
  volunteerName?: string;
  volunteerSpecialty?: string;
  volunteerPhoto?: string | null;
  notes?: string;
  status?: string;
}

export type VolunteerOffer = Volunteer;

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: string;

  // Compatibility Aliases
  read?: boolean;
}

export type NotificationItem = Notification;

export interface HospitalNotice {
  id: string;
  title: string;
  content: string;
  type: string; // INFO, ALERT, CIRCULAR, HOLIDAY
  priority: string; // NORMAL, HIGH, CRITICAL
  timestamp: number;
  hospitalId: string;
  isRead: boolean;

  // Compatibility Aliases
  category?: string;
  department?: string;
  author?: string;
  date?: string;
  isImportant?: boolean;
}

export interface InternalMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  diagnoses: string;
  medicationsJson: string;
  instructions: string;
  nextVisitDate: string;
  timestamp: number;
}

export interface CoverageAnalytics {
  doctorId: string;
  acceptedCount: number;
  rejectedCount: number;
  completedCount: number;
  totalHours: number;
  leaveRequestsCount: number;
  performanceScore: number;
}

export interface CoverageFeedback {
  id: string;
  coverageRequestId: string;
  requestingDoctorId: string;
  coveringDoctorId: string;
  rating: number;
  feedback: string;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  sentimentScore?: number | null;
  sentimentConfidence?: number | null;
  createdAt: number;

  // Compatibility Aliases for Android Sync
  requestId?: string;
  reviewerId?: string;
  reviewedDoctorId?: string;
  reviewText?: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isRead: boolean;

  // Compatibility Aliases
  chatRoomId?: string;
  senderUid?: string;
  receiverUid?: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCounts: Record<string, number>;

  // Compatibility Aliases
  participantUids?: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  lastMessageTime?: number;
}

export interface DataPayload {
  type: "doctors" | "leave_requests" | "notices" | "chat_rooms";
  items: any[];
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  category?: "policy" | "drug" | "triage";
  dataPayload?: DataPayload;
}

