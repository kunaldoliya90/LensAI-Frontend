import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing is gained by advertising the framework version.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The app is same-origin only and embeds nothing, so framing it is
          // never legitimate — this is the clickjacking guard.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Vercel sets this on custom domains already; stating it keeps the
          // header the same if this ever runs behind something else.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
