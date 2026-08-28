package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val MedLinkDarkColorScheme = darkColorScheme(
    primary = PolishSky,
    secondary = PolishAccentEmerald,
    tertiary = PolishAccentPurple,
    background = PolishDarkSlate,
    surface = Color(0xFF243249),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TextLight,
    onSurface = TextLight,
    outline = Color(0xFF334155)
)

private val MedLinkLightColorScheme = lightColorScheme(
    primary = PolishSky,
    secondary = PolishAccentEmerald,
    tertiary = PolishAccentPurple,
    background = PolishBg,
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TextDark,
    onSurface = TextDark,
    outline = Color(0xFFE2E8F0)
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = false, // Set false by default to enforce the gorgeous light Professional Polish theme
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) MedLinkDarkColorScheme else MedLinkLightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
