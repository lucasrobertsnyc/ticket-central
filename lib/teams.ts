export interface TeamInfo {
  abbr: string;
  primary: string;
  secondary: string;
  espnId: string;  // ESPN CDN team ID
  league: string;  // "nfl" | "nba" | "mlb" | "nhl"
}

export const TEAM_INFO: Record<string, TeamInfo> = {
  // NFL
  "Chiefs":    { abbr: "KC",  primary: "#E31837", secondary: "#FFB612", espnId: "kc",  league: "nfl" },
  "49ers":     { abbr: "SF",  primary: "#AA0000", secondary: "#B3995D", espnId: "sf",  league: "nfl" },
  "Cowboys":   { abbr: "DAL", primary: "#003594", secondary: "#C0C0C0", espnId: "dal", league: "nfl" },
  "Packers":   { abbr: "GB",  primary: "#203731", secondary: "#FFB612", espnId: "gb",  league: "nfl" },
  // NBA
  "Lakers":    { abbr: "LAL", primary: "#552583", secondary: "#FDB927", espnId: "lal", league: "nba" },
  "Warriors":  { abbr: "GSW", primary: "#1D428A", secondary: "#FFC72C", espnId: "gs",  league: "nba" },
  "Knicks":    { abbr: "NYK", primary: "#006BB6", secondary: "#F58426", espnId: "ny",  league: "nba" },
  "Celtics":   { abbr: "BOS", primary: "#007A33", secondary: "#FFFFFF", espnId: "bos", league: "nba" },
  // MLB
  "Yankees":   { abbr: "NYY", primary: "#003087", secondary: "#FFFFFF", espnId: "nyy", league: "mlb" },
  "Red Sox":   { abbr: "BOS", primary: "#BD3039", secondary: "#FFFFFF", espnId: "bos", league: "mlb" },
  // NHL
  "Rangers":   { abbr: "NYR", primary: "#0038A8", secondary: "#CE1126", espnId: "nyr", league: "nhl" },
  "Penguins":  { abbr: "PIT", primary: "#000000", secondary: "#FCB514", espnId: "pit", league: "nhl" },
};

export const SPORT_GENRES = new Set(["NFL", "NBA", "MLB", "NHL", "MLS"]);

/** Split "Chiefs vs. 49ers" → ["Chiefs", "49ers"] */
export function parseMatchup(artist: string): [string, string] | null {
  const parts = artist.split(/ vs\.? /i);
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()];
  return null;
}

/** Look up a team by exact name, then partial match */
export function getTeam(name: string): TeamInfo {
  if (TEAM_INFO[name]) return TEAM_INFO[name];
  for (const key of Object.keys(TEAM_INFO)) {
    if (name.includes(key) || key.includes(name)) return TEAM_INFO[key];
  }
  return { abbr: name.slice(0, 3).toUpperCase(), primary: "#1e293b", secondary: "#94a3b8", espnId: "", league: "" };
}

/** ESPN CDN transparent logo PNG */
export function logoUrl(team: TeamInfo): string {
  if (!team.espnId || !team.league) return "";
  return `https://a.espncdn.com/i/teamlogos/${team.league}/500/${team.espnId}.png`;
}
