package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import android.widget.Toast
import android.util.Log
import com.example.data.model.User
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.theme.PolishSkyLight
import com.example.ui.viewmodel.MedLinkViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorSettingsView(
    viewModel: MedLinkViewModel,
    user: User?,
    onChangePassword: () -> Unit,
    onLogout: () -> Unit
) {
    var isEditMode by remember { mutableStateOf(false) }
    val isLoading by viewModel.loading.collectAsState()
    val authError by viewModel.authError.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(authError) {
        authError?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearAuthErrors()
        }
    }

    
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { viewModel.updateProfilePhoto(it) }
    }

    // Editable states
    var name by remember(user) { mutableStateOf(user?.name ?: "") }
    var phone by remember(user) { mutableStateOf(user?.phoneNumber ?: "") }
    var specialty by remember(user) { mutableStateOf(user?.specialty ?: "") }
    var department by remember(user) { mutableStateOf(user?.department ?: "") }
    var qualification by remember(user) { mutableStateOf(user?.qualification ?: "") }
    var experience by remember(user) { mutableStateOf(user?.experienceInt?.toString() ?: "0") }
    var clinicStatus by remember(user) { mutableStateOf(user?.clinicStatus ?: "Offline") }
    
    // Hospital Info
    var hospitalName by remember(user) { mutableStateOf(user?.hospitalName ?: "") }
    var hospitalId by remember(user) { mutableStateOf(user?.hospitalId ?: "") }
    var hospitalAddress by remember(user) { mutableStateOf(user?.hospitalAddress ?: "") }
    var city by remember(user) { mutableStateOf(user?.city ?: "") }
    var state by remember(user) { mutableStateOf(user?.state ?: "") }
    var country by remember(user) { mutableStateOf(user?.country ?: "") }
    var pinCode by remember(user) { mutableStateOf(user?.pinCode ?: "") }
    
    // Personal Info
    var gender by remember(user) { mutableStateOf(user?.gender ?: "") }
    var dob by remember(user) { mutableStateOf(user?.dob ?: "") }

    val completion = remember(user) {
        val fields = listOf(
            user?.avatarUrl, user?.name, user?.email, user?.phoneNumber,
            user?.hospitalName, user?.licenseNumber, user?.registrationNumber,
            user?.specialty, user?.department, user?.experience,
            user?.qualification, user?.gender, user?.dob, user?.govIdUrl,
            user?.hospitalAddress, user?.city, user?.state, user?.country, user?.pinCode
        )
        val filled = fields.count { it != null && it.toString().isNotEmpty() }
        (filled.toFloat() / fields.size.toFloat())
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PolishBg)
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Professional Profile", fontSize = 24.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
            if (isEditMode) {
                TextButton(onClick = { 
                    user?.let {
                        viewModel.updateUserProfile(it.copy(
                            name = name,
                            phoneNumber = phone,
                            specialty = specialty,
                            department = department,
                            clinicStatus = clinicStatus,
                            qualification = qualification,
                            experience = experience.toIntOrNull() ?: 0,
                            hospitalName = hospitalName,
                            hospitalId = hospitalId,
                            hospitalAddress = hospitalAddress,
                            city = city,
                            state = state,
                            country = country,
                            pinCode = pinCode,
                            gender = gender,
                            dob = dob
                        ))
                    }
                    isEditMode = false
                }) {
                    Text("Save Changes", fontWeight = FontWeight.Bold, color = com.example.ui.theme.PolishAccentEmerald)
                }
            } else {
                IconButton(onClick = { isEditMode = true }) {
                    Icon(Icons.Default.Edit, null, tint = PolishSky)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Profile Card
        Card(
            shape = RoundedCornerShape(32.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Box {
                    Surface(
                        shape = CircleShape, 
                        color = PolishSkyLight, 
                        modifier = Modifier.size(110.dp).clickable { 
                            if (!isLoading) photoPickerLauncher.launch("image/*") 
                        }
                    ) {
                        if (isLoading) {
                            Box(contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(32.dp), color = PolishSky)
                            }
                        } else {
                            AsyncImage(
                                model = user?.avatarUrl, 
                                contentDescription = "Profile Photo", 
                                contentScale = ContentScale.Crop,
                                placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                                error = rememberVectorPainter(Icons.Default.AccountCircle),
                                onError = { state ->
                                    Log.e("MedLinkUI", "Image load error: ${state.result.throwable.message}")
                                    Log.d("MedLinkUI", "Failed URL: ${user?.avatarUrl}")
                                }
                            )
                        }
                    }
                    Surface(
                        shape = CircleShape, color = PolishSky, 
                        modifier = Modifier.size(32.dp).align(Alignment.BottomEnd).border(3.dp, Color.White, CircleShape).clickable { 
                            if (!isLoading) photoPickerLauncher.launch("image/*") 
                        }
                    ) {
                        Icon(Icons.Default.CameraAlt, null, tint = Color.White, modifier = Modifier.padding(6.dp))
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(user?.name ?: "Dr. User", fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text("${user?.qualification} • ${user?.specialty}", fontSize = 14.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                
                Spacer(modifier = Modifier.height(20.dp))
                
                // Profile Completion
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Profile Completion: ${(completion * 100).toInt()}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { completion },
                        modifier = Modifier.width(200.dp).height(6.dp).clip(CircleShape),
                        color = if (completion > 0.8f) com.example.ui.theme.PolishAccentEmerald else PolishSky,
                        trackColor = Color(0xFFF1F5F9)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Sections
        ProfileSection("Personal Information", Icons.Default.Person) {
            ProfileDataRow("Full Name", name, isEditMode) { name = it }
            
            if (isEditMode) {
                var genderExpanded by remember { mutableStateOf(false) }
                val genders = listOf("Male", "Female", "Other", "Prefer not to say")
                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                    Text("Gender", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    
                    ExposedDropdownMenuBox(
                        expanded = genderExpanded,
                        onExpandedChange = { genderExpanded = !genderExpanded }
                    ) {
                        OutlinedTextField(
                            value = gender,
                            onValueChange = { },
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = genderExpanded) },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PolishSky),
                            modifier = Modifier.fillMaxWidth().menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = genderExpanded,
                            onDismissRequest = { genderExpanded = false }
                        ) {
                            genders.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = { gender = option; genderExpanded = false }
                                )
                            }
                        }
                    }
                }
            } else {
                ProfileDataRow("Gender", gender, false)
            }
            
            ProfileDataRow("Date of Birth", dob, isEditMode) { dob = it }
            ProfileDataRow("Phone", phone, isEditMode) { phone = it }
            ProfileDataRow("Email", user?.email ?: "", false)
        }

        ProfileSection("Professional Information", Icons.Default.Work) {
            ProfileDataRow("Qualification", qualification, isEditMode) { qualification = it }
            ProfileDataRow("Specialization", specialty, isEditMode) { specialty = it }
            ProfileDataRow("Department", department, isEditMode) { department = it }
            ProfileDataRow("Experience (Years)", experience, isEditMode) { experience = it }
            ProfileDataRow("License No.", user?.licenseNumber ?: "", false)
            ProfileDataRow("Registration No.", user?.registrationNumber ?: "", false)
        }

        ProfileSection("Hospital Information", Icons.Default.Business) {
            ProfileDataRow("Hospital Name", hospitalName, isEditMode) { hospitalName = it }
            ProfileDataRow("Hospital ID", hospitalId, isEditMode) { hospitalId = it }
            ProfileDataRow("Hospital Address", hospitalAddress, isEditMode) { hospitalAddress = it }
            ProfileDataRow("City", city, isEditMode) { city = it }
            ProfileDataRow("State", state, isEditMode) { state = it }
            ProfileDataRow("Country", country, isEditMode) { country = it }
            ProfileDataRow("PIN Code", pinCode, isEditMode) { pinCode = it }
        }

        ProfileSection("Verification & Status", Icons.Default.VerifiedUser) {
            ProfileDataRow("Identity Document", if (user?.govIdUrl != null) "Verified" else "Pending Upload", false)
            ProfileDataRow("Clinical Status", clinicStatus, isEditMode) { clinicStatus = it }
            ProfileDataRow("Verification Status", if (user?.verified == true) "ACCREDITED" else "PENDING", false)
            ProfileDataRow("Joined Date", SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(user?.joinedDateLong ?: 0L)), false)
        }

        ProfileSection("Coverage Statistics", Icons.Default.BarChart) {
            ProfileDataRow("Rating", "${user?.averageRatingFloat} (${user?.totalReviewsInt} reviews)", false)
        }

        // AI Feedback Sentiment Section (Live from Firestore)
        val profileIds = remember(user) { 
            listOf(user?.id ?: "", user?.email ?: "").filter { it.isNotBlank() } 
        }
        val feedbackFlow = remember(profileIds) {
            viewModel.getDoctorFeedbackFlow(profileIds)
        }
        val feedbackList by feedbackFlow.collectAsState(null)

        ProfileSection("Coverage Feedback Insights", Icons.Default.AutoAwesome) {
            if (feedbackList == null) {
                // 1. INITIAL LOADING STATE
                Box(Modifier.fillMaxWidth().padding(vertical = 20.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = PolishSky, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Loading AI Feedback...", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    }
                }
            } else if (feedbackList!!.isEmpty()) {
                // 2. GENUINELY EMPTY STATE
                Box(Modifier.fillMaxWidth().padding(vertical = 20.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Analytics, null, tint = Color.LightGray, modifier = Modifier.size(40.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No feedback yet", color = Color.Gray, fontSize = 13.sp)
                    }
                }
            } else {
                // 3. DATA LOADED STATE
                val currentList = feedbackList!!
                val analyzedFeedback = currentList.filter { !it.sentiment.isNullOrBlank() }
                
                val posCount = analyzedFeedback.count { it.sentiment?.trim()?.uppercase() == "POSITIVE" }
                val neuCount = analyzedFeedback.count { it.sentiment?.trim()?.uppercase() == "NEUTRAL" }
                val negCount = analyzedFeedback.count { it.sentiment?.trim()?.uppercase() == "NEGATIVE" }

                val totalPoints = (posCount * 100.0) + (neuCount * 50.0) + (negCount * 0.0)
                val sentimentScoreValue = if (analyzedFeedback.isNotEmpty()) (totalPoints / analyzedFeedback.size).toInt() else 0
                
                Log.d("AI_SENTIMENT_RENDER_SETTINGS", """
                    doctor: ${user?.name}
                    feedbackListSize: ${currentList.size}
                    positiveCount: $posCount
                    neutralCount: $neuCount
                    negativeCount: $negCount
                    calculatedScore: $sentimentScoreValue
                """.trimIndent())

                val posPercent = if (analyzedFeedback.isNotEmpty()) (posCount * 100) / analyzedFeedback.size else 0
                val neuPercent = if (analyzedFeedback.isNotEmpty()) (neuCount * 100) / analyzedFeedback.size else 0
                val negPercent = if (analyzedFeedback.isNotEmpty()) (negCount * 100) / analyzedFeedback.size else 0

                Column(modifier = Modifier.fillMaxWidth()) {
                    val renderedText = "$sentimentScoreValue / 100"
                    Log.d("AI_SENTIMENT_RENDERED_TEXT_SETTINGS", renderedText)
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = renderedText,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = PolishDarkSlate
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Sentiment Score",
                            fontSize = 14.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    val isUpdating by viewModel.feedbackLoading.collectAsState()
                    if (isUpdating) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                            CircularProgressIndicator(modifier = Modifier.size(12.dp), strokeWidth = 1.5.dp, color = PolishSky)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Updating AI sentiment...", fontSize = 10.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    SentimentProgressBar("Positive", posPercent, Color(0xFF10B981))
                    Spacer(modifier = Modifier.height(12.dp))
                    SentimentProgressBar("Neutral", neuPercent, Color(0xFFFACC15))
                    Spacer(modifier = Modifier.height(12.dp))
                    SentimentProgressBar("Negative", negPercent, Color(0xFFEF4444))
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth().padding(bottom = 40.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                SettingsActionItem(Icons.Default.Password, "Change Clinical Password", onClick = onChangePassword)
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color(0xFFF1F5F9))
                SettingsActionItem(
                    Icons.AutoMirrored.Filled.Logout, 
                    "Secure Sign Out", 
                    Color.Red, 
                    onClick = { 
                        viewModel.logout()
                        onLogout()
                    }
                )
            }
        }
    }
}

@Composable
fun ProfileSection(title: String, icon: ImageVector, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
            Icon(icon, null, tint = PolishSky, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
        }
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                content()
            }
        }
    }
}

@Composable
fun ProfileDataRow(label: String, value: String, isEditable: Boolean, onValueChange: (String) -> Unit = {}) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text(label, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
        if (isEditable) {
            TextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth(),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedIndicatorColor = PolishSky
                ),
                textStyle = LocalTextStyle.current.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            )
        } else {
            Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = PolishDarkSlate, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
fun SettingsActionItem(icon: ImageVector, title: String, color: Color = PolishDarkSlate, onClick: () -> Unit = {}) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, color = color, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        Icon(Icons.Default.ChevronRight, null, tint = Color.LightGray)
    }
}
