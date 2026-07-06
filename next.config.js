/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '127.0.0.1:3000',
    '127.0.0.1:3001',
    'localhost:3000',
    'localhost:3001',
  ],
  transpilePackages: ['antd', '@ant-design/icons'],
};

module.exports = nextConfig;
