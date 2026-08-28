package com.example.ui.screens

import android.util.Log
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.MedLinkViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun AdminDashboardScreen(
    viewModel: MedLinkViewModel,
    onLogout: () -> Unit
) {
    val pendingDoctors by viewModel.pendingDoctors.collectAsState()
    val allDoctors by viewModel.doctorsList.collectAsState()
    val allSystemLeaveRequests by viewModel.allSystemLeaveRequests.collectAsState()
    val activityLogs by viewModel.adminActivityLogs.collectAsState()
    val adminNotifications by viewModel.adminNotifications.collectAsState()
    val adminStats by viewModel.adminStats.collectAsState()
    val complianceError by viewModel.complianceError.collectAsState()
    val complianceSuccess by viewModel.complianceSuccess.collectAsState()
    val adminActionLoading by viewModel.adminActionLoading.collectAsState()
    val userDetails by viewModel.userDetails.collectAsState()
    
    val snackbarHostState = remember { SnackbarHostState() }

    var activeTab by remember { mutableStateOf("compliance") } // compliance, verification, leave_requests, activity_log, notifications, settings
    var verificationSubFilter by remember { mutableStateOf("pending") }
    var selectedDoctorForProfile by remember { mutableStateOf<User?>(null) }
    var isChangingPassword by remember { mutableStateOf(false) }

    LaunchedEffect(complianceError, complianceSuccess) {
        complianceError?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearAuthErrors()
        }
        complianceSuccess?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearAuthErrors()
        }
    }

    if (selectedDoctorForProfile != null) {
        BackHandler { selectedDoctorForProfile = null }
        DoctorPublicProfileView(viewModel = viewModel, doctor = selectedDoctorForProfile!!, onBack = { selectedDoctorForProfile = null })
        LaunchedEffect(selectedDoctorForProfile) {
            viewModel.logDoctorProfileAudit(selectedDoctorForProfile!!)
        }
    } else if (isChangingPassword) {
        BackHandler { isChangingPassword = false }
        ChangePasswordScreen(viewModel = viewModel, onBack = { isChangingPassword = false })
    } else {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            containerColor = PolishBg,
            bottomBar = {
                NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
                    NavigationBarItem(
                        selected = activeTab == "compliance",
                        onClick = { activeTab = "compliance" },
                        icon = { Icon(Icons.Default.Dashboard, null) },
                        label = { Text("Console", fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = PolishSky, selectedTextColor = PolishSky, indicatorColor = PolishSkyLight)
                    )
                    NavigationBarItem(
                        selected = activeTab == "verification",
                        onClick = { activeTab = "verification" },
                        icon = { Icon(Icons.Default.VerifiedUser, null) },
                        label = { Text("Verification", fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = PolishSky, selectedTextColor = PolishSky, indicatorColor = PolishSkyLight)
                    )
                    NavigationBarItem(
                        selected = activeTab == "leave_requests",
                        onClick = { activeTab = "leave_requests" },
                        icon = { Icon(Icons.Default.Analytics, null) },
                        label = { Text("Leave", fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = PolishSky, selectedTextColor = PolishSky, indicatorColor = PolishSkyLight)
                    )
                    NavigationBarItem(
                        selected = activeTab == "activity_log",
                        onClick = { activeTab = "activity_log" },
                        icon = { Icon(Icons.Default.History, null) },
                        label = { Text("Logs", fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = PolishSky, selectedTextColor = PolishSky, indicatorColor = PolishSkyLight)
                    )
                    NavigationBarItem(
                        selected = activeTab == "settings",
                        onClick = { activeTab = "settings" },
                        icon = { Icon(Icons.Default.Settings, null) },
                        label = { Text("Settings", fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = PolishSky, selectedTextColor = PolishSky, indicatorColor = PolishSkyLight)
                    )
                }
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                // MedLinkPro Admin Header
                Surface(
                    color = Color.White,
                    shadowElevation = 1.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.statusBarsPadding().padding(24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("MEDLINKPRO", fontSize = 10.sp, fontWeight = FontWeight.Black, color = PolishSky, letterSpacing = 2.sp)
                            Text(
                                text = when(activeTab) {
                                    "compliance" -> "Compliance Console"
                                    "verification" -> "Doctor Verification"
                                    "leave_requests" -> "Clinical Leave Oversight"
                                    "activity_log" -> "System Activity Logs"
                                    "notifications" -> "Clinical Alerts"
                                    else -> "Admin Settings"
                                },
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = PolishDarkSlate
                            )
                        }
                        IconButton(onClick = onLogout, modifier = Modifier.background(Color(0xFFFEE2E2), RoundedCornerShape(12.dp))) {
                            Icon(Icons.AutoMirrored.Filled.Logout, null, tint = Color.Red)
                        }
                    }
                }

                when (activeTab) {
                    "compliance" -> ComplianceConsoleSection(
                        stats = adminStats,
                        onNavigate = { tab, filter ->
                            activeTab = tab
                            if (filter != null) verificationSubFilter = filter
                        }
                    )
                    "verification" -> DoctorVerificationSection(
                        pending = pendingDoctors,
                        all = allDoctors,
                        loadingId = adminActionLoading,
                        viewModel = viewModel,
                        initialFilter = verificationSubFilter,
                        onViewProfile = { selectedDoctorForProfile = it }
                    )
                    "leave_requests" -> AdminLeaveRequestsSection(allSystemLeaveRequests, allDoctors)
                    "activity_log" -> AdminActivityLogSection(activityLogs)
                    "notifications" -> AdminNotificationsSection(adminNotifications)
                    "settings" -> AdminSettingsSection(userDetails, { isChangingPassword = true }, onLogout)
                }
            }
        }
    }
}

@Composable
fun ComplianceConsoleSection(
    stats: AdminDashboardStats,
    onNavigate: (String, String?) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Clinical Oversight Summary", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))

        // Stats Grid
        val cards = listOf(
            Triple("Pending Review", stats.pendingApprovals.toString(), "pending"),
            Triple("Approved Doctors", stats.approvedDoctors.toString(), "approved"),
            Triple("Rejected Registrations", stats.rejectedDoctors.toString(), "rejected"),
            Triple("Leave Requests", stats.totalLeaveRequests.toString(), null)
        )

        val icons = listOf(Icons.Default.HourglassEmpty, Icons.Default.Verified, Icons.Default.Block, Icons.Default.EventBusy)
        val colors = listOf(Color(0xFFFEF3C7), Color(0xFFDCFCE7), Color(0xFFFEE2E2), Color(0xFFE0F2FE))
        val tintColors = listOf(Color(0xFF9A3412), Color(0xFF166534), Color.Red, PolishSky)

        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            for (i in cards.indices step 2) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                    for (j in 0..1) {
                        if (i + j < cards.size) {
                            val (title, count, filter) = cards[i + j]
                            StatsCard(
                                title = title,
                                count = count,
                                icon = icons[i + j],
                                bgColor = colors[i + j],
                                iconColor = tintColors[i + j],
                                modifier = Modifier.weight(1f),
                                onClick = { 
                                    if (filter != null) onNavigate("verification", filter)
                                    else onNavigate("leave_requests", null)
                                }
                            )
                        } else {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        Text("Quick Oversight", fontWeight = FontWeight.Black, fontSize = 14.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            MiniActionCard(Icons.Default.History, "Recent Logs", Modifier.weight(1f)) { onNavigate("activity_log", null) }
            MiniActionCard(Icons.Default.Notifications, "Alerts", Modifier.weight(1f)) { onNavigate("notifications", null) }
        }
    }
}

@Composable
fun StatsCard(title: String, count: String, icon: ImageVector, bgColor: Color, iconColor: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        modifier = modifier.height(130.dp).border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Surface(shape = RoundedCornerShape(12.dp), color = bgColor, modifier = Modifier.size(40.dp)) {
                Icon(icon, null, tint = iconColor, modifier = Modifier.padding(10.dp))
            }
            Column {
                Text(count, fontSize = 24.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
                Text(title, fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun MiniActionCard(icon: ImageVector, label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier.border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = PolishSky, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
        }
    }
}

@Composable
fun AdminSettingsSection(user: User?, onChangePassword: () -> Unit, onLogout: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Admin Settings", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("ACCOUNT INFORMATION", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = PolishBg, modifier = Modifier.size(50.dp)) {
                        Icon(Icons.Default.AdminPanelSettings, null, tint = PolishSky, modifier = Modifier.padding(12.dp))
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(user?.name ?: "System Administrator", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(user?.email ?: "", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                AdminSettingsActionItem(Icons.Default.Password, "Change Clinical Password", onClick = onChangePassword)
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color(0xFFF1F5F9))
                AdminSettingsActionItem(
                    Icons.AutoMirrored.Filled.Logout, 
                    "Secure Sign Out", 
                    Color.Red, 
                    onClick = onLogout
                )
            }
        }
    }
}

@Composable
fun DoctorVerificationSection(
    pending: List<User>,
    all: List<User>,
    loadingId: String?,
    viewModel: MedLinkViewModel,
    initialFilter: String = "pending",
    onViewProfile: (User) -> Unit
) {
    var subFilter by remember(initialFilter) { mutableStateOf(initialFilter) } // pending, approved, rejected

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Doctor Verification", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))
        
        // Sub-filter Toggle
        Row(
            modifier = Modifier.fillMaxWidth().background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)).padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            val filters = listOf("pending" to "Pending", "approved" to "Approved", "rejected" to "Rejected")
            filters.forEach { (id, label) ->
                val isSelected = subFilter == id
                Button(
                    onClick = { subFilter = id },
                    modifier = Modifier.weight(1f).height(36.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) Color.White else Color.Transparent,
                        contentColor = if (isSelected) PolishSky else Color.Gray
                    ),
                    elevation = if (isSelected) ButtonDefaults.buttonElevation(defaultElevation = 2.dp) else null,
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        val filteredList = when(subFilter) {
            "pending" -> pending
            "approved" -> all.filter { it.approvalStatus == "APPROVED" }
            "rejected" -> all.filter { it.approvalStatus == "REJECTED" }
            else -> emptyList()
        }

        if (filteredList.isEmpty()) {
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Group, null, modifier = Modifier.size(48.dp), tint = Color.LightGray)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No ${subFilter} doctors found.", color = Color.Gray, fontWeight = FontWeight.Medium)
                    Text("The clinical directory is currently empty for this status.", fontSize = 12.sp, color = Color.LightGray)
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                items(filteredList) { doctor ->
                    AdminVerificationCard(
                        doctor = doctor,
                        isLoading = loadingId == doctor.id,
                        showActions = subFilter == "pending",
                        onApprove = { viewModel.reviewDoctorLicense(doctor.id, doctor.name, true) },
                        onReject = { reason -> viewModel.reviewDoctorLicense(doctor.id, doctor.name, false, reason) },
                        onViewProfile = { onViewProfile(doctor) }
                    )
                }
            }
        }
    }
}

@Composable
fun AdminLeaveRequestsSection(requests: List<LeaveRequest>, allDoctors: List<User>) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Leave Requests (Read-Only)", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))
        
        if (requests.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No clinical leave records found.", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(requests) { req ->
                    OversightLeaveCard(req, allDoctors)
                }
            }
        }
    }
}

@Composable
fun OversightLeaveCard(req: LeaveRequest, allDoctors: List<User>) {
    // RESOLVE PHOTO PRIORITY
    val matchingDoctor = allDoctors.find { it.id == req.doctorId }
    val finalPhotoUrl = req.doctorProfilePhoto ?: matchingDoctor?.avatarUrl ?: matchingDoctor?.photoUrl
    
    Log.d("ADMIN_LEAVE_PHOTO_DEBUG", "Leave Request ID: ${req.id} | Doctor: ${req.doctorName} | Request Photo: ${req.doctorProfilePhoto} | Profile Photo: ${matchingDoctor?.avatarUrl} | Final: $finalPhotoUrl")

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // DOCTOR PROFILE PHOTO
                Surface(
                    shape = CircleShape,
                    modifier = Modifier.size(52.dp),
                    color = PolishBg
                ) {
                    if (!finalPhotoUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = finalPhotoUrl,
                            contentDescription = "Doctor Photo",
                            contentScale = ContentScale.Crop,
                            placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                            error = rememberVectorPainter(Icons.Default.AccountCircle)
                        )
                    } else {
                        // INITIALS FALLBACK
                        val initials = req.doctorName.split(" ")
                            .filter { it.isNotBlank() && it.length > 1 }
                            .map { it.take(1).uppercase() }
                            .take(2)
                            .joinToString("")
                        
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Text(
                                text = initials.ifEmpty { "?" },
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                color = PolishSky
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(req.doctorName, fontWeight = FontWeight.Black, fontSize = 15.sp, color = PolishDarkSlate)
                        if (req.priority == "Urgent") {
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(color = Color(0xFFFEE2E2), shape = RoundedCornerShape(4.dp)) {
                                Text("URGENT", modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp), fontSize = 8.sp, fontWeight = FontWeight.Black, color = Color.Red)
                            }
                        }
                    }
                    Text(req.specialization, fontSize = 11.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                }
                Badge(containerColor = when(req.status) {
                    "ACCEPTED", "IN_PROGRESS" -> Color(0xFFDCFCE7)
                    "COMPLETED" -> Color(0xFFF1F5F9)
                    else -> Color(0xFFFEF3C7)
                }) {
                    Text(req.status, modifier = Modifier.padding(4.dp), fontSize = 9.sp, fontWeight = FontWeight.Black, color = if (req.status == "ACCEPTED" || req.status == "IN_PROGRESS") Color(0xFF166534) else Color(0xFF9A3412))
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AdminInfoItem(Icons.Default.CalendarToday, "Period", req.leaveDuration, Modifier.weight(1f))
                AdminInfoItem(Icons.Default.AccessTime, "Shift", req.coverageType, Modifier.weight(1f))
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            AdminInfoItem(Icons.Default.Business, "Site", req.location ?: "N/A", Modifier.fillMaxWidth())
            
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(12.dp))
            
            Text("Reason: ${req.reason}", fontSize = 12.sp, color = Color.Gray)
            if (req.notes.isNotBlank()) {
                Text("Handover: ${req.notes}", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
            }
            
            if (req.approvedDoctorName != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF0FDF4), RoundedCornerShape(8.dp)).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Security, null, tint = Color(0xFF166534), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Covered by Dr. ${req.approvedDoctorName}", fontSize = 11.sp, color = Color(0xFF166534), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AdminInfoItem(icon: ImageVector, label: String, value: String, modifier: Modifier = Modifier) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier) {
        Icon(icon, null, modifier = Modifier.size(16.dp), tint = Color.Gray)
        Spacer(modifier = Modifier.width(6.dp))
        Column {
            Text(label, fontSize = 9.sp, color = Color.Gray)
            Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
fun AdminVerificationCard(
    doctor: User, 
    isLoading: Boolean,
    showActions: Boolean,
    onApprove: () -> Unit, 
    onReject: (String) -> Unit, 
    onViewProfile: () -> Unit
) {
    var showRejectDialog by remember { mutableStateOf(false) }
    var rejectReason by remember { mutableStateOf("") }

    if (showRejectDialog) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            title = { Text("Reject Doctor", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column {
                    Text("Please provide a reason for rejecting Dr. ${doctor.name}. This will be recorded.", fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = rejectReason,
                        onValueChange = { rejectReason = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Reason...") },
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 14.sp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onReject(rejectReason)
                        showRejectDialog = false
                        rejectReason = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                    enabled = rejectReason.isNotBlank()
                ) {
                    Text("Confirm Rejection", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(
                    model = doctor.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier.size(56.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop,
                    placeholder = rememberVectorPainter(Icons.Default.AccountCircle)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(doctor.name, fontWeight = FontWeight.Black, fontSize = 16.sp)
                    Text(doctor.specialty ?: "General Practice", fontSize = 12.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                    Text("Reg: ${doctor.registrationNumber}", fontSize = 11.sp, color = Color.Gray)
                }
                if (!showActions) {
                    Column(horizontalAlignment = Alignment.End) {
                        Badge(containerColor = when(doctor.approvalStatus) {
                            "APPROVED" -> Color(0xFFDCFCE7)
                            "REJECTED" -> Color(0xFFFEE2E2)
                            else -> Color(0xFFF1F5F9)
                        }) {
                            Text(doctor.approvalStatus, modifier = Modifier.padding(4.dp), fontSize = 8.sp, fontWeight = FontWeight.Black, color = if(doctor.approvalStatus == "APPROVED") Color(0xFF166534) else if(doctor.approvalStatus == "REJECTED") Color.Red else Color.Gray)
                        }
                        if (doctor.approvalStatus == "REJECTED" && !doctor.rejectionReason.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Reason: ${doctor.rejectionReason}", fontSize = 9.sp, color = Color.Red, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.width(100.dp))
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = onViewProfile,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    enabled = !isLoading
                ) {
                    Text("Audit Profile", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                }
                
                if (showActions) {
                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Approve", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    
                    IconButton(
                        onClick = { showRejectDialog = true },
                        modifier = Modifier.background(Color(0xFFFEE2E2), RoundedCornerShape(12.dp)),
                        enabled = !isLoading
                    ) {
                        Icon(Icons.Default.Close, null, tint = Color.Red)
                    }
                }
            }
        }
    }
}

@Composable
fun AdminSettingsActionItem(icon: ImageVector, title: String, color: Color = PolishDarkSlate, onClick: () -> Unit = {}) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 12.dp)
    ) {
        Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Color.LightGray, modifier = Modifier.size(16.dp))
    }
}

@Composable
fun AdminActivityLogSection(logs: List<AdminActivityLog>) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Admin Activity Log", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))
        
        if (logs.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No activity logs found.", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(logs) { log ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.History, null, tint = PolishSky, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(log.action, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.weight(1f))
                                val dateStr = java.text.SimpleDateFormat("MMM dd, yyyy HH:mm", java.util.Locale.getDefault()).format(java.util.Date(log.timestampLong))
                                Text(dateStr, fontSize = 10.sp, color = Color.Gray)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("By: ${log.adminName}", fontSize = 12.sp, color = Color.Gray)
                            Text("Doctor: ${log.doctorName}", fontSize = 12.sp, color = Color.Gray)
                            if (!log.reason.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Reason: ${log.reason}", fontSize = 12.sp, color = Color.Red)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AdminNotificationsSection(notifications: List<AdminNotification>) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Admin Alerts & Notifications", fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))
        
        if (notifications.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No notifications found.", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(notifications) { notif ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = if (notif.isRead) Color.White else Color(0xFFF0FDF4)),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Notifications, null, tint = PolishSky, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(notif.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.weight(1f))
                                val dateStr = java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault()).format(java.util.Date(notif.timestampLong))
                                Text(dateStr, fontSize = 10.sp, color = Color.Gray)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(notif.message, fontSize = 12.sp, color = Color.DarkGray)
                        }
                    }
                }
            }
        }
    }
}
