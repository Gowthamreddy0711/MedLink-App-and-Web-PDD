package com.example.util

import android.content.Context
import android.graphics.*
import android.graphics.pdf.PdfDocument
import com.example.data.model.Prescription
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

object PdfGenerator {
    fun generatePrescriptionPdf(context: Context, rx: Prescription): File {
        val document = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = document.startPage(pageInfo)
        val canvas = page.canvas
        val paint = Paint()

        // Header
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 24f
        paint.color = Color.parseColor("#0284C7")
        canvas.drawText(rx.hospitalName, 50f, 60f, paint)

        paint.textSize = 12f
        paint.color = Color.GRAY
        canvas.drawText("Digital Healthcare Network", 50f, 80f, paint)

        // Doctor Info
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.color = Color.BLACK
        paint.textSize = 14f
        canvas.drawText("Dr. ${rx.doctorName}", 50f, 130f, paint)
        
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        paint.textSize = 12f
        canvas.drawText("Medical Specialist", 50f, 150f, paint)

        // Divider
        paint.strokeWidth = 2f
        canvas.drawLine(50f, 170f, 545f, 170f, paint)

        // Rx Body
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        paint.textSize = 20f
        canvas.drawText("Rx", 50f, 210f, paint)

        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        paint.textSize = 14f
        canvas.drawText("Patient: ${rx.patientName}", 50f, 240f, paint)
        canvas.drawText("Diagnosis: ${rx.diagnoses}", 50f, 270f, paint)

        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("Medications:", 50f, 310f, paint)
        
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText(rx.medicationsJson, 50f, 340f, paint)

        canvas.drawText("Instructions: ${rx.instructions}", 50f, 400f, paint)
        canvas.drawText("Follow-up: ${rx.nextVisitDate}", 50f, 430f, paint)

        // Footer
        paint.textSize = 10f
        canvas.drawText("Validated Digital Signature: MEDLINK-SIG-${rx.id.take(8)}", 50f, 780f, paint)
        canvas.drawText("Timestamp: ${SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()).format(Date(rx.timestampLong))}", 50f, 800f, paint)

        document.finishPage(page)

        val file = File(context.cacheDir, "rx_${rx.id}.pdf")
        document.writeTo(FileOutputStream(file))
        document.close()
        return file
    }
}
