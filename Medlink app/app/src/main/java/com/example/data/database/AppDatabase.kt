package com.example.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        UserEntity::class,
        AppointmentEntity::class,
        QueueEntity::class,
        QueueItemEntity::class,
        PrescriptionEntity::class,
        ReviewEntity::class,
        NotificationEntity::class,
        LeaveRequestEntity::class,
        CoverageRequestEntity::class,
        PatientAccessEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun appointmentDao(): AppointmentDao
    abstract fun queueDao(): QueueDao
    abstract fun queueItemDao(): QueueItemDao
    abstract fun prescriptionDao(): PrescriptionDao
    abstract fun reviewDao(): ReviewDao
    abstract fun notificationDao(): NotificationDao
    abstract fun leaveRequestDao(): LeaveRequestDao
    abstract fun coverageRequestDao(): CoverageRequestDao
    abstract fun patientAccessDao(): PatientAccessDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "medlink_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
