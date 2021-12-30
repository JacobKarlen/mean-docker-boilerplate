# Stage 1: build and compile
FROM node:16-alpine3.11 as build-stage
 
WORKDIR /usr/src/app
 
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json .
 
# Install app dependencies
RUN npm i
 
# Bundle app source
COPY . .

ARG configuration=production

RUN echo "Configuration: $configuration"
 
RUN npm run build -- --output-path=./dist/out --configuration $configuration

# Stage 2: Nginx
FROM nginx:alpine

COPY --from=build-stage /usr/src/app/dist/out /usr/share/nginx/html
COPY --from=build-stage /usr/src/app/nginx.conf /etc/nginx/conf.d/default.conf