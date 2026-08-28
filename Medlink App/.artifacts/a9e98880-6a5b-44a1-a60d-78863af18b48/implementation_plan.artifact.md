# Implementation Plan - Profile Image Sync & Doctor Detail View

This plan addresses the profile image synchronization issue across the app and implements the "View Profile" feature in the clinical messages section.

## User Review Required

> [!IMPORTANT]
> I am adding a "Cache Buster" to profile image URLs. This forces the app to immediately reload and display your new photo the second you upload it, even if the cloud web address remains the same.

## Proposed Changes

### 1. Fix Profile Image Synchronization
- **[MODIFY] [MedLinkViewModel.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/viewmodel/MedLinkViewModel.kt)**:
    - Update `updateProfilePhoto` to append a unique timestamp (e.g., `?t=123456`) to the internal `avatarUrl`.
    - This ensures that **Coil** (the image loader) treats it as a brand new image and bypasses any old memory/disk cache.
    - Ensure `_userDetails` is updated with this "fresh" URL immediately.
- **[MODIFY] [DoctorDashboard.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/screens/DoctorDashboard.kt)**:
    - Ensure the "Practitioner Summary" card correctly observes the updated `userDetails`.

### 2. View Peer Details in Messages
- **[MODIFY] [DoctorDirectoryScreen.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/screens/DoctorDirectoryScreen.kt)**:
    - The "Profile" button on each doctor card is already connected to `onViewProfile`. I will ensure it passes the full `User` object correctly.
- **[MODIFY] [DoctorDashboard.kt](file:///D:/MedLink/MedLink-main/app/src/main/java/com/example/ui/screens/DoctorDashboard.kt)**:
    - I previously added the navigation logic to open `DoctorPublicProfileView`. I will double-check that it correctly displays all "Basic Details" as requested (Specialization, Hospital, Department, and Experience).

### 3. Comprehensive Image Loading Polish
- **Apply to all screens**: Ensure `AsyncImage` across the entire application uses:
    - `placeholder`: The standard practitioner icon.
    - `error`: The standard practitioner icon.
    - `contentScale`: `ContentScale.Crop` with `CircleShape` for a professional medical appearance.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:assembleDebug` to verify compilation.

### Manual Verification
- **Upload Sync**:
    1. Upload a new photo from Settings.
    2. Go back to Dashboard instantly.
    3. Verify the new photo appears in the "Practitioner Summary" without restarting.
- **Peer Details**:
    1. Go to Messages > Directory.
    2. Click "Profile" on a colleague.
    3. Verify a professional profile screen opens showing their qualifications and hospital.
- **Persistence**:
    1. Restart the app.
    2. Verify the profile photo remains visible.
