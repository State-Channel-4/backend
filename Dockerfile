# base image maybe i can use 16 or 18
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port your Node.js app will run on
EXPOSE 8000

# Define the command to start your Node.js app
CMD ["npm", "start"]
