export function isTeacherPending(teacherOrStatus) {
  const rawStatus =
    typeof teacherOrStatus === 'string'
      ? teacherOrStatus
      : teacherOrStatus?.status;
  return String(rawStatus || '').trim().toLowerCase() === 'pending';
}