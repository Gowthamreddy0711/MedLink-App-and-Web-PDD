package com.example.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val email: String,
    val name: String,
    val passwordHash: String,
    val role: String, // "PATIENT", "DOCTOR", "ADMIN"
    val isApproved: Boolean, // For doctor approval
    val specialty: String? = null,
    val licenseNumber: String? = null,
    val registrationNumber: String? = null,
    val governmentId: String? = null,
    val avatarUrl: String? = null,
    val phoneNumber: String? = null,
    val location: String? = null,
    val insuranceInfo: String? = null,
    val emergencyContact: String? = null
)

@Entity(tableName = "appointments")
data class AppointmentEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val patientName: String,
    val doctorId: String,
    val doctorName: String,
    val dateTime: Long,
    val status: String, // "SCHEDULED", "COMPLETED", "CANCELLED"
    val notes: String,
    val queueNumber: Int
)

@Entity(tableName = "queue")
data class QueueEntity(
    @PrimaryKey val doctorId: String,
    val currentPatientId: String?,
    val currentPatientName: String?,
    val currentQueueNumber: Int,
    val estimatedWaitMinutes: Int
)

@Entity(tableName = "queue_items")
data class QueueItemEntity(
    @PrimaryKey val id: String,
    val doctorId: String,
    val appointmentId: String,
    val patientName: String,
    val queueNumber: Int,
    val status: String, // "WAITING", "ACTIVE", "COMPLETED"
    val timestamp: Long
)

@Entity(tableName = "prescriptions")
data class PrescriptionEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val patientName: String,
    val doctorId: String,
    val doctorName: String,
    val diagnoses: String,
    val medicationsJson: String, // JSON serialization of List of Medications
    val pdfPath: String?,
    val timestamp: Long
)

@Entity(tableName = "reviews")
data class ReviewEntity(
    @PrimaryKey val id: String,
    val doctorId: String,
    val patientId: String,
    val patientName: String,
    val rating: Int,
    val comment: String,
    val timestamp: Long
)

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val timestamp: Long,
    val isRead: Boolean
)

@Entity(tableName = "leave_requests")
data class LeaveRequestEntity(
    @PrimaryKey val id: String,
    val doctorId: String,
    val startDate: Long,
    val endDate: Long,
    val reason: String,
    val status: String // "PENDING", "APPROVED", "REJECTED"
)

@Entity(tableName = "coverage_requests")
data class CoverageRequestEntity(
    @PrimaryKey val id: String,
    val doctorId: String,
    val coveringDoctorId: String,
    val date: Long,
    val status: String // "PENDING", "ACCEPTED", "REJECTED"
)

@Entity(tableName = "patient_access")
data class PatientAccessEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val doctorId: String,
    val granted: Boolean,
    val timestamp: Long
)
