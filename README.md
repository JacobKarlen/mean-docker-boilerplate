# mean-docker-boilerplate
A boilerplate setup of the MEAN-stack (MongoDB, Express, Angular, Node) running in docker containers and orchestrated with docker-compose. Node backend configured with TypeScript and Nodemon to reload on code changes.

Production script serves Angular front-end with Nginx.

# Start development environment with
```
docker-compose -f docker-compose.dev.yml up --build
```
# Start production environment with
```
docker-compose -f docker-compose.pro.yml up --build
```
