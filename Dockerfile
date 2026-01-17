# Use Node.js v24 base image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for the build step
RUN npm install

# Copy the rest of the application source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the application port
EXPOSE 3000

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Copy Workflow Library
COPY library /app/library

# Start the application using the wrapper script
CMD ["/start.sh"]