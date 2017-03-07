FROM node:7.6

# Create app directory and set workdir
WORKDIR /usr/src/video-backupper

# Install app dependencies
COPY package.json .
RUN npm install

# Copy full app
COPY . .