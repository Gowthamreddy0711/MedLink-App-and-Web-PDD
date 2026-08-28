package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.MedLinkViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorAIView(
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val chatHistory by viewModel.aiChatHistory.collectAsState()
    val loading by viewModel.aiConsultationLoading.collectAsState()
    val userDetails by viewModel.userDetails.collectAsState()
    var userPrompt by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Auto-scroll logic
    LaunchedEffect(chatHistory.size, loading) {
        if (chatHistory.isNotEmpty()) {
            listState.animateScrollToItem(chatHistory.size)
        }
    }

    // FIXED ARCHITECTURE: Column root with weight(1f) to ensure no overlap and perfect keyboard anchoring.
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PolishBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        // 1. TOP APP BAR
        Surface(
            color = Color.White,
            shadowElevation = 1.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = PolishDarkSlate)
                }
                Column(modifier = Modifier.weight(1f).padding(start = 4.dp)) {
                    Text(
                        text = "MedLink Assistant",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        color = PolishDarkSlate
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF10B981)))
                        Spacer(modifier = Modifier.width(6.6.dp))
                        Text(
                            text = "Smart Clinical Assistant • Ready",
                            fontSize = 10.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                IconButton(onClick = { /* History placeholder */ }) {
                    Icon(Icons.Default.ChatBubbleOutline, null, tint = PolishDarkSlate)
                }
            }
        }

        // 2. CONTENT AREA
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            if (chatHistory.isEmpty()) {
                ClinicalWelcomeDashboard(
                    doctorName = userDetails?.name ?: "Doctor",
                    userPrompt = userPrompt,
                    onPromptChange = { userPrompt = it },
                    onSend = {
                        if (userPrompt.isNotBlank()) {
                            viewModel.initiateAIConsultationMessage(userPrompt)
                            userPrompt = ""
                        }
                    },
                    isLoading = loading,
                    onActionClick = { viewModel.initiateAIConsultationMessage(it) }
                )
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    items(chatHistory) { msg ->
                        if (msg.role == "user") {
                            UserBubble(msg.content)
                        } else {
                            AssistantStructuredResponse(msg, viewModel, onChatOpen, onViewProfile)
                        }
                    }

                    if (loading) {
                        item {
                            CheckingIndicator()
                        }
                    }
                }
            }
        }

        // 3. ANCHORED INPUT AREA (Always at bottom of Column in Chat State)
        if (chatHistory.isNotEmpty()) {
            Surface(
                color = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                AssistantInputArea(
                    value = userPrompt,
                    onValueChange = { userPrompt = it },
                    onSend = {
                        if (userPrompt.isNotBlank()) {
                            viewModel.initiateAIConsultationMessage(userPrompt)
                            userPrompt = ""
                        }
                    },
                    isLoading = loading,
                    isBottomBar = true
                )
            }
        }
    }
}

@Composable
fun ClinicalWelcomeDashboard(
    doctorName: String,
    userPrompt: String,
    onPromptChange: (String) -> Unit,
    onSend: () -> Unit,
    isLoading: Boolean,
    onActionClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        PrivacyStatusBanner()

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Hello, Dr. ${doctorName.split(" ").firstOrNull() ?: doctorName} 👋",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = PolishDarkSlate
        )
        Text(
            text = "How can I help you today?",
            fontSize = 15.sp,
            color = Color.Gray,
            modifier = Modifier.padding(top = 4.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        AssistantInputArea(
            value = userPrompt,
            onValueChange = onPromptChange,
            onSend = onSend,
            isLoading = isLoading,
            isBottomBar = false
        )

        Spacer(modifier = Modifier.height(32.dp))

        Text("Quick Actions", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))

        val actions = listOf(
            ActionUiConfig("My Duties", "View upcoming coverages", Icons.Outlined.Assignment, Color(0xFFEFF6FF), PolishSky),
            ActionUiConfig("Find Coverage", "Find available doctors", Icons.Outlined.Groups, Color(0xFFF5F3FF), Color(0xFF8B5CF6)),
            ActionUiConfig("Leave Status", "Check leave requests", Icons.Outlined.CheckCircle, Color(0xFFECFDF5), Color(0xFF10B981)),
            ActionUiConfig("Clinical AI", "Ask clinical questions", Icons.Outlined.Psychology, Color(0xFFFFF1F2), Color(0xFFF43F5E)),
            ActionUiConfig("Directory", "Search doctors", Icons.Outlined.Badge, Color(0xFFFFFBEB), Color(0xFFF59E0B)),
            ActionUiConfig("Notices", "Latest hospital alerts", Icons.Outlined.Campaign, Color(0xFFEFF6FF), Color(0xFF3B82F6))
        )

        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            for (i in actions.indices step 2) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                    ActionCardItem(actions[i], Modifier.weight(1f)) { onActionClick(actions[i].title) }
                    if (i + 1 < actions.size) {
                        ActionCardItem(actions[i + 1], Modifier.weight(1f)) { onActionClick(actions[i + 1].title) }
                    } else {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        Text("Try asking", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
        Spacer(modifier = Modifier.height(12.dp))
        
        val suggestions = listOf(
            "Who can cover my shift tomorrow?",
            "Show available cardiologists",
            "What is my leave status?",
            "Show latest hospital notices"
        )
        
        suggestions.forEach { suggestion ->
            SuggestionChipRow(suggestion) { onActionClick(suggestion) }
            Spacer(modifier = Modifier.height(8.dp))
        }
        
        Spacer(modifier = Modifier.height(40.dp))
    }
}

data class ActionUiConfig(
    val title: String,
    val desc: String,
    val icon: ImageVector,
    val bgColor: Color,
    val iconColor: Color
)

@Composable
fun ActionCardItem(config: ActionUiConfig, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier.border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Surface(
                shape = CircleShape,
                color = config.bgColor,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(config.icon, null, tint = config.iconColor, modifier = Modifier.padding(10.dp))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(config.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
            Text(config.desc, fontSize = 11.sp, color = Color.Gray, lineHeight = 14.sp, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
fun SuggestionChipRow(label: String, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AutoAwesome, null, tint = PolishSky, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Text(text = label, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = PolishDarkSlate)
            }
            Icon(Icons.Default.ChevronRight, null, tint = Color.LightGray, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
fun UserBubble(content: String) {
    Column(modifier = Modifier.fillMaxWidth().padding(start = 64.dp), horizontalAlignment = Alignment.End) {
        Surface(
            color = PolishSky,
            shape = RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp, bottomEnd = 4.dp)
        ) {
            Text(
                text = content,
                color = Color.White,
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
            )
        }
        Text(
            text = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date()),
            fontSize = 9.sp,
            color = Color.Gray,
            modifier = Modifier.padding(top = 4.dp, end = 4.dp)
        )
    }
}

@Composable
fun AssistantStructuredResponse(
    message: LocalChatMessage,
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(end = 40.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(color = PolishSky, shape = CircleShape, modifier = Modifier.size(18.dp)) {
                Icon(Icons.Default.Shield, null, tint = Color.White, modifier = Modifier.padding(4.dp))
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Assistant", fontSize = 10.sp, fontWeight = FontWeight.Black, color = PolishSky, letterSpacing = 1.sp)
        }

        AssistantBaseCard(message.content)

        if (message.structuredData.isNotEmpty()) {
            when (message.intent) {
                AssistantIntent.DOCTOR_SEARCH -> {
                    RichDoctorsResults(message.structuredData.filterIsInstance<User>(), onChatOpen, onViewProfile)
                }
                AssistantIntent.COVERAGE_OPEN -> {
                    RichCoverageResults(message.structuredData.filterIsInstance<LeaveRequest>())
                }
                AssistantIntent.LEAVE_STATUS -> {
                    RichLeaveResults(message.structuredData.filterIsInstance<LeaveRequest>())
                }
                AssistantIntent.APPOINTMENTS -> {
                    RichAppointmentResults(message.structuredData.filterIsInstance<Appointment>())
                }
                AssistantIntent.HOSPITAL_NOTICES -> {
                    RichNoticeResults(message.structuredData.filterIsInstance<HospitalNotice>())
                }
                AssistantIntent.MESSAGES -> {
                    RichChatResults(message.structuredData.filterIsInstance<ChatRoom>(), onChatOpen, viewModel)
                }
                AssistantIntent.PROFILE -> {
                    val user = message.structuredData.filterIsInstance<User>().firstOrNull()
                    if (user != null) RichProfileSummary(user)
                }
                else -> { /* No structured rendering */ }
            }
        }
    }
}

@Composable
fun AssistantBaseCard(content: String) {
    Card(
        shape = RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 4.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp, bottomStart = 4.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            FormattedAssistantTextContent(content)
        }
    }
}

@Composable
fun RichDoctorsResults(
    doctors: List<User>,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        doctors.take(3).forEach { doctor ->
            Card(
                onClick = { onViewProfile(doctor) },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(
                        model = doctor.avatarUrl,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp).clip(CircleShape).border(1.dp, PolishBg, CircleShape),
                        contentScale = ContentScale.Crop,
                        placeholder = painterResource(R.drawable.medlink_logo)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Dr. ${doctor.name}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(doctor.specialty ?: "General Medicine", fontSize = 11.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                        Text(doctor.hospitalName ?: "City Hospital", fontSize = 10.sp, color = Color.Gray)
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(if (doctor.clinicStatus == "Available") Color(0xFF10B981) else Color.Gray))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(doctor.clinicStatus, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (doctor.clinicStatus == "Available") Color(0xFF166534) else Color.Gray)
                        }
                    }
                    Row {
                        IconButton(onClick = { onChatOpen(doctor) }) { Icon(Icons.Default.ChatBubbleOutline, null, tint = PolishSky, modifier = Modifier.size(18.dp)) }
                        IconButton(onClick = { onViewProfile(doctor) }) { Icon(Icons.Default.ArrowForward, null, tint = PolishSky, modifier = Modifier.size(18.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
fun RichCoverageResults(requests: List<LeaveRequest>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        requests.take(3).forEach { req ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = CircleShape, color = PolishSky.copy(0.1f), modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.People, null, tint = PolishSky, modifier = Modifier.padding(6.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Dr. ${req.doctorName}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(req.specialization, fontSize = 11.sp, color = PolishSky)
                        }
                        Surface(shape = RoundedCornerShape(6.dp), color = Color(0xFFFEE2E2)) {
                            Text(req.priority, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color(0xFF991B1B))
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("${req.coverageType} Coverage", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text("Duration: ${req.leaveDuration}", fontSize = 11.sp, color = Color.Gray)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { /* Navigate to Details */ }, shape = RoundedCornerShape(8.dp), modifier = Modifier.fillMaxWidth().height(36.dp), contentPadding = PaddingValues(0.dp)) {
                        Text("View Request Details", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun RichLeaveResults(requests: List<LeaveRequest>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        requests.take(3).forEach { req ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    val statusColor = when(req.status) {
                        "ACCEPTED", "IN_PROGRESS", "COMPLETED" -> Color(0xFF10B981)
                        "OPEN", "PENDING" -> Color(0xFFF59E0B)
                        else -> Color.Gray
                    }
                    Box(modifier = Modifier.size(4.dp, 40.dp).clip(CircleShape).background(statusColor))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(req.leaveType, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(req.leaveDuration, fontSize = 11.sp, color = Color.Gray)
                        Text("Status: ${req.status}", fontSize = 10.sp, fontWeight = FontWeight.Black, color = statusColor)
                    }
                    Icon(Icons.Default.ChevronRight, null, tint = Color.LightGray)
                }
            }
        }
    }
}

@Composable
fun RichAppointmentResults(appts: List<Appointment>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        appts.take(3).forEach { appt ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = CircleShape, color = Color(0xFFF1F5F9), modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.Person, null, tint = Color.Gray, modifier = Modifier.padding(6.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(appt.patientName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(appt.type, fontSize = 11.sp, color = PolishSky)
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Event, null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(appt.date, fontSize = 11.sp, color = Color.Gray)
                        Spacer(modifier = Modifier.width(16.dp))
                        Icon(Icons.Default.Schedule, null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(appt.time, fontSize = 11.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun RichNoticeResults(notices: List<HospitalNotice>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        notices.take(3).forEach { notice ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(notice.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text(notice.content, fontSize = 11.sp, color = Color.Gray, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Published on MedLink Network", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = PolishSky)
                }
            }
        }
    }
}

@Composable
fun RichChatResults(rooms: List<ChatRoom>, onChatOpen: (User) -> Unit, viewModel: MedLinkViewModel) {
    val doctors by viewModel.doctorsList.collectAsState()
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        rooms.take(3).forEach { room ->
            val otherId = room.participants.find { it != viewModel.currentUser.value.id }
            val doctor = doctors.find { it.id == otherId }
            if (doctor != null) {
                Card(
                    onClick = { onChatOpen(doctor) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(model = doctor.avatarUrl, contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Dr. ${doctor.name}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(room.lastMessage, fontSize = 11.sp, color = Color.Gray, maxLines = 1)
                        }
                        Icon(Icons.Default.ChatBubbleOutline, null, tint = PolishSky, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun RichProfileSummary(user: User) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = user.avatarUrl, contentDescription = null, modifier = Modifier.size(56.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("Dr. ${user.name}", fontWeight = FontWeight.Black, fontSize = 16.sp)
                    Text(user.specialty ?: "General Medicine", fontSize = 12.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                    Text(user.qualification ?: "", fontSize = 11.sp, color = Color.Gray)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(12.dp))
            ProfileInfoRow(Icons.Default.Badge, "Reg Num", user.registrationNumber ?: "N/A")
            ProfileInfoRow(Icons.Default.Business, "Hospital", user.hospitalName ?: "N/A")
            ProfileInfoRow(Icons.Default.VerifiedUser, "Status", if (user.verified) "Accredited" else "Pending")
        }
    }
}

@Composable
fun ProfileInfoRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
        Icon(icon, null, tint = Color.Gray, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text("$label: ", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
        Text(value, fontSize = 11.sp, color = PolishDarkSlate, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun CheckingIndicator() {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(8.dp)) {
        CircularProgressIndicator(color = PolishSky, modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
        Spacer(modifier = Modifier.width(10.dp))
        Text("Consulting clinical records...", fontSize = 11.sp, color = Color.Gray)
    }
}

@Composable
fun FormattedAssistantTextContent(text: String) {
    Column {
        text.split("\n").forEach { line ->
            if (line.isNotBlank()) {
                Text(
                    text = line.replace("###", "").replace("**", "").trim(),
                    fontSize = 14.sp,
                    color = PolishDarkSlate,
                    lineHeight = 20.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

@Composable
fun PrivacyStatusBanner() {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFFF1F5F9)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Lock, null, tint = PolishSky, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Private Assistant", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                Text("Powered by real-time MedLink records.", fontSize = 11.sp, color = Color.Gray)
            }
            SecurityCheckBadge("Secure")
        }
    }
}

@Composable
fun SecurityCheckBadge(label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(12.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
    }
}

@Composable
fun AssistantInputArea(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    isLoading: Boolean,
    isBottomBar: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = if (isBottomBar) 16.dp else 0.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isBottomBar) {
            Surface(
                shape = CircleShape,
                color = Color(0xFFF1F5F9),
                modifier = Modifier.size(40.dp)
            ) {
                Icon(Icons.Default.AttachFile, null, tint = Color.Gray, modifier = Modifier.padding(10.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
        } else {
            Icon(Icons.Default.AutoAwesome, null, tint = PolishSky, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(12.dp))
        }

        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text("Ask MedLink Assistant...", fontSize = 14.sp, color = Color.Gray) },
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(24.dp),
            enabled = !isLoading,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PolishSky,
                unfocusedBorderColor = if (isBottomBar) Color(0xFFF1F5F9) else Color(0xFFE2E8F0),
                focusedContainerColor = if (isBottomBar) Color(0xFFF8FAFC) else Color.White,
                unfocusedContainerColor = if (isBottomBar) Color(0xFFF8FAFC) else Color.White
            ),
            maxLines = 3,
            trailingIcon = {
                IconButton(
                    onClick = onSend,
                    enabled = value.isNotBlank() && !isLoading,
                    modifier = Modifier
                        .background(if (value.isNotBlank()) PolishSky else Color(0xFFF1F5F9), CircleShape)
                        .size(32.dp)
                ) {
                    Icon(
                        if (isBottomBar) Icons.AutoMirrored.Filled.Send else Icons.Default.ArrowForward,
                        null, 
                        tint = if (value.isNotBlank()) Color.White else Color.LightGray, 
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        )
    }
}
