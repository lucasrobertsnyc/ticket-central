/**
 * Spotify Web API — artist image helper.
 *
 * Uses the Client Credentials flow (no user login required).
 * Set these two env vars in .env.local to enable real artist photos:
 *
 *   SPOTIFY_CLIENT_ID=your_client_id
 *   SPOTIFY_CLIENT_SECRET=your_client_secret
 *
 * Get both at https://developer.spotify.com/dashboard → create an app.
 *
 * When the env vars are absent every function returns null gracefully,
 * so the app falls back to the stock photos in data/tickets.ts.
 */

interface TokenCache {
  value: string;
  expiresAt: number;
}

// Module-level cache so we reuse the token across requests in the same
// server process (Next.js keeps the module in memory between requests).
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string | null> {
  const id     = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  // Reuse cached token if it still has > 60 s left
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.value;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${id}:${secret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
      // Don't let Next.js cache the token fetch itself
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[Spotify] token request failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    tokenCache = {
      value:     data.access_token as string,
      expiresAt: Date.now() + (data.expires_in as number) * 1000,
    };
    return tokenCache.value;
  } catch (err) {
    console.error("[Spotify] token fetch threw:", err);
    return null;
  }
}

/**
 * Returns the largest available Spotify artist image URL for the given
 * artist name, or null if Spotify is not configured / artist not found.
 *
 * Images are high-resolution official press photos served from Spotify's CDN.
 */
export async function getSpotifyArtistImage(artistName: string): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const url =
      "https://api.spotify.com/v1/search?" +
      new URLSearchParams({ q: artistName, type: "artist", limit: "1" });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Cache artist images for 24 hours — they rarely change
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.error("[Spotify] search failed:", res.status);
      return null;
    }

    const data = await res.json();
    const images: { url: string; width: number; height: number }[] =
      data?.artists?.items?.[0]?.images ?? [];

    // images[0] is always the largest (typically 640×640 or higher)
    return images[0]?.url ?? null;
  } catch (err) {
    console.error("[Spotify] artist search threw:", err);
    return null;
  }
}
