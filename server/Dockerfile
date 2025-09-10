FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start app
CMD ["node", "index.js"]
