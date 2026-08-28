package com.example.data.network

import com.squareup.moshi.Json
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class SentimentRequest(
    @Json(name = "reviewText") val reviewText: String
)

data class SentimentResponse(
    @Json(name = "sentiment") val sentiment: String,
    @Json(name = "confidence") val confidence: Double
)

data class HealthResponse(
    @Json(name = "status") val status: String,
    @Json(name = "service") val service: String
)

interface SentimentApiService {
    @GET("/")
    suspend fun healthCheck(): HealthResponse

    @POST("predict-sentiment")
    suspend fun predictSentiment(@Body request: SentimentRequest): SentimentResponse

    companion object {
        fun create(): SentimentApiService {
            val moshi = Moshi.Builder()
                .add(KotlinJsonAdapterFactory())
                .build()
            return Retrofit.Builder()
                .baseUrl(NetworkConfig.sentimentApiBaseUrl)
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .build()
                .create(SentimentApiService::class.java)
        }
    }
}
