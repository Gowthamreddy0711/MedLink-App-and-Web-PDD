package com.example.data.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUserById(id: String): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Update
    suspend fun updateUser(user: UserEntity)

    @Query("SELECT * FROM users WHERE role = 'DOCTOR'")
    fun getAllDoctorsFlow(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE role = 'DOCTOR' AND isApproved = 1")
    fun getApprovedDoctorsFlow(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE isApproved = 0 AND role = 'DOCTOR'")
    fun getPendingDoctorsFlow(): Flow<List<UserEntity>>

    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteUserById(userId: String)
}

@Dao
interface AppointmentDao {
    @Query("SELECT * FROM appointments WHERE id = :id")
    suspend fun getAppointmentById(id: String): AppointmentEntity?

    @Query("SELECT * FROM appointments WHERE patientId = :patientId ORDER BY dateTime DESC")
    fun getAppointmentsForPatient(patientId: String): Flow<List<AppointmentEntity>>

    @Query("SELECT * FROM appointments WHERE doctorId = :doctorId ORDER BY dateTime DESC")
    fun getAppointmentsForDoctor(doctorId: String): Flow<List<AppointmentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAppointment(appointment: AppointmentEntity)

    @Update
    suspend fun updateAppointment(appointment: AppointmentEntity)

    @Query("SELECT COUNT(*) FROM appointments WHERE doctorId = :doctorId AND dateTime >= :startOfDay AND dateTime < :endOfDay")
    suspend fun getAppointmentCountForDoctorToday(doctorId: String, startOfDay: Long, endOfDay: Long): Int
}

@Dao
interface QueueDao {
    @Query("SELECT * FROM queue WHERE doctorId = :doctorId")
    fun getQueueForDoctorFlow(doctorId: String): Flow<QueueEntity?>

    @Query("SELECT * FROM queue WHERE doctorId = :doctorId")
    suspend fun getQueueForDoctor(doctorId: String): QueueEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateQueue(queue: QueueEntity)
}

@Dao
interface QueueItemDao {
    @Query("SELECT * FROM queue_items WHERE doctorId = :doctorId AND status = :status ORDER BY queueNumber ASC")
    fun getQueueItemsForDoctorFlow(doctorId: String, status: String): Flow<List<QueueItemEntity>>

    @Query("SELECT * FROM queue_items WHERE doctorId = :doctorId AND status = 'WAITING' ORDER BY queueNumber ASC")
    suspend fun getWaitingItemsForDoctor(doctorId: String): List<QueueItemEntity>

    @Query("SELECT * FROM queue_items WHERE appointmentId = :appointmentId LIMIT 1")
    suspend fun getQueueItemByAppointmentId(appointmentId: String): QueueItemEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQueueItem(queueItem: QueueItemEntity)

    @Update
    suspend fun updateQueueItem(queueItem: QueueItemEntity)

    @Query("DELETE FROM queue_items WHERE id = :id")
    suspend fun deleteQueueItem(id: String)

    @Query("DELETE FROM queue_items WHERE appointmentId = :appointmentId")
    suspend fun deleteQueueItemByAppointmentId(appointmentId: String)
}

@Dao
interface PrescriptionDao {
    @Query("SELECT * FROM prescriptions WHERE patientId = :patientId ORDER BY timestamp DESC")
    fun getPrescriptionsForPatient(patientId: String): Flow<List<PrescriptionEntity>>

    @Query("SELECT * FROM prescriptions WHERE doctorId = :doctorId ORDER BY timestamp DESC")
    fun getPrescriptionsForDoctor(doctorId: String): Flow<List<PrescriptionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPrescription(prescription: PrescriptionEntity)
}

@Dao
interface ReviewDao {
    @Query("SELECT * FROM reviews WHERE doctorId = :doctorId ORDER BY timestamp DESC")
    fun getReviewsForDoctorFlow(doctorId: String): Flow<List<ReviewEntity>>

    @Query("SELECT * FROM reviews WHERE doctorId = :doctorId")
    suspend fun getReviewsForDoctor(doctorId: String): List<ReviewEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReview(review: ReviewEntity)
}

@Dao
interface NotificationDao {
    @Query("SELECT * FROM notifications WHERE userId = :userId ORDER BY timestamp DESC")
    fun getNotificationsForUser(userId: String): Flow<List<NotificationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: NotificationEntity)

    @Query("UPDATE notifications SET isRead = 1 WHERE userId = :userId")
    suspend fun markAllAsRead(userId: String)
}

@Dao
interface LeaveRequestDao {
    @Query("SELECT * FROM leave_requests WHERE doctorId = :doctorId ORDER BY startDate DESC")
    fun getLeaveRequestsForDoctor(doctorId: String): Flow<List<LeaveRequestEntity>>

    @Query("SELECT * FROM leave_requests ORDER BY startDate DESC")
    fun getAllLeaveRequests(): Flow<List<LeaveRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLeaveRequest(request: LeaveRequestEntity)

    @Update
    suspend fun updateLeaveRequest(request: LeaveRequestEntity)
}

@Dao
interface CoverageRequestDao {
    @Query("SELECT * FROM coverage_requests WHERE doctorId = :doctorId OR coveringDoctorId = :coveringDoctorId ORDER BY date DESC")
    fun getCoverageRequestsForDoctor(doctorId: String, coveringDoctorId: String): Flow<List<CoverageRequestEntity>>

    @Query("SELECT * FROM coverage_requests WHERE status = 'PENDING' ORDER BY date DESC")
    fun getPendingCoverageRequests(): Flow<List<CoverageRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCoverageRequest(request: CoverageRequestEntity)

    @Update
    suspend fun updateCoverageRequest(request: CoverageRequestEntity)
}

@Dao
interface PatientAccessDao {
    @Query("SELECT * FROM patient_access WHERE patientId = :patientId AND doctorId = :doctorId LIMIT 1")
    suspend fun getPatientAccess(patientId: String, doctorId: String): PatientAccessEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPatientAccess(access: PatientAccessEntity)
}
