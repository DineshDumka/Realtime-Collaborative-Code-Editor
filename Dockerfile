FROM node:18-alpine AS build

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built files from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/server ./server
COPY --from=build /app/src/serverActions ./src/serverActions
COPY --from=build /app/server.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port for the server
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]