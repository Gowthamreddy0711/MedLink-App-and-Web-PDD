package com.example.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.ChatRoom
import com.example.data.model.User
import com.example.ui.theme.PolishBg
import com.example.ui.theme.PolishDarkSlate
import com.example.ui.theme.PolishSky
import com.example.ui.viewmodel.MedLinkViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecentChatsScreen(
    viewModel: MedLinkViewModel,
    onChatOpen: (User) -> Unit,
    onNewChat: () -> Unit,
    onBack: () -> Unit
) {
    val chatRooms by viewModel.chatRooms.collectAsState()
    val doctors by viewModel.doctorsList.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    val filteredRooms = remember(chatRooms, searchQuery, doctors) {
        chatRooms.mapNotNull { room ->
            // Filter out empty rooms (only show rooms with at least one actual message)
            if (room.lastMessage.isBlank() || room.lastMessage == "No messages yet") return@mapNotNull null
            
            val otherId = room.participants.find { it != currentUser.id }
            val otherDoctor = doctors.find { it.id == otherId }
            if (otherDoctor != null && (otherDoctor.name.contains(searchQuery, ignoreCase = true))) {
                room to otherDoctor
            } else null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Messages", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNewChat,
                containerColor = PolishSky,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp),
                icon = { Icon(Icons.Default.Chat, null) },
                text = { Text("New Chat") }
            )
        },
        containerColor = PolishBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search conversations...") },
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

            if (filteredRooms.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                        Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("No Previous Chats Found", fontWeight = FontWeight.Bold, color = PolishDarkSlate)
                        Text(
                            "Your active conversations with other doctors will appear here once you send a message.",
                            color = Color.Gray,
                            fontSize = 12.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = onNewChat,
                            colors = ButtonDefaults.buttonColors(containerColor = PolishSky),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Find Colleagues to Message")
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(filteredRooms) { (room, doctor) ->
                        ChatRoomItem(room, doctor, currentUser.id) { onChatOpen(doctor) }
                    }
                }
            }
        }
    }
}

@Composable
fun ChatRoomItem(
    room: ChatRoom,
    doctor: User,
    currentUserId: String,
    onClick: () -> Unit
) {
    val unreadCount = room.unreadCounts[currentUserId] ?: 0
    val timeStr = remember(room.lastMessageTimestampLong) {
        val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
        sdf.format(Date(room.lastMessageTimestampLong))
    }

    Surface(
        onClick = onClick,
        color = Color.White,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp).border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(shape = CircleShape, modifier = Modifier.size(56.dp), color = Color(0xFFF1F5F9)) {
                AsyncImage(
                    model = doctor.avatarUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    placeholder = rememberVectorPainter(Icons.Default.AccountCircle),
                    error = rememberVectorPainter(Icons.Default.AccountCircle)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(doctor.name, fontWeight = FontWeight.Bold, color = PolishDarkSlate, fontSize = 16.sp)
                    Spacer(modifier = Modifier.weight(1f))
                    Text(timeStr, fontSize = 10.sp, color = Color.Gray)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = room.lastMessage,
                        fontSize = 13.sp,
                        color = if (unreadCount > 0) PolishDarkSlate else Color.Gray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        fontWeight = if (unreadCount > 0) FontWeight.Bold else FontWeight.Normal,
                        modifier = Modifier.weight(1f)
                    )
                    if (unreadCount > 0) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = CircleShape,
                            color = PolishSky,
                            modifier = Modifier.size(20.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(unreadCount.toString(), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
