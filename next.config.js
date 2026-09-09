/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Express + Mongoose must stay as Node externals (not bundled for Edge)
  serverExternalPackages: [
    "express",
    "mongoose",
    "multer",
    "cloudinary",
    "nodemailer",
    "bcryptjs",
    "jsonwebtoken",
    "cookie-parser",
    "cors",
    "request-ip",
    "nanoid",
    "axios",
  ],
};

module.exports = nextConfig;
