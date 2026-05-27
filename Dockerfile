# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install all dependencies (including devDependencies needed for build)
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the project (creates dist/ and compiles server.ts)
RUN npm run build

# Prune devDependencies to keep container size small
RUN npm prune --production

# Expose the port (Cloud Run dynamically sets this to 8080)
EXPOSE 8080

# Run the app
CMD ["npm", "run", "start"]
