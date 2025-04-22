FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create volume for logs
VOLUME [ "/usr/src/app/logs" ]

# Expose the port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"] 