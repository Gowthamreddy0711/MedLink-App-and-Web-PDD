const fs = require('fs');
const path = require('path');

const directory = 'src';

const replacements = [
  { search: /UserProfile/g, replace: 'User' },
  { search: /VolunteerOffer/g, replace: 'Volunteer' },
  { search: /NotificationItem/g, replace: 'Notification' },
  { search: /\.uid/g, replace: '.id' },
  { search: /\.fullName/g, replace: '.name' },
  { search: /\.photoUrl/g, replace: '.avatarUrl' },
  { search: /\.hospital/g, replace: '.hospitalName' },
  { search: /\.requesterUid/g, replace: '.doctorId' },
  { search: /\.assignedVolunteerUid/g, replace: '.approvedDoctorId' },
  { search: /\.assignedVolunteerName/g, replace: '.approvedDoctorName' },
  { search: /\.requesterSpecialty/g, replace: '.specialization' },
  { search: /\.requesterPhoto/g, replace: '.doctorProfilePhoto' },
  { search: /\.requesterName/g, replace: '.doctorName' },
  { search: /\.shiftType/g, replace: '.coverageType' },
  { search: /\.shiftDate/g, replace: '.leaveStartDate' },
  { search: /\.urgency/g, replace: '.priority' },
  { search: /\.volunteerUid/g, replace: '.doctorId' },
  { search: /\.volunteerName/g, replace: '.name' },
  { search: /\.volunteerPhoto/g, replace: '.profilePhoto' },
  { search: /\.volunteerSpecialty/g, replace: '.specialization' },
  { search: /\.participantUids/g, replace: '.participants' },
  { search: /\.lastMessageTime/g, replace: '.lastMessageTimestamp' },
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(directory);

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
