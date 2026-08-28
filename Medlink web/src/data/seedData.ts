import {
  UserProfile,
  LeaveRequest,
  VolunteerOffer,
  ChatRoom,
  Message,
  NotificationItem,
  HospitalNotice,
} from "../types";

// Production empty defaults - NO dummy/mock data
export const SEED_DOCTORS: UserProfile[] = [];
export const INITIAL_CURRENT_USER: UserProfile | null = null;
export const SEED_LEAVE_REQUESTS: LeaveRequest[] = [];
export const SEED_VOLUNTEERS: VolunteerOffer[] = [];
export const SEED_CHAT_ROOMS: ChatRoom[] = [];
export const SEED_MESSAGES: Message[] = [];
export const SEED_NOTIFICATIONS: NotificationItem[] = [];
export const SEED_NOTICES: HospitalNotice[] = [];
