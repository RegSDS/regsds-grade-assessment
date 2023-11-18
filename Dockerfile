# Use the official Node.js image for multi-platform support
FROM --platform=$BUILDPLATFORM node:16-alpine AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application (if necessary)
# ...

# Final image
FROM --platform=$TARGETPLATFORM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy from the builder image
COPY --from=builder /usr/src/app .

# Expose the port your app runs on
EXPOSE 3000

# Command to run your application
CMD ["node", "your-app-file.js"]
