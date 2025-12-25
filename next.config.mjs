/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "cdn.pixabay.com",
      "images.unsplash.com",
      "i.ibb.co",
      "10.10.7.62",
      "rakib.b-cdn.net",
      "10.10.7.41",
      'img.com',
      "yoga-app.b-cdn.net",
      "69.62.67.86",
      "api.yogawithjen.life",
      "web.yogawithjen.life",
      "res.cloudinary.com",
      "50.6.200.33",
      "flagcdn.com",
      // "ftp.thepigeonhub.com",
      // "api.thepigeonhub.com",
      "ftp.thepigeonhub.com",
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "10.10.7.41",
        port: "5001", // ✅ allow images from 10.10.7.41:5001
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
