# Walkthrough - Automatic Cleanup of Expired Coverage Requests

I have implemented an automatic deletion system that removes coverage requests from the database once their clinical end date has passed. This keeps the network directory clean and ensures that doctors only see relevant opportunities.

## Changes Made

### Data Layer Reliability

#### [FirebaseRepository.kt](file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/data/firebase/FirebaseRepository.kt)
- **Real-time Filtering**: Updated the global coverage requests flow to automatically filter out any request where the `leaveEndDate` is in the past. This happens instantly across the entire network.
- **Delete Method**: Implemented a secure `deleteLeaveRequest` method to permanently remove expired documents from Firestore.

### Repository & Business Logic

#### [MedLinkRepositories.kt](file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/data/repository/MedLinkRepositories.kt)
- **Exposed Deletion**: Added the delete capability to the `LeaveCoverageRepository` to support the new cleanup workflow.

#### [MedLinkViewModel.kt](file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)
- **Self-Cleaning Dashboard**: Updated the "My Leave Status" loading logic. Whenever a doctor views their own requests, the app now performs a background audit.
- **Owner-Initiated Cleanup**: Any expired requests belonging to the current user are automatically identified and deleted from Firestore, satisfying security rules that only allow owners to delete their own data.

## Verification Results

### Automatic Filtering
Peer doctors will now immediately stop seeing requests that have expired, even before the physical deletion occurs, thanks to the new real-time time-based filters.

### Database Integrity
Requests are now hard-deleted from the `leaveRequests` collection once the owner's app detects they are no longer clinically relevant (past the end date).

render_diffs(file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/data/firebase/FirebaseRepository.kt)
render_diffs(file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)
