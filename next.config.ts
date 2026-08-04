import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Cache optimized images for 31 days
    minimumCacheTTL: 2678400,

    // Only generate WebP versions
    formats: ["image/webp"],

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
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
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
