FROM node:18-alpine

WORKDIR /app

# Install Oracle Instant Client dependencies
RUN apk add --no-cache libaio libnsl libc6-compat curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]

