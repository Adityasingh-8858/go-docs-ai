# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set build-time environment variables if needed
# For example, to not upload source maps to Sentry during build
# ARG SENTRY_AUTH_TOKEN
# ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Build the Next.js application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the application
# Using "npm start" will execute the "next start" script from package.json
CMD ["npm", "start"]
