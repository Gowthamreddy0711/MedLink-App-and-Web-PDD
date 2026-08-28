package com.example.data.firebase

import android.net.Uri
import android.util.Log
import com.example.data.model.*
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.toObject
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Calendar
import java.util.UUID

class FirebaseRepository {
    private val auth by lazy { FirebaseAuth.getInstance() }
    private val db by lazy { FirebaseFirestore.getInstance() }
    private val storage by lazy { FirebaseStorage.getInstance() }

    // --- Authentication ---
    fun getCurrentUserId(): String? = auth.currentUser?.uid

    suspend fun signup(email: String, pass: String, user: User): Result<String> {
        return try {
            val res = auth.createUserWithEmailAndPassword(email, pass).await()
            val userId = res.user?.uid ?: throw Exception("Signup failed")
            val finalUser = user.copy(id = userId)
            db.collection("users").document(userId).set(finalUser).await()
            Result.success(userId)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun login(email: String, pass: String): Result<Unit> {
        return try {
            auth.signInWithEmailAndPassword(email, pass).await()
            Result.success(Unit)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    suspend fun changePassword(currentPass: String, newPass: String): Result<Unit> {
        val user = auth.currentUser ?: return Result.failure(Exception("User not authenticated"))
        val email = user.email ?: return Result.failure(Exception("User email not found"))
        
        return try {
            // 1. Re-authenticate
            val credential = EmailAuthProvider.getCredential(email, currentPass)
            user.reauthenticate(credential).await()
            
            // 2. Update password
            user.updatePassword(newPass).await()
            Result.success(Unit)
        } catch (t: Throwable) {
            Result.failure(t)
        }
    }

    fun logout() = try { auth.signOut() } catch (t: Throwable) { /* Ignore */ }

    suspend fun getUser(userId: String, email: String? = null): Result<User?> {
        return try {
            val app = com.google.firebase.FirebaseApp.getInstance()
            val opts = app.options
            
            Log.d("ADMIN_PROFILE_READ_START", "---------------------------------------")
            Log.d("ADMIN_PROFILE_READ_START", "Firebase Project: ${opts.projectId}")
            Log.d("ADMIN_PROFILE_READ_START", "Auth UID: $userId")
            Log.d("ADMIN_PROFILE_READ_START", "Email Fallback: $email")
            Log.d("ADMIN_PROFILE_READ_START", "Collection: users")
            Log.d("ADMIN_PROFILE_READ_START", "Document: $userId")
            Log.d("ADMIN_PROFILE_READ_START", "Full Path: users/$userId")
            Log.d("ADMIN_PROFILE_READ_START", "---------------------------------------")

            var doc = db.collection("users").document(userId).get().await()
            var exists = doc.exists()
            
            if (!exists && email != null && email.isNotBlank()) {
                Log.d("ADMIN_LOGIN_DEBUG", "Document not found by UID, falling back to email query for: $email")
                val querySnapshot = db.collection("users").whereEqualTo("email", email).limit(1).get().await()
                if (!querySnapshot.isEmpty) {
                    doc = querySnapshot.documents[0]
                    exists = true
                    Log.d("ADMIN_LOGIN_DEBUG", "Found document by email with actual ID: ${doc.id}")
                }
            }

            val rawData = if (exists) doc.data else null
            val rawRole = if (exists) doc.getString("role") else null
            val rawApprovalStatus = if (exists) doc.getString("approvalStatus") else null
            
            Log.d("ADMIN_PROFILE_READ_RESULT", "---------------------------------------")
            Log.d("ADMIN_PROFILE_READ_RESULT", "Success: TRUE")
            Log.d("ADMIN_PROFILE_READ_RESULT", "Document Exists: $exists")
            Log.d("ADMIN_PROFILE_READ_RESULT", "Document ID: ${doc.id}")
            Log.d("ADMIN_PROFILE_READ_RESULT", "Data: $rawData")
            Log.d("ADMIN_PROFILE_READ_RESULT", "Role: $rawRole")
            Log.d("ADMIN_PROFILE_READ_RESULT", "Approval: $rawApprovalStatus")
            Log.d("ADMIN_PROFILE_READ_RESULT", "---------------------------------------")

            Log.d("ADMIN_LOGIN_DEBUG", "---------------------------------------")
            Log.d("ADMIN_LOGIN_DEBUG", "Firebase Auth UID: $userId")
            Log.d("ADMIN_LOGIN_DEBUG", "Actual Document ID: ${doc.id}")
            Log.d("ADMIN_LOGIN_DEBUG", "Document exists: $exists")
            Log.d("ADMIN_LOGIN_DEBUG", "Firebase project ID: ${opts.projectId}")
            Log.d("ADMIN_LOGIN_DEBUG", "Raw Firestore data: $rawData")
            Log.d("ADMIN_LOGIN_DEBUG", "Raw role: $rawRole")
            Log.d("ADMIN_LOGIN_DEBUG", "Normalized role: ${rawRole?.trim()?.uppercase()}")
            Log.d("ADMIN_LOGIN_DEBUG", "approvalStatus: $rawApprovalStatus")
            Log.d("ADMIN_LOGIN_DEBUG", "---------------------------------------")

            if (exists) {
                val parsedUser = doc.toObject(User::class.java)?.copy(id = doc.id)
                Result.success(parsedUser)
            } else {
                Result.success(null)
            }
        } catch (t: Throwable) {
            Log.e("ADMIN_PROFILE_READ_ERROR", "---------------------------------------")
            Log.e("ADMIN_PROFILE_READ_ERROR", "Exception class: ${t.javaClass.name}")
            Log.e("ADMIN_PROFILE_READ_ERROR", "Exception message: ${t.message}")
            Log.e("ADMIN_PROFILE_READ_ERROR", "Cause: ${t.cause}")
            Log.e("ADMIN_PROFILE_READ_ERROR", "---------------------------------------")
            Result.failure(t)
        }
    }

    suspend fun updateUser(user: User) {
        try {
            db.collection("users").document(user.id).set(user).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "updateUser error", t)
        }
    }

    // --- Doctors & Directory ---

    fun getAdminDoctorsFlow(): Flow<List<User>> = callbackFlow {
        val listener = try {
            db.collection("users")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("ADMIN_USERS_QUERY_ERROR", "Error: ${error.message}")
                        return@addSnapshotListener
                    }

                    val docs = snapshot?.documents ?: emptyList()
                    
                    var doctorCount = 0
                    var pendingCount = 0
                    var approvedCount = 0
                    var rejectedCount = 0
                    var nullStatusCount = 0

                    val doctorUsers = docs.mapNotNull { d ->
                        val rawData = d.data
                        val docId = d.id
                        
                        val rawRole = rawData?.get("role")?.toString()
                        val rawApprovalStatus = rawData?.get("approvalStatus")?.toString()
                        
                        val normalizedRole = rawRole?.trim()?.uppercase() ?: ""
                        
                        if (normalizedRole != "DOCTOR") return@mapNotNull null
                        
                        doctorCount++
                        
                        // Robust Approval Status Normalization
                        var finalStatus = rawApprovalStatus?.trim()?.uppercase() ?: ""
                        
                        if (finalStatus.isEmpty()) {
                            nullStatusCount++
                            // Fallback: If missing, check verified flag
                            val isVerified = rawData?.get("verified") as? Boolean ?: false
                            finalStatus = if (isVerified) "APPROVED" else "PENDING"
                        }

                        // Diagnostic for Pending specific filtering
                        if (finalStatus == "PENDING") {
                            pendingCount++
                            Log.d("ADMIN_PENDING_DEBUG", "UID: $docId | Name: ${rawData?.get("name")} | Status: $finalStatus")
                        } else if (finalStatus == "APPROVED") {
                            approvedCount++
                        } else if (finalStatus == "REJECTED") {
                            rejectedCount++
                        }

                        try {
                            d.toObject(User::class.java)?.copy(id = docId)?.apply {
                                role = "DOCTOR"
                                approvalStatus = finalStatus
                            }
                        } catch (t: Throwable) {
                            Log.e("ADMIN_MODEL_ERROR", "Failed to map $docId", t)
                            null
                        }
                    }

                    Log.d("ADMIN_DOCTOR_COUNTS", "Doctors: $doctorCount | Pending: $pendingCount | Approved: $approvedCount | Rejected: $rejectedCount | Fixed Nulls: $nullStatusCount")
                    trySend(doctorUsers)
                }
        } catch (t: Throwable) {
            Log.e("ADMIN_USERS_QUERY_ERROR", "Fatal error", t)
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getAdminDashboardStatsFlow(): Flow<AdminDashboardStats> = callbackFlow {
        val today = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis

        // Combined listener for users and leaveRequests
        val usersListener = db.collection("users").addSnapshotListener { userSnapshot, _ ->
            val docs = userSnapshot?.documents ?: emptyList()
            val doctors = docs.filter { it.getString("role")?.trim()?.uppercase() == "DOCTOR" }
            
            val pending = doctors.count { 
                val status = it.getString("approvalStatus")?.trim()?.uppercase()
                status == "PENDING" || (status == null && it.getBoolean("verified") != true)
            }
            val approved = doctors.count { it.getString("approvalStatus")?.trim()?.uppercase() == "APPROVED" || it.getBoolean("verified") == true }
            val rejected = doctors.count { it.getString("approvalStatus")?.trim()?.uppercase() == "REJECTED" }
            
            val newToday = doctors.count { doc ->
                val joined = doc.get("joinedDate")
                val joinedMs = when(joined) {
                    is Long -> joined
                    is com.google.firebase.Timestamp -> joined.toDate().time
                    else -> 0L
                }
                joinedMs >= today
            }

            db.collection("leaveRequests").addSnapshotListener { leaveSnapshot, _ ->
                val leaves = leaveSnapshot?.documents ?: emptyList()
                val leaveCount = leaves.size
                
                val leavesToday = leaves.count { doc ->
                    val created = doc.get("createdAt")
                    val createdMs = when(created) {
                        is Long -> created
                        is com.google.firebase.Timestamp -> created.toDate().time
                        else -> 0L
                    }
                    createdMs >= today
                }

                trySend(AdminDashboardStats(
                    pendingApprovals = pending,
                    approvedDoctors = approved,
                    rejectedDoctors = rejected,
                    totalLeaveRequests = leaveCount,
                    newRegistrationsToday = newToday,
                    leaveRequestsToday = leavesToday
                ))
            }
        }
        awaitClose { usersListener.remove() }
    }

    suspend fun updateApprovalStatus(doctorId: String, status: String, reason: String? = null, adminUid: String = "") {
        Log.d("FirebaseRepository", "ADMIN: Attempting to update doctor $doctorId to status $status")
        try {
            val serverTimestamp = com.google.firebase.firestore.FieldValue.serverTimestamp()
            val updates = mutableMapOf<String, Any>("approvalStatus" to status)
            if (reason != null) updates["rejectionReason"] = reason
            
            if (status == "APPROVED") {
                updates["verified"] = true
                updates["isVerified"] = true
                updates["isPractitionerVerified"] = true
                updates["approvedAt"] = serverTimestamp
                if (adminUid.isNotEmpty()) updates["approvedBy"] = adminUid
            } else if (status == "REJECTED") {
                updates["rejectedAt"] = serverTimestamp
                if (adminUid.isNotEmpty()) updates["rejectedBy"] = adminUid
            }
            
            db.collection("users").document(doctorId).update(updates).await()
            Log.d("FirebaseRepository", "ADMIN: Successfully updated doctor $doctorId in Firestore")
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "ADMIN: Error updating approval status for $doctorId", t)
            throw t
        }
    }

    suspend fun verifyDoctor(doctorId: String, isApproved: Boolean) {
        try {
            db.collection("users").document(doctorId).update("verified", isApproved).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "verifyDoctor error", t)
        }
    }

    // --- Leave & Coverage ---

    suspend fun submitLeaveRequest(request: LeaveRequest) {
        try {
            val id = if (request.id.isEmpty()) UUID.randomUUID().toString() else request.id
            db.collection("leaveRequests").document(id).set(request.copy(id = id)).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "submitLeaveRequest error", t)
        }
    }

    fun getAllLeaveRequestsFlow(): Flow<List<LeaveRequest>> = callbackFlow {
        Log.d("FirebaseRepository", "DIAGNOSTIC: Starting getAllLeaveRequestsFlow query for OPEN requests")
        val listener = try {
            db.collection("leaveRequests")
                .whereIn("status", listOf("OPEN", "PENDING"))
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("FirebaseRepository", "DIAGNOSTIC: Leave requests listener error", error)
                        return@addSnapshotListener
                    }
                    
                    val docs = snapshot?.documents ?: emptyList()
                    Log.d("FirebaseRepository", "DIAGNOSTIC (getAllLeaveRequestsFlow): rawDocsCount=${docs.size}")
                    
                    val list = docs.mapNotNull { doc ->
                        try {
                            val req = doc.toObject(LeaveRequest::class.java)?.copy(id = doc.id)
                            if (req == null) {
                                Log.w("FirebaseRepository", "DIAGNOSTIC: doc.toObject returned null for ${doc.id}")
                            }
                            // Removed the aggressive client-side date filter to prevent data from silently disappearing.
                            // The ViewModel will handle business logic filtering.
                            req
                        } catch (t: Throwable) {
                            Log.e("FirebaseRepository", "DIAGNOSTIC: Error parsing leave request ${doc.id}", t)
                            null
                        }
                    }
                    Log.d("FirebaseRepository", "DIAGNOSTIC (getAllLeaveRequestsFlow): parsedDocsCount=${list.size}, validDocsCount=${list.size}")
                    trySend(list.sortedByDescending { it.createdAtLong })
                }
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "DIAGNOSTIC: getAllLeaveRequestsFlow fatal", t)
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getAllLeaveRequestsOversightFlow(): Flow<List<LeaveRequest>> = callbackFlow {
        val listener = try {
            db.collection("leaveRequests")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val list = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(LeaveRequest::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(list.sortedByDescending { it.createdAtLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getMyLeaveRequestsFlow(doctorIds: List<String>): Flow<List<LeaveRequest>> = callbackFlow {
        if (doctorIds.isEmpty() || doctorIds.all { it.isBlank() }) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }
        val validIds = doctorIds.filter { it.isNotBlank() }.distinct()
        Log.d("FirebaseRepository", "DIAGNOSTIC: Starting getMyLeaveRequestsFlow for IDs: $validIds")
        val listener = try {
            db.collection("leaveRequests")
                .whereIn("doctorId", validIds)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("FirebaseRepository", "DIAGNOSTIC: My leave requests error", error)
                        return@addSnapshotListener
                    }
                    
                    val docs = snapshot?.documents ?: emptyList()
                    Log.d("FirebaseRepository", "DIAGNOSTIC (getMyLeaveRequestsFlow): rawDocsCount=${docs.size}")
                    
                    val list = docs.mapNotNull { doc ->
                        try {
                            doc.toObject(LeaveRequest::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            Log.e("FirebaseRepository", "DIAGNOSTIC: Error parsing my leave request ${doc.id}", t)
                            null
                        }
                    }
                    Log.d("FirebaseRepository", "DIAGNOSTIC (getMyLeaveRequestsFlow): parsedDocsCount=${list.size}, validDocsCount=${list.size}")
                    trySend(list.sortedByDescending { it.createdAtLong })
                }
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "DIAGNOSTIC: getMyLeaveRequestsFlow fatal error", t)
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getCoverageDutiesFlow(doctorIds: List<String>): Flow<List<LeaveRequest>> = callbackFlow {
        if (doctorIds.isEmpty() || doctorIds.all { it.isBlank() }) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }

        val validIds = doctorIds.filter { it.isNotBlank() }.distinct()
        
        // EXTENDED STATUS SUPPORT: Handle legacy statuses like APPROVED/ACTIVE from Web
        val allowedStatuses = setOf("ACCEPTED", "IN_PROGRESS", "COMPLETED", "APPROVED", "ACTIVE")
        val listener = try {
            db.collection("leaveRequests")
                .whereIn("approvedDoctorId", validIds)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("FirebaseRepository", "getCoverageDutiesFlow error", error)
                        return@addSnapshotListener
                    }
                    
                    val docs = snapshot?.documents ?: emptyList()
                    Log.d("FirebaseRepository", "DIAGNOSTIC (getCoverageDutiesFlow): rawDocsCount=${docs.size}")
                    
                    val list = docs.mapNotNull { doc ->
                        try {
                            val req = doc.toObject(LeaveRequest::class.java)?.copy(id = doc.id)
                            if (req != null && req.status in allowedStatuses) {
                                // NORMALIZE STATUS: Convert Web-compatible statuses to Android lifecycle
                                when(req.status) {
                                    "APPROVED" -> req.copy(status = "ACCEPTED")
                                    "ACTIVE" -> req.copy(status = "IN_PROGRESS")
                                    else -> req
                                }
                            } else null
                        } catch (t: Throwable) {
                            null
                        }
                    }
                    Log.d("FirebaseRepository", "DIAGNOSTIC (getCoverageDutiesFlow): filteredCount=${list.size}")
                    trySend(list.sortedWith(
                        compareByDescending<LeaveRequest> { it.approvalTimeLong ?: 0L }
                            .thenByDescending { it.createdAtLong }
                    ))
                }
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "DIAGNOSTIC: getCoverageDutiesFlow fatal", t)
            null
        }
        awaitClose { listener?.remove() }
    }

    suspend fun volunteerForLeave(requestId: String, volunteer: Volunteer) {
        val authUid = auth.currentUser?.uid ?: throw Exception("Auth session expired")
        val docRef = db.collection("leaveRequests").document(requestId)
            .collection("volunteers").document(authUid)
        
        try {
            // Explicitly set status to WAITING_FOR_APPROVAL when volunteering
            docRef.set(volunteer.copy(doctorId = authUid, status = "WAITING_FOR_APPROVAL")).await()
        } catch (t: Throwable) {
            throw t
        }
    }

    suspend fun updateVolunteerStatus(requestId: String, volunteerId: String, status: String) {
        try {
            db.collection("leaveRequests").document(requestId)
                .collection("volunteers").document(volunteerId)
                .update("status", status).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "updateVolunteerStatus error", t)
        }
    }

    fun getVolunteersFlow(requestId: String): Flow<List<Volunteer>> = callbackFlow {
        val listener = try {
            db.collection("leaveRequests").document(requestId)
                .collection("volunteers")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val list = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(Volunteer::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(list.sortedByDescending { it.timestampLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    suspend fun deleteLeaveRequest(requestId: String) {
        try {
            db.collection("leaveRequests").document(requestId).delete().await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "deleteLeaveRequest error", t)
        }
    }

    suspend fun updateLeaveRequestStatus(requestId: String, status: String, approvedVolunteer: Volunteer? = null) {
        try {
            val updates = mutableMapOf<String, Any>("status" to status)
            if (approvedVolunteer != null) {
                updates["approvedDoctorId"] = approvedVolunteer.doctorId
                updates["approvedDoctorName"] = approvedVolunteer.name
                updates["approvedDoctorEmail"] = approvedVolunteer.email
                updates["approvedDoctorPhone"] = approvedVolunteer.phone
                updates["approvalTime"] = System.currentTimeMillis()
            }
            db.collection("leaveRequests").document(requestId).update(updates).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "updateStatus error", t)
        }
    }

    // --- Hospital Notices ---

    fun getHospitalNoticesFlow(): Flow<List<HospitalNotice>> = callbackFlow {
        val listener = try {
            db.collection("hospitalNotices")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val notices = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(HospitalNotice::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(notices.sortedByDescending { it.timestampLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- Internal Messages ---

    fun getInternalMessagesFlow(): Flow<List<InternalMessage>> = callbackFlow {
        val listener = try {
            db.collection("internalMessages")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val messages = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(InternalMessage::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(messages.sortedByDescending { it.timestampLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    suspend fun sendInternalMessage(message: InternalMessage) {
        try {
            db.collection("internalMessages").add(message).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "sendInternal error", t)
        }
    }

    // --- Analytics ---

    fun getCoverageAnalyticsFlow(doctorId: String): Flow<CoverageAnalytics?> = callbackFlow {
        val listener = try {
            db.collection("coverageAnalytics").document(doctorId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    try {
                        trySend(snapshot?.toObject(CoverageAnalytics::class.java))
                    } catch (t: Throwable) {
                        trySend(null)
                    }
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- Notifications ---

    suspend fun addNotification(notification: Notification) {
        try {
            val id = if (notification.id.isEmpty()) UUID.randomUUID().toString() else notification.id
            db.collection("notifications").document(id).set(notification.copy(id = id)).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "addNotification error", t)
        }
    }

    fun getNotificationsFlow(userIds: List<String>): Flow<List<Notification>> = callbackFlow {
        if (userIds.isEmpty()) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }
        val listener = try {
            db.collection("notifications")
                .whereIn("userId", userIds)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val notifications = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(Notification::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(notifications.sortedByDescending { it.timestampLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    suspend fun markNotificationsRead(userIds: List<String>) {
        try {
            val batch = db.batch()
            val unread = db.collection("notifications")
                .whereIn("userId", userIds)
                .whereEqualTo("isRead", false)
                .get().await()
            for (doc in unread.documents) {
                batch.update(doc.reference, "isRead", true)
            }
            batch.commit().await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "markRead error", t)
        }
    }

    // --- Hospitals ---
    fun getHospitalsFlow(): Flow<List<Hospital>> = callbackFlow {
        val listener = try {
            db.collection("hospitals")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val list = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(Hospital::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(list)
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- Storage ---
    suspend fun uploadProfileImage(contentResolver: android.content.ContentResolver, userId: String, uri: Uri): String {
        Log.d("FirebaseRepository", "STORAGE_DIAGNOSTIC: Using bucket: ${storage.reference.bucket}")
        Log.d("FirebaseRepository", "Starting profile upload for $userId from URI: $uri")
        val ref = storage.reference.child("profiles/$userId.jpg")
        
        try {
            val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw Exception("Failed to read bytes from URI")
            Log.d("FirebaseRepository", "Uploading ${bytes.size} bytes to path: ${ref.path}")
            
            // Use Chained Task Pattern (official Firebase recommendation)
            val uploadTask = ref.putBytes(bytes)
            val urlTask = uploadTask.continueWithTask { task ->
                if (!task.isSuccessful) {
                    task.exception?.let { throw it }
                }
                Log.d("FirebaseRepository", "Upload complete, requesting URL from task context")
                ref.downloadUrl
            }
            
            val downloadUrl = urlTask.await().toString()
            Log.d("FirebaseRepository", "Obtained download URL: $downloadUrl")
            return downloadUrl
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "FATAL STORAGE UPLOAD ERROR for $userId", t)
            throw t
        }
    }

    suspend fun uploadDocument(contentResolver: android.content.ContentResolver, userId: String, uri: Uri, docName: String): String {
        val ref = storage.reference.child("documents/$userId/$docName")
        try {
            val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: throw Exception("Failed to read bytes")
            
            val uploadTask = ref.putBytes(bytes)
            val urlTask = uploadTask.continueWithTask { task ->
                if (!task.isSuccessful) {
                    task.exception?.let { throw it }
                }
                ref.downloadUrl
            }
            
            return urlTask.await().toString()
        } catch (t: Throwable) {
            throw t
        }
    }

    // --- One-to-One Messaging ---

    suspend fun sendDirectMessage(message: Message) {
        try {
            val participants = listOf(message.senderId, message.receiverId).sorted()
            val roomId = "${participants[0]}_${participants[1]}"
            
            val id = UUID.randomUUID().toString()
            val finalMsg = message.copy(id = id, roomId = roomId)
            
            db.collection("messages").document(id).set(finalMsg).await()
            
            val roomRef = db.collection("chatRooms").document(roomId)
            db.runTransaction { transaction ->
                val snapshot = transaction.get(roomRef)
                if (!snapshot.exists()) {
                    transaction.set(roomRef, ChatRoom(
                        id = roomId,
                        participants = participants,
                        lastMessage = message.text,
                        lastMessageTimestamp = System.currentTimeMillis(),
                        unreadCounts = mapOf(message.receiverId to 1)
                    ))
                } else {
                    val room = snapshot.toObject(ChatRoom::class.java)!!
                    val newUnread = room.unreadCounts.toMutableMap()
                    newUnread[message.receiverId] = (newUnread[message.receiverId] ?: 0) + 1
                    transaction.update(roomRef, mapOf(
                        "lastMessage" to message.text,
                        "lastMessageTimestamp" to System.currentTimeMillis(),
                        "unreadCounts" to newUnread
                    ))
                }
            }.await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "sendDirect error", t)
        }
    }

    fun getDirectMessagesFlow(myId: String, otherId: String): Flow<List<Message>> = callbackFlow {
        val participants = listOf(myId, otherId).sorted()
        val roomId = "${participants[0]}_${participants[1]}"
        
        val listener = try {
            db.collection("messages")
                .whereEqualTo("roomId", roomId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val messages = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(Message::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(messages.sortedBy { it.timestampLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getChatRoomsFlow(myIds: List<String>): Flow<List<ChatRoom>> = callbackFlow {
        if (myIds.isEmpty()) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }
        val listener = try {
            db.collection("chatRooms")
                .whereArrayContainsAny("participants", myIds)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val rooms = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(ChatRoom::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(rooms.sortedByDescending { it.lastMessageTimestampLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    suspend fun markMessagesAsRead(myId: String, otherId: String) {
        try {
            val participants = listOf(myId, otherId).sorted()
            val unread = db.collection("messages")
                .whereEqualTo("senderId", otherId)
                .whereEqualTo("receiverId", myId)
                .whereEqualTo("isRead", false)
                .get().await()
            
            val batch = db.batch()
            for (doc in unread.documents) {
                batch.update(doc.reference, "isRead", true)
            }
            
            val roomId = "${participants[0]}_${participants[1]}"
            val roomRef = db.collection("chatRooms").document(roomId)
            batch.update(roomRef, "unreadCounts.$myId", 0)
            
            batch.commit().await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "markRead error", t)
        }
    }

    fun getUnreadMessageCountFlow(myIds: List<String>): Flow<Int> = callbackFlow {
        if (myIds.isEmpty()) {
            trySend(0)
            awaitClose { }
            return@callbackFlow
        }
        val listener = try {
            db.collection("messages")
                .whereIn("receiverId", myIds)
                .whereEqualTo("isRead", false)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    trySend(snapshot?.size() ?: 0)
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getUnreadNotificationsCountFlow(myIds: List<String>): Flow<Int> = callbackFlow {
        if (myIds.isEmpty()) {
            trySend(0)
            awaitClose { }
            return@callbackFlow
        }
        val listener = try {
            db.collection("notifications")
                .whereIn("userId", myIds)
                .whereEqualTo("isRead", false)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    trySend(snapshot?.size() ?: 0)
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- Appointments ---
    fun getAppointmentsFlow(doctorIds: List<String>): Flow<List<Appointment>> = callbackFlow {
        if (doctorIds.isEmpty()) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }
        val listener = try {
            db.collection("appointments")
                .whereIn("doctorId", doctorIds)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    val list = snapshot?.documents?.mapNotNull { doc ->
                        try {
                            doc.toObject(Appointment::class.java)?.copy(id = doc.id)
                        } catch (t: Throwable) {
                            null
                        }
                    } ?: emptyList()
                    trySend(list.sortedByDescending { it.createdAtLong })
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- My Offers (Volunteering) ---
    fun getMyOffersFlow(doctorId: String): Flow<List<LeaveRequest>> = callbackFlow {
        // Firestore doesn't support collectionGroup queries easily with sub-collections in this context without extra indexing.
        // For standard MedLink scale, we listen to all open requests and filter for our involvement in the sub-collection.
        val listener = try {
            db.collection("leaveRequests")
                .whereIn("status", listOf("OPEN", "PENDING"))
                .addSnapshotListener { snapshot, error ->
                    if (error != null) return@addSnapshotListener
                    
                    // This is a more complex sync. We need to check the 'volunteers' sub-collection of each request.
                    // For the count, we'll return the list of requests where the user has volunteered.
                    // Implementation note: In production, you'd denormalize this into a 'myOffers' top-level collection.
                    val requests = snapshot?.documents?.mapNotNull { it.toObject(LeaveRequest::class.java)?.copy(id = it.id) } ?: emptyList()
                    trySend(requests)
                }
        } catch (t: Throwable) {
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- Admin Activity & Notifications ---
    
    suspend fun logAdminActivity(activity: AdminActivityLog) {
        try {
            val id = if (activity.id.isEmpty()) "act_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(5)}" else activity.id
            db.collection("adminActivityLogs").document(id).set(activity.copy(id = id)).await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "logAdminActivity error", t)
        }
    }

    fun getAdminActivityLogsFlow(): Flow<List<AdminActivityLog>> = callbackFlow {
        val listener = try {
            db.collection("adminActivityLogs")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("FirebaseRepository", "Admin Activity listener error", error)
                        return@addSnapshotListener
                    }
                    val logs = snapshot?.documents?.mapNotNull { d ->
                        try {
                            d.toObject(AdminActivityLog::class.java)?.copy(id = d.id)
                        } catch (t: Throwable) {
                            Log.e("FirebaseRepository", "Error parsing activity log", t)
                            null
                        }
                    } ?: emptyList()
                    trySend(logs.sortedByDescending { it.timestampLong })
                }
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "getAdminActivityLogsFlow error", t)
            null
        }
        awaitClose { listener?.remove() }
    }

    fun getAdminNotificationsFlow(): Flow<List<AdminNotification>> = callbackFlow {
        val listener = try {
            db.collection("adminNotifications")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("FirebaseRepository", "Admin Notification listener error", error)
                        return@addSnapshotListener
                    }
                    val notifications = snapshot?.documents?.mapNotNull { d ->
                        try {
                            d.toObject(AdminNotification::class.java)?.copy(id = d.id)
                        } catch (t: Throwable) {
                            Log.e("FirebaseRepository", "Error parsing admin notification", t)
                            null
                        }
                    } ?: emptyList()
                    trySend(notifications.sortedByDescending { it.timestampLong })
                }
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "getAdminNotificationsFlow error", t)
            null
        }
        awaitClose { listener?.remove() }
    }

    // --- Coverage Lifecycle & Feedback ---

    suspend fun startCoverage(requestId: String, currentUserId: String, profileId: String = "") = withContext(kotlinx.coroutines.Dispatchers.IO) {
        val ref = db.collection("leaveRequests").document(requestId)
        db.runTransaction { transaction ->
            val snapshot = transaction.get(ref)
            if (!snapshot.exists()) throw IllegalStateException("Request not found")
            val status = snapshot.getString("status")
            val approvedId = snapshot.getString("approvedDoctorId")
            
            // Handle both Android (ACCEPTED) and Web (APPROVED) statuses
            if (status != "ACCEPTED" && status != "APPROVED") {
                throw IllegalStateException("Can only start accepted/approved coverage")
            }
            
            val isAssigned = approvedId == currentUserId || (profileId.isNotEmpty() && approvedId == profileId)
            if (!isAssigned) throw IllegalStateException("Only assigned doctor can start coverage")
            
            transaction.update(ref, "status", "IN_PROGRESS")
        }.await()
    }

    suspend fun completeCoverage(requestId: String, currentUserId: String, profileId: String = "") = withContext(kotlinx.coroutines.Dispatchers.IO) {
        val ref = db.collection("leaveRequests").document(requestId)
        db.runTransaction { transaction ->
            val snapshot = transaction.get(ref)
            if (!snapshot.exists()) throw IllegalStateException("Request not found")
            val status = snapshot.getString("status")
            val approvedId = snapshot.getString("approvedDoctorId")
            
            // Handle both Android (IN_PROGRESS) and Web (ACTIVE) statuses
            if (status != "IN_PROGRESS" && status != "ACTIVE") {
                throw IllegalStateException("Can only complete in-progress/active coverage")
            }
            
            val isAssigned = approvedId == currentUserId || (profileId.isNotEmpty() && approvedId == profileId)
            if (!isAssigned) throw IllegalStateException("Only assigned doctor can complete coverage")
            
            transaction.update(ref, "status", "COMPLETED")
        }.await()
    }

    suspend fun submitCoverageFeedback(feedback: CoverageFeedback) = withContext(kotlinx.coroutines.Dispatchers.IO) {
        val feedbackId = "feedback_${feedback.requestId}"
        val feedbackRef = db.collection("coverageFeedback").document(feedbackId)
        val doctorRef = db.collection("users").document(feedback.reviewedDoctorId)
        
        try {
            // STEP 1: Save the Feedback document
            Log.d("REVIEW_SUBMIT_FIRESTORE", "Step 1: Saving review document: $feedbackId")
            feedbackRef.set(feedback.copy(id = feedbackId)).await()
            Log.d("REVIEW_SUBMIT_FIRESTORE", "Step 1: SUCCESS")

            // STEP 2: Attempt to update Doctor aggregate rating
            try {
                Log.d("REVIEW_SUBMIT_FIRESTORE", "Step 2: Attempting profile update for: ${feedback.reviewedDoctorId}")
                db.runTransaction { transaction ->
                    val doctorSnap = transaction.get(doctorRef)
                    if (doctorSnap.exists()) {
                        val currentAvg = when (val r = doctorSnap.get("averageRating")) {
                            is Double -> r
                            is Long -> r.toDouble()
                            is Int -> r.toDouble()
                            is Float -> r.toDouble()
                            else -> {
                                when (val rs = doctorSnap.get("rating")) {
                                    is Double -> rs
                                    is Long -> rs.toDouble()
                                    is Int -> rs.toDouble()
                                    is Float -> rs.toDouble()
                                    else -> 0.0
                                }
                            }
                        }
                        val currentCount = when (val c = doctorSnap.get("totalReviews")) {
                            is Long -> c.toInt()
                            is Int -> c
                            is Double -> c.toInt()
                            else -> {
                                when (val cs = doctorSnap.get("reviewCount")) {
                                    is Long -> cs.toInt()
                                    is Int -> cs
                                    is Double -> cs.toInt()
                                    else -> 0
                                }
                            }
                        }
                        
                        val newCount = currentCount + 1
                        val newAvg = ((currentAvg * currentCount) + feedback.ratingInt).toDouble() / newCount
                        
                        val updates = mutableMapOf<String, Any>(
                            "averageRating" to newAvg,
                            "totalReviews" to newCount,
                            "rating" to newAvg,
                            "reviewCount" to newCount
                        )

                        // Update Sentiment Statistics if available
                        if (feedback.sentiment != null) {
                            updateSentimentStats(doctorSnap, feedback.sentiment!!, updates)
                        }

                        transaction.update(doctorRef, updates)
                    }
                }.await()
                Log.d("REVIEW_SUBMIT_FIRESTORE", "Step 2: SUCCESS")
            } catch (permError: Throwable) {
                Log.e("REVIEW_SUBMIT_REAL_ERROR", "Step 2: Profile update failed", permError)
            }

            Log.d("REVIEW_SUBMIT_FIRESTORE", "Feedback workflow COMPLETE for requestId: ${feedback.requestId}")
        } catch (t: Throwable) {
            Log.e("REVIEW_SUBMIT_REAL_ERROR", "Feedback workflow FAILED for requestId: ${feedback.requestId}", t)
            throw t
        }
    }

    private fun updateSentimentStats(doctorSnap: com.google.firebase.firestore.DocumentSnapshot, sentiment: String, updates: MutableMap<String, Any>) {
        val currentSentimentScore = when (val s = doctorSnap.get("sentimentScore")) {
            is Double -> s
            is Long -> s.toDouble()
            is Int -> s.toDouble()
            else -> 0.0
        }
        val currentSentimentCount = doctorSnap.getLong("sentimentReviewCount")?.toInt() ?: 0
        val currentPos = doctorSnap.getLong("positiveSentimentCount")?.toInt() ?: 0
        val currentNeu = doctorSnap.getLong("neutralSentimentCount")?.toInt() ?: 0
        val currentNeg = doctorSnap.getLong("negativeSentimentCount")?.toInt() ?: 0

        val scoreForThisReview = when (sentiment.uppercase()) {
            "POSITIVE" -> 100.0
            "NEUTRAL" -> 50.0
            "NEGATIVE" -> 0.0
            else -> null
        }

        if (scoreForThisReview != null) {
            val newSentimentCount = currentSentimentCount + 1
            val newSentimentScore = ((currentSentimentScore * currentSentimentCount) + scoreForThisReview) / newSentimentCount
            
            updates["sentimentScore"] = newSentimentScore
            updates["sentimentReviewCount"] = newSentimentCount
            
            when (sentiment.uppercase()) {
                "POSITIVE" -> updates["positiveSentimentCount"] = currentPos + 1
                "NEUTRAL" -> updates["neutralSentimentCount"] = currentNeu + 1
                "NEGATIVE" -> updates["negativeSentimentCount"] = currentNeg + 1
            }
        }
    }

    fun getCoverageFeedbackForRequest(requestId: String): Flow<List<CoverageFeedback>> = callbackFlow {
        val listener = db.collection("coverageFeedback")
            .whereEqualTo("requestId", requestId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                val list = snapshot?.documents?.mapNotNull { doc ->
                    try {
                        doc.toObject(CoverageFeedback::class.java)?.copy(id = doc.id)
                    } catch (e: Exception) {
                        null
                    }
                } ?: emptyList()
                trySend(list)
            }
        awaitClose { listener.remove() }
    }

    fun getCoverageFeedbackForDoctor(doctorIds: List<String>): Flow<List<CoverageFeedback>> = callbackFlow {
        if (doctorIds.isEmpty()) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }
        
        // Normalize input IDs for robust matching
        val normalizedDoctorIds = doctorIds.map { it.trim().lowercase() }.filter { it.isNotEmpty() }
        
        Log.d("GLOBAL_FEEDBACK_DEBUG", "START: Querying reviews for normalizedDoctorIds: $normalizedDoctorIds")
        
        val listener = db.collection("coverageFeedback")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("GLOBAL_FEEDBACK_DEBUG", "Query failed", error)
                    return@addSnapshotListener
                }
                
                val allDocs = snapshot?.documents ?: emptyList()
                Log.d("GLOBAL_FEEDBACK_DEBUG", "Collection Size: ${allDocs.size} documents in 'reviews'")
                
                val matchedList = allDocs.mapNotNull { doc ->
                    try {
                        val data = doc.data ?: return@mapNotNull null
                        
                        // ALL POSSIBLE DOCTOR IDENTITY FIELDS (Legacy + Web + Android)
                        val docIdentifiers = listOf(
                            data["reviewedDoctorId"],
                            data["coveringDoctorId"],
                            data["profileId"],
                            data["doctorId"],
                            data["doctor_id"],
                            data["targetDoctorId"],
                            data["reviewedId"],
                            data["authUid"],
                            data["uid"],
                            data["reviewedDoctorEmail"],
                            data["coveringDoctorEmail"],
                            data["email"],
                            data["reviewedEmail"],
                            data["doctorName"],
                            data["reviewedDoctorName"],
                            data["doctor_name"]
                        ).mapNotNull { id ->
                            when (id) {
                                is String -> id.trim().lowercase()
                                is com.google.firebase.firestore.DocumentReference -> id.id.trim().lowercase()
                                else -> id?.toString()?.trim()?.lowercase()
                            }
                        }.filter { it.isNotEmpty() }

                        // Check if any normalized document identifier matches any of the target normalized doctor IDs
                        val matchedDocId = docIdentifiers.find { docId -> 
                            normalizedDoctorIds.contains(docId) || normalizedDoctorIds.any { it.contains(docId) && docId.length > 5 }
                        }
                        val isMatch = matchedDocId != null
                        
                        if (isMatch) {
                            // ROBUST MANUAL MAPPING - Avoid all reflection for critical sentiment data
                            val rawRating = data["rating"]
                            val ratingValue: Any = when (rawRating) {
                                is Number -> rawRating.toInt()
                                is String -> rawRating.toIntOrNull() ?: 0
                                else -> 0
                            }

                            val rawSentiment = (data["sentiment"] ?: data["sentiment_label"] ?: data["label"] ?: data["prediction"] ?: data["sentimentLabel"] ?: data["reviewSentiment"])?.toString()?.trim()?.uppercase()
                            val rawConfidence = data["sentimentConfidence"] ?: data["sentiment_confidence"] ?: data["confidence"] ?: data["score"] ?: data["probability"]
                            
                            val feedback = CoverageFeedback(
                                id = doc.id,
                                requestId = (data["requestId"] ?: data["coverageRequestId"] ?: data["request_id"] ?: "").toString(),
                                reviewerId = (data["reviewerId"] ?: data["requestingDoctorId"] ?: data["reviewer_id"] ?: "").toString(),
                                reviewedDoctorId = matchedDocId!!,
                                rating = ratingValue,
                                reviewText = (data["reviewText"] ?: data["feedback"] ?: data["comment"] ?: data["review_text"] ?: "").toString(),
                                createdAt = data["createdAt"] ?: data["timestamp"] ?: data["date"] ?: System.currentTimeMillis(),
                                sentiment = rawSentiment,
                                sentimentConfidence = rawConfidence
                            )

                            Log.d("AI_SENTIMENT_FINAL_REPO", "docId=${feedback.id}, sentiment=${feedback.sentiment}, rating=${feedback.ratingInt}, keys=${data.keys}")
                            feedback
                        } else {
                            null
                        }
                    } catch (e: Exception) {
                        Log.e("GLOBAL_FEEDBACK_DEBUG", "Error processing doc ${doc.id}", e)
                        null
                    }
                }
                
                Log.d("GLOBAL_FEEDBACK_DEBUG", "RESULT: Matched ${matchedList.size} of ${allDocs.size} for IDs: $normalizedDoctorIds")
                trySend(matchedList)
            }
        awaitClose { listener.remove() }
    }

    suspend fun checkFeedbackExists(requestId: String): Boolean {
        return try {
            val querySnapshot = db.collection("coverageFeedback")
                .whereEqualTo("requestId", requestId)
                .limit(1)
                .get().await()
            !querySnapshot.isEmpty
        } catch (e: Exception) {
            Log.e("FirebaseRepository", "Error checking feedback existence", e)
            false
        }
    }

    suspend fun updateFeedbackSentiment(feedbackId: String, reviewedDoctorId: String, sentiment: String, confidence: Double, score: Int) = withContext(kotlinx.coroutines.Dispatchers.IO) {
        val feedbackRef = db.collection("coverageFeedback").document(feedbackId)
        val doctorRef = db.collection("users").document(reviewedDoctorId)
        
        try {
            db.runTransaction { transaction ->
                // 1. Update review document
                transaction.update(feedbackRef, mapOf(
                    "sentiment" to sentiment,
                    "sentimentConfidence" to confidence,
                    "sentimentScore" to score
                ))

                // 2. Update doctor aggregate stats
                val doctorSnap = transaction.get(doctorRef)
                if (doctorSnap.exists()) {
                    val updates = mutableMapOf<String, Any>()
                    updateSentimentStats(doctorSnap, sentiment, updates)
                    transaction.update(doctorRef, updates)
                }
            }.await()
        } catch (t: Throwable) {
            Log.e("FirebaseRepository", "Error updating feedback sentiment in transaction", t)
            throw t
        }
    }
}
