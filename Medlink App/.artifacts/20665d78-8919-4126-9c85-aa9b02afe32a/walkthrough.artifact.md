# Walkthrough - Fixed Unresolved reference 'startCoverage'

I have resolved the `Unresolved reference 'startCoverage'` error in `LeaveCoverageScreens.kt` by implementing the missing logic across the data, repository, and view model layers.

## Changes

### [Component] Data Layer

#### [FirestoreModels.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/model/FirestoreModels.kt)
- Added `ACTIVE` to the allowed statuses for `LeaveRequest`.

#### [FirebaseRepository.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/firebase/FirebaseRepository.kt)
- Updated `getCoverageDutiesFlow` to fetch requests with either `APPROVED` or `ACTIVE` status.

### [Component] Repository Layer

#### [MedLinkRepositories.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/repository/MedLinkRepositories.kt)
- Implemented `startCoverage(requestId: String)` in `LeaveCoverageRepository` which updates the Firestore status to `ACTIVE`.

### [Component] View Model Layer

#### [MedLinkViewModel.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)
- Implemented `startCoverage(requestId: String, originalDoctorId: String)`.
- Added logic to send a notification to the doctor whose leave is being covered when the session starts.

### [Component] UI Layer

#### [LeaveCoverageScreens.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/screens/LeaveCoverageScreens.kt)
- Refactored `DutyCard` to use the `LeaveRequest` status from the backend. This ensures the "Coverage Active" state persists even if the user navigates away or restarts the app.

## Verification Results

### Automated Tests
- Executed `./gradlew :app:compileDebugKotlin`.
- **Result**: The error `Unresolved reference 'startCoverage'` in `LeaveCoverageScreens.kt` is no longer present. (Note: Other unrelated errors in `PdfGenerator.kt` were detected but do not impact this fix).

### Manual Verification Path
1.  **Request Coverage**: A doctor submits a leave request.
2.  **Volunteer**: Another doctor volunteers.
3.  **Approve**: The original doctor approves the volunteer.
4.  **Start Duty**: The volunteer goes to "My Coverage Duties" and clicks "Start Coverage Session".
5.  **State Persistence**: The status updates to `ACTIVE` in Firestore, and the UI reflects "Coverage Active".
