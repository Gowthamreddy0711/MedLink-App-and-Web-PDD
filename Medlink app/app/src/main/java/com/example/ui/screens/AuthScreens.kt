package com.example.ui.screens

import android.app.DatePickerDialog
import android.location.Geocoder
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.theme.*
import com.example.ui.viewmodel.MedLinkViewModel
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.delay
import java.util.*
import java.text.SimpleDateFormat
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

// --- VALIDATION UTILS ---

fun validateName(name: String): Boolean {
    val nameRegex = Regex("^[A-Za-z ]+$")
    return name.trim().isNotEmpty() && nameRegex.matches(name.trim())
}

fun validatePhone(phone: String): Boolean {
    return phone.length == 10 && phone.all { it.isDigit() }
}

data class PasswordRequirements(
    val hasMinLength: Boolean = false,
    val hasUpperCase: Boolean = false,
    val hasLowerCase: Boolean = false,
    val hasNumber: Boolean = false,
    val hasSpecialChar: Boolean = false,
    val hasNoSpaces: Boolean = false
) {
    val isValid: Boolean get() = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasNoSpaces
}

fun calculatePasswordRequirements(password: String): PasswordRequirements {
    val specialChars = "!@#$%^&*()_+-={}[]:;\"'<>,.?/\\|~"
    return PasswordRequirements(
        hasMinLength = password.length in 8..32,
        hasUpperCase = password.any { it.isUpperCase() },
        hasLowerCase = password.any { it.isLowerCase() },
        hasNumber = password.any { it.isDigit() },
        hasSpecialChar = password.any { specialChars.contains(it) },
        hasNoSpaces = password.isNotEmpty() && !password.contains(" ")
    )
}

@Composable
fun PasswordRequirementItem(text: String, isMet: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 2.dp)
    ) {
        Icon(
            imageVector = if (isMet) Icons.Default.CheckCircle else Icons.Default.Cancel,
            contentDescription = null,
            tint = if (isMet) Color(0xFF16A34A) else Color(0xFFDC2626),
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            fontSize = 11.sp,
            color = if (isMet) Color(0xFF16A34A) else Color(0xFFDC2626),
            fontWeight = FontWeight.Medium
        )
    }
}

enum class AuthScreenState {
    SPLASH,
    DOCTOR_AUTH
}

@Composable
fun AuthScreen(
    viewModel: MedLinkViewModel,
    onLoginSuccess: () -> Unit
) {
    var screenState by remember { mutableStateOf(AuthScreenState.SPLASH) }

    AnimatedContent(
        targetState = screenState,
        transitionSpec = {
            fadeIn(animationSpec = tween(400)) togetherWith fadeOut(animationSpec = tween(400))
        },
        label = "AuthFlowTransition"
    ) { state ->
        when (state) {
            AuthScreenState.SPLASH -> {
                SplashScreen(onFinished = {
                    screenState = AuthScreenState.DOCTOR_AUTH
                })
            }
            AuthScreenState.DOCTOR_AUTH -> {
                DoctorAuthScreen(
                    viewModel = viewModel,
                    onLoginSuccess = onLoginSuccess
                )
            }
        }
    }
}

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(2200) 
        onFinished()
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1100, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logo_pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color.White,
                        com.example.ui.theme.PolishBg
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(32.dp),
                color = Color.White,
                shadowElevation = 8.dp,
                modifier = Modifier
                    .size(140.dp)
                    .scale(pulseScale)
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(32.dp))
                    .padding(16.dp)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.medlink_logo),
                    contentDescription = "MedLink Secure Logo",
                    modifier = Modifier.fillMaxSize()
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "MEDLINK",
                fontSize = 36.sp,
                fontWeight = FontWeight.Black,
                color = com.example.ui.theme.PolishDarkSlate,
                letterSpacing = 4.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Doctor Coverage & Shift Management",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF64748B),
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(48.dp))

            CircularProgressIndicator(
                color = com.example.ui.theme.PolishSky,
                strokeWidth = 3.dp,
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.height(80.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier
                    .alpha(0.7f)
                    .background(Color.White, RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = com.example.ui.theme.PolishAccentEmerald,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.6.dp))
                Text(
                    text = "Professional Shift Collaboration Platform",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = com.example.ui.theme.PolishDarkSlate
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorAuthScreen(
    viewModel: MedLinkViewModel,
    onLoginSuccess: () -> Unit
) {
    var isSignUpMode by remember { mutableStateOf(false) }
    var selectedRole by remember { mutableStateOf("DOCTOR") } // DOCTOR or ADMIN
    var showSuccessDialog by remember { mutableStateOf(false) }
    var lastSignedUpDoctorName by remember { mutableStateOf("") }

    // Forms
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    
    // Doctor Professional Forms
    var hospitalName by remember { mutableStateOf("") }
    var hospitalId by remember { mutableStateOf("") }
    var licenseNumber by remember { mutableStateOf("") }
    var registrationNumber by remember { mutableStateOf("") }
    var specialization by remember { mutableStateOf("") }
    var department by remember { mutableStateOf("") }
    var experience by remember { mutableStateOf("") }
    var qualification by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }
    var dob by remember { mutableStateOf("") }
    
    // Address Forms
    var address by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var state by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("") }
    var pinCode by remember { mutableStateOf("") }

    val context = LocalContext.current
    val fusedLocationClient = remember { 
        try {
            LocationServices.getFusedLocationProviderClient(context)
        } catch (t: Throwable) {
            Log.e("DoctorAuthScreen", "Failed to initialize LocationServices", t)
            null
        }
    }
    
    fun fetchLiveLocation() {
        if (fusedLocationClient == null) return
        
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                location?.let {
                    val geocoder = Geocoder(context, Locale.getDefault())
                    try {
                        val addresses = geocoder.getFromLocation(it.latitude, it.longitude, 1)
                        if (!addresses.isNullOrEmpty()) {
                            val addr = addresses[0]
                            address = addr.getAddressLine(0) ?: ""
                            city = addr.locality ?: ""
                            state = addr.adminArea ?: ""
                            country = addr.countryName ?: ""
                            pinCode = addr.postalCode ?: ""
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
            fetchLiveLocation()
        }
    }

    // Images
    var avatarUri by remember { mutableStateOf<Uri?>(null) }
    var govIdUri by remember { mutableStateOf<Uri?>(null) }
    var medicalCertificateUri by remember { mutableStateOf<Uri?>(null) }

    val avatarLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> avatarUri = uri }
    val govIdLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> govIdUri = uri }
    val medicalCertificateLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> medicalCertificateUri = uri }

    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }

    val authError by viewModel.authError.collectAsState()
    val isLoading by viewModel.loading.collectAsState()
    var loadingMessage by remember { mutableStateOf("") }

    // Validation State
    val passwordReqs = remember(password) { calculatePasswordRequirements(password) }
    val isNameValid = remember(name) { if (name.isEmpty()) true else validateName(name) }
    val isPhoneValid = remember(phone) { if (phone.isEmpty()) true else validatePhone(phone) }
    val passwordsMatch = remember(password, confirmPassword) { password == confirmPassword }
    
    val isSignUpEnabled = validateName(name) && validatePhone(phone) && passwordReqs.isValid && passwordsMatch && 
                         email.isNotEmpty() && hospitalName.isNotEmpty() && licenseNumber.isNotEmpty() && 
                         registrationNumber.isNotEmpty() && specialization.isNotEmpty() && 
                         department.isNotEmpty() && experience.isNotEmpty() && qualification.isNotEmpty() &&
                         gender.isNotEmpty() && dob.isNotEmpty() && address.isNotEmpty() && 
                         city.isNotEmpty() && state.isNotEmpty() && country.isNotEmpty() && pinCode.isNotEmpty()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(com.example.ui.theme.PolishBg)
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // TOP BRANDING SECTION
            Spacer(modifier = Modifier.height(60.dp))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.White,
                    shadowElevation = 4.dp,
                    modifier = Modifier.size(64.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.medlink_logo),
                        contentDescription = "MedLink Logo",
                        modifier = Modifier.padding(12.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "MedLink",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = PolishDarkSlate,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Connecting Doctors. Continuing Care.",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray,
                    letterSpacing = 0.5.sp
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            if (!isSignUpMode) {
                // MODERN LOGIN UI
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        horizontalAlignment = Alignment.Start
                    ) {
                    ModernAccountTypeSelector(
                        selectedRole = selectedRole,
                        onRoleSelected = { selectedRole = it; viewModel.clearAuthErrors() }
                    )

                    Spacer(modifier = Modifier.height(40.dp))

                    Text(
                        text = "Sign in",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black,
                        color = PolishDarkSlate
                    )
                    Text(
                        text = "Access your MedLink account",
                        fontSize = 15.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    // INLINE ERROR COMPONENT
                    if (authError != null) {
                        InlineErrorMessage(authError!!)
                        Spacer(modifier = Modifier.height(24.dp))
                    }

                    ModernLoginInput(
                        value = email,
                        onValueChange = { email = it },
                        label = "Clinical Email Address",
                        placeholder = "Enter your email address",
                        leadingIcon = Icons.Default.Email,
                        keyboardType = KeyboardType.Email
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    ModernLoginInput(
                        value = password,
                        onValueChange = { password = it },
                        label = "Password",
                        placeholder = "Enter your password",
                        leadingIcon = Icons.Default.Lock,
                        keyboardType = KeyboardType.Password,
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    null,
                                    modifier = Modifier.size(20.dp),
                                    tint = Color.Gray
                                )
                            }
                        }
                    )

                    Text(
                        text = "Forgot password?",
                        color = PolishSky,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .align(Alignment.End)
                            .padding(top = 12.dp)
                            .clickable { /* Reset logic placeholder */ }
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    Button(
                        onClick = {
                            loadingMessage = "Signing in..."
                            viewModel.login(email, password, selectedRole) {
                                onLoginSuccess()
                            }
                        },
                        enabled = !isLoading && email.isNotEmpty() && password.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PolishSky,
                            disabledContainerColor = PolishSky.copy(alpha = 0.6f)
                        ),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                    ) {
                        if (isLoading) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("Signing in...", fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Text("Sign In", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }

                    if (selectedRole == "DOCTOR") {
                        Spacer(modifier = Modifier.height(32.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("New to MedLink? ", fontSize = 14.sp, color = Color.Gray)
                            Text(
                                "Create Doctor Account",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = PolishSky,
                                modifier = Modifier.clickable { isSignUpMode = true }
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            } else {
                // EXISTING SIGNUP UI (Within the new full-screen scroll)
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Clinical Hub Portal",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = com.example.ui.theme.PolishDarkSlate
                    )
                    Text(
                        text = "Register your healthcare practice",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        modifier = Modifier.padding(bottom = 24.dp)
                    )

                    Card(
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(24.dp)) {
                            // Signup Header / Switch back to login
                            TextButton(onClick = { isSignUpMode = false }) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Back to Sign In", fontWeight = FontWeight.Bold)
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))

                            if (authError != null) {
                                InlineErrorMessage(authError!!)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            val colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = com.example.ui.theme.PolishSky,
                                unfocusedBorderColor = Color(0xFFE2E8F0),
                                focusedLabelColor = com.example.ui.theme.PolishSky,
                                unfocusedLabelColor = Color(0xFF64748B)
                            )

                            // Personal Info
                            SignupSectionHeader("Personal Information")
                            OutlinedTextField(
                                value = name, onValueChange = { if (!it.contains("  ")) name = it },
                                label = { Text("Full Name (Letters only)") },
                                leadingIcon = { Icon(Icons.Default.Person, null, tint = com.example.ui.theme.PolishSky) },
                                singleLine = true, isError = !isNameValid, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                            )
                            OutlinedTextField(
                                value = email, onValueChange = { email = it },
                                label = { Text("Email Address") },
                                leadingIcon = { Icon(Icons.Default.Email, null, tint = com.example.ui.theme.PolishSky) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                            )
                            OutlinedTextField(
                                value = phone, onValueChange = { if (it.length <= 10) phone = it },
                                label = { Text("Mobile Number (10 digits)") },
                                leadingIcon = { Icon(Icons.Default.Phone, null, tint = com.example.ui.theme.PolishSky) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                singleLine = true, isError = !isPhoneValid, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                            )
                            
                            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                var genderExpanded by remember { mutableStateOf(false) }
                                val genders = listOf("Male", "Female", "Other", "Prefer not to say")
                                
                                ExposedDropdownMenuBox(
                                    expanded = genderExpanded,
                                    onExpandedChange = { genderExpanded = !genderExpanded },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    OutlinedTextField(
                                        value = gender,
                                        onValueChange = {},
                                        readOnly = true,
                                        label = { Text("Gender") },
                                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = genderExpanded) },
                                        colors = colors,
                                        modifier = Modifier.menuAnchor()
                                    )
                                    ExposedDropdownMenu(
                                        expanded = genderExpanded,
                                        onDismissRequest = { genderExpanded = false }
                                    ) {
                                        genders.forEach { option ->
                                            DropdownMenuItem(
                                                text = { Text(option) },
                                                onClick = {
                                                    gender = option
                                                    genderExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }
                                
                                OutlinedTextField(
                                    value = dob, 
                                    onValueChange = { }, 
                                    label = { Text("DOB") }, 
                                    colors = colors, 
                                    modifier = Modifier.weight(1f).clickable {
                                        val calendar = Calendar.getInstance()
                                        DatePickerDialog(context, { _, year, month, day ->
                                            dob = "$day/${month + 1}/$year"
                                        }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show()
                                    },
                                    readOnly = true,
                                    enabled = false,
                                    trailingIcon = { Icon(Icons.Default.CalendarToday, null, tint = PolishSky) }
                                )
                            }

                            SignupSectionHeader("Security")
                            OutlinedTextField(
                                value = password, onValueChange = { password = it },
                                label = { Text("Password") },
                                leadingIcon = { Icon(Icons.Default.Lock, null, tint = com.example.ui.theme.PolishSky) },
                                trailingIcon = {
                                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                        Icon(if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff, null, tint = Color(0xFF94A3B8))
                                    }
                                },
                                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                            )
                            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp).padding(bottom = 12.dp)) {
                                PasswordRequirementItem("8+ characters", passwordReqs.hasMinLength)
                                PasswordRequirementItem("Uppercase & Lowercase", passwordReqs.hasUpperCase && passwordReqs.hasLowerCase)
                                PasswordRequirementItem("Number & Special Char", passwordReqs.hasNumber && passwordReqs.hasSpecialChar)
                            }
                            OutlinedTextField(
                                value = confirmPassword, onValueChange = { confirmPassword = it },
                                label = { Text("Confirm Password") },
                                leadingIcon = { Icon(Icons.Default.LockReset, null, tint = com.example.ui.theme.PolishSky) },
                                trailingIcon = {
                                    IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                                        Icon(if (confirmPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff, null, tint = Color(0xFF94A3B8))
                                    }
                                },
                                visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                singleLine = true, isError = !passwordsMatch, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                            )

                            SignupSectionHeader("Professional Information")
                            OutlinedTextField(value = hospitalName, onValueChange = { hospitalName = it }, label = { Text("Hospital Name") }, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp))
                            OutlinedTextField(value = hospitalId, onValueChange = { hospitalId = it }, label = { Text("Hospital ID (Optional)") }, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp))
                            OutlinedTextField(value = licenseNumber, onValueChange = { licenseNumber = it }, label = { Text("Medical License No.") }, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp))
                            OutlinedTextField(value = registrationNumber, onValueChange = { registrationNumber = it }, label = { Text("Registration No.") }, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp))
                            OutlinedTextField(value = specialization, onValueChange = { specialization = it }, label = { Text("Specialization") }, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp))
                            OutlinedTextField(value = department, onValueChange = { department = it }, label = { Text("Department") }, colors = colors, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp))
                            
                            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(value = qualification, onValueChange = { qualification = it }, label = { Text("Qualification") }, colors = colors, modifier = Modifier.weight(1f))
                                OutlinedTextField(value = experience, onValueChange = { experience = it }, label = { Text("Exp (Years)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = colors, modifier = Modifier.weight(1f))
                            }

                            SignupSectionHeader("Facility Address")
                            OutlinedTextField(
                                value = address, 
                                onValueChange = { address = it }, 
                                label = { Text("Hospital Address") }, 
                                colors = colors, 
                                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                                trailingIcon = {
                                    IconButton(onClick = { 
                                        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                                            fetchLiveLocation()
                                        } else {
                                            locationPermissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                                        }
                                    }) {
                                        Icon(Icons.Default.MyLocation, "Get Live Location", tint = PolishSky)
                                    }
                                }
                            )
                            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, colors = colors, modifier = Modifier.weight(1f))
                                OutlinedTextField(value = state, onValueChange = { state = it }, label = { Text("State") }, colors = colors, modifier = Modifier.weight(1f))
                            }
                            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(value = country, onValueChange = { country = it }, label = { Text("Country") }, colors = colors, modifier = Modifier.weight(1f))
                                OutlinedTextField(value = pinCode, onValueChange = { pinCode = it }, label = { Text("PIN Code") }, colors = colors, modifier = Modifier.weight(1f))
                            }

                            SignupSectionHeader("Verification Documents")
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                if (avatarUri != null) {
                                    Surface(
                                        modifier = Modifier.size(56.dp).clip(RoundedCornerShape(12.dp)).border(1.dp, PolishSky, RoundedCornerShape(12.dp)),
                                        color = Color.White
                                    ) {
                                        androidx.compose.ui.viewinterop.AndroidView(
                                            factory = { ctx ->
                                                android.widget.ImageView(ctx).apply {
                                                    scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
                                                    setImageURI(avatarUri)
                                                }
                                            },
                                            update = { it.setImageURI(avatarUri) },
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                }
                                ImagePickerButton("Profile Photo", avatarUri != null, modifier = Modifier.weight(1f)) { avatarLauncher.launch("image/*") }
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                if (govIdUri != null) {
                                    Surface(
                                        modifier = Modifier.size(56.dp).clip(RoundedCornerShape(12.dp)).border(1.dp, PolishSky, RoundedCornerShape(12.dp)),
                                        color = Color.White
                                    ) {
                                        androidx.compose.ui.viewinterop.AndroidView(
                                            factory = { ctx ->
                                                android.widget.ImageView(ctx).apply {
                                                    scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
                                                    setImageURI(govIdUri)
                                                }
                                            },
                                            update = { it.setImageURI(govIdUri) },
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                }
                                ImagePickerButton("Government ID", govIdUri != null, modifier = Modifier.weight(1f)) { govIdLauncher.launch("image/*") }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            if (medicalCertificateUri != null) {
                                Surface(
                                    modifier = Modifier.size(56.dp).clip(RoundedCornerShape(12.dp)).border(1.dp, PolishSky, RoundedCornerShape(12.dp)),
                                    color = Color.White
                                ) {
                                    androidx.compose.ui.viewinterop.AndroidView(
                                        factory = { ctx ->
                                            android.widget.ImageView(ctx).apply {
                                                scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
                                                setImageURI(medicalCertificateUri)
                                            }
                                        },
                                        update = { it.setImageURI(medicalCertificateUri) },
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                            }
                            ImagePickerButton("Medical Certificate", medicalCertificateUri != null, modifier = Modifier.weight(1f)) { medicalCertificateLauncher.launch("*/*") }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    loadingMessage = "Creating clinical account..."
                                    viewModel.signupDoctor(
                                        email, name, password, phone, hospitalName, hospitalId.ifEmpty { null },
                                        licenseNumber, registrationNumber, specialization, department,
                                        experience.toIntOrNull() ?: 0, qualification, gender, dob, address,
                                        city, state, country, pinCode, avatarUri, govIdUri, medicalCertificateUri
                                    ) {
                                        onLoginSuccess() 
                                    }
                                },
                                enabled = !isLoading && isSignUpEnabled,
                                colors = ButtonDefaults.buttonColors(containerColor = com.example.ui.theme.PolishSky),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth().height(56.dp)
                            ) {
                                if (isLoading) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                                } else {
                                    Text("Create Clinical Account", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(48.dp))
        }

        if (showSuccessDialog) {
            AlertDialog(
                onDismissRequest = { showSuccessDialog = false; isSignUpMode = false },
                title = { Text("Registration Submitted", fontWeight = FontWeight.Bold) },
                text = { Text("Dr. $lastSignedUpDoctorName, your account has been created. Please wait for admin verification before full access.") },
                confirmButton = {
                    Button(onClick = { showSuccessDialog = false; isSignUpMode = false }) { Text("OK") }
                }
            )
        }
    }
}

@Composable
fun SignupSectionHeader(title: String) {
    Text(
        text = title, fontSize = 12.sp, fontWeight = FontWeight.Black,
        color = com.example.ui.theme.PolishSky,
        modifier = Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 12.dp)
    )
}

@Composable
fun ImagePickerButton(label: String, isSelected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, if (isSelected) com.example.ui.theme.PolishAccentEmerald else Color(0xFFE2E8F0)),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = if (isSelected) com.example.ui.theme.PolishAccentEmerald else Color.Gray)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(if (isSelected) Icons.Default.CheckCircle else Icons.Default.CloudUpload, null)
            Spacer(modifier = Modifier.width(8.dp))
            Text(if (isSelected) "$label Selected" else "Upload $label")
        }
    }
}

// --- MODERN CLINICAL UI COMPONENTS ---

@Composable
fun ModernAccountTypeSelector(
    selectedRole: String,
    onRoleSelected: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Sign in as",
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = PolishDarkSlate,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            listOf("DOCTOR" to "Doctor", "ADMIN" to "Admin").forEach { (id, label) ->
                val isSelected = selectedRole == id
                Surface(
                    onClick = { onRoleSelected(id) },
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSelected) PolishSky else Color.Transparent,
                    shadowElevation = if (isSelected) 2.dp else 0.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = label,
                            fontSize = 14.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color.White else Color.Gray
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ModernLoginInput(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    leadingIcon: ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 8.dp, start = 4.dp)
        )
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, fontSize = 14.sp, color = Color.LightGray) },
            leadingIcon = { Icon(leadingIcon, null, modifier = Modifier.size(18.dp), tint = PolishSky) },
            trailingIcon = trailingIcon,
            visualTransformation = visualTransformation,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White,
                disabledContainerColor = Color.White,
                cursorColor = PolishSky,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
            )
        )
    }
}

@Composable
fun InlineErrorMessage(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFFEF2F2), RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.Error, null, tint = Color.Red, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text("Unable to sign in", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF991B1B))
            Text(message, fontSize = 12.sp, color = Color(0xFFB91C1C))
        }
    }
}

