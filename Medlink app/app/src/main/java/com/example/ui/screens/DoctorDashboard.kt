package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.EventNote
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.MedLinkViewModel

@Composable
fun DoctorDashboardScreen(
    viewModel: MedLinkViewModel,
    onLogout: () -> Unit
) {
    val userDetails by viewModel.userDetails.collectAsState()
    
    var activeTab by remember { mutableStateOf("dashboard") }
    var chattingWith by remember { mutableStateOf<User?>(null) }
    var viewingProfile by remember { mutableStateOf<User?>(null) }
    var isChangingPassword by remember { mutableStateOf(false) }

    // Clear dashboard notifications when viewed to stop showing the badge
    LaunchedEffect(activeTab) {
        if (activeTab == "dashboard") {
            viewModel.markNotificationsRead()
        }
    }

    if (chattingWith != null) {
        BackHandler { chattingWith = null }
        ChatScreen(viewModel = viewModel, otherUser = chattingWith!!, onBack = { chattingWith = null })
    } else if (viewingProfile != null) {
        BackHandler { viewingProfile = null }
        DoctorPublicProfileView(viewModel = viewModel, doctor = viewingProfile!!, onBack = { viewingProfile = null })
    } else if (isChangingPassword) {
        BackHandler { isChangingPassword = false }
        ChangePasswordScreen(viewModel = viewModel, onBack = { isChangingPassword = false })
    } else if (activeTab == "notifications") {
        BackHandler { activeTab = "dashboard" }
        NotificationsView(viewModel = viewModel, onBack = { activeTab = "dashboard" })
    } else if (activeTab == "ai_assistant") {
        BackHandler { activeTab = "dashboard" }
        DoctorAIView(
            viewModel = viewModel,
            onChatOpen = { chattingWith = it },
            onViewProfile = { viewingProfile = it },
            onBack = { activeTab = "dashboard" }
        )
    } else {
        // Generic handler for internal Scaffold tabs
        BackHandler(enabled = activeTab != "dashboard") {
            activeTab = "dashboard"
        }
        Scaffold(
            bottomBar = {
                NavigationBar(
                    containerColor = Color.White,
                    tonalElevation = 8.dp,
                    modifier = Modifier.clip(RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp))
                ) {
                    val items = listOf(
                        Triple("dashboard", "Dashboard", Icons.Default.Dashboard),
                        Triple("coverage_opps", "Coverage", Icons.Default.Group),
                        Triple("ai_assistant", "Assistant", Icons.Default.SmartToy),
                        Triple("messages", "Chats", Icons.Default.ChatBubble),
                        Triple("profile", "Profile", Icons.Default.Person)
                    )
                    items.forEach { (id, label, icon) ->
                        NavigationBarItem(
                            selected = activeTab == id,
                            onClick = { activeTab = id },
                            icon = {
                                Icon(icon, contentDescription = label)
                            },
                            label = { Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = PolishSky,
                                selectedTextColor = PolishSky,
                                indicatorColor = PolishSkyLight
                            )
                        )
                    }
                }
            },
            containerColor = PolishBg
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                when (activeTab) {
                    "dashboard" -> DoctorDashboardHomeView(
                        viewModel = viewModel, 
                        userDetails = userDetails, 
                        onNavigate = { activeTab = it },
                        onChatOpen = { chattingWith = it }
                    )
                    "coverage_opps" -> AllCoverageRequestsScreen(
                        viewModel = viewModel, 
                        onChatOpen = { chattingWith = it },
                        onViewProfile = { viewingProfile = it },
                        onBack = { activeTab = "dashboard" }
                    )
                    "messages" -> RecentChatsScreen(
                        viewModel = viewModel,
                        onChatOpen = { chattingWith = it },
                        onNewChat = { activeTab = "quick_messages" },
                        onBack = { activeTab = "dashboard" }
                    )
                    "quick_messages" -> DoctorDirectoryScreen(
                        viewModel = viewModel,
                        onChatOpen = { chattingWith = it },
                        onViewProfile = { viewingProfile = it },
                        onBack = { activeTab = "dashboard" }
                    )
                    "profile" -> DoctorSettingsView(
                        viewModel = viewModel, 
                        user = userDetails, 
                        onChangePassword = { isChangingPassword = true },
                        onLogout = onLogout
                    )
                    "request_leave" -> RequestCoverageScreen(viewModel, onBack = { activeTab = "dashboard" })
                    "my_leave_status" -> MyLeaveStatusScreen(
                        viewModel = viewModel, 
                        onViewProfile = { user -> viewingProfile = user },
                        onBack = { activeTab = "dashboard" }
                    )
                    "leave_history" -> LeaveHistoryScreen(
                        viewModel = viewModel, 
                        onViewProfile = { user -> viewingProfile = user },
                        onBack = { activeTab = "dashboard" }
                    )
                    "coverage_duties" -> MyActiveDutiesScreen(
                        viewModel = viewModel, 
                        onChatOpen = { user -> chattingWith = user },
                        onViewProfile = { user -> viewingProfile = user },
                        onBack = { activeTab = "dashboard" }
                    )
                    "duty_history" -> DutyHistoryScreen(
                        viewModel = viewModel, 
                        onChatOpen = { user -> chattingWith = user },
                        onViewProfile = { user -> viewingProfile = user },
                        onBack = { activeTab = "dashboard" }
                    )
                    "analytics" -> CoverageAnalyticsView(viewModel, onBack = { activeTab = "dashboard" })
                    "coverage_calendar" -> CoverageCalendarView(viewModel, onBack = { activeTab = "dashboard" })
                }
            }
        }
    }
}

@Composable
fun DoctorDashboardHomeView(
    viewModel: MedLinkViewModel,
    userDetails: User?,
    onNavigate: (String) -> Unit,
    onChatOpen: (User) -> Unit
) {
    val opportunitiesCount by viewModel.coverageOpportunitiesCount.collectAsState()
    val myPendingCount by viewModel.myPendingLeavesCount.collectAsState()
    val myApprovedCount by viewModel.myApprovedLeavesCount.collectAsState()
    val myCompletedCount by viewModel.myCompletedLeavesCount.collectAsState()
    val activeDutiesCount by viewModel.activeCoverageDutiesCount.collectAsState()
    val completedDutiesCount by viewModel.completedCoverageDutiesCount.collectAsState()
    val unreadNotifications by viewModel.unreadNotificationCount.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        // 1. DASHBOARD HEADER
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = CircleShape,
                    modifier = Modifier
                        .size(44.dp)
                        .clickable { onNavigate("profile") },
                    color = Color(0xFFF1F5F9)
                ) {
                    AsyncImage(
                        model = userDetails?.avatarUrl,
                        contentDescription = "Profile",
                        contentScale = ContentScale.Crop,
                        placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                        error = rememberVectorPainter(Icons.Default.AccountCircle)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Switch(
                    checked = userDetails?.clinicStatus == "Available",
                    onCheckedChange = { viewModel.toggleClinicStatus() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = Color(0xFF10B981)
                    ),
                    modifier = Modifier.scale(0.7f)
                )
            }

            IconButton(onClick = { onNavigate("notifications") }) {
                BadgedBox(
                    badge = {
                        if (unreadNotifications > 0) {
                            Badge { Text(unreadNotifications.toString()) }
                        }
                    }
                ) {
                    Icon(Icons.Default.Notifications, null, tint = PolishDarkSlate)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 2. WELCOME TEXT
        Text(
            text = "Welcome, Dr. ${userDetails?.name ?: "User"} 👋",
            fontSize = 26.sp,
            fontWeight = FontWeight.Black,
            color = PolishDarkSlate
        )
        Text(
            text = "Your Coverage. Our Continuity. Better Healthcare.",
            fontSize = 13.sp,
            color = Color.Gray,
            modifier = Modifier.padding(top = 4.dp)
        )

        Spacer(modifier = Modifier.height(28.dp))

        // 3. MEDICAL LICENSE & STATUS ROW
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.weight(1.1f).height(120.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.VerifiedUser, null, tint = Color.White.copy(0.6f), modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.6.dp))
                        Text("MEDICAL LICENSE", color = Color.White.copy(0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                    Column {
                        Text(
                            text = userDetails?.licenseNumber ?: "Not available",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black
                        )
                        if (userDetails?.verified == true) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                                Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(10.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Verified", color = Color(0xFF10B981), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = if (userDetails?.clinicStatus == "Available") Color(0xFFDCFCE7) else Color(0xFFF1F5F9)),
                modifier = Modifier.weight(1f).height(120.dp).clickable { viewModel.toggleClinicStatus() }
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        "STATUS",
                        color = if (userDetails?.clinicStatus == "Available") Color(0xFF166534) else Color.Gray,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(if (userDetails?.clinicStatus == "Available") Color(0xFF10B981) else Color.Gray))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = userDetails?.clinicStatus ?: "Offline",
                                color = if (userDetails?.clinicStatus == "Available") Color(0xFF166534) else PolishDarkSlate,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                        Text("Tap to toggle", fontSize = 8.sp, color = Color.Gray.copy(0.7f))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 4. PRACTITIONER SUMMARY
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
                .clickable { onNavigate("profile") }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("PRACTITIONER SUMMARY", color = PolishSky, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = PolishBg, modifier = Modifier.size(70.dp)) {
                        AsyncImage(
                            model = userDetails?.avatarUrl,
                            contentDescription = "Profile",
                            contentScale = ContentScale.Crop,
                            placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                            error = rememberVectorPainter(Icons.Default.AccountCircle)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(userDetails?.name ?: "Dr. User", fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Text(userDetails?.specialty ?: "Not available", fontSize = 12.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                            Icon(Icons.Default.Star, null, tint = Color(0xFFFACC15), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${userDetails?.averageRatingFloat ?: 0.0} (${userDetails?.totalReviewsInt ?: 0} Reviews)",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = PolishDarkSlate
                            )
                        }
                        Text("Dept: ${userDetails?.department ?: "Not available"}", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
                        Text("Hosp: ${userDetails?.hospitalName ?: "Not available"}", fontSize = 11.sp, color = Color.Gray)
                        Text("Exp: ${userDetails?.experienceInt ?: 0} Years", fontSize = 11.sp, color = Color.Gray)
                    }
                    Icon(Icons.Default.ChevronRight, null, tint = Color.LightGray)
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // 5. QUICK OVERVIEW
        Text("QUICK OVERVIEW", fontSize = 14.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))

        val overviewCards = listOf(
            OverviewCardData(
                title = "My Leave Requests",
                value = (myPendingCount + myApprovedCount).toString(),
                subText = "$myPendingCount Pending • $myApprovedCount Approved",
                icon = Icons.Default.AssignmentInd,
                bgColor = Color(0xFFFEF3C7),
                iconColor = Color(0xFF9A3412),
                target = "my_leave_status"
            ),
            OverviewCardData(
                title = "Coverage Requests",
                value = opportunitiesCount.toString(),
                subText = "Available from peers",
                icon = Icons.Default.People,
                bgColor = Color(0xFFEFF6FF),
                iconColor = Color(0xFF1E40AF),
                target = "coverage_opps"
            ),
            OverviewCardData(
                title = "My Coverage Duties",
                value = activeDutiesCount.toString(),
                subText = "Active assignments",
                icon = Icons.Default.Shield,
                bgColor = Color(0xFFF3E8FF),
                iconColor = Color(0xFF5B21B6),
                target = "coverage_duties"
            ),
            OverviewCardData(
                title = "Leave History",
                value = myCompletedCount.toString(),
                subText = "Your finished requests",
                icon = Icons.AutoMirrored.Filled.EventNote,
                bgColor = Color(0xFFF1F5F9),
                iconColor = Color.Gray,
                target = "leave_history"
            ),
            OverviewCardData(
                title = "Duty History",
                value = completedDutiesCount.toString(),
                subText = "Your finished duties",
                icon = Icons.Default.History,
                bgColor = Color(0xFFF8FAFC),
                iconColor = PolishSky,
                target = "duty_history"
            )
        )

        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            overviewCards.forEach { card ->
                DashboardOverviewCard(card) { onNavigate(card.target) }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))


        // 7. QUICK ACTIONS GRID
        Text("QUICK ACTIONS", fontSize = 14.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(16.dp))

        val actions = listOf(
            ActionItem("Request Leave", "Submit clinical request", Icons.Default.EventNote, Color(0xFFF0FDF4), Color(0xFF166534), 0, "request_leave"),
            ActionItem("Coverage Requests", "Available shifts from peers", Icons.Default.People, Color(0xFFEFF6FF), Color(0xFF1E40AF), opportunitiesCount, "coverage_opps"),
            ActionItem("My Leave Status", "Manage active requests", Icons.Default.AssignmentInd, Color(0xFFFEF3C7), Color(0xFF9A3412), 0, "my_leave_status"),
            ActionItem("Leave History", "View finished requests", Icons.AutoMirrored.Filled.EventNote, Color(0xFFF1F5F9), Color.Gray, 0, "leave_history"),
            ActionItem("Coverage Duties", "Ongoing assignments", Icons.Default.Shield, Color(0xFFF3E8FF), Color(0xFF5B21B6), 0, "coverage_duties"),
            ActionItem("Duty History", "Your finished duties", Icons.Default.History, Color(0xFFF8FAFC), PolishSky, 0, "duty_history"),
            ActionItem("Coverage Calendar", "Operations on specific dates", Icons.Default.CalendarMonth, Color(0xFFF5F3FF), Color(0xFF7C3AED), 0, "coverage_calendar"),
            ActionItem("Clinician Directory", "Search professional network", Icons.Default.Badge, Color(0xFFFFFBEB), Color(0xFFD97706), 0, "quick_messages"),
            ActionItem("Clinical Assistant", "Ops AI decision support", Icons.Default.SmartToy, Color(0xFFEEF2FF), Color(0xFF3730A3), 0, "ai_assistant")
        )

        val columns = 2 
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            for (i in actions.indices step columns) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                    for (j in 0 until columns) {
                        if (i + j < actions.size) {
                            ActionCard(actions[i + j], modifier = Modifier.weight(1f), onClick = { onNavigate(actions[i+j].target) })
                        } else {
                            // Provide an empty weight for alignment
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // 8. SHIFT COVERAGE ANALYTICS & AUDIT
        ShiftCoverageAnalyticsSection(viewModel)
        
        Spacer(modifier = Modifier.height(48.dp))
    }
}

data class ActionItem(
    val title: String,
    val desc: String,
    val icon: ImageVector,
    val bgColor: Color,
    val iconColor: Color,
    val badge: Int,
    val target: String
)

@Composable
fun ActionCard(item: ActionItem, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = modifier.height(140.dp).border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp)),
        onClick = {
            android.util.Log.d("LEAVE_NAV_DEBUG", "========== NAVIGATION DEBUG ==========")
            android.util.Log.d("LEAVE_NAV_DEBUG", "Source: Dashboard")
            android.util.Log.d("LEAVE_NAV_DEBUG", "Clicked: ${item.title}")
            android.util.Log.d("LEAVE_NAV_DEBUG", "Destination route: ${item.target}")
            onClick()
        }
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(12.dp)) {
            if (item.badge > 0) {
                Surface(
                    shape = CircleShape,
                    color = Color.Red,
                    modifier = Modifier.size(18.dp).align(Alignment.TopEnd)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(item.badge.toString(), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Column(verticalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxSize()) {
                Surface(shape = RoundedCornerShape(12.dp), color = item.bgColor, modifier = Modifier.size(40.dp)) {
                    Icon(item.icon, null, tint = item.iconColor, modifier = Modifier.padding(10.dp))
                }
                Column {
                    Text(item.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate, lineHeight = 16.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(item.desc, fontSize = 9.sp, color = Color.Gray, lineHeight = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

@Composable
fun ShiftCoverageAnalyticsSection(viewModel: MedLinkViewModel) {
    val shiftBalance by viewModel.shiftBalance.collectAsState()
    val dutyHours by viewModel.totalVolunteeredHours.collectAsState()
    val assignedShifts by viewModel.activeCoverageDutiesCount.collectAsState()
    val volunteerOffers by viewModel.totalVolunteerOffers.collectAsState()
    val fulfillmentMetrics by viewModel.networkFulfillmentMetrics.collectAsState()
    val specialtyBreakdown by viewModel.specialtyCoverageBreakdown.collectAsState()

    Column(modifier = Modifier.fillMaxWidth()) {
        Text("SHIFT COVERAGE ANALYTICS & AUDIT", fontSize = 14.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
        Text(
            text = "Shift balance reports, duty hours tracking, and network coverage metrics calculated live from Firestore.",
            fontSize = 10.sp,
            color = Color.Gray,
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        // Analytics Cards Grid
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            AnalyticsCard(
                title = "Shift Balance",
                value = if (shiftBalance >= 0) "+$shiftBalance Surplus" else "$shiftBalance Deficit",
                icon = Icons.Default.Balance,
                color = if (shiftBalance >= 0) Color(0xFF10B981) else Color(0xFFEF4444),
                modifier = Modifier.weight(1f)
            )
            AnalyticsCard(
                title = "Volunteered Duty",
                value = "$dutyHours hrs",
                icon = Icons.Default.History,
                color = PolishSky,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            AnalyticsCard(
                title = "Assigned Shifts",
                value = "$assignedShifts",
                icon = Icons.Default.AssignmentTurnedIn,
                color = Color(0xFF8B5CF6),
                modifier = Modifier.weight(1f)
            )
            AnalyticsCard(
                title = "Volunteer Offers",
                value = "${volunteerOffers.first}",
                subValue = "${volunteerOffers.second} approved",
                icon = Icons.Default.VolunteerActivism,
                color = Color(0xFFEC4899),
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        AnalyticsCard(
            title = "Network Fulfillment Rate",
            value = "${fulfillmentMetrics.first}%",
            subValue = "${fulfillmentMetrics.second} of ${fulfillmentMetrics.third} requests fulfilled",
            icon = Icons.AutoMirrored.Filled.TrendingUp,
            color = Color(0xFFF59E0B),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Specialty Breakdown Section
        Text("SPECIALTY SHIFT COVERAGE BREAKDOWN", fontSize = 12.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
        Spacer(modifier = Modifier.height(12.dp))

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (specialtyBreakdown.isEmpty()) {
                    Text("No clinical data available for breakdown.", fontSize = 11.sp, color = Color.Gray)
                } else {
                    specialtyBreakdown.forEach { (specialty, stats) ->
                        val fulfilled = stats.first
                        val total = stats.second
                        val rate = if (total > 0) (fulfilled.toDouble() / total * 100).toInt() else 0
                        
                        SpecialtyBreakdownRow(
                            label = specialty.ifBlank { "Unspecified" },
                            countText = "$fulfilled/$total",
                            percentageText = "($rate% Covered)"
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AnalyticsCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    subValue: String? = null,
    icon: ImageVector,
    color: Color
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = modifier.border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Surface(shape = RoundedCornerShape(10.dp), color = color.copy(alpha = 0.1f), modifier = Modifier.size(36.dp)) {
                Icon(icon, null, tint = color, modifier = Modifier.padding(8.dp))
            }
            Column {
                Text(title, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
                if (subValue != null) {
                    Text(subValue, fontSize = 9.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun SpecialtyBreakdownRow(label: String, countText: String, percentageText: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate, modifier = Modifier.weight(1f))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(countText, fontSize = 12.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
            Spacer(modifier = Modifier.width(8.dp))
            Text(percentageText, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = PolishSky)
        }
    }
}


data class OverviewCardData(
    val title: String,
    val value: String,
    val subText: String,
    val icon: ImageVector,
    val bgColor: Color,
    val iconColor: Color,
    val target: String
)

@Composable
fun DashboardOverviewCard(data: OverviewCardData, onClick: () -> Unit) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier
            .width(160.dp)
            .height(180.dp)
            .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = data.bgColor,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(data.icon, null, tint = data.iconColor, modifier = Modifier.padding(10.dp))
            }
            
            Column {
                Text(
                    text = data.value,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    color = PolishDarkSlate
                )
                Text(
                    text = data.title,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PolishDarkSlate,
                    modifier = Modifier.padding(top = 2.dp)
                )
                Text(
                    text = data.subText,
                    fontSize = 9.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 4.dp),
                    lineHeight = 12.sp
                )
            }
        }
    }
}

