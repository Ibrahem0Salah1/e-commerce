import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  // cacheComponents: true,
  // partialPrefetching: true,
  images: {
    // Cache optimized images for 31 days
   formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Only allow these quality levels
    qualities: [60, 75],

    // Sizes your app is likely to actually use
    deviceSizes: [640, 768, 1024, 1280, 1536],

    // Small UI image sizes
    imageSizes: [32, 48, 64, 96, 128, 256],

    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",

    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
         hostname: "pub-73f65fffffb8440d8b0b6d5313971be0.r2.dev", // or "cdn.yourdomain.com"
      },
      {
        protocol: "https",
        hostname: "placehold.co"
      },
       {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "mds-woad.vercel.app", // your custom R2 domain
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "toothpickapp.ams3.digitaloceanspaces.com",
      },
    ],
  },
};


// module.exports = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "lh3.googleusercontent.com",
//         port: "",
//         pathname: "/account123/**",
//       },
//     ],
//   },
// };
export default nextConfig;
