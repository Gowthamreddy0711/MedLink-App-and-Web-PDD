package com.example.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.Exclude
import com.google.firebase.firestore.PropertyName

data class Message(
    val id: String = "",
    val roomId: String = "",
    val senderId: String = "",
    val receiverId: String = "",
    val text: String = "",
    @get:PropertyName("timestamp") @set:PropertyName("timestamp")
    var timestamp: Any = System.currentTimeMillis(),
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

data class ChatRoom(
    val id: String = "", // Typically "id1_id2" where id1 < id2
    val participants: List<String> = emptyList(),
    val lastMessage: String = "",
    @get:PropertyName("lastMessageTimestamp") @set:PropertyName("lastMessageTimestamp")
    var lastMessageTimestamp: Any = System.currentTimeMillis(),
    val unreadCounts: Map<String, Int> = emptyMap()
) {
    @get:Exclude
    val lastMessageTimestampLong: Long
        get() = when (val t = lastMessageTimestamp) {
            is Long -> t
            is Timestamp -> t.toDate().time
            else -> 0L
        }
}

enum class AssistantIntent {
    LEAVE_STATUS,
    COVERAGE_OPEN,
    DOCTOR_SEARCH,
    MY_DUTIES,
    APPOINTMENTS,
    HOSPITAL_NOTICES,
    MESSAGES,
    PROFILE,
    ANALYTICS,
    HELP,
    SAFETY,
    UNKNOWN
}

data class AssistantResponse(
    val text: String,
    val intent: AssistantIntent,
    val data: List<Any> = emptyList()
)

data class LocalChatMessage(
    val role: String, // "user" or "assistant"
    val content: String,
    val intent: AssistantIntent? = null,
    val structuredData: List<Any> = emptyList()
)
