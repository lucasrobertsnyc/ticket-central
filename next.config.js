/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.scdn.co" }, // Spotify CDN
    ],
  },
};
module.exports = nextConfig;
