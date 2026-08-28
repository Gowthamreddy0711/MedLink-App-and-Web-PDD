# Implementation Plan - Automatic Deletion of Expired Coverage Requests

The user wants coverage requests to be automatically removed once their end date has passed. To achieve this within the constraints of Firebase client-side security rules, we will implement a combination of real-time filtering and owner-initiated cleanup.

## User Review Required

> [!IMPORTANT]
> - **Hard Deletion**: Requests will be permanently removed from Firestore once expired. If you prefer to keep them in a "History" tab, we should mark them as "EXPIRED" instead of deleting.
> - **Security Constraints**: Per Firestore rules, only the doctor who created the request can delete it. Peer doctors will simply stop seeing expired requests in the "Opportunities" list.

## Proposed Changes

### Data Layer

#### [MODIFY] [FirebaseRepository.kt](file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/data/firebase/FirebaseRepository.kt)
- **Filter Global List**: Update `getAllLeaveRequestsFlow` to filter out any `LeaveRequest` where `leaveEndDate < currentTime`.
- **Add Delete Method**: Implement `deleteLeaveRequest(requestId: String)` to hard-delete a document.
- **Filter Personal List**: Update `getMyLeaveRequestsFlow` to filter expired items (safety measure before cleanup).

#### [MODIFY] [MedLinkRepositories.kt](file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/data/repository/MedLinkRepositories.kt)
- Expose `deleteLeaveRequest` in `LeaveCoverageRepository`.

### ViewModel & Logic

#### [MODIFY] [MedLinkViewModel.kt](file:///D:/MedLink/MedLink%20Android%20App/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)
- **Auto-Cleanup Logic**: In `loadMyLeaveRequests`, identify any requests belonging to the current user that are past their `leaveEndDate`.
- **Batch Deletion**: Trigger `deleteLeaveRequest` for these expired items.
- **Global List Filtering**: Ensure `loadAllLeaveRequests` also applies the time-based filter to the local `_allLeaveRequests` state.

## Verification Plan

### Manual Verification
1.  **Submit a Request**: Create a coverage request with an end date in the past (using a manual date picker or modifying system time if possible).
2.  **Check Opportunity List**: Verify the request does NOT appear for other doctors.
3.  **Check Owner Status**: Open "My Leave Status". The request should briefly appear or be immediately removed from the list and Firestore.
4.  **Database Check**: Confirm the document is gone from the `leaveRequests` collection in the Firebase Console.
