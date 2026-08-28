import { User, LeaveRequest, Volunteer, HospitalNotice } from "../types";

export interface AssistantContext {
  currentUser: User | null;
  doctors: User[];
  leaveRequests: LeaveRequest[];
  volunteers: Volunteer[];
  notices: HospitalNotice[];
}

export interface AssistantResponse {
  answer: string;
}

export function querySmartAssistant(prompt: string, context: AssistantContext): AssistantResponse {
  const q = prompt.trim().toLowerCase();
  const { currentUser, doctors, leaveRequests, notices } = context;

  if (!q) return { answer: "Please ask a clinical operations question." };

  if (q.includes("summarize my duties") || q.includes("my duties") || q.includes("my schedule")) {
    if (!currentUser) return { answer: "User profile not found." };
    const myDuties = leaveRequests.filter(r => r.approvedDoctorId === currentUser.id);
    const myRequests = leaveRequests.filter(r => r.doctorId === currentUser.id && r.status === "OPEN");

    let text = `### Operational Summary for Dr. ${currentUser.name}\n\n`;
    text += `• **Active Duties:** ${myDuties.length} assigned shifts.\n`;
    text += `• **Your Open Requests:** ${myRequests.length} published to the network.\n`;
    return { answer: text };
  }

  if (q.includes("find coverage") || q.includes("who can cover")) {
    const available = doctors.filter(d => d.id !== currentUser?.id && d.clinicStatus === "Available");
    if (available.length === 0) return { answer: "No doctors are currently available for coverage." };
    let text = `I found ${available.length} available clinicians:\n\n`;
    available.slice(0, 5).forEach(d => {
      text += `- **Dr. ${d.name}** (${d.specialty})\n`;
    });
    return { answer: text };
  }

  if (q.includes("notices") || q.includes("announcements")) {
    if (notices.length === 0) return { answer: "No recent hospital notices found." };
    let text = `### Latest Hospital Notices\n\n`;
    notices.slice(0, 3).forEach(n => {
      text += `**${n.title}**\n${n.content}\n\n`;
    });
    return { answer: text };
  }

  if (q.includes("cardiologist") || q.includes("surgeon") || q.includes("specialist")) {
    const matched = doctors.filter(d => {
        const spec = (d.specialty || "").toLowerCase();
        return q.includes(spec) || (spec.length > 3 && q.includes(spec.substring(0, spec.length - 1)));
    });
    if (matched.length === 0) return { answer: "No matching specialists found in the directory." };
    let text = `Found specialists:\n\n`;
    matched.forEach(d => { text += `- Dr. ${d.name} (${d.specialty})\n`; });
    return { answer: text };
  }

  return {
    answer: "I am your MedLink Smart Assistant. I can help summarize your duties, find coverage, or show hospital notices.\n\nTry asking: 'Summarize my duties' or 'Show latest notices'."
  };
}
