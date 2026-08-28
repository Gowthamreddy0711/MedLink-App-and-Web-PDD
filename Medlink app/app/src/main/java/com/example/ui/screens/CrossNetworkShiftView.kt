package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.viewmodel.MedLinkViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrossNetworkShiftView(viewModel: MedLinkViewModel, onBack: () -> Unit) {
    val hospitals by viewModel.hospitalsList.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadHospitals()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Network Shifts", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = PolishBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Text(
                "Volunteer for shifts across the Digital Healthcare Network.",
                modifier = Modifier.padding(20.dp),
                fontSize = 13.sp,
                color = Color.Gray
            )

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(hospitals) { hospital ->
                    Card(
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(shape = RoundedCornerShape(12.dp), color = Color(0xFFF1F5F9), modifier = Modifier.size(52.dp)) {
                                    Icon(Icons.Default.Business, null, tint = PolishSky, modifier = Modifier.padding(12.dp))
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(hospital.name, fontWeight = FontWeight.Bold, color = PolishDarkSlate, fontSize = 16.sp)
                                    Text(hospital.address, fontSize = 11.sp, color = Color.Gray)
                                }
                                Badge(containerColor = if (hospital.priority == "Urgent") Color(0xFFFEE2E2) else Color(0xFFE0F2FE)) {
                                    Text(hospital.priority, modifier = Modifier.padding(4.dp), fontSize = 10.sp, color = if (hospital.priority == "Urgent") Color.Red else PolishSky)
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(20.dp))
                            
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            HospitalStatMini(Icons.Default.Route, "${hospital.distanceKmDouble} km", "Distance")
                            HospitalStatMini(Icons.Default.EventAvailable, "${hospital.availableShiftsCountInt} Shifts", "Available")
                            HospitalStatMini(Icons.Default.Groups, hospital.type, "Facility")
                        }
                            
                            Spacer(modifier = Modifier.height(20.dp))
                            HorizontalDivider(color = Color(0xFFF8FAFC))
                            Spacer(modifier = Modifier.height(20.dp))
                            
                            Button(
                                onClick = { /* Volunteer for shift logic */ },
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = PolishSky)
                            ) {
                                Text("Volunteer for Network Shift", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HospitalStatMini(icon: androidx.compose.ui.graphics.vector.ImageVector, value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, null, tint = Color.Gray, modifier = Modifier.size(16.dp))
        Text(value, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = PolishDarkSlate, modifier = Modifier.padding(top = 4.dp))
        Text(label, fontSize = 9.sp, color = Color.Gray)
    }
}
