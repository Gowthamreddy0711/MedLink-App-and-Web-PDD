# Task: Implement API-Free Local AI Assistant

## Web Application (React)
- [x] Add `@mlc-ai/web-llm` to `package.json`
- [x] Create `src/services/localAIService.ts` (WebLLM integration)
- [x] Update `src/pages/ai/AIChatScreen.tsx` (UI with loading progress & local chat)
- [x] Delete `src/services/geminiService.ts`

## Android Application (Native)
- [x] Add MediaPipe GenAI to `libs.versions.toml`
- [x] Add MediaPipe GenAI dependency to `app/build.gradle.kts`
- [x] Create `LocalAIManager.kt` (MediaPipe LLM integration)
- [x] Update `MedLinkViewModel.kt` to use `LocalAIManager`
- [x] Update `DoctorAIView.kt` with loading states
- [x] Remove/Refactor `GeminiService.kt` and Gemini dependencies

## Verification
- [x] Verify WebGPU support and model loading in Web
- [x] Verify offline chat functionality in Web
- [x] Verify Android build and model loading (simulated if no GPU)
- [x] Final cleanup of API keys from configuration
