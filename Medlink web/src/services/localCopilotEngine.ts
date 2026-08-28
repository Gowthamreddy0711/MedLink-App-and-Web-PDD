/**
 * MedLink Smart Clinical Operations Assistant Engine
 *
 * ─── What this IS ──────────────────────────────────────────────────────────
 * A structured intent-detection + data-retrieval engine that:
 *   1. Parses the user's natural-language query into one of 14 recognised intents.
 *   2. Retrieves the relevant subset of the authenticated doctor's live Firestore
 *      data (supplied via CopilotContext from DataContext real-time subscriptions).
 *   3. Generates a human-readable, natural-language response from that real data.
 *
 * ─── What this is NOT ──────────────────────────────────────────────────────
 * • NOT a machine-learning model.
 * • NOT a large-language model (LLM).
 * • Does NOT call any external AI API (no Gemini, no OpenAI, no Claude, etc.).
 * • Does NOT download any model file.
 * • Does NOT require WebGPU or WebLLM.
 * • Does NOT produce AI-generated or hallucinated content.
 *
 * All responses are deterministically built from real MedLink Firestore documents
 * supplied through the DataContext. If no matching data exists, the engine says so.
 *
 * ─── Medical Safety ────────────────────────────────────────────────────────
 * This assistant provides OPERATIONAL information only (scheduling, coverage,
 * leave, notices). It NEVER diagnoses, prescribes, or makes clinical decisions.
 */

import {
  User,
  LeaveRequest,
  Volunteer,
  HospitalNotice,
  ChatRoom,
  Notification,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

import { DataPayload } from "../types";

export interface CopilotContext {
  currentUser: User | null;
  doctors: User[];
  leaveRequests: LeaveRequest[];
  volunteers: Volunteer[];
  notices: HospitalNotice[];
  chatRooms: ChatRoom[];
  notifications: Notification[];
}

export interface SessionContext {
  lastIntent?: Intent;
  lastData?: DataPayload;
}

export interface CopilotResponse {
  answer: string;
  intent: Intent;
  dataPayload?: DataPayload;
}

export type Intent =
  | "DOCTOR_SEARCH"
  | "LEAVE_STATUS"
  | "COVERAGE_OPEN"
  | "MY_DUTIES"
  | "APPOINTMENTS"
  | "MESSAGES"
  | "HOSPITAL_NOTICES"
  | "ANALYTICS"
  | "PROFILE"
  | "HELP"
  | "UNKNOWN"
  | "MEDICAL_SAFETY";

// ═══════════════════════════════════════════════════════════════════════════
// Permission Filter  (Volunteer → Acceptance workflow)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Restricts private contact details of other doctors until a coverage
 * relationship has been formally APPROVED/ACCEPTED between the two parties.
 */
export function filterDoctorPermissions(
  targetDoc: User,
  currentUid: string | null | undefined,
  activeRequests: LeaveRequest[] = []
): Partial<User> {
  // Always expose your own full profile
  if (!currentUid || targetDoc.id === currentUid) return targetDoc;

  const hasAcceptedRelationship = activeRequests.some((r) => {
    const approved =
      r.status === "APPROVED" || (r as any).status === "ACCEPTED";
    const currentIsVolunteer =
      r.approvedDoctorId === currentUid ||
      r.assignedVolunteerUid === currentUid;
    const targetIsRequester = r.doctorId === targetDoc.id;
    const currentIsRequester = r.doctorId === currentUid;
    const targetIsVolunteer =
      r.approvedDoctorId === targetDoc.id ||
      r.assignedVolunteerUid === targetDoc.id;
    return (
      approved &&
      ((currentIsVolunteer && targetIsRequester) ||
        (currentIsRequester && targetIsVolunteer))
    );
  });

  if (hasAcceptedRelationship || targetDoc.role === "ADMIN") return targetDoc;

  // Mask private fields until relationship is accepted
  return {
    ...targetDoc,
    phoneNumber: "Available after coverage is accepted",
    phone: "Available after coverage is accepted",
    email: targetDoc.email
      ? `${targetDoc.email.charAt(0)}••••@••••`
      : "Restricted",
    hospitalAddress: targetDoc.hospitalAddress
      ? "Visible after coverage is accepted"
      : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Specialty Keyword Map
// ═══════════════════════════════════════════════════════════════════════════

const SPECIALTY_KEYWORDS: Record<string, string> = {
  // Cardiology
  cardio: "Cardiology",
  cardiologist: "Cardiology",
  cardiology: "Cardiology",
  cardiac: "Cardiology",
  heart: "Cardiology",
  // Surgery
  surg: "Surgery",
  surgeon: "Surgery",
  surgery: "Surgery",
  surgical: "Surgery",
  // Pediatrics
  pediatric: "Pediatrics",
  paediatric: "Pediatrics",
  pediatrician: "Pediatrics",
  paediatrician: "Pediatrics",
  paediatrics: "Pediatrics",
  pediatrics: "Pediatrics",
  children: "Pediatrics",
  // Neurology
  neuro: "Neurology",
  neurologist: "Neurology",
  neurology: "Neurology",
  neurological: "Neurology",
  // Orthopedics
  ortho: "Orthopedics",
  orthopedic: "Orthopedics",
  orthopaedic: "Orthopedics",
  orthopedics: "Orthopedics",
  orthopaedics: "Orthopedics",
  bone: "Orthopedics",
  // Emergency Medicine
  emergency: "Emergency Medicine",
  "e.r.": "Emergency Medicine",
  er: "Emergency Medicine",
  // Anaesthesiology
  anaesthesia: "Anaesthesiology",
  anesthesia: "Anaesthesiology",
  anaesthesiologist: "Anaesthesiology",
  anesthesiologist: "Anaesthesiology",
  anaesthesiology: "Anaesthesiology",
  anesthesiology: "Anaesthesiology",
  // Psychiatry
  psych: "Psychiatry",
  psychiatry: "Psychiatry",
  psychiatrist: "Psychiatry",
  // Radiology
  radio: "Radiology",
  radiology: "Radiology",
  radiologist: "Radiology",
  // Oncology
  onco: "Oncology",
  oncology: "Oncology",
  oncologist: "Oncology",
  cancer: "Oncology",
  // Gynaecology
  gynae: "Gynaecology",
  gynaecology: "Gynaecology",
  gynecology: "Gynaecology",
  obgyn: "Gynaecology",
  gynaecologist: "Gynaecology",
  gynecologist: "Gynaecology",
  // Dermatology
  derma: "Dermatology",
  dermatology: "Dermatology",
  dermatologist: "Dermatology",
  skin: "Dermatology",
  // Gastroenterology
  gastro: "Gastroenterology",
  gastroenterology: "Gastroenterology",
  gastroenterologist: "Gastroenterology",
  // Nephrology
  nephro: "Nephrology",
  nephrology: "Nephrology",
  nephrologist: "Nephrology",
  kidney: "Nephrology",
  // Pulmonology
  pulmo: "Pulmonology",
  pulmonology: "Pulmonology",
  pulmonologist: "Pulmonology",
  lung: "Pulmonology",
  respiratory: "Pulmonology",
  // Endocrinology
  endo: "Endocrinology",
  endocrinology: "Endocrinology",
  endocrinologist: "Endocrinology",
  diabetes: "Endocrinology",
  thyroid: "Endocrinology",
  // Ophthalmology
  ophthal: "Ophthalmology",
  ophthalmology: "Ophthalmology",
  ophthalmologist: "Ophthalmology",
  eye: "Ophthalmology",
  // ENT
  ent: "ENT",
  otolaryngology: "ENT",
  // Urology
  urology: "Urology",
  urologist: "Urology",
  // Rheumatology
  rheumatology: "Rheumatology",
  rheumatologist: "Rheumatology",
  arthritis: "Rheumatology",
  // Internal Medicine
  internist: "Internal Medicine",
  // General
  physician: "General Medicine",
  gp: "General Medicine",
};

function extractSpecialty(q: string): string {
  // Multi-word keys first (e.g. "internal medicine", "emergency medicine")
  const multiWord = Object.entries(SPECIALTY_KEYWORDS)
    .filter(([k]) => k.includes(" "))
    .sort((a, b) => b[0].length - a[0].length);
  for (const [key, label] of multiWord) {
    if (q.includes(key)) return label;
  }
  // Single-word tokens
  const tokens = q.split(/[\s,./]+/);
  for (const token of tokens) {
    if (SPECIALTY_KEYWORDS[token]) return SPECIALTY_KEYWORDS[token];
  }
  return "";
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility — Date formatters
// ═══════════════════════════════════════════════════════════════════════════

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Intent Detection
// ═══════════════════════════════════════════════════════════════════════════

export function detectIntent(query: string): Intent {
  const q = query.toLowerCase().trim();

  // Medical Safety
  if (
    q.includes("diagnose") ||
    q.includes("treatment") ||
    q.includes("medication") ||
    q.includes("dosage") ||
    q.includes("prescribe") ||
    q.includes("headache") ||
    q.includes("symptoms")
  ) {
    return "MEDICAL_SAFETY";
  }

  if (
    q === "help" ||
    q === "?" ||
    q.includes("what can you") ||
    q.includes("what do you do") ||
    q.includes("commands") ||
    (q.includes("help") && q.length < 12)
  ) {
    return "HELP";
  }

  if (
    q.includes("my profile") ||
    q.includes("who am i") ||
    q.includes("my specialization") ||
    q.includes("my hospital") ||
    q.includes("my accreditation")
  ) {
    return "PROFILE";
  }

  if (
    q.includes("how many") ||
    q.includes("count") ||
    q.includes("analytics") ||
    q.includes("stats")
  ) {
    return "ANALYTICS";
  }

  if (
    q.includes("notice") ||
    q.includes("hospital update")
  ) {
    return "HOSPITAL_NOTICES";
  }

  if (
    q.includes("message") ||
    q.includes("chat") ||
    q.includes("conversation")
  ) {
    return "MESSAGES";
  }

  if (
    q.includes("my leave") ||
    q.includes("leave status") ||
    q.includes("pending leave") ||
    q.includes("approved leave") ||
    q.includes("recent leave")
  ) {
    return "LEAVE_STATUS";
  }

  if (
    q.includes("open coverage") ||
    q.includes("coverage requests") ||
    q.includes("need coverage") ||
    q.includes("available coverage") ||
    q.includes("what shifts need coverage") ||
    q.includes("who needs coverage") ||
    q.includes("who can cover my shift")
  ) {
    return "COVERAGE_OPEN";
  }

  if (
    q.includes("my duties") ||
    q.includes("my upcoming duties") ||
    q.includes("what shifts am i covering") ||
    q.includes("my coverage duties")
  ) {
    return "MY_DUTIES";
  }

  if (
    q.includes("appointment") ||
    q.includes("my appointments")
  ) {
    return "APPOINTMENTS";
  }

  const specialty = extractSpecialty(q);
  if (
    specialty ||
    q.includes("doctor") ||
    q.includes("who is available")
  ) {
    return "DOCTOR_SEARCH";
  }

  return "UNKNOWN";
}

function handleHelp(): CopilotResponse {
  return {
    intent: "HELP",
    answer: "I can help you with your MedLink operations.\n\n• Leave status\n• Coverage requests\n• Upcoming duties\n• Doctor directory\n• Appointments\n• Hospital notices\n• Messages\n• Profile\n• Analytics",
  };
}

function handleMedicalSafety(): CopilotResponse {
  return {
    intent: "MEDICAL_SAFETY",
    answer: "I'm designed for MedLink operational tasks such as coverage, leave, doctors, duties, appointments, messages, and hospital updates. Please consult a qualified healthcare professional for medical decisions.",
  };
}

function handleProfile(user: User | null): CopilotResponse {
  if (!user) {
    return { intent: "PROFILE", answer: "You are not currently logged in." };
  }
  return {
    intent: "PROFILE",
    answer: "Here is your profile information:",
    dataPayload: { type: "doctors", items: [user] }
  };
}

function handleDoctorSearch(q: string, doctors: User[], currentUser: User | null, sessionContext?: SessionContext): CopilotResponse {
  let matched = doctors;

  if (sessionContext?.lastIntent === "DOCTOR_SEARCH" && sessionContext.lastData?.items) {
    matched = sessionContext.lastData.items;
  }

  const specialty = extractSpecialty(q);
  const wantAvailable = q.includes("available") || q.includes("today") || q.includes("free");

  if (specialty) {
    matched = matched.filter(d => (d.specialty || "").toLowerCase().includes(specialty.toLowerCase()));
  }
  if (wantAvailable) {
    matched = matched.filter(d => d.clinicStatus === "Available" || d.isAvailableForCoverage === true);
  }

  matched = matched.filter(d => d.id !== currentUser?.id);

  if (!matched.length) {
    return { intent: "DOCTOR_SEARCH", answer: "I couldn't find any matching doctors in MedLink." };
  }

  return {
    intent: "DOCTOR_SEARCH",
    answer: `${matched.length} doctor${matched.length === 1 ? '' : 's'} found.`,
    dataPayload: { type: "doctors", items: matched }
  };
}

function handleLeaveStatus(currentUser: User | null, leaveRequests: LeaveRequest[]): CopilotResponse {
  if (!currentUser) return { intent: "LEAVE_STATUS", answer: "Please log in to view your leave status." };

  const uid = currentUser.id;
  const myLeave = leaveRequests.filter(r => r.doctorId === uid || (r as any).requesterUid === uid);

  if (!myLeave.length) {
    return { intent: "LEAVE_STATUS", answer: "You have no leave requests on record in MedLink." };
  }

  const pendingCount = myLeave.filter(r => r.status === "PENDING").length;
  const approvedCount = myLeave.filter(r => r.status === "APPROVED" || (r as any).status === "ACCEPTED").length;

  return {
    intent: "LEAVE_STATUS",
    answer: `You have ${myLeave.length} leave request${myLeave.length === 1 ? '' : 's'}.\n${approvedCount} approved and ${pendingCount} pending.`,
    dataPayload: { type: "leave_requests", items: myLeave }
  };
}

function handleCoverageOpen(leaveRequests: LeaveRequest[], q: string, sessionContext?: SessionContext): CopilotResponse {
  let matched = leaveRequests.filter(r => r.status === "PENDING");

  if (sessionContext?.lastIntent === "COVERAGE_OPEN" && sessionContext.lastData?.items) {
    matched = sessionContext.lastData.items;
  }

  const specialty = extractSpecialty(q);
  if (specialty) {
    matched = matched.filter(r => (r.specialization || "").toLowerCase().includes(specialty.toLowerCase()));
  }

  if (!matched.length) {
    return { intent: "COVERAGE_OPEN", answer: "I couldn't find any open coverage requests matching your query." };
  }

  return {
    intent: "COVERAGE_OPEN",
    answer: `I found ${matched.length} open coverage request${matched.length === 1 ? '' : 's'}.`,
    dataPayload: { type: "leave_requests", items: matched }
  };
}

function handleMyDuties(currentUser: User | null, leaveRequests: LeaveRequest[]): CopilotResponse {
  if (!currentUser) return { intent: "MY_DUTIES", answer: "Please log in to view your duties." };

  const uid = currentUser.id;
  const myDuties = leaveRequests.filter(r => 
    (r.status === "APPROVED" || (r as any).status === "ACCEPTED") &&
    (r.approvedDoctorId === uid || r.assignedVolunteerUid === uid)
  );

  if (!myDuties.length) {
    return { intent: "MY_DUTIES", answer: "You have no assigned coverage duties." };
  }

  return {
    intent: "MY_DUTIES",
    answer: `You have ${myDuties.length} upcoming coverage dut${myDuties.length === 1 ? 'y' : 'ies'}.`,
    dataPayload: { type: "leave_requests", items: myDuties }
  };
}

function handleAppointments(currentUser: User | null, leaveRequests: LeaveRequest[], q: string, sessionContext?: SessionContext): CopilotResponse {
  if (!currentUser) return { intent: "APPOINTMENTS", answer: "Please log in to view your appointments." };
  
  let myDuties = leaveRequests.filter(r => 
    (r.status === "APPROVED" || (r as any).status === "ACCEPTED") &&
    (r.approvedDoctorId === currentUser.id || r.assignedVolunteerUid === currentUser.id)
  );

  if (sessionContext?.lastIntent === "APPOINTMENTS" && sessionContext.lastData?.items) {
    myDuties = sessionContext.lastData.items;
  }

  const now = Date.now();
  if (q.includes("completed") || q.includes("past")) {
    myDuties = myDuties.filter(r => r.leaveEndDate < now);
  } else if (q.includes("upcoming") || q.includes("today")) {
    myDuties = myDuties.filter(r => r.leaveEndDate >= now);
  }

  if (!myDuties.length) {
    return { intent: "APPOINTMENTS", answer: "I couldn't find any matching appointments." };
  }

  return {
    intent: "APPOINTMENTS",
    answer: `${myDuties.length} appointment${myDuties.length === 1 ? '' : 's'} found.`,
    dataPayload: { type: "leave_requests", items: myDuties }
  };
}

function handleMessages(chatRooms: ChatRoom[], currentUser: User | null, doctors: User[]): CopilotResponse {
  if (!currentUser) return { intent: "MESSAGES", answer: "Please log in to view your messages." };

  const myRooms = chatRooms.filter(r => r.participants?.includes(currentUser.id));
  
  if (!myRooms.length) {
    return { intent: "MESSAGES", answer: "You have no conversations." };
  }

  return {
    intent: "MESSAGES",
    answer: `You have ${myRooms.length} conversation${myRooms.length === 1 ? '' : 's'}.`,
    dataPayload: { type: "chat_rooms", items: myRooms }
  };
}

function handleHospitalNotices(notices: HospitalNotice[]): CopilotResponse {
  if (!notices.length) {
    return { intent: "HOSPITAL_NOTICES", answer: "There are no new hospital notices." };
  }

  const latest = [...notices].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  return {
    intent: "HOSPITAL_NOTICES",
    answer: `Here are the latest hospital notices.`,
    dataPayload: { type: "notices", items: latest }
  };
}

function handleAnalytics(currentUser: User | null, leaveRequests: LeaveRequest[], doctors: User[], q: string): CopilotResponse {
  if (q.includes("pending") && q.includes("coverage")) {
    const count = leaveRequests.filter(r => r.status === "PENDING").length;
    return { intent: "ANALYTICS", answer: `Currently, there are ${count} open coverage requests.` };
  }
  if (q.includes("leave request") && currentUser) {
    const count = leaveRequests.filter(r => r.doctorId === currentUser.id || (r as any).requesterUid === currentUser.id).length;
    return { intent: "ANALYTICS", answer: `You have ${count} leave requests.` };
  }
  if (q.includes("doctor") && q.includes("available")) {
    const count = doctors.filter(d => d.clinicStatus === "Available" || d.isAvailableForCoverage === true).length;
    return { intent: "ANALYTICS", answer: `There are ${count} available doctors in the network.` };
  }
  if (q.includes("appointment") && q.includes("completed") && currentUser) {
    const now = Date.now();
    const count = leaveRequests.filter(r => 
      (r.status === "APPROVED" || (r as any).status === "ACCEPTED") &&
      (r.approvedDoctorId === currentUser.id || r.assignedVolunteerUid === currentUser.id) &&
      r.leaveEndDate < now
    ).length;
    return { intent: "ANALYTICS", answer: `You have completed ${count} appointments.` };
  }
  
  return { intent: "ANALYTICS", answer: "I can calculate statistics on pending requests, leave requests, available doctors, and completed appointments." };
}

function handleUnknown(): CopilotResponse {
  return {
    intent: "UNKNOWN",
    answer: "I can help with MedLink operations such as leave, coverage, doctors, duties, appointments, messages, notices, and analytics.\n\nTry asking:\n• What is my leave status?\n• Show open coverage requests\n• Find cardiologists\n• Show latest notices"
  };
}

export async function querySmartAssistant(
  prompt: string,
  context: CopilotContext,
  sessionContext?: SessionContext
): Promise<CopilotResponse> {
  const q = prompt.trim().toLowerCase();
  const { currentUser, doctors, leaveRequests, chatRooms, notices } = context;

  if (!q) {
    return { intent: "HELP", answer: "Please type a question or tap a quick action below." };
  }

  const intent = detectIntent(q);

  switch (intent) {
    case "HELP": return handleHelp();
    case "MEDICAL_SAFETY": return handleMedicalSafety();
    case "PROFILE": return handleProfile(currentUser);
    case "DOCTOR_SEARCH": return handleDoctorSearch(q, doctors, currentUser, sessionContext);
    case "LEAVE_STATUS": return handleLeaveStatus(currentUser, leaveRequests);
    case "COVERAGE_OPEN": return handleCoverageOpen(leaveRequests, q, sessionContext);
    case "MY_DUTIES": return handleMyDuties(currentUser, leaveRequests);
    case "APPOINTMENTS": return handleAppointments(currentUser, leaveRequests, q, sessionContext);
    case "MESSAGES": return handleMessages(chatRooms, currentUser, doctors);
    case "HOSPITAL_NOTICES": return handleHospitalNotices(notices);
    case "ANALYTICS": return handleAnalytics(currentUser, leaveRequests, doctors, q);
    default: return handleUnknown();
  }
}

