# Implementation Plan - Shift Coverage Analytics & Audit

This plan addresses the requirement to add a professional "Shift Coverage Analytics & Audit" section to the Android Doctor Dashboard, providing real-time clinical metrics calculated from Firestore.

## Proposed Changes

### 1. MedLinkViewModel.kt
- **Calculate Shift Balance**: Implement a StateFlow that derives `(Total Covered Duties) - (Total Requested Leaves)`.
- **Calculate Volunteered Hours**: Implement a StateFlow that sums the hours from all `myCoverageDuties`.
- **Calculate Network Fulfillment Rate**: Implement a StateFlow that calculates the percentage of all system requests that have reached `ACCEPTED`, `IN_PROGRESS`, or `COMPLETED` status.
- **Specialty Breakdown**: Implement a StateFlow that groups `allSystemLeaveRequests` by specialty and calculates the coverage rate for each.
- **Volunteer Offers**: Implement a StateFlow that counts the number of requests the user has volunteered for.

### 2. DoctorDashboard.kt
- **Clean Dashboard**:
    - Remove the "Accept Requests" action card.
    - Remove the "Hospital Notices" action card.
- **Add Analytics Section**:
    - Insert a new "SHIFT COVERAGE ANALYTICS & AUDIT" section before "QUICK OVERVIEW".
    - Implement professional cards for Shift Balance, Volunteered Hours, Assigned Shifts, Volunteer Offers, and Network Fulfillment Rate.
    - Implement a "Specialty Shift Coverage Breakdown" list showing dynamic data for each specialty found in the database.

## Calculation Logic (Live Data)
- **Shift Balance**: `(Assigned Duties + Completed Duties) - (Total Leave Requests)`.
- **Fulfillment Rate**: `(Requests with status != OPEN/PENDING) / (Total Requests) * 100`.
- **Duty Hours**: `Sum of (LeaveEndDate - LeaveStartDate)` for all assigned/completed duties.
- **Specialty Rate**: For each specialty, `(Fulfilled in Specialty) / (Total in Specialty) * 100`.

## Verification Plan

### Manual Verification
1. **Login**: Authenticate as a doctor.
2. **Dashboard Review**:
    - Confirm "Accept Requests" and "Hospital Notices" are gone.
    - Confirm "Shift Coverage Analytics & Audit" section is visible.
3. **Data Accuracy**:
    - Compare the "Shift Balance" with the actual count of leaves vs. duties.
    - Verify the "Network Fulfillment Rate" matches the global state.
    - Ensure the "Specialty Breakdown" correctly lists specialties from real data.
4. **Real-time Sync**: Create a new leave request and verify the fulfillment rate and specialty counts update immediately.
