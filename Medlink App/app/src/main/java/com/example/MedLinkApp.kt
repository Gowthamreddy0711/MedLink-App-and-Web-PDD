package com.example

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp

class MedLinkApp : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            FirebaseApp.initializeApp(this)
        } catch (e: Throwable) {
            Log.e("MedLinkApp", "Firebase initialization failed", e)
        }
    }
}
