FROM node:16-alpine3.11 as base
 
# Create app directory
WORKDIR /usr/src/app
 
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
 
# Install any needed packages
RUN npm install
 
# Bundle app source
COPY . .

FROM base as production

ENV NODE_PATH=./build

RUN npm run build
 
EXPOSE 8080
 
CMD [ "npm", "start" ]