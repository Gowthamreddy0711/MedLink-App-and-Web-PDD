package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.viewmodel.MedLinkViewModel
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CoverageAnalyticsView(viewModel: MedLinkViewModel, onBack: () -> Unit) {
    val analytics by viewModel.coverageAnalytics.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Continuity Analytics", fontWeight = FontWeight.Bold) },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            analytics?.let { data ->
                // Top Stats Row
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    AnalyticsStatCard("Efficiency", "${data.performanceScoreDouble}%", Icons.Default.TrendingUp, com.example.ui.theme.PolishAccentEmerald, Modifier.weight(1f))
                    AnalyticsStatCard("Hours Covered", "${data.totalHoursDouble}h", Icons.Default.History, PolishSky, Modifier.weight(1f))
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Middle Stats Row
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    AnalyticsStatCard("Accepted", data.acceptedCount.toString(), Icons.Default.CheckCircle, Color(0xFF10B981), Modifier.weight(1f))
                    AnalyticsStatCard("Rejected", data.rejectedCount.toString(), Icons.Default.Cancel, Color(0xFFEF4444), Modifier.weight(1f))
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Chart Section
                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(28.dp))
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("Coverage Performance Chart", fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Box(modifier = Modifier.fillMaxWidth().height(180.dp).padding(horizontal = 8.dp), contentAlignment = Alignment.Center) {
                        PerformanceChart(listOf(40f, 60f, 45f, 90f, 75f, 85f, data.performanceScoreDouble.toFloat()))
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            LegendMini("Shifts", PolishSky)
                            LegendMini("Continuity", com.example.ui.theme.PolishAccentEmerald)
                            LegendMini("Efficiency", Color(0xFFF59E0B))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Secondary Stats
                ProfileSectionHeader("Monthly Overview")
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        DetailStatRow("Avg. Response Time", "12 mins", Icons.Default.Timer, Color(0xFF8B5CF6))
                        DetailStatRow("Leave Requests", data.leaveRequestsCount.toString(), Icons.Default.EventBusy, Color(0xFFF59E0B))
                        DetailStatRow("Completed Shifts", data.completedCount.toString(), Icons.Default.AssignmentTurnedIn, Color(0xFF10B981))
                    }
                }
            } ?: run {
                Box(Modifier.fillMaxWidth().height(300.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Analytics, null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Insufficient data for analytics.", color = Color.Gray)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun PerformanceChart(dataPoints: List<Float>) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height
        val spacing = width / (dataPoints.size - 1)
        val maxVal = 100f
        
        val path = Path().apply {
            val startY = height - (dataPoints[0] / maxVal * height)
            moveTo(0f, startY)
            dataPoints.forEachIndexed { index, value ->
                val x = index * spacing
                val y = height - (value / maxVal * height)
                lineTo(x, y)
            }
        }
        
        drawPath(
            path = path,
            brush = Brush.verticalGradient(listOf(PolishSky, PolishSky.copy(alpha = 0.3f))),
            style = Stroke(width = 3.dp.toPx())
        )
        
        // Draw points
        dataPoints.forEachIndexed { index, value ->
            val x = index * spacing
            val y = height - (value / maxVal * height)
            drawCircle(color = PolishSky, radius = 4.dp.toPx(), center = androidx.compose.ui.geometry.Offset(x, y))
            drawCircle(color = Color.White, radius = 2.dp.toPx(), center = androidx.compose.ui.geometry.Offset(x, y))
        }
    }
}

@Composable
fun LegendMini(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(color))
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
    }
}

@Composable
fun DetailStatRow(label: String, value: String, icon: ImageVector, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Surface(shape = RoundedCornerShape(10.dp), color = color.copy(alpha = 0.1f), modifier = Modifier.size(36.dp)) {
            Icon(icon, null, tint = color, modifier = Modifier.padding(8.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = PolishDarkSlate, modifier = Modifier.weight(1f))
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
    }
}

@Composable
fun AnalyticsStatCard(label: String, value: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = modifier.height(100.dp).border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            Column {
                Text(value, fontSize = 20.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
                Text(label, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ProfileSectionHeader(title: String) {
    Text(
        text = title, fontSize = 12.sp, fontWeight = FontWeight.Black,
        color = PolishSky,
        modifier = Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 12.dp)
    )
}
