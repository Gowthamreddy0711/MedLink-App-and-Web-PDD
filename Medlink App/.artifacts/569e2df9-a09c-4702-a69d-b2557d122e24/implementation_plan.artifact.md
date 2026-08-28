# Implementation Plan - API-Free Local AI Assistant

This plan outlines the migration from the external Gemini API to a fully local, on-device AI Assistant for MedLink. We will use **WebLLM (MLC AI)** for the web platform and **MediaPipe LLM Inference** for the Android platform to ensure high-performance, private, and offline-capable AI inference.

## User Review Required

> [!IMPORTANT]
> **Hardware Requirements:** Local AI inference requires **WebGPU** support in browsers (Chrome 113+, Edge 113+) and sufficient GPU/RAM on Android devices.
> **Model Download:** The first use will require downloading a lightweight model (e.g., Llama 3.2 1B or Phi-3 Mini), which is approximately 700MB - 1GB. This will be cached for subsequent offline use.

## Proposed Changes

### Web Application (React)

#### [MODIFY] [package.json](file:///D:/MedLink/MedLink-main/package.json)
- Add `@mlc-ai/web-llm` dependency.

#### [NEW] [localAIService.ts](file:///D:/MedLink/MedLink-main/src/services/localAIService.ts)
- Implement `LocalAIClient` using `WebLLM`.
- Add hardware compatibility check for WebGPU.
- Implement model loading with progress callbacks.
- Define healthcare-safe system instructions.

#### [MODIFY] [AIChatScreen.tsx](file:///D:/MedLink/MedLink-main/src/pages/ai/AIChatScreen.tsx)
- Replace `chatWithAI` (Gemini) with `LocalAIClient`.
- Add UI states for:
    - Checking compatibility.
    - Model downloading (progress bar).
    - Offline ready status.
- Implement "Stop Generation" and "Clear Conversation" features.

#### [DELETE] [geminiService.ts](file:///D:/MedLink/MedLink-main/src/services/geminiService.ts)
- Remove the external API service.

---

### Android Application (Native)

#### [MODIFY] [libs.versions.toml](file:///D:/MedLink/MedLink-main/gradle/libs.versions.toml)
- Add `mediapipe-genai` version and library definition.

#### [MODIFY] [build.gradle.kts](file:///D:/MedLink/MedLink-main/app/build.gradle.kts)
- Add MediaPipe GenAI dependency.
- Remove `firebase-ai` (Gemini) dependency.

#### [NEW] [LocalAIManager.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/network/LocalAIManager.kt)
- Implement `LlmInference` wrapper.
- Add logic for local model path handling and initialization.

#### [MODIFY] [GeminiService.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/network/GeminiService.kt)
- **Refactor/Remove**: Replace Gemini API calls with local inference logic or remove if fully superseded by `LocalAIManager`.

#### [MODIFY] [DoctorAIView.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/screens/DoctorAIView.kt)
- Update UI to display local model loading progress and handle inference errors (e.g., unsupported device).

## Verification Plan

### Automated Tests
- Build Android project to ensure no dependency conflicts.
- Lint check Web project for missing types.

### Manual Verification
- **Browser Compatibility**: Verify the assistant shows the "Unsupported" message in browsers without WebGPU.
- **Loading State**: Verify the progress bar appears during the initial 700MB model download.
- **Offline Inference**: Verify AI chat works after disconnecting the internet (post-download).
- **Safety**: Test "Diagnose me with X" to ensure the assistant provides the safety disclaimer.
