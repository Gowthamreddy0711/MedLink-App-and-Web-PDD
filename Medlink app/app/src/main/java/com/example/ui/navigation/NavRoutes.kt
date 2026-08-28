package com.example.ui.navigation

sealed class Screen(val route: String) {
    // Auth & Onboarding
    object Splash : Screen("splash")
    object GetStarted : Screen("get_started")
    object RoleSelection : Screen("role_selection")
    object DoctorLogin : Screen("doctor_login")
    object DoctorSignup : Screen("doctor_signup")
    object DoctorVerification : Screen("doctor_verification")
    object PatientLogin : Screen("patient_login")
    object PatientSignup : Screen("patient_signup")

    // Doctor Dashboard & Features
    object DoctorDashboard : Screen("doctor_dashboard")
    object DoctorProfile : Screen("doctor_profile")
    object EditDoctorProfile : Screen("edit_doctor_profile")
    object AppointmentList : Screen("appointment_list")
    object AppointmentDetails : Screen("appointment_details/{appointmentId}") {
        fun createRoute(appointmentId: String) = "appointment_details/$appointmentId"
    }
    object PatientQueue : Screen("patient_queue")
    object LeaveRequest : Screen("leave_request")
    object LeaveStatus : Screen("leave_status")
    object CoverageRequestsSent : Screen("coverage_requests_sent")
    object CoverageRequestsReceived : Screen("coverage_requests_received")
    object PatientAccessRequest : Screen("patient_access_request")
    object PermissionApproval : Screen("permission_approval")
    object PrescriptionForm : Screen("prescription_form/{patientId}") {
        fun createRoute(patientId: String) = "prescription_form/$patientId"
    }
    object PrescriptionSuccess : Screen("prescription_success")
    object LiveClinicStatus : Screen("live_clinic_status")
    object SubstituteDoctorView : Screen("substitute_doctor_view")

    // Patient Dashboard & Features
    object PatientHome : Screen("patient_home")
    object SearchDoctors : Screen("search_doctors")
    object DoctorDetails : Screen("doctor_details/{doctorId}") {
        fun createRoute(doctorId: String) = "doctor_details/$doctorId"
    }
    object BookAppointment : Screen("book_appointment/{doctorId}") {
        fun createRoute(doctorId: String) = "book_appointment/$doctorId"
    }
    object AppointmentConfirmation : Screen("appointment_confirmation")
    object TokenScreen : Screen("token_screen/{appointmentId}") {
        fun createRoute(appointmentId: String) = "token_screen/$appointmentId"
    }
    object RecommendedDoctor : Screen("recommended_doctor")
    object NearbyDoctors : Screen("nearby_doctors")
    object MedicineSchedule : Screen("medicine_schedule")
    object ReminderScreen : Screen("reminder_screen")
    object AdherenceReport : Screen("adherence_report")
    object AIChat : Screen("ai_chat")
    object AISuggestions : Screen("ai_suggestions")
    object SubmitReview : Screen("submit_review/{doctorId}") {
        fun createRoute(doctorId: String) = "submit_review/$doctorId"
    }
    object ViewReviews : Screen("view_reviews/{doctorId}") {
        fun createRoute(doctorId: String) = "view_reviews/$doctorId"
    }
    object PatientHistory : Screen("patient_history")
    object HistoryDetails : Screen("history_details/{historyId}") {
        fun createRoute(historyId: String) = "history_details/$historyId"
    }

    object AdminDashboard : Screen("admin_dashboard")

    // Common
    object Notifications : Screen("notifications")
    object Settings : Screen("settings")
}
