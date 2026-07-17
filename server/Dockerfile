FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
