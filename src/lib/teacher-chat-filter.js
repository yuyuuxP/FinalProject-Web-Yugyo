export function belongsToCurrentTeacher(thread, currentTeacher, isPendingAccount = false) {
  if (isPendingAccount || !currentTeacher?.id) return false;

  const teacherId = Number(currentTeacher.id);
  const teacherName = String(currentTeacher.full_name || '').trim().toLowerCase();
  const firstName = teacherName.split(/\s+/).filter(Boolean)[0] || '';

  const threadInstructorId =
    thread?.instructor_id != null && Number(thread.instructor_id) > 0
      ? Number(thread.instructor_id)
      : thread?.resolved_instructor_id != null && Number(thread.resolved_instructor_id) > 0
      ? Number(thread.resolved_instructor_id)
      : null;

  if (threadInstructorId != null && threadInstructorId !== teacherId) {
    return false;
  }

  const threadInstructorName = String(thread?.instructor_name || '').trim().toLowerCase();
  if (threadInstructorName && teacherName) {
    const threadFirstName = threadInstructorName.split(/\s+/).filter(Boolean)[0] || '';
    if (
      threadInstructorName !== teacherName &&
      (!firstName || threadFirstName !== firstName)
    ) {
      return false;
    }
  }

  const combinedText = `${thread?.subject || ''} ${thread?.last_message || ''} ${
    thread?.first_message || ''
  } ${thread?.message || ''}`.toLowerCase();

  const addressedMatch = combinedText.match(/\b(?:chef|guru|kak|ustadz(?:ah)?)\s+([a-z]+)/i);
  if (addressedMatch && addressedMatch[1] && teacherName) {
    const mentionedName = addressedMatch[1].trim().toLowerCase();
    if (
      mentionedName !== firstName &&
      !teacherName.includes(mentionedName) &&
      !mentionedName.includes(firstName)
    ) {
      return false;
    }
  }

  return true;
}