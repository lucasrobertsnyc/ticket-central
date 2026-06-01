export interface TeamInfo {
  abbr: string;
  primary: string;
  secondary: string;
  espnId: string;
  league: string;
}

// ── Per-league team records ────────────────────────────────────────────────────
// Keyed by nickname so partial matching works on full city+nickname strings
// from Ticketmaster ("Los Angeles Lakers" → matches "Lakers").
// Storing separately per league lets getTeam() disambiguate conflicts:
//   "Cardinals" → NFL (Arizona) vs MLB (St. Louis)
//   "Rangers"   → NHL (NY) vs MLB (Texas)
//   "Giants"    → NFL (NY) vs MLB (SF)

const NFL: Record<string, TeamInfo> = {
  "Cardinals":    { abbr: "ARI", primary: "#97233F", secondary: "#FFB612", espnId: "ari", league: "nfl" },
  "Falcons":      { abbr: "ATL", primary: "#A71930", secondary: "#000000", espnId: "atl", league: "nfl" },
  "Ravens":       { abbr: "BAL", primary: "#241773", secondary: "#9E7C0C", espnId: "bal", league: "nfl" },
  "Bills":        { abbr: "BUF", primary: "#00338D", secondary: "#C60C30", espnId: "buf", league: "nfl" },
  "Panthers":     { abbr: "CAR", primary: "#0085CA", secondary: "#101820", espnId: "car", league: "nfl" },
  "Bears":        { abbr: "CHI", primary: "#0B162A", secondary: "#C83803", espnId: "chi", league: "nfl" },
  "Bengals":      { abbr: "CIN", primary: "#FB4F14", secondary: "#000000", espnId: "cin", league: "nfl" },
  "Browns":       { abbr: "CLE", primary: "#311D00", secondary: "#FF3C00", espnId: "cle", league: "nfl" },
  "Cowboys":      { abbr: "DAL", primary: "#003594", secondary: "#869397", espnId: "dal", league: "nfl" },
  "Broncos":      { abbr: "DEN", primary: "#FB4F14", secondary: "#002244", espnId: "den", league: "nfl" },
  "Lions":        { abbr: "DET", primary: "#0076B6", secondary: "#B0B7BC", espnId: "det", league: "nfl" },
  "Packers":      { abbr: "GB",  primary: "#203731", secondary: "#FFB612", espnId: "gb",  league: "nfl" },
  "Texans":       { abbr: "HOU", primary: "#03202F", secondary: "#A71930", espnId: "hou", league: "nfl" },
  "Colts":        { abbr: "IND", primary: "#002C5F", secondary: "#A2AAAD", espnId: "ind", league: "nfl" },
  "Jaguars":      { abbr: "JAX", primary: "#006778", secondary: "#9F792C", espnId: "jax", league: "nfl" },
  "Chiefs":       { abbr: "KC",  primary: "#E31837", secondary: "#FFB81C", espnId: "kc",  league: "nfl" },
  "Raiders":      { abbr: "LV",  primary: "#000000", secondary: "#A5ACAF", espnId: "lv",  league: "nfl" },
  "Chargers":     { abbr: "LAC", primary: "#0080C6", secondary: "#FFC20E", espnId: "lac", league: "nfl" },
  "Rams":         { abbr: "LAR", primary: "#003594", secondary: "#FFA300", espnId: "lar", league: "nfl" },
  "Dolphins":     { abbr: "MIA", primary: "#008E97", secondary: "#FC4C02", espnId: "mia", league: "nfl" },
  "Vikings":      { abbr: "MIN", primary: "#4F2683", secondary: "#FFC62F", espnId: "min", league: "nfl" },
  "Patriots":     { abbr: "NE",  primary: "#002244", secondary: "#C60C30", espnId: "ne",  league: "nfl" },
  "Saints":       { abbr: "NO",  primary: "#D3BC8D", secondary: "#101820", espnId: "no",  league: "nfl" },
  "Giants":       { abbr: "NYG", primary: "#0B2265", secondary: "#A71930", espnId: "nyg", league: "nfl" },
  "Jets":         { abbr: "NYJ", primary: "#125740", secondary: "#000000", espnId: "nyj", league: "nfl" },
  "Eagles":       { abbr: "PHI", primary: "#004C54", secondary: "#A5ACAF", espnId: "phi", league: "nfl" },
  "Steelers":     { abbr: "PIT", primary: "#FFB612", secondary: "#101820", espnId: "pit", league: "nfl" },
  "49ers":        { abbr: "SF",  primary: "#AA0000", secondary: "#B3995D", espnId: "sf",  league: "nfl" },
  "Seahawks":     { abbr: "SEA", primary: "#002244", secondary: "#69BE28", espnId: "sea", league: "nfl" },
  "Buccaneers":   { abbr: "TB",  primary: "#D50A0A", secondary: "#FF7900", espnId: "tb",  league: "nfl" },
  "Titans":       { abbr: "TEN", primary: "#0C2340", secondary: "#4B92DB", espnId: "ten", league: "nfl" },
  "Commanders":   { abbr: "WSH", primary: "#5A1414", secondary: "#FFB612", espnId: "wsh", league: "nfl" },
};

const NBA: Record<string, TeamInfo> = {
  "Hawks":        { abbr: "ATL", primary: "#E03A3E", secondary: "#C1D32F", espnId: "atl", league: "nba" },
  "Celtics":      { abbr: "BOS", primary: "#007A33", secondary: "#BA9653", espnId: "bos", league: "nba" },
  "Nets":         { abbr: "BKN", primary: "#000000", secondary: "#FFFFFF", espnId: "bkn", league: "nba" },
  "Hornets":      { abbr: "CHA", primary: "#1D1160", secondary: "#00788C", espnId: "cha", league: "nba" },
  "Bulls":        { abbr: "CHI", primary: "#CE1141", secondary: "#000000", espnId: "chi", league: "nba" },
  "Cavaliers":    { abbr: "CLE", primary: "#860038", secondary: "#FDBB30", espnId: "cle", league: "nba" },
  "Mavericks":    { abbr: "DAL", primary: "#00538C", secondary: "#002B5E", espnId: "dal", league: "nba" },
  "Nuggets":      { abbr: "DEN", primary: "#0E2240", secondary: "#FEC524", espnId: "den", league: "nba" },
  "Pistons":      { abbr: "DET", primary: "#C8102E", secondary: "#1D428A", espnId: "det", league: "nba" },
  "Warriors":     { abbr: "GSW", primary: "#1D428A", secondary: "#FFC72C", espnId: "gs",  league: "nba" },
  "Rockets":      { abbr: "HOU", primary: "#CE1141", secondary: "#000000", espnId: "hou", league: "nba" },
  "Pacers":       { abbr: "IND", primary: "#002D62", secondary: "#FDBB30", espnId: "ind", league: "nba" },
  "Clippers":     { abbr: "LAC", primary: "#C8102E", secondary: "#1D428A", espnId: "lac", league: "nba" },
  "Lakers":       { abbr: "LAL", primary: "#552583", secondary: "#FDB927", espnId: "lal", league: "nba" },
  "Grizzlies":    { abbr: "MEM", primary: "#5D76A9", secondary: "#12173F", espnId: "mem", league: "nba" },
  "Heat":         { abbr: "MIA", primary: "#98002E", secondary: "#F9A01B", espnId: "mia", league: "nba" },
  "Bucks":        { abbr: "MIL", primary: "#00471B", secondary: "#EEE1C6", espnId: "mil", league: "nba" },
  "Timberwolves": { abbr: "MIN", primary: "#0C2340", secondary: "#236192", espnId: "min", league: "nba" },
  "Pelicans":     { abbr: "NO",  primary: "#0C2340", secondary: "#C8102E", espnId: "no",  league: "nba" },
  "Knicks":       { abbr: "NYK", primary: "#006BB6", secondary: "#F58426", espnId: "ny",  league: "nba" },
  "Thunder":      { abbr: "OKC", primary: "#007AC1", secondary: "#EF3B24", espnId: "okc", league: "nba" },
  "Magic":        { abbr: "ORL", primary: "#0077C0", secondary: "#C4CED4", espnId: "orl", league: "nba" },
  "76ers":        { abbr: "PHI", primary: "#006BB6", secondary: "#ED174C", espnId: "phi", league: "nba" },
  "Sixers":       { abbr: "PHI", primary: "#006BB6", secondary: "#ED174C", espnId: "phi", league: "nba" },
  "Suns":         { abbr: "PHX", primary: "#1D1160", secondary: "#E56020", espnId: "phx", league: "nba" },
  "Trail Blazers":{ abbr: "POR", primary: "#E03A3E", secondary: "#000000", espnId: "por", league: "nba" },
  "Kings":        { abbr: "SAC", primary: "#5A2D81", secondary: "#63727A", espnId: "sac", league: "nba" },
  "Spurs":        { abbr: "SA",  primary: "#C4CED4", secondary: "#000000", espnId: "sa",  league: "nba" },
  "Raptors":      { abbr: "TOR", primary: "#CE1141", secondary: "#000000", espnId: "tor", league: "nba" },
  "Jazz":         { abbr: "UTA", primary: "#002B5C", secondary: "#00471B", espnId: "uta", league: "nba" },
  "Wizards":      { abbr: "WAS", primary: "#002B5C", secondary: "#E31837", espnId: "was", league: "nba" },
};

const MLB: Record<string, TeamInfo> = {
  "Diamondbacks": { abbr: "ARI", primary: "#A71930", secondary: "#E3D4AD", espnId: "ari", league: "mlb" },
  "Braves":       { abbr: "ATL", primary: "#CE1141", secondary: "#13274F", espnId: "atl", league: "mlb" },
  "Orioles":      { abbr: "BAL", primary: "#DF4601", secondary: "#000000", espnId: "bal", league: "mlb" },
  "Red Sox":      { abbr: "BOS", primary: "#BD3039", secondary: "#0C2340", espnId: "bos", league: "mlb" },
  "Cubs":         { abbr: "CHC", primary: "#0E3386", secondary: "#CC3433", espnId: "chc", league: "mlb" },
  "White Sox":    { abbr: "CWS", primary: "#27251F", secondary: "#C4CED4", espnId: "cws", league: "mlb" },
  "Reds":         { abbr: "CIN", primary: "#C6011F", secondary: "#000000", espnId: "cin", league: "mlb" },
  "Guardians":    { abbr: "CLE", primary: "#E31937", secondary: "#002B5C", espnId: "cle", league: "mlb" },
  "Rockies":      { abbr: "COL", primary: "#333366", secondary: "#C4CED4", espnId: "col", league: "mlb" },
  "Tigers":       { abbr: "DET", primary: "#0C2C56", secondary: "#FA4616", espnId: "det", league: "mlb" },
  "Astros":       { abbr: "HOU", primary: "#002D62", secondary: "#EB6E1F", espnId: "hou", league: "mlb" },
  "Royals":       { abbr: "KC",  primary: "#004687", secondary: "#C09A5B", espnId: "kc",  league: "mlb" },
  "Angels":       { abbr: "LAA", primary: "#BA0021", secondary: "#003263", espnId: "laa", league: "mlb" },
  "Dodgers":      { abbr: "LAD", primary: "#005A9C", secondary: "#EF3E42", espnId: "lad", league: "mlb" },
  "Marlins":      { abbr: "MIA", primary: "#00A3E0", secondary: "#EF3340", espnId: "mia", league: "mlb" },
  "Brewers":      { abbr: "MIL", primary: "#12284B", secondary: "#FFC52E", espnId: "mil", league: "mlb" },
  "Twins":        { abbr: "MIN", primary: "#002B5C", secondary: "#D31145", espnId: "min", league: "mlb" },
  "Mets":         { abbr: "NYM", primary: "#002D72", secondary: "#FF5910", espnId: "nym", league: "mlb" },
  "Yankees":      { abbr: "NYY", primary: "#003087", secondary: "#C4CED4", espnId: "nyy", league: "mlb" },
  "Athletics":    { abbr: "OAK", primary: "#003831", secondary: "#EFB21E", espnId: "oak", league: "mlb" },
  "Phillies":     { abbr: "PHI", primary: "#E81828", secondary: "#002D72", espnId: "phi", league: "mlb" },
  "Pirates":      { abbr: "PIT", primary: "#27251F", secondary: "#FDB827", espnId: "pit", league: "mlb" },
  "Padres":       { abbr: "SD",  primary: "#2F241D", secondary: "#FFC425", espnId: "sd",  league: "mlb" },
  "Giants":       { abbr: "SF",  primary: "#FD5A1E", secondary: "#27251F", espnId: "sf",  league: "mlb" },
  "Mariners":     { abbr: "SEA", primary: "#0C2C56", secondary: "#005C5C", espnId: "sea", league: "mlb" },
  "Cardinals":    { abbr: "STL", primary: "#C41E3A", secondary: "#0C2340", espnId: "stl", league: "mlb" },
  "Rays":         { abbr: "TB",  primary: "#092C5C", secondary: "#8FBCE6", espnId: "tb",  league: "mlb" },
  "Rangers":      { abbr: "TEX", primary: "#003278", secondary: "#C0111F", espnId: "tex", league: "mlb" },
  "Blue Jays":    { abbr: "TOR", primary: "#134A8E", secondary: "#E8291C", espnId: "tor", league: "mlb" },
  "Nationals":    { abbr: "WSH", primary: "#AB0003", secondary: "#14225A", espnId: "wsh", league: "mlb" },
};

const NHL: Record<string, TeamInfo> = {
  "Ducks":        { abbr: "ANA", primary: "#F47A38", secondary: "#B9975B", espnId: "ana", league: "nhl" },
  "Bruins":       { abbr: "BOS", primary: "#FCB514", secondary: "#000000", espnId: "bos", league: "nhl" },
  "Sabres":       { abbr: "BUF", primary: "#002654", secondary: "#FCB514", espnId: "buf", league: "nhl" },
  "Flames":       { abbr: "CGY", primary: "#C8102E", secondary: "#F1BE48", espnId: "cgy", league: "nhl" },
  "Hurricanes":   { abbr: "CAR", primary: "#CC0000", secondary: "#000000", espnId: "car", league: "nhl" },
  "Blackhawks":   { abbr: "CHI", primary: "#CF0A2C", secondary: "#000000", espnId: "chi", league: "nhl" },
  "Avalanche":    { abbr: "COL", primary: "#6F263D", secondary: "#236192", espnId: "col", league: "nhl" },
  "Blue Jackets": { abbr: "CBJ", primary: "#002654", secondary: "#CE1126", espnId: "cbj", league: "nhl" },
  "Stars":        { abbr: "DAL", primary: "#006847", secondary: "#8F8F8C", espnId: "dal", league: "nhl" },
  "Red Wings":    { abbr: "DET", primary: "#CE1126", secondary: "#FFFFFF", espnId: "det", league: "nhl" },
  "Oilers":       { abbr: "EDM", primary: "#041E42", secondary: "#FF4C00", espnId: "edm", league: "nhl" },
  "Panthers":     { abbr: "FLA", primary: "#041E42", secondary: "#C8102E", espnId: "fla", league: "nhl" },
  "Kings":        { abbr: "LA",  primary: "#111111", secondary: "#A2AAAD", espnId: "la",  league: "nhl" },
  "Wild":         { abbr: "MIN", primary: "#154734", secondary: "#DDAF37", espnId: "min", league: "nhl" },
  "Canadiens":    { abbr: "MTL", primary: "#AF1E2D", secondary: "#192168", espnId: "mtl", league: "nhl" },
  "Predators":    { abbr: "NSH", primary: "#FFB81C", secondary: "#041E42", espnId: "nsh", league: "nhl" },
  "Devils":       { abbr: "NJ",  primary: "#CE1126", secondary: "#000000", espnId: "nj",  league: "nhl" },
  "Islanders":    { abbr: "NYI", primary: "#00539B", secondary: "#F47D30", espnId: "nyi", league: "nhl" },
  "Rangers":      { abbr: "NYR", primary: "#0038A8", secondary: "#CE1126", espnId: "nyr", league: "nhl" },
  "Senators":     { abbr: "OTT", primary: "#C52032", secondary: "#C2912C", espnId: "ott", league: "nhl" },
  "Flyers":       { abbr: "PHI", primary: "#F74902", secondary: "#000000", espnId: "phi", league: "nhl" },
  "Penguins":     { abbr: "PIT", primary: "#000000", secondary: "#FCB514", espnId: "pit", league: "nhl" },
  "Sharks":       { abbr: "SJS", primary: "#006D75", secondary: "#EA7200", espnId: "sj",  league: "nhl" },
  "Kraken":       { abbr: "SEA", primary: "#001628", secondary: "#99D9D9", espnId: "sea", league: "nhl" },
  "Blues":        { abbr: "STL", primary: "#002F87", secondary: "#FCB514", espnId: "stl", league: "nhl" },
  "Lightning":    { abbr: "TBL", primary: "#002868", secondary: "#FFFFFF", espnId: "tb",  league: "nhl" },
  "Maple Leafs":  { abbr: "TOR", primary: "#003E7E", secondary: "#FFFFFF", espnId: "tor", league: "nhl" },
  "Canucks":      { abbr: "VAN", primary: "#00205B", secondary: "#00843D", espnId: "van", league: "nhl" },
  "Golden Knights":{ abbr: "VGK", primary: "#B4975A", secondary: "#333F42", espnId: "vgk", league: "nhl" },
  "Capitals":     { abbr: "WSH", primary: "#041E42", secondary: "#C8102E", espnId: "wsh", league: "nhl" },
  "Jets":         { abbr: "WPG", primary: "#041E42", secondary: "#AC162C", espnId: "wpg", league: "nhl" },
};

// ── Public helpers ────────────────────────────────────────────────────────────

export const SPORT_GENRES = new Set(["NFL", "NBA", "MLB", "NHL", "MLS"]);

const FALLBACK_TEAM: TeamInfo = {
  abbr: "?", primary: "#1e293b", secondary: "#94a3b8", espnId: "", league: "",
};

function searchRecord(record: Record<string, TeamInfo>, name: string): TeamInfo | null {
  const n = name.toLowerCase();
  for (const [key, team] of Object.entries(record)) {
    if (n.includes(key.toLowerCase())) return team;
  }
  return null;
}

/**
 * Look up a team by name fragment (city + nickname from TM event title).
 * Pass `genre` ("NFL" | "NBA" | "MLB" | "NHL") to disambiguate shared
 * nicknames like Cardinals, Rangers, Giants.
 */
export function getTeam(name: string, genre?: string): TeamInfo {
  const records: Record<string, Record<string, TeamInfo>> = {
    NFL, NBA, MLB, NHL,
  };

  // League-qualified lookup first (most accurate)
  if (genre && records[genre]) {
    const hit = searchRecord(records[genre], name);
    if (hit) return hit;
  }

  // Cross-league fallback
  for (const record of [NFL, NBA, MLB, NHL]) {
    const hit = searchRecord(record, name);
    if (hit) return hit;
  }

  return { ...FALLBACK_TEAM, abbr: name.replace(/^.* /, "").slice(0, 3).toUpperCase() };
}

/** ESPN CDN transparent logo PNG (500×500). */
export function logoUrl(team: TeamInfo): string {
  if (!team.espnId || !team.league) return "";
  return `https://a.espncdn.com/i/teamlogos/${team.league}/500/${team.espnId}.png`;
}

/**
 * Parse "Team A vs. Team B" or "Team A at Team B" into [teamA, teamB].
 * Returns null if no matchup pattern is detected.
 */
export function parseMatchup(artist: string): [string, string] | null {
  // "vs." or "vs" (case-insensitive)
  let parts = artist.split(/ vs\.? /i);
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()];

  // "at" — only accept if both sides look like team names (≤ 5 words each)
  parts = artist.split(/ at /i);
  if (
    parts.length === 2 &&
    parts[0].trim().split(/\s+/).length <= 5 &&
    parts[1].trim().split(/\s+/).length <= 5
  ) {
    return [parts[0].trim(), parts[1].trim()];
  }

  return null;
}

// Legacy flat export kept for any code that still imports TEAM_INFO directly
export const TEAM_INFO: Record<string, TeamInfo> = { ...NFL, ...NBA, ...MLB, ...NHL };
