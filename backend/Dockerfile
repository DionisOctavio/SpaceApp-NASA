# SpaceApp-NASA Backend Dockerfile
# Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3000

# Start the backend server
CMD ["node", "server.js"]
