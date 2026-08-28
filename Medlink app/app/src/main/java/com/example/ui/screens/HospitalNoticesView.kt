package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HospitalNoticesView(viewModel: MedLinkViewModel, onBack: () -> Unit) {
    val notices by viewModel.hospitalNotices.collectAsState()
    val user by viewModel.userDetails.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Hospital Notices", fontWeight = FontWeight.Bold) },
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
            if (notices.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No notices posted yet.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(notices) { notice ->
                        val isRead = user?.readNoticeIds?.contains(notice.id) ?: false
                        NoticeCard(notice, isRead) {
                            viewModel.markNoticeAsRead(notice.id)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NoticeCard(notice: com.example.data.model.HospitalNotice, isRead: Boolean, onRead: () -> Unit) {
    val sdf = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())
    val dateStr = sdf.format(Date(notice.timestampLong))

    LaunchedEffect(Unit) {
        onRead()
    }

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = if (isRead) Color.White else Color(0xFFF0F9FF)),
        modifier = Modifier.fillMaxWidth().border(1.dp, if (isRead) Color(0xFFF1F5F9) else PolishSky.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = CircleShape,
                    color = when(notice.type) {
                        "ALERT" -> Color(0xFFFEE2E2)
                        "CIRCULAR" -> Color(0xFFE0F2FE)
                        else -> Color(0xFFF1F5F9)
                    },
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = when(notice.type) {
                            "ALERT" -> Icons.Default.Warning
                            "CIRCULAR" -> Icons.Default.Description
                            else -> Icons.Default.Info
                        },
                        contentDescription = null,
                        tint = when(notice.type) {
                            "ALERT" -> Color.Red
                            "CIRCULAR" -> PolishSky
                            else -> Color.Gray
                        },
                        modifier = Modifier.padding(8.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(notice.title, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                    Text(dateStr, fontSize = 10.sp, color = Color.Gray)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(notice.content, fontSize = 13.sp, color = Color.DarkGray, lineHeight = 18.sp)
        }
    }
}
