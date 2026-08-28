package com.example.ui.screens

import android.app.DatePickerDialog
import android.content.Intent
import android.widget.Toast
import android.net.Uri
import android.util.Log
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.LeaveRequest
import com.example.data.model.User
import com.example.data.model.Volunteer
import com.example.ui.theme.*
import com.example.ui.viewmodel.MedLinkViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestCoverageScreen(
    viewModel: MedLinkViewModel,
    onBack: () -> Unit
) {
    val doctor by viewModel.userDetails.collectAsState()
    val context = LocalContext.current

    var startDate by remember { mutableStateOf(System.currentTimeMillis()) }
    var endDate by remember { mutableStateOf(System.currentTimeMillis() + 86400000) }
    var leaveType by remember { mutableStateOf("Sick Leave") }
    var reason by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var coverageType by remember { mutableStateOf("Full Day") }
    var priority by remember { mutableStateOf("Normal") }
    var notes by remember { mutableStateOf("") }

    val sdf = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Request Clinical Coverage", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = PolishBg
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Doctor Info Header
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(24.dp))
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, modifier = Modifier.size(60.dp), color = Color(0xFFF1F5F9)) {
                        AsyncImage(
                            model = doctor?.avatarUrl,
                            contentDescription = "Doctor Photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize(),
                            placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                            error = rememberVectorPainter(Icons.Default.AccountCircle)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(doctor?.name ?: "", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(doctor?.specialty ?: "", color = PolishSky, fontSize = 12.sp)
                        Text("Reg: ${doctor?.registrationNumber ?: ""}", color = Color.Gray, fontSize = 11.sp)
                    }
                }
            }

            Text("Leave Details", fontWeight = FontWeight.Bold, color = PolishDarkSlate)

            var showLeaveTypeMenu by remember { mutableStateOf(false) }
            Box {
                OutlinedTextField(
                    value = leaveType,
                    onValueChange = {},
                    label = { Text("Leave Type") },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, Modifier.clickable { showLeaveTypeMenu = true }) }
                )
                DropdownMenu(expanded = showLeaveTypeMenu, onDismissRequest = { showLeaveTypeMenu = false }) {
                    listOf("Sick Leave", "Vacation", "Conference", "Personal", "Emergency").forEach {
                        DropdownMenuItem(text = { Text(it) }, onClick = { leaveType = it; showLeaveTypeMenu = false })
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = {
                        val cal = Calendar.getInstance()
                        val picker = DatePickerDialog(context, { _, y, m, d ->
                            val c = Calendar.getInstance()
                            c.set(y, m, d, 0, 0, 0)
                            startDate = c.timeInMillis
                        }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH))
                        // RESTRICT TO TODAY + FUTURE
                        picker.datePicker.minDate = System.currentTimeMillis() - 1000
                        picker.show()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Start Date", fontSize = 10.sp, color = Color.Gray)
                        Text(sdf.format(Date(startDate)), fontWeight = FontWeight.Bold)
                    }
                }

                OutlinedButton(
                    onClick = {
                        val cal = Calendar.getInstance()
                        val picker = DatePickerDialog(context, { _, y, m, d ->
                            val c = Calendar.getInstance()
                            c.set(y, m, d, 23, 59, 59)
                            endDate = c.timeInMillis
                        }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH))
                        // RESTRICT TO TODAY + FUTURE
                        picker.datePicker.minDate = System.currentTimeMillis() - 1000
                        picker.show()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("End Date", fontSize = 10.sp, color = Color.Gray)
                        Text(sdf.format(Date(endDate)), fontWeight = FontWeight.Bold)
                    }
                }
            }

            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it },
                label = { Text("Reason for Leave") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Text("Operational Site", fontWeight = FontWeight.Bold, color = PolishDarkSlate)

            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                label = { Text("Hospital/Clinic Location") },
                placeholder = { Text("e.g. Saveetha Hospital, Chennai") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                leadingIcon = { Icon(Icons.Default.LocationOn, null, tint = PolishSky) }
            )

            Text("Coverage Details", fontWeight = FontWeight.Bold, color = PolishDarkSlate)

            var showTypeMenu by remember { mutableStateOf(false) }
            Box {
                OutlinedTextField(
                    value = coverageType,
                    onValueChange = {},
                    label = { Text("Coverage Type") },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, Modifier.clickable { showTypeMenu = true }) }
                )
                DropdownMenu(expanded = showTypeMenu, onDismissRequest = { showTypeMenu = false }) {
                    listOf("Full Day", "Half Day", "Emergency").forEach {
                        DropdownMenuItem(text = { Text(it) }, onClick = { coverageType = it; showTypeMenu = false })
                    }
                }
            }

            var showPriorityMenu by remember { mutableStateOf(false) }
            Box {
                OutlinedTextField(
                    value = priority,
                    onValueChange = {},
                    label = { Text("Priority Level") },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    trailingIcon = { Icon(Icons.Default.ArrowDropDown, null, Modifier.clickable { showPriorityMenu = true }) }
                )
                DropdownMenu(expanded = showPriorityMenu, onDismissRequest = { showPriorityMenu = false }) {
                    listOf("Normal", "Urgent").forEach {
                        DropdownMenuItem(text = { Text(it) }, onClick = { priority = it; showPriorityMenu = false })
                    }
                }
            }

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Handover Notes / Instructions") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                shape = RoundedCornerShape(12.dp)
            )

            Button(
                onClick = {
                    val todayCal = Calendar.getInstance().apply {
                        set(Calendar.HOUR_OF_DAY, 0)
                        set(Calendar.MINUTE, 0)
                        set(Calendar.SECOND, 0)
                        set(Calendar.MILLISECOND, 0)
                    }
                    val todayMs = todayCal.timeInMillis
                    
                    val isPast = startDate < todayMs
                    
                    Log.d("DOCTOR_LEAVE_DATE_DEBUG", "Today: ${sdf.format(Date(todayMs))} | Selected: ${sdf.format(Date(startDate))} | Is Past: $isPast")

                    if (isPast) {
                        Toast.makeText(context, "Please select today or a future date.", Toast.LENGTH_LONG).show()
                        return@Button
                    }
                    
                    if (endDate < startDate) {
                        Toast.makeText(context, "End date cannot be before start date.", Toast.LENGTH_SHORT).show()
                        return@Button
                    }

                    if (location.isBlank()) {
                        Toast.makeText(context, "Please enter operational site location", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val currentAuthUid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid
                    if (currentAuthUid.isNullOrEmpty()) {
                        Toast.makeText(context, "Authentication error. Cannot create request.", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    
                    val duration = "${((endDate - startDate) / 86400000) + 1} Days"
                    val request = LeaveRequest(
                        doctorId = currentAuthUid,
                        doctorName = doctor?.name ?: "",
                        doctorEmail = doctor?.email ?: "",
                        doctorPhone = doctor?.phoneNumber ?: "",
                        doctorProfilePhoto = doctor?.avatarUrl,
                        doctorLicense = doctor?.licenseNumber ?: "",
                        specialization = doctor?.specialty ?: "",
                        leaveStartDate = startDate,
                        leaveEndDate = endDate,
                        leaveDuration = duration,
                        leaveType = leaveType,
                        reason = reason,
                        location = location,
                        coverageType = coverageType,
                        priority = priority,
                        notes = notes
                    )
                    viewModel.submitLeaveRequest(request) {
                        onBack()
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PolishSky)
            ) {
                Text("Submit Coverage Request", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AllCoverageRequestsScreen(
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val requests by viewModel.allLeaveRequests.collectAsState()
    val volunteeringLoading by viewModel.volunteeringLoading.collectAsState()
    val doctor by viewModel.userDetails.collectAsState()
    val authError by viewModel.authError.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        viewModel.loadAllLeaveRequests()
    }

    LaunchedEffect(authError) {
        authError?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearAuthErrors()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Coverage Opportunities", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = PolishBg
    ) { padding ->
        val currentAuthUid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid
        
        if (doctor == null || currentAuthUid.isNullOrEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = PolishSky)
            }
        } else if (requests.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No pending coverage requests available.", color = Color.Gray)
            }
        } else {
            val filteredRequests = requests.filter { 
                val isOwnRequest = (it.doctorId.isNotBlank() && it.doctorId == currentAuthUid) || 
                                 (doctor != null && it.doctorId == doctor!!.id)
                if (isOwnRequest) {
                    android.util.Log.d("COVERAGE_REQUEST_DEBUG", "Excluded own request ID: ${it.id}")
                }
                !isOwnRequest && (it.status == "OPEN" || it.status == "PENDING")
            }
            
            android.util.Log.d("COVERAGE_REQUEST_DEBUG", "--- OVERSIGHT DIAGNOSTIC ---")
            android.util.Log.d("COVERAGE_REQUEST_DEBUG", "Current Auth UID: $currentAuthUid")
            android.util.Log.d("COVERAGE_REQUEST_DEBUG", "Raw requests count: ${requests.size}")
            android.util.Log.d("COVERAGE_REQUEST_DEBUG", "Final filtered count: ${filteredRequests.size}")
            android.util.Log.d("COVERAGE_REQUEST_DEBUG", "----------------------------")

            if (filteredRequests.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No other clinicians need coverage currently.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(
                        items = filteredRequests,
                        key = { it.id }
                    ) { request ->
                        val volunteeringStatusMap by viewModel.volunteeringStatus.collectAsState()
                        val hasVolunteered = volunteeringStatusMap[request.id] == true
                        
                        CoverageRequestCard(
                            request = request,
                            volunteerStatus = if (hasVolunteered) "WAITING_FOR_APPROVAL" else "OPEN",
                            isLoading = volunteeringLoading[request.id] ?: false,
                            onVolunteer = {
                                doctor?.let { doc ->
                                    val authUid = viewModel.authRepository.activeUser.value.id
                                    val finalId = if (doc.id.isNotEmpty()) doc.id else authUid
                                    
                                    if (finalId.isNotEmpty()) {
                                        val volunteer = Volunteer(
                                            doctorId = finalId,
                                            name = doc.name,
                                            email = doc.email,
                                            phone = doc.phoneNumber,
                                            profilePhoto = doc.avatarUrl,
                                            experience = doc.experienceInt,
                                            specialization = doc.specialty ?: "",
                                            status = "WAITING_FOR_APPROVAL"
                                        )
                                        viewModel.volunteerForLeave(request.id, volunteer)
                                    }
                                }
                            },
                            onViewProfile = {
                                scope.launch {
                                    if (request.doctorId.isNotBlank()) {
                                        val result = viewModel.authRepository.getUserDetails(request.doctorId)
                                        val reqUser = result.getOrNull()
                                        if (reqUser != null) {
                                            onViewProfile(reqUser)
                                        }
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CoverageRequestCard(
    request: LeaveRequest,
    volunteerStatus: String,
    isLoading: Boolean = false,
    onVolunteer: () -> Unit,
    onViewProfile: () -> Unit
) {
    val context = LocalContext.current
    val sdf = SimpleDateFormat("dd MMM", Locale.getDefault())
    val isAccepted = volunteerStatus == "ACCEPTED"
    val isWaiting = volunteerStatus == "WAITING_FOR_APPROVAL"
    val isRejected = volunteerStatus == "REJECTED"
    val isVolunteered = isWaiting || isAccepted || isRejected

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(24.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = CircleShape, modifier = Modifier.size(50.dp), color = Color(0xFFF1F5F9)) {
                    AsyncImage(
                        model = request.doctorProfilePhoto, 
                        contentDescription = "Doctor Photo", 
                        contentScale = ContentScale.Crop,
                        placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                        error = rememberVectorPainter(Icons.Default.AccountCircle)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(request.doctorName.ifBlank { "Doctor information unavailable" }, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(request.specialization.ifBlank { "Specialization unknown" }, color = PolishSky, fontSize = 11.sp)
                }
                Badge(containerColor = if (request.priority == "Urgent") Color(0xFFFEE2E2) else Color(0xFFE0F2FE)) {
                    Text(request.priority, modifier = Modifier.padding(4.dp), fontSize = 10.sp, color = if (request.priority == "Urgent") Color.Red else PolishSky)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            if (isAccepted) {
                Surface(
                    color = Color(0xFFDCFCE7),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF166534), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("✓ Coverage Accepted", color = Color(0xFF166534), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(16.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                InfoItem(Icons.Default.CalendarToday, "Dates", "${sdf.format(Date(request.leaveStartDateLong))} - ${sdf.format(Date(request.leaveEndDateLong))}")
                InfoItem(Icons.Default.AccessTime, "Type", request.coverageType)
            }

            Spacer(modifier = Modifier.height(12.dp))
            
            // Location Display
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { 
                        if (!request.location.isNullOrBlank()) {
                            openMaps(context, request.location, request.latitude, request.longitude)
                        }
                    }
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.LocationOn, null, tint = PolishSky, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("Site Location", fontSize = 9.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Text(
                        text = if (request.location.isNullOrBlank()) "Hospital not specified" else request.location, 
                        fontSize = 12.sp, 
                        fontWeight = FontWeight.SemiBold, 
                        color = PolishDarkSlate,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (!request.location.isNullOrBlank()) {
                    Spacer(modifier = Modifier.weight(1f))
                    Icon(Icons.Default.Navigation, null, tint = PolishSky, modifier = Modifier.size(14.dp))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text("Reason: ${request.reason.ifBlank { "No reason provided" }}", fontSize = 12.sp, color = Color.Gray)

            Spacer(modifier = Modifier.height(20.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onViewProfile,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).height(44.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Text("View Profile", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                }
                
                Button(
                    onClick = onVolunteer,
                    enabled = !isVolunteered && !isLoading,
                    modifier = Modifier.weight(1.2f).height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when(volunteerStatus) {
                            "WAITING_FOR_APPROVAL" -> Color(0xFFFEF3C7)
                            "REJECTED" -> Color.Gray
                            else -> PolishSky
                        },
                        contentColor = if (isWaiting) Color(0xFF9A3412) else Color.White
                    )
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Text(
                            when(volunteerStatus) {
                                "ACCEPTED" -> "Accepted"
                                "WAITING_FOR_APPROVAL" -> "Waiting Approval"
                                "REJECTED" -> "Declined"
                                else -> "Volunteer to Cover"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InfoItem(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, modifier = Modifier.size(16.dp), tint = Color.Gray)
        Spacer(modifier = Modifier.width(6.6.dp))
        Column {
            Text(label, fontSize = 9.sp, color = Color.Gray)
            Text(value, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyLeaveStatusScreen(
    viewModel: MedLinkViewModel,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val requests by viewModel.myLeaveRequests.collectAsStateWithLifecycle()
    val activeRequests = remember(requests) { 
        val now = System.currentTimeMillis()
        requests.filter { 
            it.status != "COMPLETED" && 
            it.status != "REJECTED" && 
            it.status != "CANCELLED" &&
            it.leaveEndDateLong >= now
        } 
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Active Leave Status", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { padding ->
        if (activeRequests.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Assignment, contentDescription = null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No active leave requests.", color = Color.Gray, fontSize = 16.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(
                    items = activeRequests,
                    key = { it.id }
                ) { request ->
                    MyRequestCard(viewModel, request, onViewProfile)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveHistoryScreen(
    viewModel: MedLinkViewModel,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val requests by viewModel.myLeaveRequests.collectAsStateWithLifecycle()
    val history = remember(requests) { 
        val now = System.currentTimeMillis()
        requests.filter { 
            it.status == "COMPLETED" || 
            it.status == "REJECTED" || 
            it.status == "CANCELLED" ||
            it.leaveEndDateLong < now
        }.sortedByDescending { it.createdAtLong } 
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Leave History", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { padding ->
        if (history.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No leave history found.", color = Color.Gray, fontSize = 16.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(
                    items = history,
                    key = { it.id }
                ) { request ->
                    MyRequestCard(viewModel, request, onViewProfile)
                }
            }
        }
    }
}

@Composable
fun MyRequestCard(viewModel: MedLinkViewModel, request: LeaveRequest, onViewProfile: (User) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val volunteers by viewModel.getVolunteersForRequest(request.id).collectAsState(emptyList())
    val sdf = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(24.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("${request.leaveType} from ${sdf.format(Date(request.leaveStartDateLong))}", fontWeight = FontWeight.Bold)
                    Text(request.reason, color = Color.Gray, fontSize = 12.sp)
                    if (!request.location.isNullOrBlank()) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                            Icon(Icons.Default.LocationOn, null, tint = PolishSky, modifier = Modifier.size(10.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(request.location, fontSize = 10.sp, color = Color.Gray)
                        }
                    }
                }
                Badge(containerColor = when(request.status) {
                    "ACCEPTED" -> Color(0xFFDCFCE7)
                    "IN_PROGRESS" -> Color(0xFFE0F2FE)
                    "COMPLETED" -> Color(0xFFF1F5F9)
                    "REJECTED" -> Color(0xFFFEE2E2)
                    else -> Color(0xFFFEF3C7)
                }) {
                    Text(request.status, modifier = Modifier.padding(4.dp), fontSize = 10.sp, color = when(request.status) {
                        "ACCEPTED" -> Color(0xFF166534)
                        "IN_PROGRESS" -> PolishSky
                        "REJECTED" -> Color.Red
                        else -> Color(0xFF9A3412)
                    })
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                InfoItem(Icons.Default.Timer, "Duration", request.leaveDuration)
                if (request.approvalTime != null) {
                    InfoItem(Icons.Default.CheckCircle, "Approved On", sdf.format(Date(request.approvalTimeLong ?: 0L)))
                }
            }

            if (request.status == "OPEN" || request.status == "PENDING") {
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color(0xFFF1F5F9))
                Spacer(modifier = Modifier.height(8.dp))
                
                TextButton(
                    onClick = { expanded = !expanded },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.textButtonColors(
                        containerColor = if (volunteers.isNotEmpty()) Color(0xFFE0F2FE) else Color(0xFFF8FAFC)
                    )
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (volunteers.isNotEmpty()) Icons.Default.Groups else Icons.Default.PersonSearch,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (volunteers.isNotEmpty()) "Review Volunteers (${volunteers.size})" else "Awaiting Volunteers...",
                            fontWeight = FontWeight.Black,
                            fontSize = 13.sp,
                            color = if (volunteers.isNotEmpty()) PolishSky else Color.Gray
                        )
                        Spacer(modifier = Modifier.weight(1f))
                        Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null)
                    }
                }
                
                if (expanded) {
                    if (volunteers.isEmpty()) {
                        Text(
                            "No doctors have volunteered for this request yet.",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(12.dp)
                        )
                    } else {
                        Column(modifier = Modifier.padding(top = 8.dp)) {
                            volunteers.forEach { volunteer ->
                                VolunteerRow(
                                    viewModel = viewModel,
                                    volunteer = volunteer, 
                                    onViewProfile = onViewProfile,
                                    onApprove = { viewModel.approveCoverage(request.id, volunteer) },
                                    onReject = { viewModel.rejectVolunteer(request.id, volunteer) }
                                )
                                HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(vertical = 4.dp))
                            }
                        }
                    }
                }
            } else if (request.status == "ACCEPTED" || request.status == "IN_PROGRESS" || request.status == "COMPLETED") {
                Spacer(modifier = Modifier.height(12.dp))
                val isCompleted = request.status == "COMPLETED"
                
                Row(
                    verticalAlignment = Alignment.CenterVertically, 
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if(isCompleted) Color(0xFFF8FAFC) else Color(0xFFF0FDF4), RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Icon(
                        imageVector = if(isCompleted) Icons.Default.TaskAlt else Icons.Default.Verified, 
                        contentDescription = null, 
                        tint = if(isCompleted) Color.Gray else Color(0xFF166534), 
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if(isCompleted) "Coverage Completed by Dr. ${request.approvedDoctorName}" else "Covered by Dr. ${request.approvedDoctorName}", 
                        color = if(isCompleted) Color.Gray else Color(0xFF166534), 
                        fontSize = 12.sp, 
                        fontWeight = FontWeight.Bold
                    )
                }

                if (isCompleted) {
                    val currentUserId = viewModel.currentUser.value.id
                    val doctorDetails by viewModel.userDetails.collectAsState()
                    // Robust check: matches Auth UID OR Profile ID (for legacy/email-fallback records)
                    val isRequestingDoctor = request.doctorId == currentUserId || (doctorDetails != null && request.doctorId == doctorDetails!!.id)
                    
                    if (isRequestingDoctor && request.approvedDoctorId != null) {
                        var showFeedbackDialog by remember { mutableStateOf(false) }
                        val feedbackList by viewModel.getCoverageFeedbackForRequest(request.id).collectAsState(emptyList())
                        val feedback = feedbackList.firstOrNull()
                        val feedbackError by viewModel.feedbackError.collectAsState()
                        val feedbackLoading by viewModel.feedbackLoading.collectAsState()
                        val context = LocalContext.current

                        LaunchedEffect(feedbackError) {
                            feedbackError?.let {
                                Toast.makeText(context, it, Toast.LENGTH_LONG).show()
                                viewModel.clearAuthErrors()
                            }
                        }

                        if (showFeedbackDialog) {
                            CoverageFeedbackDialog(
                                doctorName = request.approvedDoctorName ?: "Clinician",
                                isLoading = feedbackLoading,
                                onDismiss = { showFeedbackDialog = false },
                                onSubmit = { rating, text ->
                                    viewModel.submitCoverageFeedback(request.id, request.approvedDoctorId ?: "", rating, text) {
                                        showFeedbackDialog = false
                                    }
                                }
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        
                        if (feedback != null) {
                            // SHOW SUBMITTED FEEDBACK
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("Your Feedback", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                                        Spacer(modifier = Modifier.weight(1f))
                                        Row {
                                            repeat(5) { index ->
                                                Icon(
                                                    imageVector = Icons.Default.Star,
                                                    contentDescription = null,
                                                    tint = if (index < feedback.ratingInt) Color(0xFFFACC15) else Color.LightGray,
                                                    modifier = Modifier.size(12.dp)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("${feedback.ratingInt}/5", fontSize = 11.sp, fontWeight = FontWeight.Black)
                                    }
                                    if (feedback.reviewText.isNotBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "\"${feedback.reviewText}\"",
                                            fontSize = 13.sp,
                                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                            color = PolishDarkSlate
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Feedback submitted", fontSize = 9.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Bold)
                                }
                            }
                        } else {
                            // SHOW GIVE FEEDBACK ACTION
                            Surface(
                                color = Color(0xFFFEF3C7),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().clickable { showFeedbackDialog = true }
                            ) {
                                Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Stars, null, tint = Color(0xFF9A3412), modifier = Modifier.size(20.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Rate this coverage", fontWeight = FontWeight.Black, color = Color(0xFF9A3412), fontSize = 14.sp)
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        repeat(5) {
                                            Icon(Icons.Default.StarOutline, null, tint = Color(0xFF9A3412).copy(0.4f), modifier = Modifier.size(24.dp))
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text("Tap to give feedback", fontSize = 10.sp, color = Color(0xFF9A3412).copy(0.7f), fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VolunteerRow(
    viewModel: MedLinkViewModel,
    volunteer: Volunteer, 
    onViewProfile: (User) -> Unit,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val isDecided = volunteer.status != "WAITING_FOR_APPROVAL"
    val isAccepted = volunteer.status == "ACCEPTED"
    
    // Resolve rating from authoritative doctor directory
    val allDoctors by viewModel.doctorsList.collectAsState()
    val doctorInfo = allDoctors.find { it.id == volunteer.doctorId }
    
    // Resolve all potential IDs for this volunteer to ensure no history is missed
    val volunteerIds = remember(volunteer.doctorId, doctorInfo) {
        listOf(volunteer.doctorId, doctorInfo?.id ?: "", doctorInfo?.email ?: "").filter { it.isNotBlank() }.distinct()
    }
    
    // Fetch previous reviews for this volunteer using multiple identities
    val previousFeedback by viewModel.getDoctorFeedbackFlow(volunteerIds).collectAsState(emptyList())
    val scope = rememberCoroutineScope()

    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(20.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(
                    model = volunteer.profilePhoto, 
                    contentDescription = "Volunteer Photo", 
                    modifier = Modifier.size(60.dp).clip(CircleShape), 
                    contentScale = ContentScale.Crop,
                    placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                    error = rememberVectorPainter(Icons.Default.AccountCircle)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(volunteer.name, fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
                    Text("${volunteer.specialization} • ${volunteer.experience}y exp", fontSize = 12.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                    
                    if (doctorInfo != null) {
                        Text(
                            text = "${doctorInfo.qualification ?: ""} • ${doctorInfo.hospitalName ?: "Independent"}",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                    }
                }
                
                if (isDecided) {
                    Badge(
                        containerColor = if (isAccepted) Color(0xFFDCFCE7) else Color(0xFFFEE2E2)
                    ) {
                        Text(
                            text = if (isAccepted) "Accepted" else "Declined",
                            color = if (isAccepted) Color(0xFF166534) else Color.Red,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            // Rating Row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Row {
                    repeat(5) { index ->
                        val ratingValue = doctorInfo?.averageRatingFloat ?: 0f
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = if (index < ratingValue.toInt()) Color(0xFFFACC15) else Color.LightGray,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${doctorInfo?.averageRatingFloat ?: 0.0} (${doctorInfo?.totalReviewsInt ?: 0} Reviews)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = PolishDarkSlate
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Previous Feedback Section
            Text("PREVIOUS PEER FEEDBACK", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.Gray, letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(8.dp))
            
            if (previousFeedback.isEmpty()) {
                Text("No previous feedback yet.", fontSize = 11.sp, color = Color.LightGray, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    previousFeedback.take(2).forEach { feedback ->
                        Surface(
                            color = Color.White,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(12.dp))
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Row {
                                        repeat(5) { i ->
                                            Icon(
                                                Icons.Default.Star, null, 
                                                tint = if (i < feedback.ratingInt) Color(0xFFFACC15) else Color.LightGray,
                                                modifier = Modifier.size(10.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(java.util.Date(feedback.createdAtLong)),
                                        fontSize = 9.sp,
                                        color = Color.LightGray
                                    )
                                }
                                if (feedback.reviewText.isNotBlank()) {
                                    Text("\"${feedback.reviewText}\"", fontSize = 12.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic, color = PolishDarkSlate)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            if (!isDecided) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = {
                            scope.launch {
                                val result = viewModel.authRepository.getUserDetails(volunteer.doctorId)
                                val user = result.getOrNull()
                                if (user != null) onViewProfile(user)
                            }
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(40.dp),
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Text("View Profile", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                    }

                    Button(
                        onClick = onReject, 
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2), contentColor = Color.Red),
                        modifier = Modifier.weight(0.8f).height(40.dp)
                    ) {
                        Text("Reject", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    
                    Button(
                        onClick = onApprove, 
                        shape = RoundedCornerShape(12.dp), 
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        modifier = Modifier.weight(0.8f).height(40.dp)
                    ) {
                        Text("Accept", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            val result = viewModel.authRepository.getUserDetails(volunteer.doctorId)
                            val user = result.getOrNull()
                            if (user != null) onViewProfile(user)
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(40.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Text("View Full Clinical Profile", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyActiveDutiesScreen(
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val duties by viewModel.myCoverageDuties.collectAsState()
    val activeDuties = remember(duties) { duties.filter { it.status != "COMPLETED" } }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Active Coverage Duties", fontWeight = FontWeight.Bold) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } })
        }
    ) { padding ->
        if (activeDuties.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { 
                Text("No active coverage assignments.", color = Color.Gray) 
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(
                    items = activeDuties,
                    key = { it.id }
                ) { duty ->
                    DutyCard(viewModel, duty, onChatOpen, onViewProfile)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DutyHistoryScreen(
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val duties by viewModel.myCoverageDuties.collectAsState()
    val completedDuties = remember(duties) { duties.filter { it.status == "COMPLETED" } }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Duty History", fontWeight = FontWeight.Bold) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } })
        }
    ) { padding ->
        if (completedDuties.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { 
                Text("No duty history found.", color = Color.Gray) 
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(
                    items = completedDuties,
                    key = { it.id }
                ) { duty ->
                    DutyCard(viewModel, duty, onChatOpen, onViewProfile)
                }
            }
        }
    }
}

@Composable
fun DutyCard(
    viewModel: MedLinkViewModel, 
    duty: LeaveRequest,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit
) {
    val context = LocalContext.current
    val isInProgress = duty.status == "IN_PROGRESS"
    val isAccepted = duty.status == "ACCEPTED"
    val scope = rememberCoroutineScope()

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(24.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(
                    model = duty.doctorProfilePhoto, 
                    contentDescription = "Doctor Photo", 
                    modifier = Modifier.size(50.dp).clip(CircleShape), 
                    contentScale = ContentScale.Crop,
                    placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                    error = rememberVectorPainter(Icons.Default.AccountCircle)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Covering Dr. ${duty.doctorName}", fontWeight = FontWeight.Bold)
                    Text(duty.specialization, color = PolishSky, fontSize = 12.sp)
                }
                Surface(
                    color = Color(0xFFDCFCE7),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("✓ Assigned", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF166534))
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                InfoItem(Icons.Default.CalendarToday, "Period", "${SimpleDateFormat("dd MMM", Locale.getDefault()).format(Date(duty.leaveStartDateLong))} - ${SimpleDateFormat("dd MMM", Locale.getDefault()).format(Date(duty.leaveEndDateLong))}")
                InfoItem(Icons.Default.Schedule, "Duration", duty.leaveDuration)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Location Display for Duty
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { 
                        if (!duty.location.isNullOrBlank()) {
                            openMaps(context, duty.location, duty.latitude, duty.longitude)
                        }
                    }
                    .background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.LocationOn, null, tint = PolishSky, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Reporting Site", fontSize = 9.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Text(
                        text = duty.location ?: "Location not available", 
                        fontSize = 12.sp, 
                        fontWeight = FontWeight.SemiBold, 
                        color = PolishDarkSlate,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (!duty.location.isNullOrBlank()) {
                    Icon(Icons.Default.Navigation, null, tint = PolishSky, modifier = Modifier.size(14.dp))
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            val result = viewModel.authRepository.getUserDetails(duty.doctorId)
                            val requester = result.getOrNull()
                            if (requester != null) onViewProfile(requester)
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).height(44.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Text("View Profile", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                }

                Button(
                    onClick = { 
                        scope.launch {
                            val result = viewModel.authRepository.getUserDetails(duty.doctorId)
                            val requester = result.getOrNull()
                            if (requester != null) onChatOpen(requester)
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).height(44.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PolishSky)
                ) {
                    Icon(Icons.AutoMirrored.Filled.Chat, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Chat", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (isAccepted || isInProgress) {
                Button(
                    onClick = { 
                        if (isAccepted) {
                            viewModel.startCoverage(duty.id, duty.doctorId)
                        } else {
                            viewModel.completeCoverage(duty.id, duty.doctorId)
                        }
                    }, 
                    modifier = Modifier.fillMaxWidth().height(48.dp), 
                    shape = RoundedCornerShape(12.dp), 
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isInProgress) Color(0xFF10B981) else PolishDarkSlate
                    )
                ) {
                    Icon(
                        imageVector = if (isInProgress) Icons.Default.TaskAlt else Icons.Default.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isInProgress) "Complete Session" else "Start Session",
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp
                    )
                }
            } else if (duty.status == "COMPLETED") {
                Surface(
                    color = Color(0xFFF1F5F9),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.CheckCircle, null, tint = Color.Gray, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Session Finished", color = Color.Gray, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

fun openMaps(context: android.content.Context, location: String, lat: Double?, lng: Double?) {
    try {
        val uri = if (lat != null && lng != null) {
            Uri.parse("geo:$lat,$lng?q=${Uri.encode(location)}")
        } else {
            Uri.parse("geo:0,0?q=${Uri.encode(location)}")
        }
        val intent = Intent(Intent.ACTION_VIEW, uri)
        intent.setPackage("com.google.android.apps.maps")
        context.startActivity(intent)
    } catch (e: Exception) {
        Log.e("LeaveCoverage", "Failed to open maps", e)
    }
}

@Composable
fun CoverageFeedbackDialog(
    doctorName: String,
    isLoading: Boolean = false,
    onDismiss: () -> Unit,
    onSubmit: (Int, String) -> Unit
) {
    var rating by remember { mutableIntStateOf(5) }
    var feedbackText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Stars, null, tint = PolishSky, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(16.dp))
                Text("Rate Performance", fontWeight = FontWeight.Black, fontSize = 20.sp)
                Text("How was the coverage by Dr. $doctorName?", fontSize = 12.sp, color = Color.Gray, textAlign = TextAlign.Center)
            }
        },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                // Star Selector
                Row(
                    modifier = Modifier.padding(vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    repeat(5) { index ->
                        val starIndex = index + 1
                        val isSelected = starIndex <= rating
                        Icon(
                            imageVector = if (isSelected) Icons.Default.Star else Icons.Default.StarBorder,
                            contentDescription = null,
                            tint = if (isSelected) Color(0xFFFACC15) else Color.LightGray,
                            modifier = Modifier
                                .size(36.dp)
                                .clickable { rating = starIndex }
                        )
                    }
                }

                OutlinedTextField(
                    value = feedbackText,
                    onValueChange = { feedbackText = it },
                    placeholder = { Text("Describe your experience (optional)...", fontSize = 14.sp) },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PolishSky,
                        unfocusedBorderColor = Color(0xFFE2E8F0)
                    )
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(rating, feedbackText) },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PolishSky)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Submit Review", fontWeight = FontWeight.Bold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("Cancel", color = Color.Gray)
            }
        },
        shape = RoundedCornerShape(28.dp),
        containerColor = Color.White
    )
}

