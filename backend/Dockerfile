# SpaceApp-NASA Backend Dockerfile
# Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/apod', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the backend server
CMD ["node", "server.js"]
