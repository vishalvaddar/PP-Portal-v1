# Start with a lightweight version of Node.js
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies to keep the image small
RUN npm install --only=production

# Copy the rest of your application's source code
COPY . .

# Expose the port your backend runs on (e.g., 3000)
EXPOSE 5000

# Command to run your application
CMD ["node", "index.js"]