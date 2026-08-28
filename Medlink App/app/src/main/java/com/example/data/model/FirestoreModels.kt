package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.Exclude
import com.google.firebase.firestore.PropertyName

data class User(
    @get:Exclude @set:Exclude
    var id: String = "",
    
    @get:PropertyName("email") @set:PropertyName("email")
    var email: String = "",
    
    @get:PropertyName("name") @set:PropertyName("name")
    var name: String = "",
    
    @get:PropertyName("role") @set:PropertyName("role")
    var role: String = "", // "DOCTOR", "ADMIN"
    
    @get:PropertyName("phoneNumber") @set:PropertyName("phoneNumber")
    var phoneNumber: String = "",
    
    @get:PropertyName("avatarUrl") @set:PropertyName("avatarUrl")
    var avatarUrl: String? = null,
    
    @get:PropertyName("verified") @set:PropertyName("verified")
    var verified: Boolean = false,
    
    @get:PropertyName("isVerified") @set:PropertyName("isVerified")
    var isVerifiedInternal: Boolean = false,
    
    @get:PropertyName("isPractitionerVerified") @set:PropertyName("isPractitionerVerified")
    var isPractitionerVerified: Boolean = false,

    // Doctor specific fields
    @get:PropertyName("specialty") @set:PropertyName("specialty")
    var specialty: String? = null,
    
    @get:PropertyName("licenseNumber") @set:PropertyName("licenseNumber")
    var licenseNumber: String? = null,
    
    @get:PropertyName("registrationNumber") @set:PropertyName("registrationNumber")
    var registrationNumber: String? = null,
    
    @get:PropertyName("governmentId") @set:PropertyName("governmentId")
    var governmentId: String? = null,
    
    @get:PropertyName("location") @set:PropertyName("location")
    var location: String? = null,
    
    @get:PropertyName("clinicName") @set:PropertyName("clinicName")
    var clinicName: String? = null,
    
    @get:PropertyName("averageRating") @set:PropertyName("averageRating")
    var averageRating: Any = 0.0,
    
    @get:PropertyName("totalReviews") @set:PropertyName("totalReviews")
    var totalReviews: Any = 0,
    
    @get:PropertyName("experience") @set:PropertyName("experience")
    var experience: Any = 0,
    
    @get:PropertyName("fees") @set:PropertyName("fees")
    var fees: Any = 0.0,
    
    @get:PropertyName("clinicStatus") @set:PropertyName("clinicStatus")
    var clinicStatus: String = "Offline", // "Available", "Busy", "Away", "Offline"
    
    @get:PropertyName("hospitalIds") @set:PropertyName("hospitalIds")
    var hospitalIds: List<String> = emptyList(),
    
    @get:PropertyName("department") @set:PropertyName("department")
    var department: String? = null,

    // New Professional Fields
    @get:PropertyName("hospitalName") @set:PropertyName("hospitalName")
    var hospitalName: String? = null,
    
    @get:PropertyName("hospitalId") @set:PropertyName("hospitalId")
    var hospitalId: String? = null,
    
    @get:PropertyName("qualification") @set:PropertyName("qualification")
    var qualification: String? = null,
    
    @get:PropertyName("gender") @set:PropertyName("gender")
    var gender: String? = null,
    
    @get:PropertyName("dob") @set:PropertyName("dob")
    var dob: String? = null,
    
    @get:PropertyName("govIdUrl") @set:PropertyName("govIdUrl")
    var govIdUrl: String? = null,
    
    @get:PropertyName("medicalCertificateUrl") @set:PropertyName("medicalCertificateUrl")
    var medicalCertificateUrl: String? = null,
    
    @get:PropertyName("hospitalAddress") @set:PropertyName("hospitalAddress")
    var hospitalAddress: String? = null,
    
    @get:PropertyName("city") @set:PropertyName("city")
    var city: String? = null,
    
    @get:PropertyName("state") @set:PropertyName("state")
    var state: String? = null,
    
    @get:PropertyName("country") @set:PropertyName("country")
    var country: String? = null,
    
    @get:PropertyName("pinCode") @set:PropertyName("pinCode")
    var pinCode: String? = null,
    
    @get:PropertyName("joinedDate") @set:PropertyName("joinedDate")
    var joinedDate: Any = System.currentTimeMillis(),
    
    @get:PropertyName("coverageScore") @set:PropertyName("coverageScore")
    var coverageScore: Any = 0.0,
    
    @get:PropertyName("readNoticeIds") @set:PropertyName("readNoticeIds")
    var readNoticeIds: List<String> = emptyList(),
    
    @get:PropertyName("approvalStatus") @set:PropertyName("approvalStatus")
    var approvalStatus: String = "PENDING", // PENDING, APPROVED, REJECTED
    
    @get:PropertyName("rejectionReason") @set:PropertyName("rejectionReason")
    var rejectionReason: String? = null,
    
    @get:PropertyName("bio") @set:PropertyName("bio")
    var bio: String? = null,
    
    @get:PropertyName("emergencyContact") @set:PropertyName("emergencyContact")
    var emergencyContact: String? = null,
    
    @get:PropertyName("consultationTimings") @set:PropertyName("consultationTimings")
    var consultationTimings: String? = null,
    
    @get:PropertyName("insuranceInfo") @set:PropertyName("insuranceInfo")
    var insuranceInfo: String? = null,

    @get:PropertyName("approvedAt") @set:PropertyName("approvedAt")
    var approvedAt: Any? = null,
    
    @get:PropertyName("approvedBy") @set:PropertyName("approvedBy")
    var approvedBy: String? = null,
    
    @get:PropertyName("rejectedAt") @set:PropertyName("rejectedAt")
    var rejectedAt: Any? = null,
    
    @get:PropertyName("rejectedBy") @set:PropertyName("rejectedBy")
    var rejectedBy: String? = null,

    // Sentiment Analysis Statistics
    @get:PropertyName("sentimentScore") @set:PropertyName("sentimentScore")
    var sentimentScore: Any = 0.0,

    @get:PropertyName("positiveSentimentCount") @set:PropertyName("positiveSentimentCount")
    var positiveSentimentCount: Int = 0,

    @get:PropertyName("neutralSentimentCount") @set:PropertyName("neutralSentimentCount")
    var neutralSentimentCount: Int = 0,

    @get:PropertyName("negativeSentimentCount") @set:PropertyName("negativeSentimentCount")
    var negativeSentimentCount: Int = 0,

    @get:PropertyName("sentimentReviewCount") @set:PropertyName("sentimentReviewCount")
    var sentimentReviewCount: Int = 0
) {
    // Web Parity Shadow Properties (Outside constructor to handle different field names)
    @get:PropertyName("fullName") @set:PropertyName("fullName")
    var fullName: String?
        get() = name
        set(value) { if (value != null) name = value }

    @get:PropertyName("photoUrl") @set:PropertyName("photoUrl")
    var photoUrl: String?
        get() = avatarUrl
        set(value) { if (value != null) avatarUrl = value }

    @get:PropertyName("phone") @set:PropertyName("phone")
    var phone: String?
        get() = phoneNumber
        set(value) { if (value != null) phoneNumber = value }

    @get:PropertyName("hospital") @set:PropertyName("hospital")
    var hospital: String?
        get() = hospitalName
        set(value) { if (value != null) hospitalName = value }

    @get:PropertyName("medicalLicense") @set:PropertyName("medicalLicense")
    var medicalLicense: String?
        get() = licenseNumber
        set(value) { if (value != null) licenseNumber = value }

    @get:PropertyName("verifiedPractitioner") @set:PropertyName("verifiedPractitioner")
    var verifiedPractitioner: Boolean?
        get() = verified
        set(value) { if (value != null) verified = value }

    @get:PropertyName("rating") @set:PropertyName("rating")
    var ratingShadow: Any?
        get() = averageRating
        set(value) { if (value != null) averageRating = value }

    @get:PropertyName("reviewCount") @set:PropertyName("reviewCount")
    var reviewCountShadow: Any?
        get() = totalReviews
        set(value) { if (value != null) totalReviews = value }

    @get:PropertyName("governmentIdUrl") @set:PropertyName("governmentIdUrl")
    var governmentIdUrl: String?
        get() = govIdUrl
        set(value) { if (value != null) govIdUrl = value }

    @get:PropertyName("medicalCertificate") @set:PropertyName("medicalCertificate")
    var medicalCertificateShadow: String?
        get() = medicalCertificateUrl
        set(value) { if (value != null) medicalCertificateUrl = value }

    @get:Exclude @set:Exclude
    var bioStr: String?
        get() = bio
        set(value) { if (value != null) bio = value }

    @get:Exclude @set:Exclude
    var hospitalStr: String?
        get() = hospitalName
        set(value) { if (value != null) hospitalName = value }

    @get:Exclude @set:Exclude
    var phoneStr: String?
        get() = phoneNumber
        set(value) { if (value != null) phoneNumber = value }

    @get:Exclude @set:Exclude
    var photoUrlStr: String?
        get() = avatarUrl
        set(value) { if (value != null) avatarUrl = value }

    @get:Exclude @set:Exclude
    var verifiedPractitionerStr: Boolean?
        get() = verified
        set(value) { if (value != null) verified = value }

    @get:Exclude
    val joinedDateLong: Long
        get() = when (val t = joinedDate) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> System.currentTimeMillis()
        }

    @get:Exclude
    val averageRatingFloat: Float
        get() = when (val r = averageRating) {
            is Float -> r
            is Double -> r.toFloat()
            is Long -> r.toFloat()
            is Int -> r.toFloat()
            else -> 0f
        }

    @get:Exclude
    val totalReviewsInt: Int
        get() = when (val t = totalReviews) {
            is Int -> t
            is Long -> t.toInt()
            is Double -> t.toInt()
            else -> 0
        }

    @get:Exclude
    val experienceInt: Int
        get() = when (val e = experience) {
            is Int -> e
            is Long -> e.toInt()
            is Double -> e.toInt()
            else -> 0
        }

    @get:Exclude
    val feesDouble: Double
        get() = when (val f = fees) {
            is Double -> f
            is Long -> f.toDouble()
            is Int -> f.toDouble()
            else -> 0.0
        }

    @get:Exclude
    val coverageScoreDouble: Double
        get() = when (val s = coverageScore) {
            is Double -> s
            is Long -> s.toDouble()
            is Int -> s.toDouble()
            else -> 0.0
        }

    @get:Exclude
    val sentimentScoreDouble: Double
        get() = when (val s = sentimentScore) {
            is Double -> s
            is Long -> s.toDouble()
            is Int -> s.toDouble()
            else -> 0.0
        }
}

data class Hospital(
    val id: String = "",
    val name: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val logoUrl: String? = null,
    val type: String = "Private", 
    val specialties: List<String> = emptyList(),
    val location: String? = null,
    @get:PropertyName("distanceKm") @set:PropertyName("distanceKm")
    var distanceKm: Any = 0.0,
    @get:PropertyName("availableShiftsCount") @set:PropertyName("availableShiftsCount")
    var availableShiftsCount: Any = 0,
    val priority: String = "Normal"
) {
    @get:Exclude
    val distanceKmDouble: Double
        get() = when (val d = distanceKm) {
            is Double -> d
            is Long -> d.toDouble()
            is Int -> d.toDouble()
            else -> 0.0
        }

    @get:Exclude
    val availableShiftsCountInt: Int
        get() = when (val c = availableShiftsCount) {
            is Int -> c
            is Long -> c.toInt()
            is Double -> c.toInt()
            else -> 0
        }
}

data class LeaveRequest(
    val id: String = "",
    val doctorId: String = "",
    val doctorName: String = "",
    val doctorEmail: String = "",
    val doctorPhone: String = "",
    val doctorProfilePhoto: String? = null,
    val doctorLicense: String = "",
    val specialization: String = "",
    @get:PropertyName("leaveStartDate") @set:PropertyName("leaveStartDate")
    var leaveStartDate: Any = 0L,
    @get:PropertyName("leaveEndDate") @set:PropertyName("leaveEndDate")
    var leaveEndDate: Any = 0L,
    val leaveDuration: String = "",
    val reason: String = "",
    val coverageType: String = "Full Day", 
    val priority: String = "Normal", // Normal, Urgent
    val notes: String = "",
    val status: String = "OPEN", // OPEN, APPROVED, ACTIVE, REJECTED, COMPLETED
    @get:PropertyName("createdAt") @set:PropertyName("createdAt")
    var createdAt: Any = System.currentTimeMillis(),
    val approvedDoctorId: String? = null,
    val approvedDoctorName: String? = null,
    val approvedDoctorEmail: String? = null,
    val approvedDoctorPhone: String? = null,
    @get:PropertyName("approvalTime") @set:PropertyName("approvalTime")
    var approvalTime: Any? = null,
    val leaveType: String = "Sick Leave",
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null
) {
    @get:Exclude
    val leaveStartDateLong: Long
        get() = when (val t = leaveStartDate) {
            is Long -> t
            is Double -> t.toLong()
            is Int -> t.toLong()
            is Timestamp -> t.toDate().time
            else -> 0L
        }

    @get:Exclude
    val leaveEndDateLong: Long
        get() = when (val t = leaveEndDate) {
            is Long -> t
            is Double -> t.toLong()
            is Int -> t.toLong()
            is Timestamp -> t.toDate().time
            else -> 0L
        }

    @get:Exclude
    val createdAtLong: Long
        get() = when (val t = createdAt) {
            is Long -> t
            is Double -> t.toLong()
            is Int -> t.toLong()
            is Timestamp -> t.toDate().time
            else -> 0L
        }

    @get:Exclude
    val approvalTimeLong: Long?
        get() = when (val t = approvalTime) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> null
        }
}

data class Volunteer(
    val id: String = "",
    val doctorId: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val profilePhoto: String? = null,
    val experience: Int = 0,
    val specialization: String = "",
    val availability: String = "Available",
    val status: String = "WAITING_FOR_APPROVAL", // WAITING_FOR_APPROVAL, ACCEPTED, REJECTED
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis()
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class Notification(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val message: String = "",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis(),
    @get:PropertyName("isRead") @set:PropertyName("isRead")
    var isRead: Boolean = false,
    val type: String = "" 
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class HospitalNotice(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val type: String = "INFO", // ALERT, CIRCULAR, HOLIDAY
    val priority: String = "NORMAL",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis(),
    val hospitalId: String = "",
    @get:PropertyName("isRead") @set:PropertyName("isRead")
    var isRead: Boolean = false
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class InternalMessage(
    val id: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val text: String = "",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis(),
    val type: String = "GENERAL" // COVERAGE_DISCUSSION, ANNOUNCEMENT
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class Prescription(
    val id: String = "",
    val patientId: String = "",
    val patientName: String = "",
    val doctorId: String = "",
    val doctorName: String = "",
    val hospitalName: String = "MedLink General Hospital",
    val diagnoses: String = "",
    val medicationsJson: String = "[]",
    val instructions: String = "",
    val nextVisitDate: String = "",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis()
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class CoverageAnalytics(
    val doctorId: String = "",
    val acceptedCount: Int = 0,
    val rejectedCount: Int = 0,
    val completedCount: Int = 0,
    @get:PropertyName("totalHours") @set:PropertyName("totalHours")
    var totalHours: Any = 0.0,
    val leaveRequestsCount: Int = 0,
    @get:PropertyName("performanceScore") @set:PropertyName("performanceScore")
    var performanceScore: Any = 0.0
) {
    @get:Exclude
    val totalHoursDouble: Double
        get() = when (val h = totalHours) {
            is Double -> h
            is Long -> h.toDouble()
            is Int -> h.toDouble()
            else -> 0.0
        }

    @get:Exclude
    val performanceScoreDouble: Double
        get() = when (val s = performanceScore) {
            is Double -> s
            is Long -> s.toDouble()
            is Int -> s.toDouble()
            else -> 0.0
        }
}

data class Appointment(
    val id: String = "",
    val patientId: String = "",
    val patientName: String = "",
    val doctorId: String = "",
    val doctorName: String = "",
    val date: String = "",
    val time: String = "",
    val status: String = "SCHEDULED", // "SCHEDULED", "COMPLETED", "CANCELLED"
    val type: String = "Consultation",
    @get:PropertyName("createdAt") @set:PropertyName("createdAt")
    var createdAt: Any = System.currentTimeMillis()
) {
    @get:Exclude
    val createdAtLong: Long
        get() = when (val t = createdAt) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class AdminActivityLog(
    val id: String = "",
    val action: String = "",
    val adminUid: String = "",
    val adminName: String = "",
    val doctorUid: String = "",
    val doctorName: String = "",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis(),
    val reason: String? = null,
    val metadata: String? = null
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class AdminNotification(
    val id: String = "",
    val title: String = "",
    val message: String = "",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis(),
    @get:PropertyName("isRead") @set:PropertyName("isRead")
    var isRead: Boolean = false,
    val type: String = ""
) {
    @get:Exclude
    val timestampLong: Long
        get() = when (val t = timestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

data class AdminDashboardStats(
    val pendingApprovals: Int = 0,
    val approvedDoctors: Int = 0,
    val rejectedDoctors: Int = 0,
    val totalLeaveRequests: Int = 0,
    val newRegistrationsToday: Int = 0,
    val leaveRequestsToday: Int = 0
)

data class CoverageFeedback(
    val id: String = "",
    var requestId: String = "",
    var reviewerId: String = "",
    var reviewedDoctorId: String = "",
    var rating: Any = 0,
    var reviewText: String = "",
    var createdAt: Any = System.currentTimeMillis(),
    
    // Sentiment Analysis Results
    var sentiment: String? = null, // "POSITIVE", "NEUTRAL", "NEGATIVE"
    var sentimentConfidence: Any? = null,
    var sentimentScore: Any? = null // 100, 50, 0
) {
    @get:Exclude
    val ratingInt: Int
        get() = when (val r = rating) {
            is Int -> r
            is Long -> r.toInt()
            is Double -> r.toInt()
            is Float -> r.toInt()
            is String -> r.toIntOrNull() ?: 0
            else -> 0
        }

    @get:Exclude
    val sentimentConfidenceDouble: Double
        get() = when (val c = sentimentConfidence) {
            is Double -> c
            is Float -> c.toDouble()
            is Long -> c.toDouble()
            is Int -> c.toDouble()
            is String -> c.toDoubleOrNull() ?: 0.0
            else -> 0.0
        }
    @get:Exclude
    val createdAtLong: Long
        get() = when (val t = createdAt) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}
