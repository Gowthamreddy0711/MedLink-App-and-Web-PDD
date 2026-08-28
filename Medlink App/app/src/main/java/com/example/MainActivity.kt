package com.example

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.example.ui.screens.AdminDashboardScreen
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.DoctorApprovalGateScreen
import com.example.ui.screens.DoctorDashboardScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.MedLinkViewModel
import com.example.ui.viewmodel.ProfileLoadState
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val viewModel: MedLinkViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            startupApp()
        }
    }

    private fun startupApp() {
        try {
            enableEdgeToEdge()
            setContent {
                MyApplicationTheme {
                    val sessionState by viewModel.currentUser.collectAsState()

                    Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                        val ignored = innerPadding 
                        
                        if (!sessionState.isLoggedIn) {
                            AuthScreen(
                                viewModel = viewModel,
                                onLoginSuccess = {}
                            )
                        } else {
                            val userDetails by viewModel.userDetails.collectAsState()
                            val profileState by viewModel.profileState.collectAsState()
                            val profileError by viewModel.profileErrorMessage.collectAsState()
                            
                            when (profileState) {
                                ProfileLoadState.LOADING -> {
                                    // 1. WAIT FOR FIRESTORE PROFILE
                                    Box(
                                        modifier = Modifier.fillMaxSize().background(com.example.ui.theme.PolishBg), 
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            CircularProgressIndicator(color = com.example.ui.theme.PolishSky)
                                            Spacer(modifier = Modifier.height(16.dp))
                                            Text("Verifying Clinical Status...", color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                                ProfileLoadState.SUCCESS -> {
                                    if (userDetails == null) {
                                        // This shouldn't happen if SUCCESS is emitted
                                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                                    } else {
                                        val currentRole = userDetails!!.role.trim().uppercase()
                                        Log.d("ADMIN_LOGIN_DEBUG", "---------------------------------------")
                                        Log.d("ADMIN_LOGIN_DEBUG", "Email: ${sessionState.email}")
                                        Log.d("ADMIN_LOGIN_DEBUG", "Firebase Auth UID: ${sessionState.id}")
                                        Log.d("ADMIN_LOGIN_DEBUG", "Firestore path: users/${sessionState.id}")
                                        Log.d("ADMIN_LOGIN_DEBUG", "Firestore role: ${userDetails!!.role}")
                                        Log.d("ADMIN_LOGIN_DEBUG", "Resolved application role: $currentRole")
                                        
                                        when (currentRole) {
                                            "ADMIN" -> {
                                                Log.d("ADMIN_LOGIN_DEBUG", "Selected destination: ADMIN_DASHBOARD (COMPLIANCE CONSOLE)")
                                                AdminDashboardScreen(
                                                    viewModel = viewModel,
                                                    onLogout = { viewModel.logout() }
                                                )
                                            }
                                            "DOCTOR" -> {
                                                Log.d("ADMIN_LOGIN_DEBUG", "Selected destination: DOCTOR_DASHBOARD")
                                                if (userDetails?.approvalStatus != "APPROVED") {
                                                    DoctorApprovalGateScreen(
                                                        user = userDetails!!,
                                                        onLogout = { viewModel.logout() }
                                                    )
                                                } else {
                                                    DoctorDashboardScreen(
                                                        viewModel = viewModel,
                                                        onLogout = { viewModel.logout() }
                                                    )
                                                }
                                            }
                                            "" -> {
                                                Log.e("ADMIN_LOGIN_DEBUG", "ERROR: Role field is empty in Firestore document")
                                                ProfileNotFoundScreen(
                                                    title = "Incomplete Profile",
                                                    message = "Your clinical profile is missing a defined role (Doctor/Admin). Please contact support.",
                                                    onLogout = { viewModel.logout() }
                                                )
                                            }
                                            else -> {
                                                Log.e("ADMIN_LOGIN_DEBUG", "SECURITY REJECTION: UNKNOWN ROLE ($currentRole)")
                                                ProfileNotFoundScreen(
                                                    title = "Unauthorized Role",
                                                    message = "The role '$currentRole' is not recognized by the MedLink clinical system.",
                                                    onLogout = { viewModel.logout() }
                                                )
                                            }
                                        }
                                        Log.d("ADMIN_LOGIN_DEBUG", "---------------------------------------")
                                    }
                                }
                                ProfileLoadState.PROFILE_NOT_FOUND -> {
                                    ProfileNotFoundScreen(onLogout = { viewModel.logout() })
                                }
                                ProfileLoadState.UNAUTHORIZED -> {
                                    ProfileNotFoundScreen(
                                        title = "Access Restricted",
                                        message = "You do not have the required Firestore permissions to access this clinical profile.",
                                        onLogout = { viewModel.logout() }
                                    )
                                }
                                ProfileLoadState.ERROR -> {
                                    ProfileVerificationErrorScreen(
                                        errorMessage = profileError ?: "An unexpected error occurred during clinical verification.",
                                        onLogout = { viewModel.logout() }
                                    )
                                }
                                ProfileLoadState.IDLE -> {
                                    // Fallback to Auth
                                    AuthScreen(viewModel = viewModel, onLoginSuccess = {})
                                }
                            }
                        }
                    }
                }
            }
        } catch (t: Throwable) {
            Log.e("MainActivity", "FATAL STARTUP ERROR", t)
            finish()
        }
    }
}

@Composable
fun ProfileNotFoundScreen(
    title: String = "Clinical Profile Not Found",
    message: String = "Your authenticated account does not have a corresponding MedLink profile. Please contact your system administrator.",
    onLogout: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize().background(com.example.ui.theme.PolishBg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                modifier = Modifier.size(80.dp),
                tint = Color.Red
            )
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = title,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = com.example.ui.theme.PolishDarkSlate,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                fontSize = 14.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )
            Spacer(modifier = Modifier.height(32.dp))
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = com.example.ui.theme.PolishSky)
            ) {
                Text("Return to Login", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ProfileVerificationErrorScreen(
    errorMessage: String,
    onLogout: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize().background(com.example.ui.theme.PolishBg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = Color(0xFFFEE2E2),
                modifier = Modifier.size(100.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.CloudOff,
                        contentDescription = null,
                        modifier = Modifier.size(50.dp),
                        tint = Color.Red
                    )
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "Clinical Verification Failed",
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = com.example.ui.theme.PolishDarkSlate,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "MedLink was unable to verify your clinical credentials at this time.",
                fontSize = 15.sp,
                color = com.example.ui.theme.PolishDarkSlate,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Text(
                "Error Detail: $errorMessage",
                fontSize = 13.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp)
            )
            Spacer(modifier = Modifier.height(40.dp))
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
            ) {
                Text("Sign Out & Retry", fontWeight = FontWeight.Bold)
            }
        }
    }
}
