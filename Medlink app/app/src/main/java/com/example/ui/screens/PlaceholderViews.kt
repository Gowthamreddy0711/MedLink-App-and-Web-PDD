package com.example.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.LeaveRequest
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.viewmodel.MedLinkViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CoverageCalendarView(viewModel: MedLinkViewModel, onBack: () -> Unit) {
    val myLeaves by viewModel.myLeaveRequests.collectAsState()
    val myDuties by viewModel.myCoverageDuties.collectAsState()
    
    var calendar by remember { mutableStateOf(Calendar.getInstance()) }
    val monthYear = SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(calendar.time)

    // Grouping logic for multiple shifts per day
    val shiftsByDate = remember(myLeaves, myDuties) {
        val map = mutableMapOf<String, MutableList<LeaveRequest>>()
        val today = Calendar.getInstance()
        val currentYear = today.get(Calendar.YEAR)
        
        (myLeaves + myDuties).forEach { req ->
            val startMs = req.leaveStartDateLong
            val endMs = req.leaveEndDateLong
            
            // SAFETY: Ignore requests with missing or ancient dates
            if (startMs <= 0 || endMs <= 0) return@forEach
            
            val startCal = Calendar.getInstance().apply { 
                timeInMillis = startMs
                set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            }
            val endCal = Calendar.getInstance().apply { 
                timeInMillis = endMs
                set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            }
            
            // PERFORMANCE: Limit to +- 1 year from current calendar view or standard range
            // If the request spans more than a reasonable window (e.g. 1 year), cap it
            var iterations = 0
            while (!startCal.after(endCal) && iterations < 366) {
                val key = "${startCal.get(Calendar.YEAR)}-${startCal.get(Calendar.MONTH)}-${startCal.get(Calendar.DAY_OF_MONTH)}"
                map.getOrPut(key) { mutableListOf() }.add(req)
                startCal.add(Calendar.DAY_OF_MONTH, 1)
                iterations++
            }
        }
        map
    }

    var selectedDateShifts by remember { mutableStateOf<List<LeaveRequest>?>(null) }
    var selectedDateLabel by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clinical Schedule", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = PolishDarkSlate) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = PolishBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            // Calendar Header
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { 
                    val newCal = calendar.clone() as Calendar
                    newCal.add(Calendar.MONTH, -1)
                    calendar = newCal
                }) { Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, null) }
                
                Text(monthYear, fontSize = 20.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
                
                IconButton(onClick = { 
                    val newCal = calendar.clone() as Calendar
                    newCal.add(Calendar.MONTH, 1)
                    calendar = newCal
                }) { Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null) }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Days of week
            Row(modifier = Modifier.fillMaxWidth()) {
                listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat").forEach { day ->
                    Text(day, modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Calendar Grid
            val days = getDaysInMonth(calendar)
            LazyVerticalGrid(columns = GridCells.Fixed(7), modifier = Modifier.fillMaxWidth()) {
                items(days) { date ->
                    if (date == null) {
                        Spacer(modifier = Modifier.aspectRatio(1f))
                    } else {
                        val cal = Calendar.getInstance().apply { time = date }
                        val key = "${cal.get(Calendar.YEAR)}-${cal.get(Calendar.MONTH)}-${cal.get(Calendar.DAY_OF_MONTH)}"
                        val shifts = shiftsByDate[key] ?: emptyList()
                        
                        CalendarDay(
                            date = date, 
                            shifts = shifts,
                            onClick = {
                                if (shifts.isNotEmpty()) {
                                    selectedDateShifts = shifts
                                    selectedDateLabel = SimpleDateFormat("dd MMMM yyyy", Locale.getDefault()).format(date)
                                }
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Legend
            Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    LegendItem(Color(0xFFDCFCE7), Color(0xFF10B981), "Coverage Duty")
                    LegendItem(Color(0xFFE0F2FE), PolishSky, "Leave Request")
                    LegendItem(Color(0xFFFEE2E2), Color(0xFFEF4444), "Urgent / Critical")
                }
            }
        }

        // Detailed View Dialog
        if (selectedDateShifts != null) {
            Dialog(onDismissRequest = { selectedDateShifts = null }) {
                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(selectedDateLabel, fontSize = 18.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(selectedDateShifts!!) { shift ->
                                ShiftDetailItem(shift)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = { selectedDateShifts = null },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PolishSky)
                        ) {
                            Text("Close", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CalendarDay(date: Date, shifts: List<LeaveRequest>, onClick: () -> Unit) {
    val cal = Calendar.getInstance().apply { time = date }
    val dayNum = cal.get(Calendar.DAY_OF_MONTH)
    val isToday = isSameDay(date, Date())
    
    val hasDuty = shifts.any { it.status == "ACCEPTED" || it.status == "IN_PROGRESS" }
    val hasUrgent = shifts.any { it.priority == "Urgent" }

    val bgColor = when {
        hasUrgent -> Color(0xFFFEE2E2)
        hasDuty -> Color(0xFFDCFCE7)
        shifts.isNotEmpty() -> Color(0xFFE0F2FE)
        else -> Color.White
    }

    val dotColor = when {
        hasUrgent -> Color(0xFFEF4444)
        hasDuty -> Color(0xFF10B981)
        shifts.isNotEmpty() -> PolishSky
        else -> null
    }

    Box(
        modifier = Modifier
            .aspectRatio(0.8f) // Slightly taller to fit text
            .padding(4.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(bgColor)
            .border(if (isToday) 2.dp else 1.dp, if (isToday) PolishSky else Color(0xFFF1F5F9), RoundedCornerShape(14.dp))
            .clickable(enabled = shifts.isNotEmpty()) { onClick() },
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(vertical = 6.dp)
        ) {
            Text(
                text = dayNum.toString(), 
                fontWeight = if (isToday) FontWeight.Black else FontWeight.Bold, 
                color = if (isToday) PolishSky else PolishDarkSlate, 
                fontSize = 14.sp
            )
            
            if (shifts.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${shifts.size} shift${if(shifts.size > 1) "s" else ""}", 
                    fontSize = 8.sp, 
                    fontWeight = FontWeight.Black, 
                    color = dotColor ?: Color.Gray
                )
                
                // Show first shift type
                Text(
                    text = shifts.first().coverageType.split(" ").first(),
                    fontSize = 7.sp,
                    color = Color.Gray,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun ShiftDetailItem(shift: LeaveRequest) {
    Surface(
        color = Color(0xFFF8FAFC),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(4.dp, 40.dp).clip(CircleShape).background(if (shift.priority == "Urgent") Color.Red else PolishSky)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(shift.coverageType, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = PolishDarkSlate)
                Text("Reason: ${shift.reason}", fontSize = 11.sp, color = Color.Gray, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("Status: ${shift.status}", fontSize = 10.sp, fontWeight = FontWeight.Black, color = PolishSky)
            }
        }
    }
}

@Composable
fun LegendItem(bgColor: Color, dotColor: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(24.dp).clip(RoundedCornerShape(6.dp)).background(bgColor).border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(6.dp)), contentAlignment = Alignment.Center) {
            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(dotColor))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = PolishDarkSlate)
    }
}

fun getDaysInMonth(calendar: Calendar): List<Date?> {
    val cal = calendar.clone() as Calendar
    cal.set(Calendar.DAY_OF_MONTH, 1)
    val firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1
    val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    
    val days = mutableListOf<Date?>()
    for (i in 0 until firstDayOfWeek) days.add(null)
    for (i in 1..daysInMonth) {
        days.add(cal.time)
        cal.add(Calendar.DAY_OF_MONTH, 1)
    }
    return days
}

fun isSameDay(d1: Date, d2: Date): Boolean {
    val c1 = Calendar.getInstance().apply { time = d1 }
    val c2 = Calendar.getInstance().apply { time = d2 }
    return c1.get(Calendar.YEAR) == c2.get(Calendar.YEAR) && c1.get(Calendar.DAY_OF_YEAR) == c2.get(Calendar.DAY_OF_YEAR)
}


