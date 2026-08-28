/**
 * MedLink Constants and Theme Configuration
 */

export const THEME = {
  primary: '#2563eb', // Blue
  secondary: '#64748b', // Slate
  accent: '#3b82f6', // Lighter Blue
  background: '#ffffff',
  surface: '#f8fafc',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

export const ROUTES = {
  SPLASH: '/',
  GET_STARTED: '/get-started',
  ROLE_SELECTION: '/role-selection',
  
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_ID: '/verify-id',
  VERIFICATION_SUCCESS: '/verification-success',
  VERIFICATION_FAILED: '/verification-failed',

  // Doctor
  DOCTOR_DASHBOARD: '/doctor',
  DOCTOR_PROFILE: '/doctor/profile',
  DOCTOR_EDIT_PROFILE: '/doctor/edit-profile',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  DOCTOR_APPOINTMENT_DETAILS: '/doctor/appointments/:id',
  DOCTOR_QUEUE: '/doctor/queue',
  DOCTOR_LEAVE_APPLY: '/doctor/leave/apply',
  DOCTOR_LEAVE_STATUS: '/doctor/leave/status',
  DOCTOR_COVERAGE_SENT: '/doctor/coverage/sent',
  DOCTOR_COVERAGE_RECEIVED: '/doctor/coverage/received',
  DOCTOR_ACCESS_REQUESTS: '/doctor/access-requests',
  DOCTOR_PRESCRIPTION_WRITE: '/doctor/prescription/write',
  DOCTOR_PATIENT_HISTORY: '/doctor/patient-history/:id',

  // Patient
  PATIENT_HOME: '/patient',
  PATIENT_SEARCH: '/patient/search',
  PATIENT_DOCTOR_DETAILS: '/patient/doctor/:id',
  PATIENT_BOOK_APPOINTMENT: '/patient/book/:id',
  PATIENT_APPOINTMENT_CONFIRM: '/patient/appointment/confirm',
  PATIENT_TOKEN: '/patient/token/:id',
  PATIENT_RECOMMENDED: '/patient/recommended',
  PATIENT_NEARBY: '/patient/nearby',
  PATIENT_REMINDERS: '/patient/reminders',
  PATIENT_ADHERENCE: '/patient/adherence',
  PATIENT_HISTORY: '/patient/history',
  
  // AI & Reviews
  AI_CHAT: '/ai-chat',
  AI_SUGGESTION: '/ai-suggestion',
  SUBMIT_REVIEW: '/submit-review/:id',
  VIEW_REVIEWS: '/reviews/:id',

  // General
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',

  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_VERIFICATION: '/admin/verification',
  ADMIN_LEAVE_REQUESTS: '/admin/leave-requests',
  ADMIN_ACTIVITY_LOG: '/admin/activity-log',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',
};

// All static mock arrays have been deleted in compliance with PROJECT REQUIREMENT: REMOVE ALL DEMO DATA AND USE ONLY REAL USER DATA

