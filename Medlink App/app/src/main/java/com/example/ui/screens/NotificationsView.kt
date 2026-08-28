package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.EventNote
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
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsView(viewModel: MedLinkViewModel, onBack: () -> Unit) {
    val notifications by viewModel.userNotifications.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = PolishDarkSlate)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = PolishBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (notifications.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.NotificationsNone, null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("No new notifications.", color = Color.Gray)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(notifications) { notif ->
                        NotificationCard(notif)
                    }
                }
            }
        }
    }
}

@Composable
fun NotificationCard(notification: com.example.data.model.Notification) {
    val sdf = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())
    val dateStr = sdf.format(Date(notification.timestampLong))

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = if (notification.isRead) Color.White else Color(0xFFF0F9FF)),
        modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
    ) {
        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
                shape = CircleShape,
                color = when(notification.type) {
                    "LEAVE_REQUEST" -> Color(0xFFE0F2FE)
                    "VOLUNTEER" -> Color(0xFFDCFCE7)
                    else -> Color(0xFFF1F5F9)
                },
                modifier = Modifier.size(44.dp)
            ) {
                Icon(
                    imageVector = when(notification.type) {
                        "LEAVE_REQUEST" -> Icons.AutoMirrored.Filled.EventNote
                        "VOLUNTEER" -> Icons.Default.PersonAdd
                        else -> Icons.Default.Notifications
                    },
                    contentDescription = null,
                    tint = when(notification.type) {
                        "LEAVE_REQUEST" -> PolishSky
                        "VOLUNTEER" -> Color(0xFF10B981)
                        else -> Color.Gray
                    },
                    modifier = Modifier.padding(10.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(notification.title, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                Text(notification.message, fontSize = 13.sp, color = Color.Gray, modifier = Modifier.padding(top = 2.dp))
                Text(dateStr, fontSize = 10.sp, color = Color.LightGray, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}
