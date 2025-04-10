import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' http://localhost:8000 ws://localhost:8000",
      "frame-ancestors 'none'", // Prevent embedding in iframes
      "form-action 'self'", // Restrict form submissions to same origin
      "base-uri 'self'", // Restrict base tag href
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY", // Prevent clickjacking
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff", // Prevent MIME type sniffing
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block", // Enable XSS filtering
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin", // Control information sent in referrer header
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
      "fullscreen=(self)",
      "display-capture=()",
    ].join(", "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains", // Enable HSTS
  },
];

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: "/:path*", // Apply to all routes
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
