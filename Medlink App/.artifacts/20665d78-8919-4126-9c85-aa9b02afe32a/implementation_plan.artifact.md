# Fix Unresolved reference 'startCoverage'

The build error `Unresolved reference 'startCoverage'` in `LeaveCoverageScreens.kt` is caused by the missing `startCoverage` method in `MedLinkViewModel`. This method is intended to mark a coverage duty as active when a doctor starts their coverage session.

## Proposed Changes

### [Component] Data Models

#### [MODIFY] [FirestoreModels.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/model/FirestoreModels.kt)
- Update `LeaveRequest` status documentation/comment to include `ACTIVE`.

### [Component] Repositories

#### [MODIFY] [FirebaseRepository.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/firebase/FirebaseRepository.kt)
- Update `getCoverageDutiesFlow` to fetch requests with status `APPROVED` OR `ACTIVE` using `whereIn`.

#### [MODIFY] [MedLinkRepositories.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/data/repository/MedLinkRepositories.kt)
- Add `startCoverage(requestId: String)` method to `LeaveCoverageRepository`.

### [Component] ViewModel

#### [MODIFY] [MedLinkViewModel.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)
- Add `startCoverage(requestId: String, doctorId: String)` method to `MedLinkViewModel`.
- This method will update the request status to `ACTIVE` and send a notification to the original doctor.

### [Component] UI

#### [MODIFY] [LeaveCoverageScreens.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/screens/LeaveCoverageScreens.kt)
- Update `DutyCard` to reflect the actual `status` from the `LeaveRequest` instead of just using a local `remember` state for the "Started" button, ensuring it persists across recompositions/navigation.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:compileDebugKotlin` to verify the build error is resolved.

### Manual Verification
- Deploy the app.
- Navigate to "My Coverage Duties".
- Click "Start Coverage Session".
- Verify the button text changes to "Coverage Active".
- Navigate away and back to verify the state persists.
- Check if a notification is received by the doctor who requested coverage.
