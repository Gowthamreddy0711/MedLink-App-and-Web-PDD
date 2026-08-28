import { LeaveRequest } from "../types";

/**
 * Checks if the viewer has an accepted coverage relationship with the target doctor.
 * Either the viewer is covering for the target, or the target is covering for the viewer.
 */
export function canViewContactInfo(
  viewerId: string,
  targetId: string,
  leaveRequests: LeaveRequest[]
): boolean {
  if (!viewerId || !targetId) return false;
  if (viewerId === targetId) return true; // Can always view own info

  return leaveRequests.some((req) => {
    // Both must be involved and the request must be APPROVED, ACTIVE, or COMPLETED
    const isApprovedState = req.status === "APPROVED" || req.status === "ACTIVE" || req.status === "COMPLETED" || req.status === "Assigned";
    
    const isViewerRequester = req.doctorId === viewerId || req.requesterUid === viewerId;
    const isTargetRequester = req.doctorId === targetId || req.requesterUid === targetId;
    
    const isViewerVolunteer = req.approvedDoctorId === viewerId || req.assignedVolunteerUid === viewerId;
    const isTargetVolunteer = req.approvedDoctorId === targetId || req.assignedVolunteerUid === targetId;

    return isApprovedState && (
      (isViewerRequester && isTargetVolunteer) || 
      (isTargetRequester && isViewerVolunteer)
    );
  });
}
