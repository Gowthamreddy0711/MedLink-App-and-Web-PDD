package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
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

@Composable
fun InternalCommunicationView(viewModel: MedLinkViewModel) {
    val messages by viewModel.internalMessages.collectAsState()
    val userDetails by viewModel.userDetails.collectAsState()
    var text by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().background(PolishBg)) {
        Text(
            "Doctor Communication",
            modifier = Modifier.padding(20.dp),
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = PolishDarkSlate
        )

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(messages) { msg ->
                val isMe = msg.senderId == userDetails?.id
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isMe) PolishSky else Color.White,
                        tonalElevation = 2.dp
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            if (!isMe) {
                                Text(msg.senderName, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = PolishSky)
                            }
                            Text(msg.text, color = if (isMe) Color.White else PolishDarkSlate, fontSize = 14.sp)
                        }
                    }
                }
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
                    placeholder = { Text("Type a message...") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                IconButton(
                    onClick = {
                        if (text.isNotBlank()) {
                            viewModel.sendInternalMessage(text)
                            text = ""
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
