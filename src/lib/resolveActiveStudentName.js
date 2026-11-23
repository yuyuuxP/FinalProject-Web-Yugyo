export function resolveActiveStudentName(props = {}) {
  const fromProps =
    props.currentUser?.full_name ||
    props.currentUser?.name ||
    props.currentUser?.username ||
    props.user?.full_name ||
    props.user?.name ||
    props.user?.username ||
    props.studentName ||
    '';

  if (String(fromProps).trim()) return String(fromProps).trim();

  if (typeof window !== 'undefined') {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i) || '';
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const candidate =
          parsed?.full_name ||
          parsed?.name ||
          parsed?.username ||
          parsed?.user?.full_name ||
          parsed?.user?.name ||
          parsed?.user?.username ||
          '';
        if (String(candidate).trim()) return String(candidate).trim();
      } catch {
        // Abaikan nilai non-JSON
      }
    }
  }

  return 'Nabila';
}