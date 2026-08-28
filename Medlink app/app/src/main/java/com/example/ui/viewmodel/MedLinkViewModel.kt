package com.example.ui.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.firebase.FirebaseRepository
import com.example.data.network.CloudinaryRepository
import com.example.data.network.SmartAssistantEngine
import com.example.data.model.*
import com.example.data.repository.*
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout

enum class ProfileLoadState {
    IDLE,
    LOADING,
    SUCCESS,
    PROFILE_NOT_FOUND,
    ERROR,
    UNAUTHORIZED
}

@OptIn(ExperimentalCoroutinesApi::class)
class MedLinkViewModel(application: Application) : AndroidViewModel(application) {

    private val firebaseRepository by lazy { FirebaseRepository() }
    private val cloudinaryRepository by lazy { CloudinaryRepository() }
    private val sessionManager by lazy { SessionManager(application) }
    
    // Repositories
    val authRepository by lazy { AuthRepository(firebaseRepository, cloudinaryRepository, sessionManager) }
    val leaveCoverageRepository by lazy { LeaveCoverageRepository(firebaseRepository) }
    val communicationRepository by lazy { CommunicationRepository(firebaseRepository) }
    val analyticsRepository by lazy { AnalyticsRepository(firebaseRepository) }
    val hospitalRepository by lazy { HospitalRepository(firebaseRepository) }
    val appointmentRepository by lazy { AppointmentRepository(firebaseRepository) }

    // Smart Assistant Engine
    private val smartAssistantEngine = SmartAssistantEngine()

    // Gemini Sentiment Engine
    private val geminiSentimentEngine = com.example.data.network.GeminiSentimentEngine()



    // ----------------------------------------------------
    // AUTHENTICATION & PROFILE DATA STATE
    // ----------------------------------------------------
    val currentUser by lazy { authRepository.activeUser }
    
    private val _userDetails = MutableStateFlow<User?>(null)
    val userDetails: StateFlow<User?> = _userDetails.asStateFlow()

    private val _profileState = MutableStateFlow(ProfileLoadState.IDLE)
    val profileState: StateFlow<ProfileLoadState> = _profileState.asStateFlow()

    private val _profileErrorMessage = MutableStateFlow<String?>(null)
    val profileErrorMessage: StateFlow<String?> = _profileErrorMessage.asStateFlow()

    private val _doctorsList = MutableStateFlow<List<User>>(emptyList())
    val doctorsList: StateFlow<List<User>> = _doctorsList.asStateFlow()

    private val _pendingDoctors = MutableStateFlow<List<User>>(emptyList())
    val pendingDoctors: StateFlow<List<User>> = _pendingDoctors.asStateFlow()

    private val _adminActivityLogs = MutableStateFlow<List<AdminActivityLog>>(emptyList())
    val adminActivityLogs: StateFlow<List<AdminActivityLog>> = _adminActivityLogs.asStateFlow()

    private val _adminNotifications = MutableStateFlow<List<AdminNotification>>(emptyList())
    val adminNotifications: StateFlow<List<AdminNotification>> = _adminNotifications.asStateFlow()

    private val _adminStats = MutableStateFlow(AdminDashboardStats())
    val adminStats: StateFlow<AdminDashboardStats> = _adminStats.asStateFlow()


    private val _authError = MutableStateFlow<String?>(null)
    val authError: StateFlow<String?> = _authError.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _adminActionLoading = MutableStateFlow<String?>(null) // Doctor ID currently being processed
    val adminActionLoading: StateFlow<String?> = _adminActionLoading.asStateFlow()

    private val _complianceError = MutableStateFlow<String?>(null)
    val complianceError: StateFlow<String?> = _complianceError.asStateFlow()

    private val _complianceSuccess = MutableStateFlow<String?>(null)
    val complianceSuccess: StateFlow<String?> = _complianceSuccess.asStateFlow()

    init {

        viewModelScope.launch {
            try {
                currentUser.collect { user ->
                    try {
                        if (user.isLoggedIn && user.id.isNotEmpty()) {
                            fetchFullProfile(user.id, user.email, user.role)
                        } else {
                            _userDetails.value = null
                            _profileState.value = ProfileLoadState.IDLE
                            _userNotifications.value = emptyList()
                            _unreadMessageCount.value = 0
                            _unreadNotificationCount.value = 0
                        }
                    } catch (t: Throwable) {
                        Log.e("MedLinkViewModel", "Error in user session collect", t)
                    }
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Fatal error in ViewModel Init", t)
            }
        }
        
        // Admin & Doctor specific flows are now initialized within loadAdminData() 
        // or segmented by role in the currentUser observer above.
    }

    private fun fetchFullProfile(uid: String, sessionEmail: String, sessionRole: String) {
        viewModelScope.launch {
            Log.d("ADMIN_PROFILE_READ_START", "UID: $uid")
            if (_userDetails.value?.id != uid || _profileState.value != ProfileLoadState.SUCCESS) {
                _profileState.value = ProfileLoadState.LOADING
            }
            _profileErrorMessage.value = null
            Log.d("ADMIN_LOGIN_DEBUG", "fetchFullProfile STARTED for $uid")

            try {
                // 15-second timeout for clinical verification
                withTimeout(15000) {
                    val result = authRepository.getUserDetails(uid, sessionEmail)
                    if (result.isSuccess) {
                        val details = result.getOrNull()
                        if (details != null) {
                            Log.d("ADMIN_PROFILE_READ_RESULT", "Document Exists: TRUE\nRole: ${details.role}\nApproval: ${details.approvalStatus}")
                            _userDetails.value = details
                            _profileState.value = ProfileLoadState.SUCCESS
                            
                            // SYNC Logic
                            if (details.role.trim().uppercase() != sessionRole.trim().uppercase()) {
                                Log.d("ADMIN_LOGIN_DEBUG", "Syncing session role: $sessionRole -> ${details.role}")
                                sessionManager.saveSession(details.id, details.email, details.role.trim().uppercase())
                            }

                            // ADMIN REPAIR: one-time check for admin@gmail.com
                            if (details.email.trim().lowercase() == "admin@gmail.com" && details.role.trim().uppercase() != "ADMIN") {
                                Log.d("ADMIN_LOGIN_DEBUG", "Repairing Admin Role for $uid")
                                val repaired = details.copy(role = "ADMIN", approvalStatus = "APPROVED")
                                authRepository.updateUserProfile(repaired)
                                _userDetails.value = repaired
                            }

                            val resolvedRole = details.role.trim().uppercase()
                            Log.d("ADMIN_LOGIN_DEBUG", "Resolved Role: $resolvedRole | Destination: ${if(resolvedRole=="ADMIN") "Console" else "Dashboard"}")
                            
                            if (resolvedRole == "ADMIN") {
                                loadAdminData()
                            } else {
                                val identityIds = listOf(uid, details.id, details.email).filter { it.isNotBlank() }.distinct()
                                
                                loadUserNotifications(identityIds)
                                loadHospitalNotices()
                                loadInternalMessages()
                                loadCoverageAnalytics(identityIds)
                                loadChatRooms(identityIds)
                                loadAppointments(identityIds)
                                loadAllLeaveRequests()
                                loadMyLeaveRequests(identityIds)
                                loadMyCoverageDuties(identityIds)
                            }
                            
                            if (resolvedRole == "ADMIN" || resolvedRole == "DOCTOR") {
                                loadClinicianDirectory()
                            }
                        } else {
                            Log.d("ADMIN_PROFILE_READ_RESULT", "Document Exists: FALSE")
                            Log.e("ADMIN_LOGIN_DEBUG", "PROFILE_NOT_FOUND in Firestore for UID: $uid")
                            _profileState.value = ProfileLoadState.PROFILE_NOT_FOUND
                        }
                    } else {
                        val error = result.exceptionOrNull()
                        Log.e("ADMIN_LOGIN_DEBUG", "Firestore lookup FAILED", error)
                        _profileErrorMessage.value = error?.message ?: "Unknown Firestore Error"
                        _profileState.value = if (error?.message?.contains("permission", true) == true) {
                            ProfileLoadState.UNAUTHORIZED
                        } else {
                            ProfileLoadState.ERROR
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("ADMIN_LOGIN_DEBUG", "Profile fetch TIMEOUT or FATAL", e)
                _profileState.value = ProfileLoadState.ERROR
                _profileErrorMessage.value = "Verification timed out. Please check your connection."
            }
        }
    }

    private fun loadAdminData() {
        Log.d("ADMIN_DATA_DEBUG", "Initializing Admin Oversight Data Flows...")
        
        // Load Real-time Dashboard Stats
        viewModelScope.launch {
            try {
                authRepository.getAdminDashboardStatsFlow().collect { _adminStats.value = it }
            } catch (t: Throwable) {
                Log.e("ADMIN_DATA_DEBUG", "Error loading stats", t)
            }
        }

        // Load Leave Requests (Oversight View)
        loadAllLeaveRequests()
        
        // Load Activity Logs
        viewModelScope.launch {
            try {
                authRepository.getAdminActivityLogsFlow().collect { _adminActivityLogs.value = it }
            } catch (t: Throwable) {
                Log.e("ADMIN_DATA_DEBUG", "Error loading admin activity logs", t)
            }
        }
        
        // Load Admin Notifications
        viewModelScope.launch {
            try {
                authRepository.getAdminNotificationsFlow().collect { _adminNotifications.value = it }
            } catch (t: Throwable) {
                Log.e("ADMIN_DATA_DEBUG", "Error loading admin notifications", t)
            }
        }
    }

    private var clinicianDirectoryJob: kotlinx.coroutines.Job? = null

    private fun loadClinicianDirectory() {
        if (clinicianDirectoryJob?.isActive == true) return
        clinicianDirectoryJob = viewModelScope.launch {
            _profileState.value = ProfileLoadState.LOADING
            try {
                authRepository.getAdminDoctorsFlow().collect { doctors ->
                    Log.d("CLINICIAN_DIR", "Doctors list received. Count: ${doctors.size}")
                    _doctorsList.value = doctors
                    _pendingDoctors.value = doctors.filter { it.approvalStatus == "PENDING" }
                    
                    if (_profileState.value == ProfileLoadState.LOADING) {
                        _profileState.value = ProfileLoadState.SUCCESS
                    }
                }
            } catch (t: Throwable) {
                Log.e("CLINICIAN_DIR", "Error collecting admin doctors flow", t)
                _profileErrorMessage.value = "Failed to load clinical directory: ${t.message}"
            }
        }
    }

    fun login(email: String, pass: String, selectedRole: String? = null, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _loading.value = true
            _authError.value = null
            Log.d("ADMIN_LOGIN_DEBUG", "---------------------------------------")
            Log.d("ADMIN_LOGIN_DEBUG", "Login Attempt Email: $email")
            Log.d("ADMIN_LOGIN_DEBUG", "Selected Account Type: ${selectedRole?.uppercase()}")
            try {
                val res = authRepository.login(email, pass)
                if (res.isSuccess) {
                    val uid = firebaseRepository.getCurrentUserId() ?: ""
                    Log.d("ADMIN_LOGIN_DEBUG", "Firebase Auth: SUCCESS")
                    Log.d("ADMIN_LOGIN_DEBUG", "Firebase Auth UID: $uid")
                    
                    val detailsResult = authRepository.getUserDetails(uid, email)
                    if (detailsResult.isFailure) {
                        val err = detailsResult.exceptionOrNull()
                        Log.e("ADMIN_LOGIN_DEBUG", "Firestore lookup FAILED", err)
                        val errMessage = err?.message ?: ""
                        _authError.value = when {
                            errMessage.contains("permission", true) -> "Unable to access your clinical profile. Please contact support."
                            errMessage.contains("network", true) || errMessage.contains("unavailable", true) -> "Unable to connect. Please try again."
                            else -> "Clinical verification failed: ${errMessage.ifEmpty { "Unknown Firestore Error" }}"
                        }
                        logout()
                        _loading.value = false
                        return@launch
                    }

                    val details = detailsResult.getOrNull()
                    if (details == null) {
                        Log.e("ADMIN_LOGIN_DEBUG", "Document exists: FALSE for users/$uid")
                        _authError.value = "Clinical profile not found."
                        logout()
                        _loading.value = false
                        return@launch
                    }

                    val normalizedRole = details.role.trim().uppercase()
                    Log.d("ADMIN_LOGIN_DEBUG", "Firestore path: users/$uid")
                    Log.d("ADMIN_LOGIN_DEBUG", "Document exists: TRUE")
                    Log.d("ADMIN_LOGIN_DEBUG", "Raw role: ${details.role}")
                    Log.d("ADMIN_LOGIN_DEBUG", "Normalized role: $normalizedRole")
                    Log.d("ADMIN_LOGIN_DEBUG", "approvalStatus: ${details.approvalStatus}")

                    // Check Admin repair for admin@gmail.com if role is not ADMIN
                    if (email.trim().lowercase() == "admin@gmail.com" && normalizedRole != "ADMIN") {
                        Log.d("ADMIN_LOGIN_DEBUG", "Repairing Admin Role for $uid")
                        authRepository.updateUserProfile(details.copy(role = "ADMIN", approvalStatus = "APPROVED"))
                    }

                    val effectiveRole = if (email.trim().lowercase() == "admin@gmail.com") "ADMIN" else normalizedRole
                    val roleMatch = (selectedRole == null) || (effectiveRole == selectedRole.uppercase())

                    Log.d("ADMIN_LOGIN_DEBUG", "Resolved role: $effectiveRole")
                    Log.d("ADMIN_LOGIN_DEBUG", "Role match: $roleMatch")
                    
                    Log.d("ADMIN_LOGIN_DEBUG", "Auth Success: TRUE\nAuth UID: $uid\nFirestore Role: $effectiveRole\nApproval Status: ${details.approvalStatus}")

                    if (!roleMatch) {
                        Log.w("ADMIN_LOGIN_DEBUG", "Role Mismatch! Selected: $selectedRole | Firestore: $effectiveRole")
                        val errorMessage = if (effectiveRole == "ADMIN") {
                            "This account is registered as an Admin. Please select Admin to continue."
                        } else {
                            "This account is registered as a Doctor. Please select Doctor to continue."
                        }
                        _authError.value = errorMessage
                        logout()
                        _loading.value = false
                        return@launch
                    }
                    
                    // Fix Race Condition: Set the userDetails and profileState to SUCCESS synchronously
                    // BEFORE triggering the isLoggedIn state update in MainActivity.
                    val repairedDetails = if (email.trim().lowercase() == "admin@gmail.com") {
                        details.copy(role = "ADMIN", approvalStatus = "APPROVED")
                    } else {
                        details
                    }
                    _userDetails.value = repairedDetails
                    _profileState.value = ProfileLoadState.SUCCESS

                    // SAVE SESSION TO TRIGGER STATEFLOW OBSERVER IN MAINACTIVITY
                    sessionManager.saveSession(uid, email, effectiveRole)
                    
                    Log.d("ADMIN_SESSION_DEBUG", "Saved Role: $effectiveRole\nisLoggedIn: TRUE")

                    // Collect current state to verify
                    viewModelScope.launch {
                        sessionManager.currentUserFlow.first().let { userState ->
                            Log.d("ADMIN_SESSION_STATE", "isLoggedIn: ${userState.isLoggedIn}\nRole: ${userState.role}\nUID: ${userState.id}\nEmail: ${userState.email}")
                        }
                    }
                    
                    val dest = if (effectiveRole == "ADMIN") "ADMIN_DASHBOARD" else "DOCTOR_DASHBOARD"
                    Log.d("ADMIN_NAVIGATION_DEBUG", "Resolved Role: $effectiveRole\nDestination: $dest")
                    
                    Log.d("ADMIN_LOGIN_DEBUG", "Selected destination: $dest")
                    Log.d("ADMIN_LOGIN_DEBUG", "---------------------------------------")
                    onSuccess()
                } else {
                    val authErr = res.exceptionOrNull()?.message
                    Log.e("ADMIN_LOGIN_DEBUG", "Firebase Auth: FAILED - $authErr")
                    _authError.value = authErr ?: "Authentication failed. Please check credentials."
                }
            } catch (t: Throwable) {
                Log.e("ADMIN_LOGIN_DEBUG", "Login exception", t)
                _authError.value = "Internal Error: ${t.message}"
            }
            _loading.value = false
        }
    }

    fun changePassword(current: String, new: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _loading.value = true
            _authError.value = null
            try {
                val res = authRepository.changePassword(current, new)
                if (res.isSuccess) {
                    onSuccess()
                } else {
                    val err = res.exceptionOrNull()?.message ?: "Failed to update password"
                    _authError.value = when {
                        err.contains("recent-login", true) -> "Security timeout. Please sign out and sign in again to change your password."
                        err.contains("invalid-credential", true) || err.contains("wrong-password", true) -> "Current password is incorrect."
                        else -> err
                    }
                }
            } catch (t: Throwable) {
                _authError.value = t.message
            } finally {
                _loading.value = false
            }
        }
    }

    fun logout() {
        authRepository.logout()
        // STRICT SECURITY: Clear profile & state completely on logout to prevent UI bleeding
        _userDetails.value = null
        _profileState.value = ProfileLoadState.IDLE
        _profileErrorMessage.value = null
        _authError.value = null
    }

    fun markNoticeAsRead(noticeId: String) {
        val user = _userDetails.value ?: return
        if (!user.readNoticeIds.contains(noticeId)) {
            val updatedIds = user.readNoticeIds + noticeId
            updateUserProfile(user.copy(readNoticeIds = updatedIds))
        }
    }

    fun clearAuthErrors() {
        _authError.value = null
        _complianceError.value = null
        _complianceSuccess.value = null
        _feedbackError.value = null
    }

    fun signupDoctor(
        email: String, name: String, pass: String, phone: String,
        hospitalName: String, hospitalId: String?, license: String,
        regNumber: String, specialization: String, department: String,
        experience: Int, qualification: String, gender: String,
        dob: String, address: String, city: String, state: String,
        country: String, pinCode: String, avatarUri: android.net.Uri?,
        govIdUri: android.net.Uri?, medicalCertificateUri: android.net.Uri?, onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _loading.value = true
            _authError.value = null
            try {
                val res = authRepository.signup(
                    email, name, pass, "DOCTOR", phone, hospitalName,
                    hospitalId, license, regNumber, specialization, department,
                    experience, qualification, gender, dob, address, city,
                    state, country, pinCode, avatarUri, govIdUri, medicalCertificateUri
                )
                if (res.isSuccess) onSuccess() else _authError.value = res.exceptionOrNull()?.message
            } catch (t: Throwable) {
                _authError.value = "Signup Error: ${t.message}"
            }
            _loading.value = false
        }
    }

    fun reviewDoctorLicense(doctorId: String, doctorName: String, isApproved: Boolean, reason: String? = null) {
        viewModelScope.launch {
            _adminActionLoading.value = doctorId
            _complianceError.value = null
            _complianceSuccess.value = null
            val adminUid = currentUser.value.id
            val adminName = _userDetails.value?.name ?: "System Administrator"
            try {
                val status = if (isApproved) "APPROVED" else "REJECTED"
                val res = authRepository.updateDoctorApprovalStatus(doctorId, status, reason, adminUid)
                if (res.isSuccess) {
                    _complianceSuccess.value = "Doctor ${if (isApproved) "approved" else "rejected"} successfully."
                    authRepository.logAdminActivity(
                        AdminActivityLog(
                            action = if (isApproved) "DOCTOR_APPROVED" else "DOCTOR_REJECTED",
                            adminUid = adminUid,
                            adminName = adminName,
                            doctorUid = doctorId,
                            doctorName = doctorName,
                            reason = reason
                        )
                    )
                } else {
                    _complianceError.value = "Unable to update doctor approval status. Please try again."
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error reviewing license", t)
                _complianceError.value = t.message
            } finally {
                _adminActionLoading.value = null
            }
        }
    }

    fun logDoctorProfileAudit(doctor: User) {
        viewModelScope.launch {
            val adminUid = currentUser.value.id
            val adminName = _userDetails.value?.name ?: "System Administrator"
            try {
                authRepository.logAdminActivity(
                    AdminActivityLog(
                        action = "DOCTOR_PROFILE_REVIEWED",
                        adminUid = adminUid,
                        adminName = adminName,
                        doctorUid = doctor.id,
                        doctorName = doctor.name
                    )
                )
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error logging audit", t)
            }
        }
    }

    fun updateUserProfile(user: User) {
        viewModelScope.launch {
            try {
                authRepository.updateUserProfile(user)
                _userDetails.value = user
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error updating profile", t)
            }
        }
    }

    fun updateProfilePhoto(uri: android.net.Uri) {
        val userId = currentUser.value.id
        if (userId.isNotEmpty()) {
            viewModelScope.launch {
                try {
                    _loading.value = true
                    val url = authRepository.uploadProfileImage(getApplication<Application>().contentResolver, userId, uri)
                    val currentUserDetails = _userDetails.value
                    if (currentUserDetails != null) {
                        val separator = if (url.contains("?")) "&" else "?"
                        val freshUrl = "$url${separator}t=${System.currentTimeMillis()}"
                        val updated = currentUserDetails.copy(avatarUrl = freshUrl)
                        authRepository.updateUserProfile(updated)
                        _userDetails.value = updated
                    }
                } catch (t: Throwable) {
                    Log.e("MedLink", "Failed to update profile photo", t)
                    _authError.value = "Photo Update Failed: ${t.message}"
                } finally {
                    _loading.value = false
                }
            }
        }
    }

    fun updateClinicStatus(status: String) {
        viewModelScope.launch {
            try {
                val userId = currentUser.value.id
                if (userId.isNotEmpty()) {
                    authRepository.updateClinicStatus(userId, status)
                    _userDetails.value = _userDetails.value?.copy(clinicStatus = status)
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error updating clinic status", t)
            }
        }
    }

    // ----------------------------------------------------
    // LEAVE & COVERAGE MANAGEMENT
    // ----------------------------------------------------
    private val _allLeaveRequests = MutableStateFlow<List<LeaveRequest>>(emptyList())
    val allLeaveRequests: StateFlow<List<LeaveRequest>> = _allLeaveRequests.asStateFlow()

    private val _allSystemLeaveRequests = MutableStateFlow<List<LeaveRequest>>(emptyList())
    val allSystemLeaveRequests: StateFlow<List<LeaveRequest>> = _allSystemLeaveRequests.asStateFlow()

    private val _myLeaveRequests = MutableStateFlow<List<LeaveRequest>>(emptyList())
    val myLeaveRequests: StateFlow<List<LeaveRequest>> = _myLeaveRequests.asStateFlow()

    private val _myCoverageDuties = MutableStateFlow<List<LeaveRequest>>(emptyList())
    val myCoverageDuties: StateFlow<List<LeaveRequest>> = _myCoverageDuties.asStateFlow()

    private val _volunteeringStatus = MutableStateFlow<Map<String, Boolean>>(emptyMap())
    val volunteeringStatus: StateFlow<Map<String, Boolean>> = _volunteeringStatus.asStateFlow()

    private val _volunteeringLoading = MutableStateFlow<Map<String, Boolean>>(emptyMap())
    val volunteeringLoading: StateFlow<Map<String, Boolean>> = _volunteeringLoading.asStateFlow()

    fun toggleClinicStatus() {
        val current = _userDetails.value ?: return
        val newStatus = if (current.clinicStatus == "Available") "Offline" else "Available"
        updateClinicStatus(newStatus)
    }

    fun loadAllLeaveRequests() {
        viewModelScope.launch {
            try {
                leaveCoverageRepository.getAllLeaveRequestsFlow().collect { requests ->
                    Log.d("MedLinkViewModel", "DIAGNOSTIC (loadAllLeaveRequests): viewModelCount=${requests.size}")
                    _allLeaveRequests.value = requests
                    val currentUserId = currentUser.value.id
                    if (currentUserId.isNotEmpty()) {
                        requests.forEach { req ->
                            viewModelScope.launch {
                                try {
                                    leaveCoverageRepository.getVolunteersFlow(req.id).collect { volunteers ->
                                        if (volunteers.any { it.doctorId == currentUserId }) {
                                            _volunteeringStatus.value = _volunteeringStatus.value + (req.id to true)
                                        }
                                    }
                                } catch (t: Throwable) { /* Log error */ }
                            }
                        }
                    }
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading leave requests", t)
            }
        }

        viewModelScope.launch {
            try {
                leaveCoverageRepository.getAllLeaveRequestsOversightFlow().collect {
                    _allSystemLeaveRequests.value = it
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading oversight requests", t)
            }
        }
    }

    private var myLeaveRequestsJob: Job? = null
    private var myLeaveRequestsDoctorIds: List<String> = emptyList()
    
    fun loadMyLeaveRequests(doctorIds: List<String>) {
        if (doctorIds.isEmpty()) return
        
        // IDEMPOTENCY CHECK: Don't restart the listener if it's already active for these doctors
        if (doctorIds == myLeaveRequestsDoctorIds && myLeaveRequestsJob?.isActive == true) {
            Log.d("LEAVE_LISTENER_DEBUG", "Skipping redundant listener start for: $doctorIds")
            return
        }

        Log.d("LEAVE_LISTENER_DEBUG", "Listener started: $doctorIds | Existing state count: ${_myLeaveRequests.value.size}")
        
        myLeaveRequestsJob?.cancel()
        myLeaveRequestsDoctorIds = doctorIds
        
        myLeaveRequestsJob = viewModelScope.launch {
            try {
                leaveCoverageRepository.getMyLeaveRequestsFlow(doctorIds).collect { list ->
                    Log.d("LEAVE_LISTENER_DEBUG", "Snapshot received: count=${list.size} | Doctors: $doctorIds")
                    _myLeaveRequests.value = list
                    Log.d("LEAVE_LISTENER_DEBUG", "Final StateFlow count: ${_myLeaveRequests.value.size}")
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading my leave requests", t)
                myLeaveRequestsDoctorIds = emptyList()
            }
        }
    }

    private var myCoverageDutiesJob: Job? = null
    private var myCoverageDutiesDoctorIds: List<String> = emptyList()

    fun loadMyCoverageDuties(doctorIds: List<String>) {
        if (doctorIds.isEmpty()) return
        
        // IDEMPOTENCY CHECK
        if (doctorIds == myCoverageDutiesDoctorIds && myCoverageDutiesJob?.isActive == true) {
            Log.d("MedLinkViewModel", "Skipping redundant duty listener start for: $doctorIds")
            return
        }

        Log.d("MedLinkViewModel", "Starting My Coverage Duties listener for: $doctorIds")
        myCoverageDutiesJob?.cancel()
        myCoverageDutiesDoctorIds = doctorIds
        
        myCoverageDutiesJob = viewModelScope.launch {
            try {
                leaveCoverageRepository.getCoverageDutiesFlow(doctorIds).collect {
                    Log.d("MedLinkViewModel", "Duties snapshot received: count=${it.size}")
                    _myCoverageDuties.value = it
                }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading coverage duties", t)
                myCoverageDutiesDoctorIds = emptyList()
            }
        }
    }

    fun submitLeaveRequest(request: LeaveRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                leaveCoverageRepository.submitLeaveRequest(request)
                communicationRepository.addNotification(
                    Notification(
                        userId = "ALL_DOCTORS",
                        title = "New Coverage Opportunity",
                        message = "Dr. ${request.doctorName} requested coverage for ${request.leaveDuration}.",
                        type = "LEAVE_REQUEST"
                    )
                )
                onSuccess()
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error submitting leave", t)
            }
        }
    }

    fun volunteerForLeave(requestId: String, volunteer: Volunteer) {
        val authId = currentUser.value.id
        val finalVolunteer = if (volunteer.doctorId.isEmpty() || volunteer.doctorId != authId) {
            if (authId.isEmpty()) {
                _authError.value = "Error: Authentication session expired. Please sign in again."
                return
            }
            volunteer.copy(doctorId = authId)
        } else {
            volunteer
        }
        
        viewModelScope.launch {
            try {
                _volunteeringLoading.value = _volunteeringLoading.value + (requestId to true)
                leaveCoverageRepository.volunteerForLeave(requestId, finalVolunteer)
                val request = _allLeaveRequests.value.find { it.id == requestId } ?: _myLeaveRequests.value.find { it.id == requestId }
                if (request != null) {
                    communicationRepository.addNotification(
                        Notification(
                            userId = request.doctorId,
                            title = "New Volunteer Offer",
                            message = "Dr. ${finalVolunteer.name} has volunteered to cover your leave.",
                            type = "VOLUNTEER"
                        )
                    )
                }
                _volunteeringStatus.value = _volunteeringStatus.value + (requestId to true)
            } catch (t: Throwable) {
                Log.e("MedLink", "Error volunteering for $requestId", t)
                _authError.value = "DB_ERROR_V3: ${t.message}"
            } finally {
                _volunteeringLoading.value = _volunteeringLoading.value - requestId
            }
        }
    }

    fun completeCoverage(requestId: String, requestingDoctorId: String) {
        viewModelScope.launch {
            val duty = _myCoverageDuties.value.find { it.id == requestId }
            val currentUserId = currentUser.value.id
            val profileId = _userDetails.value?.id ?: ""
            
            val isAssignedToMe = duty != null && 
                (duty.approvedDoctorId == currentUserId || (profileId.isNotEmpty() && duty.approvedDoctorId == profileId))

            if (duty != null && duty.status == "IN_PROGRESS" && isAssignedToMe) {
                try {
                    val dateStr = java.text.SimpleDateFormat("dd MMM", java.util.Locale.getDefault()).format(java.util.Date(duty.leaveStartDateLong))
                    leaveCoverageRepository.completeLeaveRequest(requestId, currentUserId, profileId)
                    communicationRepository.addNotification(
                        Notification(
                            userId = requestingDoctorId,
                            title = "Coverage Completed",
                            message = "Dr. ${duty.approvedDoctorName} has completed your coverage session for $dateStr. Please provide feedback on their performance.",
                            type = "DUTY_COMPLETED"
                        )
                    )
                } catch (t: Throwable) {
                    Log.e("MedLinkViewModel", "Error completing coverage", t)
                }
            }
        }
    }

    // --- Feedback Logic ---
    private val _feedbackLoading = MutableStateFlow(false)
    val feedbackLoading: StateFlow<Boolean> = _feedbackLoading.asStateFlow()

    private val _feedbackError = MutableStateFlow<String?>(null)
    val feedbackError: StateFlow<String?> = _feedbackError.asStateFlow()

    private val _feedbackSuccess = MutableStateFlow<Boolean>(false)
    val feedbackSuccess: StateFlow<Boolean> = _feedbackSuccess.asStateFlow()

    fun submitCoverageFeedback(
        requestId: String,
        reviewedDoctorId: String,
        rating: Int,
        feedbackText: String,
        onSuccess: () -> Unit
    ) {
        val requesterId = currentUser.value.id
        if (requesterId == reviewedDoctorId) {
            _feedbackError.value = "You cannot rate your own coverage."
            return
        }

        viewModelScope.launch {
            _feedbackLoading.value = true
            _feedbackError.value = null
            _feedbackSuccess.value = false
            try {
                // Verify eligibility using requestId robust query
                val alreadyExists = leaveCoverageRepository.checkFeedbackExists(requestId)
                if (alreadyExists) {
                    _feedbackError.value = "Feedback for this coverage has already been submitted."
                    _feedbackLoading.value = false
                    return@launch
                }

                // STEP 1: Save the feedback without sentiment first
                val feedbackId = "feedback_$requestId"
                val feedback = CoverageFeedback(
                    requestId = requestId,
                    reviewerId = requesterId,
                    reviewedDoctorId = reviewedDoctorId,
                    rating = rating,
                    reviewText = feedbackText,
                    sentiment = null,
                    sentimentScore = null
                )
                leaveCoverageRepository.submitCoverageFeedback(feedback)

                // STEP 2: Gemini Analysis & Update
                try {
                    if (feedbackText.isNotBlank()) {
                        Log.d("SENTIMENT_REQUEST", "START: Gemini analysis for length=${feedbackText.length}")
                        val result = geminiSentimentEngine.analyze(feedbackText)
                        
                        if (result != null) {
                            Log.d("SENTIMENT_REQUEST", "SUCCESS: sentiment=${result.sentiment}, score=${result.score}")
                            leaveCoverageRepository.updateFeedbackSentiment(
                                feedbackId = feedbackId,
                                reviewedDoctorId = reviewedDoctorId,
                                sentiment = result.sentiment,
                                confidence = 1.0,
                                score = result.score
                            )
                        }
                    }
                } catch (e: Exception) {
                    Log.e("SENTIMENT_REQUEST", "GEMINI_ERROR: ${e.message}", e)
                }
                
                _feedbackSuccess.value = true
                onSuccess()
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "FIRESTORE_ERROR: Failed to submit feedback", t)
                _feedbackError.value = "Review submission failed: ${t.localizedMessage ?: "Unknown error"}"
            } finally {
                _feedbackLoading.value = false
            }
        }
    }

    fun getDoctorFeedbackFlow(doctorIds: List<String>): Flow<List<CoverageFeedback>> = 
        leaveCoverageRepository.getCoverageFeedbackForDoctor(doctorIds).onEach { list ->
            Log.d("SENTIMENT_TRACE_3_VM", "RECEIVED: count=${list.size}")
            list.forEach { fb ->
                Log.d("SENTIMENT_TRACE_4_VM_ITEM", "docId=${fb.id}, sentiment=${fb.sentiment}, textLen=${fb.reviewText.length}")
            }
            
            // DIAGNOSTIC LOGGING
            val withSentiment = list.filter { !it.sentiment.isNullOrBlank() }
            val unanalyzed = list.filter { it.sentiment.isNullOrBlank() && it.reviewText.isNotBlank() }
            
            val posCount = withSentiment.count { it.sentiment?.trim()?.uppercase() == "POSITIVE" }
            val neuCount = withSentiment.count { it.sentiment?.trim()?.uppercase() == "NEUTRAL" }
            val negCount = withSentiment.count { it.sentiment?.trim()?.uppercase() == "NEGATIVE" }
            
            Log.d("AI_SENTIMENT_DEBUG", "--- AI SENTIMENT DEBUG ---")
            Log.d("AI_SENTIMENT_DEBUG", "Doctor IDs: $doctorIds")
            Log.d("AI_SENTIMENT_DEBUG", "Total records: ${list.size}")
            Log.d("AI_SENTIMENT_DEBUG", "Analyzed: ${withSentiment.size} (POS: $posCount, NEU: $neuCount, NEG: $negCount)")
            Log.d("AI_SENTIMENT_DEBUG", "Missing sentiment: ${unanalyzed.size}")
            
            if (withSentiment.isNotEmpty()) {
                val score = ((posCount * 100.0) + (neuCount * 50.0)) / withSentiment.size
                Log.d("AI_SENTIMENT_DEBUG", "Calculated Score: $score")
            }
            Log.d("AI_SENTIMENT_DEBUG", "--------------------------")
        }

    fun getCoverageFeedbackForRequest(requestId: String): Flow<List<CoverageFeedback>> =
        leaveCoverageRepository.getCoverageFeedbackForRequest(requestId)

    fun getVolunteersForRequest(requestId: String): Flow<List<Volunteer>> = 
        leaveCoverageRepository.getVolunteersFlow(requestId)

    fun approveCoverage(requestId: String, volunteer: Volunteer) {
        viewModelScope.launch {
            try {
                leaveCoverageRepository.updateVolunteerStatus(requestId, volunteer.doctorId, "ACCEPTED")
                leaveCoverageRepository.approveCoverage(requestId, volunteer)
                
                communicationRepository.addNotification(
                    Notification(
                        userId = volunteer.doctorId,
                        title = "Coverage Approved",
                        message = "Your offer to cover a colleague has been approved.",
                        type = "COVERAGE_APPROVED"
                    )
                )
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error approving coverage", t)
            }
        }
    }

    fun rejectVolunteer(requestId: String, volunteer: Volunteer) {
        viewModelScope.launch {
            try {
                leaveCoverageRepository.updateVolunteerStatus(requestId, volunteer.doctorId, "REJECTED")
                communicationRepository.addNotification(
                    Notification(
                        userId = volunteer.doctorId,
                        title = "Volunteer Offer Declined",
                        message = "Your offer to cover a colleague was not accepted at this time.",
                        type = "VOLUNTEER_REJECTED"
                    )
                )
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error rejecting volunteer", t)
            }
        }
    }

    fun startCoverage(requestId: String, originalDoctorId: String) {
        viewModelScope.launch {
            val duty = _myCoverageDuties.value.find { it.id == requestId }
            val currentUserId = currentUser.value.id
            val profileId = _userDetails.value?.id ?: ""
            
            val isAssignedToMe = duty != null && 
                (duty.approvedDoctorId == currentUserId || (profileId.isNotEmpty() && duty.approvedDoctorId == profileId))

            if (duty != null && duty.status == "ACCEPTED" && isAssignedToMe) {
                try {
                    val dateStr = java.text.SimpleDateFormat("dd MMM", java.util.Locale.getDefault()).format(java.util.Date(duty.leaveStartDateLong))
                    leaveCoverageRepository.startCoverage(requestId, currentUserId, profileId)
                    communicationRepository.addNotification(
                        Notification(
                            userId = originalDoctorId,
                            title = "Coverage Started",
                            message = "Dr. ${duty.approvedDoctorName} has started your coverage session for $dateStr.",
                            type = "COVERAGE_STARTED"
                        )
                    )
                } catch (t: Throwable) {
                    Log.e("MedLinkViewModel", "Error starting coverage", t)
                }
            }
        }
    }

    // ----------------------------------------------------
    // NOTICES & COMMUNICATION
    // ----------------------------------------------------
    private val _hospitalNotices = MutableStateFlow<List<HospitalNotice>>(emptyList())
    val hospitalNotices: StateFlow<List<HospitalNotice>> = _hospitalNotices.asStateFlow()

    private val _internalMessages = MutableStateFlow<List<InternalMessage>>(emptyList())
    val internalMessages: StateFlow<List<InternalMessage>> = _internalMessages.asStateFlow()

    private val _userNotifications = MutableStateFlow<List<Notification>>(emptyList())
    val userNotifications: StateFlow<List<Notification>> = _userNotifications.asStateFlow()

    private val _unreadMessageCount = MutableStateFlow(0)
    val unreadMessageCount: StateFlow<Int> = _unreadMessageCount.asStateFlow()

    private val _unreadNotificationCount = MutableStateFlow(0)
    val unreadNotificationCount: StateFlow<Int> = _unreadNotificationCount.asStateFlow()

    private val _chatRooms = MutableStateFlow<List<ChatRoom>>(emptyList())
    val chatRooms: StateFlow<List<ChatRoom>> = _chatRooms.asStateFlow()

    // Dashboard dynamic counts
    val coverageOpportunitiesCount = combine(allLeaveRequests, currentUser) { requests, user ->
        try {
            requests.count { (it.status == "OPEN" || it.status == "PENDING") && it.doctorId != user.id }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val activeDutiesCount = combine(myCoverageDuties, currentUser) { duties, user ->
        try {
            duties.count { it.status == "IN_PROGRESS" || it.status == "ACCEPTED" }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val myPendingLeavesCount = myLeaveRequests.map { list -> 
        val now = System.currentTimeMillis()
        try {
            list.count { (it.status == "OPEN" || it.status == "PENDING") && it.leaveEndDateLong >= now }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val myApprovedLeavesCount = myLeaveRequests.map { list -> 
        val now = System.currentTimeMillis()
        try {
            list.count { (it.status == "IN_PROGRESS" || it.status == "ACCEPTED" || it.status == "APPROVED" || it.status == "ACTIVE") && it.leaveEndDateLong >= now }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val myCompletedLeavesCount = myLeaveRequests.map { list -> 
        val now = System.currentTimeMillis()
        try {
            list.count { 
                it.status == "COMPLETED" || 
                it.status == "REJECTED" || 
                it.status == "CANCELLED" ||
                it.leaveEndDateLong < now
            }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val activeCoverageDutiesCount = myCoverageDuties.map { list -> 
        try {
            list.count { it.status == "IN_PROGRESS" || it.status == "ACCEPTED" }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val completedCoverageDutiesCount = myCoverageDuties.map { list -> 
        try {
            list.count { it.status == "COMPLETED" }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    // --- Shift Coverage Analytics (Calculated Live) ---
    
    val shiftBalance = combine(myLeaveRequests, myCoverageDuties) { leaves, duties ->
        val covered = duties.count { it.status == "ACCEPTED" || it.status == "IN_PROGRESS" || it.status == "COMPLETED" }
        val requested = leaves.size
        covered - requested
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val totalVolunteeredHours = myCoverageDuties.map { duties ->
        duties.filter { it.status == "ACCEPTED" || it.status == "IN_PROGRESS" || it.status == "COMPLETED" }
            .sumOf { duty ->
                // Calculate hours from start and end dates
                val diffMs = duty.leaveEndDateLong - duty.leaveStartDateLong
                val days = (diffMs / 86400000).toInt() + 1
                days * 8 // Assume 8 hours per day as standard shift
            }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val networkFulfillmentMetrics = allSystemLeaveRequests.map { requests ->
        val total = requests.size
        if (total == 0) Triple(0, 0, 0)
        else {
            val fulfilled = requests.count { it.status == "ACCEPTED" || it.status == "IN_PROGRESS" || it.status == "COMPLETED" }
            val rate = (fulfilled.toDouble() / total * 100).toInt()
            Triple(rate, fulfilled, total)
        }
    }.stateIn(viewModelScope, SharingStarted.Lazily, Triple(0, 0, 0))

    val specialtyCoverageBreakdown = allSystemLeaveRequests.map { requests ->
        requests.groupBy { it.specialization }
            .mapValues { (_, specRequests) ->
                val total = specRequests.size
                val fulfilled = specRequests.count { it.status == "ACCEPTED" || it.status == "IN_PROGRESS" || it.status == "COMPLETED" }
                Pair(fulfilled, total)
            }.toList().sortedByDescending { it.second.second } // Sort by total requests
    }.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val totalVolunteerOffers = combine(volunteeringStatus, myCoverageDuties) { statusMap, duties ->
        val submitted = statusMap.count { it.value }
        val assigned = duties.size
        Pair(submitted, assigned)
    }.stateIn(viewModelScope, SharingStarted.Lazily, Pair(0, 0))

    val pendingVolunteersCount = myLeaveRequests.flatMapLatest { requests ->
        val myOpenRequests = requests.filter { it.status == "OPEN" || it.status == "PENDING" }
        if (myOpenRequests.isEmpty()) flowOf(0)
        else {
            val flows = myOpenRequests.map { getVolunteersForRequest(it.id) }
            combine(flows) { volunteersLists ->
                volunteersLists.sumOf { list -> list.count { it.status == "WAITING_FOR_APPROVAL" } }
            }
        }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)


    val unreadNoticesCount = combine(hospitalNotices, userDetails) { notices, user ->
        try {
            notices.count { notice -> !(user?.readNoticeIds?.contains(notice.id) ?: false) }
        } catch (t: Throwable) { 0 }
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    fun loadHospitalNotices() {
        viewModelScope.launch {
            try {
                communicationRepository.getHospitalNoticesFlow().collect { _hospitalNotices.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading notices", t)
            }
        }
    }

    fun loadInternalMessages() {
        viewModelScope.launch {
            try {
                communicationRepository.getInternalMessagesFlow().collect { _internalMessages.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading internal messages", t)
            }
        }
    }

    fun sendInternalMessage(text: String) {
        val user = _userDetails.value ?: return
        viewModelScope.launch {
            try {
                val msg = InternalMessage(senderId = user.id, senderName = user.name, text = text)
                communicationRepository.sendInternalMessage(msg)
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error sending message", t)
            }
        }
    }

    fun loadChatRooms(userIds: List<String>) {
        viewModelScope.launch {
            try {
                communicationRepository.getChatRoomsFlow(userIds).collect { _chatRooms.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading chat rooms", t)
            }
        }
    }

    fun loadUserNotifications(userIds: List<String>) {
        viewModelScope.launch {
            try {
                communicationRepository.getNotificationsForUser(userIds).collect { _userNotifications.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading notifications", t)
            }
        }
        viewModelScope.launch {
            try {
                communicationRepository.getUnreadMessageCountFlow(userIds).collect { _unreadMessageCount.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading unread msg count", t)
            }
        }
        viewModelScope.launch {
            try {
                communicationRepository.getUnreadNotificationsCountFlow(userIds).collect { _unreadNotificationCount.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading unread notify count", t)
            }
        }
    }

    fun markNotificationsRead() {
        val userId = currentUser.value.id
        val profileId = _userDetails.value?.id ?: ""
        val ids = listOf(userId, profileId).filter { it.isNotBlank() }.distinct()

        if (ids.isNotEmpty()) {
            viewModelScope.launch {
                try {
                    communicationRepository.markAllAsRead(ids)
                } catch (t: Throwable) {
                    Log.e("MedLinkViewModel", "Error marking notifications as read", t)
                }
            }
        }
    }

    // ----------------------------------------------------
    // HOSPITALS
    // ----------------------------------------------------
    private val _hospitalsList = MutableStateFlow<List<Hospital>>(emptyList())
    val hospitalsList: StateFlow<List<Hospital>> = _hospitalsList.asStateFlow()

    fun loadHospitals() {
        viewModelScope.launch {
            try {
                hospitalRepository.getHospitalsFlow().collect { _hospitalsList.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading hospitals", t)
            }
        }
    }

    // ----------------------------------------------------
    // ANALYTICS
    // ----------------------------------------------------
    private val _coverageAnalytics = MutableStateFlow<CoverageAnalytics?>(null)
    val coverageAnalytics: StateFlow<CoverageAnalytics?> = _coverageAnalytics.asStateFlow()

    fun loadCoverageAnalytics(doctorIds: List<String>) {
        // For simplicity, we use the first valid ID for analytics as it's a document-based fetch
        val primaryId = doctorIds.firstOrNull() ?: return
        viewModelScope.launch {
            try {
                analyticsRepository.getCoverageAnalyticsFlow(primaryId).collect { _coverageAnalytics.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading analytics", t)
            }
        }
    }

    // ----------------------------------------------------
    // APPOINTMENTS
    // ----------------------------------------------------
    private val _appointmentsList = MutableStateFlow<List<Appointment>>(emptyList())
    val appointmentsList: StateFlow<List<Appointment>> = _appointmentsList.asStateFlow()

    fun loadAppointments(doctorIds: List<String>) {
        viewModelScope.launch {
            try {
                appointmentRepository.getAppointmentsFlow(doctorIds).collect { _appointmentsList.value = it }
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Error loading appointments", t)
            }
        }
    }

    // ----------------------------------------------------
    // AI ASSISTANT (Local & Secure)
    // ----------------------------------------------------
    private val _aiChatHistory = MutableStateFlow<List<LocalChatMessage>>(emptyList())
    val aiChatHistory: StateFlow<List<LocalChatMessage>> = _aiChatHistory.asStateFlow()

    private val _aiConsultationLoading = MutableStateFlow(false)
    val aiConsultationLoading: StateFlow<Boolean> = _aiConsultationLoading.asStateFlow()

    private val _aiModelDownloadProgress = MutableStateFlow<Float?>(null) // null = not downloading
    val aiModelDownloadProgress: StateFlow<Float?> = _aiModelDownloadProgress.asStateFlow()

    private val _isAiModelReady = MutableStateFlow(false)
    val isAiModelReady: StateFlow<Boolean> = _isAiModelReady.asStateFlow()

    fun downloadAiModel() {
        _isAiModelReady.value = true
    }

    fun initiateAIConsultationMessage(message: String) {
        viewModelScope.launch {
            _aiConsultationLoading.value = true
            val userMsg = LocalChatMessage(role = "user", content = message)
            _aiChatHistory.value = _aiChatHistory.value + userMsg
            
            try {
                val response = smartAssistantEngine.query(
                    prompt = message,
                    currentUser = _userDetails.value,
                    doctors = _doctorsList.value,
                    allRequests = _allLeaveRequests.value,
                    myDuties = _myCoverageDuties.value,
                    notices = _hospitalNotices.value,
                    appointments = _appointmentsList.value,
                    chatRooms = _chatRooms.value
                )
                
                val aiMsg = LocalChatMessage(
                    role = "assistant", 
                    content = response.text,
                    intent = response.intent,
                    structuredData = response.data
                )
                _aiChatHistory.value = _aiChatHistory.value + aiMsg
            } catch (t: Throwable) {
                Log.e("MedLinkViewModel", "Smart Assistant Error", t)
                _aiChatHistory.value = _aiChatHistory.value + LocalChatMessage(role = "assistant", content = "Sorry, I encountered an error retrieving data.")
            } finally {
                _aiConsultationLoading.value = false
            }
        }
    }
}
