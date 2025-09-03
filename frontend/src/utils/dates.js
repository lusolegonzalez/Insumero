export function formatAnyDate(d) {
  // Firestore Timestamp { _seconds } o string ISO/Date
  if (d && typeof d === 'object' && '_seconds' in d) {
    return new Date(d._seconds * 1000).toLocaleString();
  }
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d ?? '');
  }
}