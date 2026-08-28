package com.example.data.network

import android.util.Log
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

class GeminiSentimentEngine {
    private val apiKey = "AQ.Ab8RN6Lam52ythLhhBeV44IWQPJmF_H7dhoQQnS-p_QgmQ8mog"
    
    private val model = GenerativeModel(
        modelName = "gemini-1.5-flash",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
        }
    )

    private val systemPrompt = """
        Analyze the sentiment of the provided medical professional feedback.
        Respond ONLY with a JSON object in this exact format:
        {
          "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
          "score": 100 | 50 | 0
        }
        
        Rules:
        - POSITIVE: 100 points
        - NEUTRAL: 50 points
        - NEGATIVE: 0 points
        - Output MUST be valid JSON.
    """.trimIndent()

    suspend fun analyze(text: String): SentimentResult? = withContext(Dispatchers.IO) {
        if (text.isBlank()) return@withContext null

        try {
            val response = model.generateContent(
                content {
                    text(systemPrompt)
                    text("Feedback to analyze: $text")
                }
            )

            val jsonStr = response.text?.trim() ?: return@withContext null
            val json = JSONObject(jsonStr)
            
            val sentiment = json.optString("sentiment", "NEUTRAL").uppercase()
            val score = json.optInt("score", 50)
            
            Log.d("GEMINI_SENTIMENT", "Analysis successful for text: ${text.take(20)}... -> $sentiment ($score)")
            
            SentimentResult(
                sentiment = normalizeSentiment(sentiment),
                score = score
            )
        } catch (e: Exception) {
            Log.e("GEMINI_SENTIMENT", "Error analyzing sentiment with Gemini", e)
            null
        }
    }

    private fun normalizeSentiment(raw: String): String {
        return when {
            raw.contains("POSITIVE") -> "POSITIVE"
            raw.contains("NEGATIVE") -> "NEGATIVE"
            else -> "NEUTRAL"
        }
    }

    data class SentimentResult(
        val sentiment: String,
        val score: Int
    )
}
