package com.example.data.repository

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.core.content.edit
import com.example.data.firebase.FirebaseRepository
import com.example.data.network.CloudinaryRepository
import com.example.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

// --- SESSION MANAGER ---
class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences("medlink_session", Context.MODE_PRIVATE)
    val contentResolver = context.contentResolver

    fun saveSession(userId: String, email: String, role: String) {
        prefs.edit {
            putString("user_id", userId)
            putString("email", email)
            putString("role", role)
            putBoolean("is_logged_in", true)
        }
        _currentUserFlow.value = CurrentUser(userId, email, role, true)
    }

    fun clearSession() {
        prefs.edit { clear() }
        _currentUserFlow.value = CurrentUser("", "", "", false)
    }

    data class CurrentUser(val id: String, val email: String, val role: String, val isLoggedIn: Boolean)

    private val _currentUserFlow = MutableStateFlow(
        CurrentUser(
            id = prefs.getString("user_id", "") ?: "",
            email = prefs.getString("email", "") ?: "",
            role = prefs.getString("role", "") ?: "",
            isLoggedIn = prefs.getBoolean("is_logged_in", false)
        )
    )
    val currentUserFlow: StateFlow<CurrentUser> = _currentUserFlow.asStateFlow()
}

// --- AUTH REPOSITORY ---
class AuthRepository(
    private val firebaseRepository: FirebaseRepository,
    private val cloudinaryRepository: CloudinaryRepository,
    private val sessionManager: SessionManager
) {
    val activeUser = sessionManager.currentUserFlow

    suspend fun signup(
        email: String,
        name: String,
        passwordHash: String,
        role: String,
        phone: String,
        hospitalName: String,
        hospitalId: String?,
        license: String,
        regNumber: String,
        specialty: String,
        department: String,
        experience: Int,
        qualification: String,
        gender: String,
        dob: String,
        address: String,
        city: String,
        state: String,
        country: String,
        pinCode: String,
        avatarUri: Uri?,
        govIdUri: Uri?,
        medicalCertificateUri: Uri?
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d("AuthRepository", "SIGNUP_STEP_1: Initializing Auth")
            // Initial user object without IDs or URLs
            val tempUser = User(
                email = email,
                name = name,
                role = role,
                phoneNumber = phone,
                hospitalName = hospitalName,
                hospitalId = hospitalId,
                licenseNumber = license,
                registrationNumber = regNumber,
                specialty = specialty,
                department = department,
                experience = experience,
                qualification = qualification,
                gender = gender,
                dob = dob,
                hospitalAddress = address,
                city = city,
                state = state,
                country = country,
                pinCode = pinCode,
                verified = false, 
                isVerifiedInternal = false,
                isPractitionerVerified = false,
                approvalStatus = "PENDING"
            )

            val result = firebaseRepository.signup(email, passwordHash, tempUser)
            if (result.isSuccess) {
                val userId = result.getOrThrow()
                Log.d("AuthRepository", "SIGNUP_STEP_2: Auth Success, ID: $userId")
                
                // Upload images non-fatally
                var uploadedAvatarUrl: String? = null
                var uploadedGovIdUrl: String? = null
                var uploadedCertUrl: String? = null
                
                try {
                    uploadedAvatarUrl = avatarUri?.let { 
                        Log.d("AuthRepository", "SIGNUP_STEP_3: Uploading Avatar to Cloudinary")
                        cloudinaryRepository.uploadProfileImage(sessionManager.contentResolver, it) 
                    }
                } catch (t: Throwable) {
                    Log.e("AuthRepository", "Non-fatal avatar upload error", t)
                }

                try {
                    uploadedGovIdUrl = govIdUri?.let { 
                        Log.d("AuthRepository", "SIGNUP_STEP_4: Uploading GovID")
                        firebaseRepository.uploadDocument(sessionManager.contentResolver, userId, it, "gov_id.jpg") 
                    }
                } catch (t: Throwable) {
                    Log.e("AuthRepository", "Non-fatal gov ID upload error", t)
                }

                try {
                    uploadedCertUrl = medicalCertificateUri?.let { 
                        Log.d("AuthRepository", "SIGNUP_STEP_4B: Uploading MedCert")
                        firebaseRepository.uploadDocument(sessionManager.contentResolver, userId, it, "med_cert.jpg") 
                    }
                } catch (t: Throwable) {
                    Log.e("AuthRepository", "Non-fatal med cert upload error", t)
                }

                // Update user with whatever URLs we obtained
                val finalUser = tempUser.copy(
                    id = userId, 
                    avatarUrl = uploadedAvatarUrl ?: tempUser.avatarUrl, 
                    govIdUrl = uploadedGovIdUrl ?: tempUser.govIdUrl,
                    medicalCertificateUrl = uploadedCertUrl ?: tempUser.medicalCertificateUrl
                )
                firebaseRepository.updateUser(finalUser)
                Log.d("AuthRepository", "SIGNUP_STEP_5: Profile Finalized")

                sessionManager.saveSession(userId, email, role)
                firebaseRepository.addNotification(
                    Notification(
                        userId = userId,
                        title = "Welcome to MedLink!",
                        message = "Your clinical account has been created. Access is pending verification.",
                        type = "WELCOME"
                    )
                )
                Result.success(Unit)
            } else {
                Log.e("AuthRepository", "SIGNUP_FAILED: ${result.exceptionOrNull()?.message}")
                Result.failure(result.exceptionOrNull() ?: Exception("Signup failed"))
            }
        } catch (t: Throwable) {
            Log.e("AuthRepository", "SIGNUP_FATAL_ERROR", t)
            Result.failure(t)
        }
    }

    suspend fun login(email: String, passwordHash: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val result = firebaseRepository.login(email, passwordHash)
            if (result.isSuccess) {
                val userId = firebaseRepository.getCurrentUserId() ?: ""
                val userResult = firebaseRepository.getUser(userId)
                val user = userResult.getOrNull()
                if (user != null) {
                    // Standardize role to uppercase for Android compatibility
                    sessionManager.saveSession(user.id, user.email, user.role.uppercase())
                }
            }
            result
        } catch (t: Throwable) {
            Log.e("AuthRepository", "LOGIN_FATAL_ERROR", t)
            Result.failure(t)
        }
    }

    suspend fun changePassword(current: String, new: String): Result<Unit> = withContext(Dispatchers.IO) {
        firebaseRepository.changePassword(current, new)
    }

    suspend fun updateDoctorApprovalStatus(doctorId: String, status: String, reason: String? = null, adminUid: String = ""): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            firebaseRepository.updateApprovalStatus(doctorId, status, reason, adminUid)
            if (status == "APPROVED") {
                firebaseRepository.addNotification(
                    Notification(
                        userId = doctorId,
                        title = "Account Approved!",
                        message = "Your MedLink clinical account has been verified and approved.",
                        type = "APPROVAL"
                    )
                )
            } else if (status == "REJECTED") {
                firebaseRepository.addNotification(
                    Notification(
                        userId = doctorId,
                        title = "Registration Update",
                        message = "Your clinical registration was not approved at this time.",
                        type = "REJECTION"
                    )
                )
            }
            Result.success(Unit)
        } catch (t: Throwable) {
            Log.e("AuthRepository", "UPDATE_APPROVAL_ERROR", t)
            Result.failure(t)
        }
    }

    suspend fun verifyDoctor(doctorId: String, isApproved: Boolean) {
        try {
            firebaseRepository.verifyDoctor(doctorId, isApproved)
            val userResult = firebaseRepository.getUser(doctorId)
            val user = userResult.getOrNull()
            if (user != null) {
                firebaseRepository.updateUser(user.copy(verified = isApproved, isPractitionerVerified = isApproved))
            }
        } catch (t: Throwable) {
            Log.e("AuthRepository", "VERIFY_ERROR", t)
        }
    }

    suspend fun getUserDetails(userId: String, email: String? = null): Result<User?> = firebaseRepository.getUser(userId, email)

    suspend fun updateUserProfile(user: User) {
        try {
            firebaseRepository.updateUser(user)
        } catch (t: Throwable) {
            Log.e("AuthRepository", "UPDATE_PROFILE_ERROR", t)
        }
    }

    suspend fun updateClinicStatus(doctorId: String, status: String) {
        try {
            val userResult = firebaseRepository.getUser(doctorId)
            val user = userResult.getOrNull()
            if (user != null) {
                firebaseRepository.updateUser(user.copy(clinicStatus = status))
            }
        } catch (t: Throwable) {
            Log.e("AuthRepository", "UPDATE_STATUS_ERROR", t)
        }
    }

    suspend fun uploadProfileImage(contentResolver: android.content.ContentResolver, userId: String, uri: Uri): String = 
        cloudinaryRepository.uploadProfileImage(contentResolver, uri)
    suspend fun uploadDocument(contentResolver: android.content.ContentResolver, userId: String, uri: Uri, docName: String): String = 
        firebaseRepository.uploadDocument(contentResolver, userId, uri, docName)

    fun logout() {
        try {
            firebaseRepository.logout()
            sessionManager.clearSession()
        } catch (t: Throwable) {
            Log.e("AuthRepository", "LOGOUT_ERROR", t)
        }
    }

    // --- Admin Data Layer ---
    fun getAdminDoctorsFlow(): Flow<List<User>> = firebaseRepository.getAdminDoctorsFlow()
    fun getAdminDashboardStatsFlow(): Flow<AdminDashboardStats> = firebaseRepository.getAdminDashboardStatsFlow()
    suspend fun logAdminActivity(activity: AdminActivityLog) = firebaseRepository.logAdminActivity(activity)
    fun getAdminActivityLogsFlow(): Flow<List<AdminActivityLog>> = firebaseRepository.getAdminActivityLogsFlow()
    fun getAdminNotificationsFlow(): Flow<List<AdminNotification>> = firebaseRepository.getAdminNotificationsFlow()
}

// --- LEAVE & COVERAGE REPOSITORY ---
class LeaveCoverageRepository(private val firebaseRepository: FirebaseRepository) {
    fun getAllLeaveRequestsFlow(): Flow<List<LeaveRequest>> =
        firebaseRepository.getAllLeaveRequestsFlow()

    fun getAllLeaveRequestsOversightFlow(): Flow<List<LeaveRequest>> =
        firebaseRepository.getAllLeaveRequestsOversightFlow()

    fun getMyLeaveRequestsFlow(doctorIds: List<String>): Flow<List<LeaveRequest>> =
        firebaseRepository.getMyLeaveRequestsFlow(doctorIds)

    fun getCoverageDutiesFlow(doctorIds: List<String>): Flow<List<LeaveRequest>> =
        firebaseRepository.getCoverageDutiesFlow(doctorIds)

    suspend fun submitLeaveRequest(request: LeaveRequest) {
        firebaseRepository.submitLeaveRequest(request)
    }

    suspend fun volunteerForLeave(requestId: String, volunteer: Volunteer) {
        firebaseRepository.volunteerForLeave(requestId, volunteer)
    }

    fun getVolunteersFlow(requestId: String): Flow<List<Volunteer>> =
        firebaseRepository.getVolunteersFlow(requestId)

    suspend fun approveCoverage(requestId: String, volunteer: Volunteer) {
        firebaseRepository.updateLeaveRequestStatus(requestId, "ACCEPTED", volunteer)
    }

    suspend fun startCoverage(requestId: String, currentUserId: String, profileId: String = "") {
        firebaseRepository.startCoverage(requestId, currentUserId, profileId)
    }

    suspend fun updateVolunteerStatus(requestId: String, volunteerId: String, status: String) {
        firebaseRepository.updateVolunteerStatus(requestId, volunteerId, status)
    }

    suspend fun rejectLeaveRequest(requestId: String) {
        firebaseRepository.updateLeaveRequestStatus(requestId, "REJECTED")
    }

    suspend fun completeLeaveRequest(requestId: String, currentUserId: String, profileId: String = "") {
        firebaseRepository.completeCoverage(requestId, currentUserId, profileId)
    }

    suspend fun deleteLeaveRequest(requestId: String) {
        firebaseRepository.deleteLeaveRequest(requestId)
    }

    // --- Feedback ---
    suspend fun submitCoverageFeedback(feedback: CoverageFeedback) = firebaseRepository.submitCoverageFeedback(feedback)
    fun getCoverageFeedbackForDoctor(doctorIds: List<String>) = firebaseRepository.getCoverageFeedbackForDoctor(doctorIds)
    fun getCoverageFeedbackForRequest(requestId: String) = firebaseRepository.getCoverageFeedbackForRequest(requestId)
    suspend fun checkFeedbackExists(requestId: String) = firebaseRepository.checkFeedbackExists(requestId)
    suspend fun updateFeedbackSentiment(feedbackId: String, reviewedDoctorId: String, sentiment: String, confidence: Double, score: Int) = 
        firebaseRepository.updateFeedbackSentiment(feedbackId, reviewedDoctorId, sentiment, confidence, score)
}

// --- COMMUNICATION & NOTICES REPOSITORY ---
class CommunicationRepository(private val firebaseRepository: FirebaseRepository) {
    fun getHospitalNoticesFlow(): Flow<List<HospitalNotice>> = firebaseRepository.getHospitalNoticesFlow()
    fun getInternalMessagesFlow(): Flow<List<InternalMessage>> = firebaseRepository.getInternalMessagesFlow()
    suspend fun sendInternalMessage(message: InternalMessage) = firebaseRepository.sendInternalMessage(message)
    
    fun getNotificationsForUser(userIds: List<String>): Flow<List<Notification>> =
        firebaseRepository.getNotificationsFlow(userIds)

    suspend fun addNotification(notification: Notification) {
        firebaseRepository.addNotification(notification)
    }

    suspend fun markAllAsRead(userIds: List<String>) {
        firebaseRepository.markNotificationsRead(userIds)
    }

    // --- Direct Messaging ---
    suspend fun sendDirectMessage(message: Message) = firebaseRepository.sendDirectMessage(message)
    fun getDirectMessagesFlow(myId: String, otherId: String) = firebaseRepository.getDirectMessagesFlow(myId, otherId)
    fun getChatRoomsFlow(myIds: List<String>) = firebaseRepository.getChatRoomsFlow(myIds)
    suspend fun markMessagesAsRead(myId: String, otherId: String) = firebaseRepository.markMessagesAsRead(myId, otherId)
    fun getUnreadMessageCountFlow(myIds: List<String>) = firebaseRepository.getUnreadMessageCountFlow(myIds)
    fun getUnreadNotificationsCountFlow(myIds: List<String>) = firebaseRepository.getUnreadNotificationsCountFlow(myIds)
}

// --- ANALYTICS REPOSITORY ---
class AnalyticsRepository(private val firebaseRepository: FirebaseRepository) {
    fun getCoverageAnalyticsFlow(doctorId: String): Flow<CoverageAnalytics?> = 
        firebaseRepository.getCoverageAnalyticsFlow(doctorId)
}

// --- HOSPITAL NETWORK REPOSITORY ---
class HospitalRepository(private val firebaseRepository: FirebaseRepository) {
    fun getHospitalsFlow(): Flow<List<Hospital>> = firebaseRepository.getHospitalsFlow()
}

// --- APPOINTMENT REPOSITORY ---
class AppointmentRepository(private val firebaseRepository: FirebaseRepository) {
    fun getAppointmentsFlow(doctorIds: List<String>): Flow<List<Appointment>> = 
        firebaseRepository.getAppointmentsFlow(doctorIds)
}
