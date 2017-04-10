FROM node:7.6

# Create app directory and set workdir
WORKDIR /usr/local/src/video-backupper

# Install app dependencies
COPY package.json .
RUN npm install

# Copy full app
COPY . .

# Set config path
ENV VIDEOBACKUPPER_CONFIG /usr/local/src/video-backupper/config/config.json

USER node
