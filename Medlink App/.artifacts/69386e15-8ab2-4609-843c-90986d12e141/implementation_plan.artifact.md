# Implementation Plan - Gemini API Feedback Sentiment System

Transition the MedLink Android sentiment analysis from a local model/FastAPI backend to the Gemini API.

## User Review Required

> [!IMPORTANT]
> - I will be using the provided `GEMINI_API_KEY` for integration. I will store it as a private constant in a new `GeminiSentimentEngine` class and ensure it is not logged or displayed.
> - The local sentiment model, FastAPI dependencies, and related network configurations will be removed/deprecated.
> - The system will automatically backfill missing sentiments for existing reviews upon profile load.

## Proposed Changes

### [Build Configuration]

#### [MODIFY] [libs.versions.toml](file:///D:/MedLink%20App%20and%20Web/Medlink%20App/gradle/libs.versions.toml)
- Add Gemini AI dependency: `generativeai = "0.9.0"` and `google-generativeai = { group = "com.google.ai.client.generativeai", name = "generativeai", version.ref = "generativeai" }`.

#### [MODIFY] [app/build.gradle.kts](file:///D:/MedLink%20App%20and%20Web/Medlink%20App/app/build.gradle.kts)
- Add `implementation(libs.google.generativeai)` to the dependencies block.

### [Data Layer]

#### [MODIFY] [FirestoreModels.kt](file:///D:/MedLink%20App%20and%20Web/Medlink%20App/app/src/main/java/com/example/data/model/FirestoreModels.kt)
- Add `var sentimentScore: Any? = null` to the `CoverageFeedback` data class to store individual review scores (100, 50, 0).

#### [NEW] [GeminiSentimentEngine.kt](file:///D:/MedLink%20App%20and%20Web/Medlink%20App/app/src/main/java/com/example/data/network/GeminiSentimentEngine.kt)
- Implement a singleton engine that uses the Gemini API to analyze `reviewText`.
- Define a system prompt to enforce structured JSON output: `{"sentiment": "POSITIVE", "score": 100}`.
- Normalize sentiments to `POSITIVE`, `NEUTRAL`, `NEGATIVE` and scores to `100`, `50`, `0`.

### [Business Logic]

#### [MODIFY] [MedLinkViewModel.kt](file:///D:/MedLink%20App%20and%20Web/Medlink%20App/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)
- Replace `sentimentApiService` calls with `GeminiSentimentEngine`.
- Update `submitCoverageFeedback` to analyze new reviews with Gemini before saving to Firestore.
- Update `backfillMissingSentiments` to use Gemini for legacy reviews.
- Update the scoring calculation in `getDoctorFeedbackFlow` to use the dynamically retrieved sentiment data.

### [Cleanup]

- Deprecate/Remove `SentimentApiService.kt` and references to `NetworkConfig.sentimentApiBaseUrl` if no longer used.

## Verification Plan

### Automated Tests
- Build the project to ensure dependencies are correctly resolved.

### Manual Verification
1. **Existing Reviews**: Open a doctor profile with legacy reviews (no sentiment). Verify that the background backfill triggers and updates Firestore with Gemini results.
2. **New Review**: Submit a new review and verify that Gemini analysis runs immediately and the score updates in real-time.
3. **Dynamic Scoring**: Verify that the calculated score on the doctor profile (e.g., 71/100) matches the logic: `(POSITIVE=100, NEUTRAL=50, NEGATIVE=0) / total`.
4. **Security Check**: Audit Logcat to ensure the API key is not printed.
