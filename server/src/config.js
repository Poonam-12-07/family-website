// Personal details (names, location) live in environment variables, not in the repo.
// The client fetches this once from GET /api/config.

function list(value, fallback) {
  return (value || fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function publicConfig() {
  // NOTE_BOARDS="alex:Her Notes,sam:Him Notes" -> [{ key: "alex", title: "Her Notes" }, ...]
  const noteBoards = list(process.env.NOTE_BOARDS, 'alex:Her Notes,sam:Him Notes').map((entry) => {
    const [key, title] = entry.split(':');
    return { key: key.trim().toLowerCase(), title: (title || key).trim() };
  });

  return {
    familyMembers: list(process.env.FAMILY_MEMBERS, 'Alex,Sam,Kid One,Kid Two'),
    noteBoards,
    weather: {
      latitude: Number(process.env.WEATHER_LAT || 37.7749),
      longitude: Number(process.env.WEATHER_LON || -122.4194),
      label: process.env.WEATHER_LABEL || 'San Francisco, CA',
    },
  };
}
