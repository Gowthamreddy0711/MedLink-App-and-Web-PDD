package com.example.data.network

import android.os.Build

object NetworkConfig {
    /**
     * The base URL for the Sentiment Analysis API.
     * Uses 10.0.2.2 for Android Emulator to reach the host PC's localhost.
     * For physical devices, you must replace this with your development PC's LAN IP.
     * 
     * IMPORTANT: Retrofit requires the base URL to end with a '/'.
     */
    private const val EMULATOR_HOST = "http://10.0.2.2:8000/"
    
    // CHANGE THIS TO YOUR PC's LAN IP FOR PHYSICAL DEVICE TESTING
    // e.g., "http://192.168.1.5:8000/"
    private const val PHYSICAL_DEVICE_HOST = "http://192.168.1.10:8000/"

    val sentimentApiBaseUrl: String
        get() = if (isEmulator()) EMULATOR_HOST else PHYSICAL_DEVICE_HOST

    private fun isEmulator(): Boolean {
        // Bypass for known physical devices
        if (Build.BRAND.equals("Nothing", ignoreCase = true)) return false
        if (Build.MANUFACTURER.equals("Nothing", ignoreCase = true)) return false

        return (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk_google")
                || Build.PRODUCT.contains("google_sdk")
                || Build.PRODUCT.startsWith("sdk")
                || Build.PRODUCT.contains("vbox86p")
                || Build.PRODUCT.contains("emulator")
                || Build.PRODUCT.contains("simulator")
    }
}
