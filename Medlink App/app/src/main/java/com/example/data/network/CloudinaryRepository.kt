package com.example.data.network

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

class CloudinaryRepository {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val uploadUrl = "https://api.cloudinary.com/v1_1/xsjgnsvi/image/upload"
    private val uploadPreset = "medlink_profile"

    suspend fun uploadProfileImage(contentResolver: ContentResolver, uri: Uri): String = withContext(Dispatchers.IO) {
        try {
            Log.d("CloudinaryRepo", "Starting upload for URI: $uri")
            
            val originalBytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
                ?: throw Exception("Failed to read image data")

            val fileSizeMb = originalBytes.size / (1024.0 * 1024.0)
            Log.d("CloudinaryRepo", "Original file size: %.2f MB".format(fileSizeMb))

            val uploadBytes = if (fileSizeMb > 5.0) {
                Log.d("CloudinaryRepo", "File > 5MB, compressing...")
                compressImage(originalBytes)
            } else {
                originalBytes
            }

            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("upload_preset", uploadPreset)
                .addFormDataPart("file", "profile_image.jpg", uploadBytes.toRequestBody("image/jpeg".toMediaType()))
                .build()

            val request = Request.Builder()
                .url(uploadUrl)
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string() ?: throw Exception("Empty response from Cloudinary")
                
                if (!response.isSuccessful) {
                    Log.e("CloudinaryRepo", "Upload failed: $bodyString")
                    throw Exception("Cloudinary Error: ${response.code}")
                }

                val json = JSONObject(bodyString)
                val secureUrl = json.getString("secure_url")
                Log.d("CloudinaryRepo", "Upload successful: $secureUrl")
                secureUrl
            }
        } catch (e: Exception) {
            Log.e("CloudinaryRepo", "Fatal upload error", e)
            throw e
        }
    }

    private fun compressImage(bytes: ByteArray): ByteArray {
        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return bytes
        val outputStream = ByteArrayOutputStream()
        
        // Start with 80% quality
        var quality = 80
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        
        // If still > 5MB, reduce quality further (unlikely for a profile pic but safe)
        while (outputStream.toByteArray().size / (1024 * 1024) > 5 && quality > 10) {
            outputStream.reset()
            quality -= 10
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        }
        
        return outputStream.toByteArray()
    }
}
