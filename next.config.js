/** @type {import("next").NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  compress: true,

  // Baseline security headers.
  // Full security policy will be defined in SECURITY.md.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  },

  // Add trusted remote image providers here
  // when real external images are required.
  images: {
    remotePatterns: []
  }
};

module.exports = nextConfig;
