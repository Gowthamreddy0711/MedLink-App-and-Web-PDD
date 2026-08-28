package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.User
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.viewmodel.MedLinkViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorDirectoryScreen(
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit,
    onBack: () -> Unit
) {
    val doctors by viewModel.doctorsList.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    
    val filteredDoctors = remember(doctors, searchQuery) {
        doctors.filter { 
            it.id != currentUser.id && 
            (it.name.contains(searchQuery, ignoreCase = true) || 
             it.specialty?.contains(searchQuery, ignoreCase = true) == true ||
             it.qualification?.contains(searchQuery, ignoreCase = true) == true ||
             it.hospitalName?.contains(searchQuery, ignoreCase = true) == true)
        }
    }

    Scaffold(
        topBar = {
            Surface(color = Color.White, shadowElevation = 1.dp) {
                TopAppBar(
                    title = {
                        Column {
                            Text("Clinician Directory", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text("Find and connect with clinicians in your network", fontSize = 10.sp, color = Color.Gray)
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = PolishDarkSlate)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )
            }
        },
        containerColor = PolishBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, specialty, or qualification...") },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(vertical = 16.dp),
                shape = RoundedCornerShape(16.dp),
                leadingIcon = { Icon(Icons.Default.Search, null, tint = PolishSky) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PolishSky, 
                    unfocusedBorderColor = Color(0xFFE2E8F0), 
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                )
            )

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentPadding = PaddingValues(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(1.dp)
            ) {
                items(filteredDoctors) { doctor ->
                    ClinicianDirectoryCard(doctor, onChatOpen, onViewProfile)
                }
            }
        }
    }
}

@Composable
fun ClinicianDirectoryCard(
    doctor: User,
    onChatOpen: (User) -> Unit,
    onViewProfile: (User) -> Unit
) {
    val context = LocalContext.current
    Surface(
        color = Color.White,
        modifier = Modifier.fillMaxWidth().clickable { onViewProfile(doctor) }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = CircleShape, 
                    modifier = Modifier.size(64.dp), 
                    color = Color(0xFFF1F5F9),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    AsyncImage(
                        model = doctor.avatarUrl, 
                        contentDescription = "Clinician Photo", 
                        contentScale = ContentScale.Crop,
                        placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                        error = rememberVectorPainter(Icons.Default.AccountCircle)
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(doctor.name, fontWeight = FontWeight.Black, fontSize = 16.sp, color = PolishDarkSlate)
                        if (doctor.verified) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.Default.CheckCircle, "Verified", tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                        }
                    }
                    Text(doctor.specialty ?: "General Practice", fontSize = 12.sp, color = PolishSky, fontWeight = FontWeight.Bold)
                    Text(doctor.qualification ?: "", fontSize = 11.sp, color = Color.Gray)
                    Text(doctor.hospitalName ?: "Independent Practice", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
                }
                AvailabilityIndicator(doctor.clinicStatus)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(), 
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = { onChatOpen(doctor) },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PolishSky),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    modifier = Modifier.weight(1f).height(40.dp)
                ) {
                    Icon(Icons.Default.Chat, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Message", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                
                OutlinedButton(
                    onClick = { onViewProfile(doctor) },
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    modifier = Modifier.weight(1f).height(40.dp)
                ) {
                    Text("View Profile", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                }

                if (doctor.email.isNotBlank()) {
                    IconButton(
                        onClick = { 
                            val intent = Intent(Intent.ACTION_SENDTO).apply {
                                data = Uri.parse("mailto:${doctor.email}")
                            }
                            context.startActivity(intent)
                        },
                        modifier = Modifier.size(40.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(10.dp))
                    ) {
                        Icon(Icons.Outlined.Email, "Email", tint = Color.Gray, modifier = Modifier.size(20.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun AvailabilityIndicator(status: String) {
    Box(
        modifier = Modifier
            .size(8.dp)
            .clip(CircleShape)
            .background(if (status == "Available") Color(0xFF10B981) else Color.LightGray)
    )
}

@Composable
fun AvailabilityBadge(status: String) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (status == "Available") Color(0xFFDCFCE7) else Color(0xFFF1F5F9)
    ) {
        Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(if (status == "Available") Color(0xFF10B981) else Color.Gray))
            Spacer(modifier = Modifier.width(6.6.dp))
            Text(status, fontSize = 9.sp, fontWeight = FontWeight.Black, color = if (status == "Available") Color(0xFF166534) else Color.Gray)
        }
    }
}
