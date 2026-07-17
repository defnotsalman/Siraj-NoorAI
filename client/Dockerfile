FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose port
EXPOSE 5173

# Start development client with host bind
CMD ["npm", "run", "dev", "--", "--host"]
