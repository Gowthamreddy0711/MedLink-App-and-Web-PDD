package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.Message
import com.example.data.model.User
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.viewmodel.MedLinkViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: MedLinkViewModel,
    otherUser: User,
    onBack: () -> Unit
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val messages by viewModel.communicationRepository.getDirectMessagesFlow(currentUser.id, otherUser.id).collectAsState(emptyList())
    var text by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
            viewModel.communicationRepository.markMessagesAsRead(currentUser.id, otherUser.id)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = CircleShape, modifier = Modifier.size(36.dp), color = Color(0xFFF1F5F9)) {
                            AsyncImage(
                                model = otherUser.avatarUrl, 
                                contentDescription = "Doctor Photo", 
                                contentScale = ContentScale.Crop,
                                placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                                error = rememberVectorPainter(Icons.Default.AccountCircle)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(otherUser.name, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text(otherUser.clinicStatus, fontSize = 10.sp, color = if (otherUser.clinicStatus == "Available") Color(0xFF10B981) else Color.Gray)
                        }
                    }
                },
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
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                items(messages) { msg ->
                    ChatBubble(msg, msg.senderId == currentUser.id)
                }
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                tonalElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).navigationBarsPadding().imePadding(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = text,
                        onValueChange = { text = it },
                        placeholder = { Text("Message Dr. ${otherUser.name.split(" ").lastOrNull() ?: ""}...") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PolishSky, unfocusedBorderColor = Color(0xFFF1F5F9))
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    IconButton(
                        onClick = {
                            if (text.isNotBlank()) {
                                scope.launch {
                                    val message = Message(
                                        senderId = currentUser.id,
                                        receiverId = otherUser.id,
                                        text = text,
                                        timestamp = System.currentTimeMillis()
                                    )
                                    viewModel.communicationRepository.sendDirectMessage(message)
                                    text = ""
                                }
                            }
                        },
                        modifier = Modifier.background(PolishSky, CircleShape)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, null, tint = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(message: Message, isMe: Boolean) {
    val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 16.dp, topEnd = 16.dp,
                bottomStart = if (isMe) 16.dp else 4.dp,
                bottomEnd = if (isMe) 4.dp else 16.dp
            ),
            color = if (isMe) PolishSky else Color.White,
            tonalElevation = 1.dp
        ) {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                Text(message.text, color = if (isMe) Color.White else PolishDarkSlate, fontSize = 14.sp)
                Text(
                    sdf.format(Date(message.timestampLong)),
                    fontSize = 9.sp,
                    color = (if (isMe) Color.White else Color.Gray).copy(alpha = 0.7f),
                    modifier = Modifier.align(Alignment.End).padding(top = 2.dp)
                )
            }
        }
    }
}
