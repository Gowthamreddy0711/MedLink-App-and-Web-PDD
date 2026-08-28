package com.example.data.network

import com.example.data.model.*
import java.text.SimpleDateFormat
import java.util.*

class SmartAssistantEngine {

    fun query(
        prompt: String,
        currentUser: User?,
        doctors: List<User>,
        allRequests: List<LeaveRequest>,
        myDuties: List<LeaveRequest>,
        notices: List<HospitalNotice>,
        appointments: List<Appointment> = emptyList(),
        chatRooms: List<ChatRoom> = emptyList()
    ): AssistantResponse {
        val q = prompt.trim().lowercase()
        if (q.isEmpty()) return AssistantResponse("Please ask a question about MedLink clinical operations.", AssistantIntent.HELP)

        // 1. SAFETY CHECK (Diagnostic/Medical questions)
        if (isMedicalDiagnostic(q)) {
            return AssistantResponse(
                "I'm designed for MedLink operational tasks such as coverage, leave, doctors, duties, appointments, messages, and hospital updates. Please consult a qualified healthcare professional for medical decisions.",
                AssistantIntent.SAFETY
            )
        }

        // 2. INTENT DETECTION
        return when {
            q.contains("help") || q.contains("what can you do") || q == "commands" -> {
                AssistantResponse(
                    "I can help with your MedLink clinical operations. Try asking about leave, coverage, doctors, duties, appointments, or notices.",
                    AssistantIntent.HELP
                )
            }
            
            // ANALYTICS (Count based)
            q.contains("how many") && (q.contains("pending") || q.contains("available") || q.contains("open")) -> {
                handleAnalytics(q, allRequests, doctors, appointments)
            }

            // LEAVE
            q.contains("leave") && (q.contains("status") || q.contains("request") || q.contains("pending") || q.contains("my")) -> {
                val myLeaves = allRequests.filter { it.doctorId == currentUser?.id }
                if (myLeaves.isEmpty()) AssistantResponse("You haven't submitted any leave requests yet.", AssistantIntent.LEAVE_STATUS)
                else AssistantResponse("I found ${myLeaves.size} leave requests for you.", AssistantIntent.LEAVE_STATUS, myLeaves)
            }

            // COVERAGE
            q.contains("coverage") || q.contains("cover") || q.contains("shifts need") -> {
                val open = allRequests.filter { it.status == "OPEN" && it.doctorId != currentUser?.id }
                if (open.isEmpty()) AssistantResponse("There are currently no open coverage requests in the network.", AssistantIntent.COVERAGE_OPEN)
                else AssistantResponse("I found ${open.size} open coverage opportunities matching clinical requirements.", AssistantIntent.COVERAGE_OPEN, open)
            }

            // DOCTORS
            q.contains("doctor") || q.contains("available") || q.contains("clinician") || isSpecialtySearch(q) -> {
                handleDoctorSearch(q, doctors, currentUser)
            }

            // DUTIES
            q.contains("duty") || q.contains("duties") || q.contains("my schedule") || q.contains("am i covering") -> {
                val active = myDuties.filter { it.status == "IN_PROGRESS" || it.status == "ACCEPTED" }
                if (active.isEmpty()) AssistantResponse("You don't have any active or upcoming coverage duties assigned.", AssistantIntent.MY_DUTIES)
                else AssistantResponse("You are assigned to ${active.size} coverage duties.", AssistantIntent.MY_DUTIES, active)
            }

            // APPOINTMENTS
            q.contains("appointment") -> {
                if (appointments.isEmpty()) AssistantResponse("No appointments found for your clinical schedule.", AssistantIntent.APPOINTMENTS)
                else AssistantResponse("I found ${appointments.size} appointments in your schedule.", AssistantIntent.APPOINTMENTS, appointments)
            }

            // NOTICES
            q.contains("notice") || q.contains("announcement") || q.contains("update") -> {
                if (notices.isEmpty()) AssistantResponse("There are no recent hospital notices to display.", AssistantIntent.HOSPITAL_NOTICES)
                else AssistantResponse("Here are the latest hospital announcements:", AssistantIntent.HOSPITAL_NOTICES, notices.take(5))
            }

            // MESSAGES
            q.contains("message") || q.contains("chat") || q.contains("conversation") || q.contains("who have i") -> {
                if (chatRooms.isEmpty()) AssistantResponse("You have no active peer-to-peer conversations.", AssistantIntent.MESSAGES)
                else AssistantResponse("I found ${chatRooms.size} recent conversations in your message history.", AssistantIntent.MESSAGES, chatRooms)
            }

            // PROFILE
            q.contains("profile") || q.contains("my info") || q.contains("specialization") || q.contains("license") -> {
                if (currentUser == null) AssistantResponse("Unable to retrieve your clinician profile.", AssistantIntent.PROFILE)
                else AssistantResponse("Here is your registered practitioner summary.", AssistantIntent.PROFILE, listOf(currentUser))
            }

            else -> {
                AssistantResponse(
                    "I can help with MedLink operations such as leave, coverage, doctors, duties, appointments, messages, notices, and analytics. How can I assist you today?",
                    AssistantIntent.UNKNOWN
                )
            }
        }
    }

    private fun handleAnalytics(q: String, requests: List<LeaveRequest>, doctors: List<User>, appts: List<Appointment>): AssistantResponse {
        return when {
            q.contains("coverage") -> {
                val count = requests.count { it.status == "OPEN" }
                AssistantResponse("Currently, there are $count open coverage requests pending in the network.", AssistantIntent.ANALYTICS)
            }
            q.contains("doctor") || q.contains("available") -> {
                val count = doctors.count { it.clinicStatus == "Available" }
                AssistantResponse("There are $count clinicians currently marked as 'Available' for clinical consultation.", AssistantIntent.ANALYTICS)
            }
            q.contains("appointment") -> {
                AssistantResponse("You have ${appts.size} scheduled appointments.", AssistantIntent.ANALYTICS)
            }
            else -> AssistantResponse("Which clinical operation analytics would you like to view?", AssistantIntent.HELP)
        }
    }

    private fun handleDoctorSearch(q: String, doctors: List<User>, currentUser: User?): AssistantResponse {
        val matched = doctors.filter { doc ->
            if (doc.id == currentUser?.id) return@filter false
            
            val spec = doc.specialty?.lowercase() ?: ""
            val name = doc.name.lowercase()
            
            q.contains(spec) || q.contains(name) || (doc.clinicStatus == "Available" && q.contains("available"))
        }

        return if (matched.isEmpty()) {
            AssistantResponse("I couldn't find any clinicians matching those criteria in the directory.", AssistantIntent.DOCTOR_SEARCH)
        } else {
            AssistantResponse("I found ${matched.size} clinicians matching your search.", AssistantIntent.DOCTOR_SEARCH, matched.take(5))
        }
    }

    private fun isMedicalDiagnostic(q: String): Boolean {
        val diagnosticKeywords = listOf("diagnose", "treatment", "medicine", "dosage", "cure", "pain", "fever", "sick", "symptom", "illness")
        return diagnosticKeywords.any { q.contains(it) } && !q.contains("leave") && !q.contains("coverage")
    }

    private fun isSpecialtySearch(q: String): Boolean {
        val specialties = listOf("cardio", "surgeon", "pediatric", "general", "medicine", "ortho", "neuro", "derma")
        return specialties.any { q.contains(it) }
    }

    private fun formatDate(timestamp: Long): String {
        return try {
            val sdf = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
            sdf.format(Date(timestamp))
        } catch (e: Exception) {
            "Unknown Date"
        }
    }
}
