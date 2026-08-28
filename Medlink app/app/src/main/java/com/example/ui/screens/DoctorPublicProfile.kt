package com.example.ui.screens

import android.util.Log
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.core.net.toUri
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.CoverageFeedback
import com.example.data.model.User
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.theme.PolishSkyLight
import com.example.ui.viewmodel.MedLinkViewModel
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorPublicProfileView(
    viewModel: MedLinkViewModel,
    doctor: User,
    onBack: () -> Unit
) {
    // Collect the latest doctor info from the main directory state if available, or stay with param
    val allDoctors by viewModel.doctorsList.collectAsState()
    val latestDoctor = allDoctors.find { it.id == doctor.id } ?: doctor

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clinical Profile", fontWeight = FontWeight.Bold) },
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
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Header
            Surface(
                shape = CircleShape, 
                color = PolishSkyLight, 
                modifier = Modifier.size(120.dp)
            ) {
                AsyncImage(
                    model = latestDoctor.avatarUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                    error = rememberVectorPainter(Icons.Default.AccountCircle)
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(latestDoctor.name, fontSize = 24.sp, fontWeight = FontWeight.Black, color = PolishDarkSlate)
            Text("${latestDoctor.qualification} • ${latestDoctor.specialty}", fontSize = 14.sp, color = PolishSky, fontWeight = FontWeight.Bold)
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Availability Status
            AvailabilityBadge(latestDoctor.clinicStatus)
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Professional Details
            ProfileDetailSection("Professional Information", Icons.Default.Work) {
                ReadOnlyDataRow("Specialization", latestDoctor.specialty ?: "General Practice")
                ReadOnlyDataRow("Department", latestDoctor.department ?: "N/A")
                ReadOnlyDataRow("Experience", "${latestDoctor.experienceInt} Years")
                ReadOnlyDataRow("Qualification", latestDoctor.qualification ?: "N/A")
            }
            
            ProfileDetailSection("Hospital Affiliation", Icons.Default.Business) {
                ReadOnlyDataRow("Hospital Name", latestDoctor.hospitalName ?: "Independent Practice")
                ReadOnlyDataRow("Hospital ID", latestDoctor.hospitalId ?: "N/A")
                ReadOnlyDataRow("Location", "${latestDoctor.city}, ${latestDoctor.state}")
            }
            
            ProfileDetailSection("Verification Status", Icons.Default.VerifiedUser) {
                ReadOnlyDataRow(
                    "Credential Status", 
                    if (latestDoctor.verified) "ACCREDITED PRACTITIONER" else "VERIFICATION PENDING",
                    if (latestDoctor.verified) Color(0xFF10B981) else Color(0xFFD97706)
                )
            }

            ProfileDetailSection("Verification Documents", Icons.Default.Description) {
                DocumentRow("Medical Certificate", latestDoctor.medicalCertificateUrl)
                DocumentRow("Government ID", latestDoctor.govIdUrl)
            }

            // Fetch Feedback List once for all sections
            val profileIds = remember(latestDoctor) { 
                listOf(latestDoctor.id, latestDoctor.email).filter { it.isNotBlank() } 
            }
            val feedbackFlow = remember(profileIds) {
                viewModel.getDoctorFeedbackFlow(profileIds)
            }
            val feedbackList by feedbackFlow.collectAsState(null)

            // AI Feedback Sentiment Section
            ProfileDetailSection("Coverage Feedback Insights", Icons.Default.AutoAwesome) {
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
                    
                    // --- ULTIMATE DIAGNOSTIC RENDER ---
                    val analyzedFeedback = currentList.filter { !it.sentiment.isNullOrBlank() }
                    
                    val posCount = analyzedFeedback.count { it.sentiment?.trim()?.uppercase() == "POSITIVE" }
                    val neuCount = analyzedFeedback.count { it.sentiment?.trim()?.uppercase() == "NEUTRAL" }
                    val negCount = analyzedFeedback.count { it.sentiment?.trim()?.uppercase() == "NEGATIVE" }

                    val totalPoints = (posCount * 100.0) + (neuCount * 50.0) + (negCount * 0.0)
                    val sentimentScoreValue = if (analyzedFeedback.isNotEmpty()) (totalPoints / analyzedFeedback.size).toInt() else 0
                    
                    Log.d("AI_SENTIMENT_RENDER", """
                        RENDER_EVENT: ${System.currentTimeMillis()}
                        doctor: ${latestDoctor.name}
                        feedbackListSize: ${currentList.size}
                        analyzedSize: ${analyzedFeedback.size}
                        pos: $posCount, neu: $neuCount, neg: $negCount
                        totalPoints: $totalPoints
                        sentimentScoreValue: $sentimentScoreValue
                    """.trimIndent())

                    val posPercent = if (analyzedFeedback.isNotEmpty()) (posCount * 100) / analyzedFeedback.size else 0
                    val neuPercent = if (analyzedFeedback.isNotEmpty()) (neuCount * 100) / analyzedFeedback.size else 0
                    val negPercent = if (analyzedFeedback.isNotEmpty()) (negCount * 100) / analyzedFeedback.size else 0

                    Column(modifier = Modifier.fillMaxWidth()) {
                        val renderedText = "$sentimentScoreValue / 100"
                        Log.d("AI_SENTIMENT_RENDERED_TEXT", "Rendering text: '$renderedText' using variable: $sentimentScoreValue")
                        
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
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        SentimentProgressBar("Positive", posPercent, Color(0xFF10B981))
                        Spacer(modifier = Modifier.height(12.dp))
                        SentimentProgressBar("Neutral", neuPercent, Color(0xFFFACC15))
                        Spacer(modifier = Modifier.height(12.dp))
                        SentimentProgressBar("Negative", negPercent, Color(0xFFEF4444))
                    }
                }
            }

            ProfileDetailSection("Coverage Ratings & Reviews", Icons.Default.Star) {
                if (latestDoctor.totalReviewsInt > 0) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = latestDoctor.averageRatingFloat.toString(),
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = PolishDarkSlate
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Row {
                                repeat(5) { index ->
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = null,
                                        tint = if (index < latestDoctor.averageRatingFloat.toInt()) Color(0xFFFACC15) else Color.LightGray,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                            Text(
                                text = "Based on ${latestDoctor.totalReviewsInt} peer reviews",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        }
                    }
                    
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text("Recent Peer Feedback", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    if (feedbackList == null) {
                        Text("Loading feedback...", fontSize = 12.sp, color = Color.Gray)
                    } else {
                        feedbackList!!.forEach { feedback ->
                            FeedbackItem(feedback)
                            HorizontalDivider(color = Color(0xFFF8FAFC), modifier = Modifier.padding(vertical = 8.dp))
                        }
                    }
                } else {
                    Box(Modifier.fillMaxWidth().padding(vertical = 20.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.RateReview, null, tint = Color.LightGray, modifier = Modifier.size(40.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No coverage ratings yet", color = Color.Gray, fontSize = 13.sp)
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun SentimentProgressBar(label: String, percentage: Int, color: Color) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PolishDarkSlate)
            Text("$percentage%", fontSize = 12.sp, fontWeight = FontWeight.Black, color = color)
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { percentage.toFloat() / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = color,
            trackColor = color.copy(alpha = 0.1f),
        )
    }
}

@Composable
fun FeedbackItem(feedback: CoverageFeedback) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            repeat(5) { index ->
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = if (index < feedback.ratingInt) Color(0xFFFACC15) else Color.LightGray,
                    modifier = Modifier.size(10.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            val dateStr = java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(java.util.Date(feedback.createdAtLong))
            Text(text = dateStr, fontSize = 9.sp, color = Color.Gray)
        }
        if (feedback.reviewText.isNotBlank()) {
            Text(
                text = "\"${feedback.reviewText}\"",
                fontSize = 13.sp,
                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                color = Color.DarkGray,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}


@Composable
fun DocumentRow(label: String, url: String?) {
    val context = androidx.compose.ui.platform.LocalContext.current
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text(label, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        if (!url.isNullOrBlank()) {
            OutlinedButton(
                onClick = {
                    val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, url.toUri())
                    context.startActivity(intent)
                },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, PolishSky),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Visibility, null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("View $label", fontWeight = FontWeight.Bold)
            }
        } else {
            Text("Document not uploaded", fontSize = 13.sp, color = Color.LightGray, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
        }
    }
}

@Composable
fun ProfileDetailSection(title: String, icon: ImageVector, content: @Composable ColumnScope.() -> Unit) {
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
fun ReadOnlyDataRow(label: String, value: String, valueColor: Color = PolishDarkSlate) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text(label, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = valueColor, modifier = Modifier.padding(top = 4.dp))
    }
}
