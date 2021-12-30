# MEAN-stack project running in docker containers with live reloading
In this post I will go over how to set up a development environment based on the popular **MEAN-stack** (MongoDB, Express, Angular, Node.js) with **docker-compose** and **Node+Express** configured with **TypeScript**. 

It will have **live reloading** on code changes on both the **client** and **server** using **docker volumes**. I will also go over adding a **production** **version** of docker-compose, serving the built Angular application with **Nginx**.

# Table of Contents
1. [Prerequisites and Getting Started](#prerequisites)
2. [Setting up and dockerizing the Angular client](#client)
3. [Setting up the Node+Express server](#server)
4. [Dockerizing the Node+Express server](#dockerizing-the-server)
5. [Adding MongoDB and Orchestrating the docker containers with docker-compose](#orchestrating-the-containers-wth-docker-compose)
6. [Adding a scalable file structure](#Creating-a-scalable-folder-structure)
7. [Connecting all the dots by creating a simple application](#Connecting-all-the-dots---creating-a-boilerplate-user-component-fetching-users-stored-in-db-from-server)
8. [Adding production version of docker-compose with Nginx](#adding-production-version-of-docker-compose-with-nginx)
9. [Final Remarks](#final-remarks)
10. [docker-compose commands](#Commands-for-docker-compose)


## Prerequisites
For this guide you will need to have **Docker** installed on your computer https://docs.docker.com/get-docker/.

## Getting Started
I first created a project directory and **initialized git**.
```
mdkir mean-docker-boilerplate
cd mean-docker-boilerplate
git init
```
Also make sure to create a **.gitignore** file and **add node_modules/** to it

#### .gitignore
```
node_modules/
```
## Client
Let's start of with setting up the **client**. First install **Angular CLI** if you don't already have it.
```
npm install -g @angular/cli
```
Then we want to set up an **Angular project** in the client directory.
```
ng new client
```
Add a **.dockerignore** file to **ignore node_modules** and **npm-debug.log** and  add a **Dockerfile** to configure the **docker image**.
#### /client/.dockerignore
```
node_modules
npm-debug.log
```

#### /client/Dockerfile
```Docker:
FROM  node:16-alpine3.11

WORKDIR  /usr/src/app

#Install app dependencies

#A wildcard is used to ensure both package.json 
#AND package-lock.json are copied

COPY  package*.json  .

#Install any needed packages

RUN  npm  i

#Bundle app source

COPY  .  .

EXPOSE  4200

CMD  [  "npm",  "start"  ]
```
We also want to do some small changes to **package.json** by specifying the **path to the ng command** in the **node_modules** directory so it uses the correct one when running in a **docker container**, as well as specfifying the host in the start script.
#### /client/package.json
```json:
...
"scripts": {
	"ng": "./node_modules/.bin/ng",
	"start": "./node_modules/.bin/ng serve --watch --host 0.0.0.0",
	"build": "./node_modules/.bin/ng build",
	"watch": "./node_modules/.bin/ng build --watch --configuration development",
	"test": "./node_modules/.bin/ng test"
},
...
```
Now we should be able to build a **docker image** and run our **Angular** application inside a **docker container**.
```
docker build -t mean-client:1.0 .
docker run -p 4200:4200 mean-client:1.0
```
And you should now have a fully functional dockerized Angular application that you can access at http://localhost:4200. Let's move on to dockerizing the Node.js+Express server!

## Server
In this section we are going to create and dockerize a **Node.js**+**Express** application and configure it to work with **TypeScript** and **live reloading** on code changes.

**Credit where credit is due, learned a lot of this through [Darian Sampare's blog](https://dev.to/dariansampare/setting-up-docker-typescript-node-hot-reloading-code-changes-in-a-running-container-2b2f).**

Let's cd into our server directory and initialize a **Node** project. This will create a **package.json** file.
```
cd server
npm init
```
To set up the **Node**+**Express** server with **TypeScript** we will add **TypeScript** as a development dependancy.
```
npm install typescript --save-dev
```
Let's also add a **src directory** in the server directory where the source code will live.
```
mkdir src
```
Now we want to set up a **tsconfig.json** file and change some of the properties to suit our project (note that the properties will not be next to eachother in the actuall tsconfig.json file).
```
npx tsc --init
```
#### /server/tsconfig.json
```json:
...
"target": "esnext",
"moduleResolution": "node",
"baseUrl": "./src",
"outDir": "./build"
...
```
The next step is to install and set up **Express** with **TypeScript**.
```
npm install --save express
npm install --save-dev @types/express
```
We will now add an **index.ts** file to our **src** directory, which will make up our express application. We will also add a **config.ts** file and a **routes.ts** file to show how this easily can be set up.
#### /server/src/index.ts
```typescript:
import  express  from  "express";
import { config } from  "./config";

import { router } from  "./routes";

const  app = express();
  
// Cross Origin middleware

app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {

	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();

});

app.use("/", router);

app.listen(config.port, () =>  console.log(`Express app listening on ${config.port}!`));
```
#### /server/src/config.ts
```typescript:
export  const  config = {
	'port':  process.env.WEB_PORT || 8080,
};
```

#### /server/src/routes.ts
```typescript:
import express,{ Request, Response, } from "express";
export const router = express.Router();

router.get('/helloworld', async (req: Request, res: Response) => {
	res.json({
		'message': 'hello world'
	});
});
```
The next step will be to install **ts-node** and **nodemon** to allow for live reloading on code changes.
```
npm install --save-dev ts-node nodemon
```
Like Darian recommends, we will set up nodemon in a separate config file **nodemon.json**.
#### /server/nodemon.json
```json:
{
	"verbose": true,
	"ignore": [],
	"watch": ["src/**/*.ts"],
	"execMap": {
		"ts": "node --inspect=0.0.0.0:9229 --nolazy -r ts-node/register"
	}
}
```
The next step would then be to add in scripts for running **nodemon** in our **package.json** in the server directory.
#### server/package.json
```json:
...
"scripts": {
	"start": "NODE_PATH=./build node build/index.js",
	"build": "tsc -p .",
	"dev": "./node_modules/.bin/nodemon src/index.ts"
}
...
```
Let's also install and setup **ESLint** to enforce TypeScript use and help find problems.
```
npm install --save-dev eslint
npx eslint --init
```
Now you should be able to run the server in development mode with
```
npm run dev
```
and the server will reload on changes in the source code. Hooray!

## Dockerizing the server
Let's move on and start dockerizing the server!
The first step will be to create a **.dockerignore-file** and adding node_modules and npm-debug.log to it to ignore these from being added.
#### /server/.dockerignore
```
node_modules
npm-debug.log
```
Now we can go ahead and create the **Dockerfile** just like we did for the **client**.
#### /server/Dockerfile
```Docker:
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
```
Let's go over the main things of the Dockerfile. First of we use the node-alpine image as our base since it requires considerably less memory than the official node images, and we don't require a lot of additional dependecies for this project.

Then we specify the working directory of where our app will live, and on the line after it we copy over package.json (and package-lock.json), which is needed for the npm install command on the line below. After this we copy over the actuall source code. 

We also define an additional build step for the production image where we define the Node_Path to our build-folder where the transpiled JavaScript will be outputted. We also define what port is to be exposed and the default command that should be executed when a docker container is instantiated from the image.

Now you should be able to run the server in a docker container with the following steps:
```
docker build -t mean-server:1.0 .
docker run -p 8080:8080 mean-server:1.0
```
And a request to **localhost:8080/helloworld** should give back **{ message: "hello world }**.

## Orchestrating the containers wth docker-compose
The next step will be to create docker-compose files for orchestrating the client and server containers, and also add in MongoDB into the mix, running in its own container. 

First we will create a development version of the docker-compose file in the project's root directory:
#### /docker-compose.dev.yml
```Docker:
version: '3'  # specify docker-compose version

# Define the services/containers to be run
services:
  client:
    build: ./client
    ports:
      - "4200:4200"
      - "9229:9229"
    volumes:
      - ./client/src:/usr/src/app/src
  server: # name of the first service
    build:
      context: ./server  # specify the directory of the Dockerfile
      target: base
    ports:
      - "8080:8080"
    environment:
      - MONGO_URL=mongodb://database/mean-app
    volumes:
      - ./server/src:/usr/src/app/src
      - ./server/nodemon.json:/usr/src/app/nodemon.json
    links:
      - database
    depends_on:
      - database
    command: npm run dev
  database: # name of the third service
    image: mongo  # specify image to build container from
    volumes:
      - mongodb:/data/db
      - mongodb_config:/data/configdb
    ports:
      - "27017:27017"  # specify port forewarding
volumes:
  mongodb:
  mongodb_config:
```
This defines the three services **client**, **server** and **database** and basically automates everything so we only have to run a single command in order to spin up the three containers.

We use volumes in order to share the code base to be available in the containers. This is needed for live reloading to work, since without the volumes, your local changes would not affect the code base in the container, so the changes would not be registered and the server would not restart. 

The first two services, client and server, doesn't need a specified image since it will automatically use the Dockerfile in client-directory and server-directory.

We've also set up a link to the database from the server service, so that this connection works properly. All services also have a definition of the ports exposed for each server. Client also exposes 9229 for debugging purposes when using nodemon. 

In a similar fashion you can add a **docker-compose.yml**-file that specifies the production build. In that cause you don't need volumes for hot reloading etc.

To run the entire development environment now only requires one command:
```
docker-compose -f docker-compose.dev.yml up --build
```
I would say this is extremely convenient, and later when you want to build and run the production version you would just substitute **docker-compose.dev-yml** with **docker-compose.yml**.

## Creating a scalable folder structure
Now that we got a working environment where everything is running in docker containers, it would be nice to improve upon the folder structure of the project to make it more maintainable and scalable. A lot of this is based on a [blog post](https://itnext.io/choosing-a-highly-scalable-folder-structure-in-angular-d987de65ec7) by **Mathis Garberg**. Check it out if you want more details. 

### Client
We will start with the client and set up this structure:
- /app
	 - /modules
		 - module1
			 - components
			 - pages
			 - module1.module.ts
		- module2...
	 - /core
		 - header
		 - footer
		 - mocks
		 - services
	 - /shared
		- components
		- models

Modules will be used to isolate components and pages related to a particular area of the application. The pages folder will only include Angular components that represent an actual page of the application, and this components act like wrappers for other module components, which are located in the components directory.

The core directory holds global components like the application header and footer, as well as mocks (delivering fake data) and services that can be used to inject data into components.

The shared directory holds components that can be useful in multiple modules or not directly related to any module. It also includes a folder of all of the models (TypeScript interfaces) used in the application. 

The app folder will also include the actual app component, the app-routing module and the app module. Routing can also be separated on a module-level later if the routing becomes complex within the application.

### Server
The server structure will be a bit more basic in this case, but I'll add it as well so all the information is available.
- /src
	 - /models
		 - user.ts
		 - ..
	 - /routes
		 - user-routes.ts
		 - ...
	 - /data
		 - users.json
	 - /index.ts
	 - /config.ts
	 - ...
## Connecting all the dots - creating a boilerplate user component fetching users stored in db from server

### Server
Let's start by adding some users to the system. We will generate some fake users with mockaroo and save it in **/server/data/users.json**. We can then use this to initialize the database from later.
#### /server/data/users.json
```json:
[{
	"first_name": "Ellary",
	"last_name": "Risbridge",
	"email": "erisbridge0@surveymonkey.com",
	"gender": "Female",
	"city": "Briey",
	"ip_address": "96.251.105.79"
}, {
	"first_name": "Ferris",
	"last_name": "Lawerence",
	"email": "flawerence1@tripod.com",
	"gender": "Genderqueer",
	"city": "Miyazaki-shi",
	"ip_address": "124.171.105.119"
}, {
	"first_name": "Peyter",
	"last_name": "Moulds",
	"email": "pmoulds2@slashdot.org",
	"gender": "Male",
	"city": "Conceição do Coité",
	"ip_address": "97.109.239.114"
}, {
	"first_name": "Valentine",
	"last_name": "Leming",
	"email": "vleming3@shutterfly.com",
	"gender": "Male",
	"city": "Santa Cruz",
	"ip_address": "28.46.112.134"
}, {
	"first_name": "Reeba",
	"last_name": "Jeanel",
	"email": "rjeanel4@paginegialle.it",
	"gender": "Agender",
	"city": "Liugong",
	"ip_address": "172.67.176.149"
}, {
	"first_name": "Alexio",
	"last_name": "Ubsdall",
	"email": "aubsdall5@un.org",
	"gender": "Female",
	"city": "Puqian",
	"ip_address": "114.64.222.165"
}, {
	"first_name": "Hayward",
	"last_name": "Worg",
	"email": "hworg6@discovery.com",
	"gender": "Bigender",
	"city": "Mirsk",
	"ip_address": "81.92.171.62"
}, {
	"first_name": "Denyse",
	"last_name": "Freiburger",
	"email": "dfreiburger7@amazon.co.jp",
	"gender": "Polygender",
	"city": "Liběšice",
	"ip_address": "89.30.184.158"
}, {
	"first_name": "Abbot",
	"last_name": "Kenelin",
	"email": "akenelin8@nymag.com",
	"gender": "Genderfluid",
	"city": "Benito Juarez",
	"ip_address": "94.234.199.62"
}, {
	"first_name": "Sonnnie",
	"last_name": "Heather",
	"email": "sheather9@umn.edu",
	"gender": "Non-binary",
	"city": "Muting",
	"ip_address": "69.176.230.45"
}]
```

We also need to set up the connection to our MongoDB database in our express app, so let's do that next! First we have to install mongoose as a dependency in **/server**, which we will use for the object modelling of the db in Node.js. We will also install the mongoose TypeScript types.
```
npm install --save mongoose
npm install --save-dev @types/mongoose
```
We will now create a simple user model and a mongoose schema for users in the file **/server/models/user.ts**. We will also create an interface that corresponds to the query result from querying user documents (**UserDoc**):
#### /server/models/user.ts
```TypeScript:
import { Schema, model, Document } from  "mongoose";

export  interface  User {
	first_name: string,
	last_name: string,
	email: string,
	gender: string,
	city: string,
	ip_address: string
}

export  interface  UserDoc  extends  Document, User {}; 
// type that queries of UserModel will return

const  userSchema = new  Schema<User>({
	"first_name": { type:  String , required:  true },
	"last_name": { type:  String , required:  true },
	"email": { type:  String , required:  true },
	"gender": { type:  String , required:  true },
	"city": { type:  String , required:  true },
	"ip_address": { type:  String , required:  true },
});

export  const  UserModel = model<User>('User', userSchema);
```

Let's also update our **config.ts**-file and add configuration options for MongoDB.
#### /server/config.ts
```TypeScript:
export const config = {
	'port':  process.env.WEB_PORT || 8080,
	'mongo': {
		'uri':  'mongodb://database/mean-app',
		'options': {
		
		}
	}
};
```

Now we can actually create some routes to serve users to the frontend (our Angular application). Create a file **/server/routes/user-routes.ts** and add some routes to it like below:
#### /server/routes/user-routes.ts
```TypeScript:
import express, { Request, Response, } from  "express";
import { Error } from  "mongoose";
import { UserModel, UserDoc } from  "../models/user";

export  const  router = express.Router();

router.get('/users', async (req: Request, res: Response) => {
	// route for getting all users from the db
	UserModel.find({}, async (err: Error, users: UserDoc) => {
		res.json(users);
	});
});
```

Now let's set up the connection to our database in the file **index.ts** and also populate the db from our users.json document on initial db creation.
#### /server/index.ts
```TypeScript:
...
import express, { application } from  "express";
import { config } from  "./config";
import mongoose, { Error }  from  "mongoose";

import { router } from  "./routes";

import { userRouter } from "./routes/user-routes";
import { UserModel, UserDoc } from "./models/user";
// require-syntax used to parse json doc
const USERS = require("./data/users.json");

const app = express();
  
// Connect to MongoDB
console.log('Connection to mongoDb on uri: ' + config.mongo.uri);
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err: Error) {
	console.error('MongoDB connection error: ' + err);
});

// populate db with users if collection doesn't exit
UserModel.findOne({}, async (err: Error, doc: UserDoc) => {
	if (!doc) {
		UserModel.collection.insertMany(USERS).then(() =>  console.log("Inserted users from JSON"));
	}
});

// Cross Origin middleware
app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use("/", router);
app.use('/', userRouter);

app.listen(config.port, () =>  console.log(`Example app listening on ${config.port}!`));

```

Now if you spin up everything with **docker-compose** you should  be able to get all the users from the route **localhost:8080/users**.

### Client
Let's move over to the client-side and create an angular-component for displaying the users.

Create a module **home** which will represent the start page of our application and wrap the component listing all the users. Below we will list the commands of creating the module.

#### start in /client/src/app/modules
```
ng generate module home
cd ./home

mkdir components
cd ./components
ng generate component userlist
cd ..

mkdir pages
cd ./pages
ng generate component home-page
```
When you have executed the commands above, add import HomeModule and add it to the list of imports in **app.module.ts**. Also import **HttpClientModule** and add it to the list (it will be used to make requests to the backend).

Also, add the **HomePageComponent** as the root route in the file **app-routing.module.ts** like below:
```TypeScript:
...
import { HomePageComponent } from  './modules/home/pages/home-page/home-page.component';

const  routes: Routes = [
	{ path: '', component: HomePageComponent }
];
...
```
I also removed all of the Angular boilerplate code in app.component.html and just left the **\<router-outlet>\</router-outlet>** so it is easier to see what we are working on.

Add the \<app-userlist>-element to the HomePageComponent and then we can focus on setting up the userlist.

Before we continue with the userlist component we will want to add the User-model to the client, as well as creating a service for serving user data. Create a new file in shared/models.
#### /client/src/app/shared/models/user.ts
```TypeScript:
export  interface  User {
	first_name: string,
	last_name: string,
	email: string,
	gender: string,
	city: string,
	ip_address: string
}
```

Let's set up a service that we can use to inject user data into components. 
#### stand in /client/src/app/core/services
```
ng generate service user
```
Then we want to add the following to the file **user.service.ts**:
#### /client/src/app/core/services/user.service.ts
```TypeScript:
import { Injectable } from  '@angular/core';
import { HttpClient, HttpHeaders } from  '@angular/common/http';
import { User } from  '../../shared/models/user';
import { Observable } from  'rxjs';

@Injectable({
	providedIn:  'root'
})

export  class  UserService {

	private  usersUrl = 'http://localhost:8080/users/';

	constructor(private  http: HttpClient) { }

	getUsers(): Observable<User[]> {
		return  this.http.get<User[]>(this.usersUrl);
	}

}
```
Now, let's use the user-service, by injecting it into our userlist component.
#### /client/src/app/modules/home/components/userlist/userlist.component.ts
```TypeScript:
import { Component, OnInit } from  '@angular/core';
import { UserService } from  'src/app/core/services/user.service';
import { User } from  '../../../../shared/models/user';

@Component({
	selector:  'app-userlist',
	templateUrl:  './userlist.component.html',
	styleUrls: ['./userlist.component.scss']
})

export  class  UserlistComponent  implements  OnInit {

	constructor(private  userService: UserService) {}
	users: User[] = [];

	ngOnInit(): void {
		this.getUsers();
	}

	getUsers(): void {
		this.userService.getUsers().subscribe(users  =>  this.users = users);
	}
}
```
Now we can add some basic html in **userlist.component.html** to render the list of fetched users:
#### /client/src/app/modules/home/components/userlist/userlist.component.html
```html:
<div  class="card highlight-card">
	<ul>
		<li  *ngFor="let user of users">
			<span  class="badge">{{user.first_name}} {{user.last_name}}, {{user.city}}</span>
		</li>
	</ul>
</div>
```
Now when you go to http://localhost:4200 you should be presented with a simple list of the users stored in the MongoDB database. 

## Adding production version of docker-compose with Nginx
Let's go over how you can set up a production version of your docker-compose file (**docker-compose.pro.yml**). The main difference between the development and the production orchestration is that we are going to build the client and serve the static Angular app with Nginx, instead of using the Angular CLI development server. 

We will therefore rename our current **Dockerfile** in **/client** to **Dockerfile.dev** and create a new file with the name **Dockerfile** used for the production version. Since we are renaming the Dockerfile used for development, we have to change it accordingly in **docker-compose.dev.yml** by specifying **dockerfile: Dockerfile.dev**.
#### /docker-compose.dev.yml
```Dockerfile:
...
services:
 client: # name of the first service
   build: 
      context: ./client
      dockerfile: Dockerfile.dev
   ports:
     - "80:4200"
     - "9229:9229"
   volumes:
...
```

#### /client/Dockerfile (production version)
```Dockerfile:
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

RUN echo "Configuration: $configuration "
 
RUN npm run build -- --output-path=./dist/out --configuration $configuration

# Stage 2: Nginx
FROM nginx:alpine

COPY --from=build-stage /usr/src/app/dist/out /usr/share/nginx/html
COPY --from=build-stage /usr/src/app/nginx.conf /etc/nginx/conf.d/default.conf
```
In the production version we use a multi-stage build where the first stage (based on Node) builds the Angular application, and the second stage sets up Nginx to serve the static files.

As you can see at the bottom of the Dockerfile, we also overwrite the default Nginx config with the file **nginx.conf**, so let's take a look at that.
#### /client/nginx.conf
```js:
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
  }
}
```
This pretty much speaks for it self, I will however mention that the try_files part of the location is important to make sure that the Angular routing works properly.

Next we will look at the production version of the docker-compose file - **docker-compose.pro.yml**.
#### /docker-compose.pro.yml
```Dockerfile:
version: '3' # specify docker-compose version
 
# Define the services/containers to be run
services:
 client: # name of the first service
   build: ./client
   ports:
     - "80:80"
 server: # name of the second service
    build: 
      context: ./server # specify the directory of the Dockerfile
      target: base
    ports:
     - "8080:8080"
    environment:
     - MONGO_URL=mongodb://database/mean-app
    links:
     - database
    depends_on:
     - database
    command: sh -c "npm run build && npm run start"
 database: # name of the third service
   image: mongo # specify image to build container from
   volumes:
     - mongodb:/data/db
     - mongodb_config:/data/configdb
   ports:
     - "27017:27017" # specify port forewarding
volumes:
  mongodb:
  mongodb_config:
```
Notable changes compared to the development version is that the volumes of the client and server have been removed since we don't need it anymore to support hot reload of code. We don't have to explicitly state the client's Dockerfile here since it will default to the production version called **Dockerfile**, with the multi-stage build.

Another difference is that we **sh -c "npm run build && npm run start"** instead of **npm run dev** as the command on container initialization of the server container. 

We have also made a slight addition to the scripts in package.json of the server, by adding **&& cp -r ./src/data ./build** to the build script. This is to copy over any static JSON files from /server/src/data to the build. 
#### /server/package.json
```JSON:
"scripts": {
    "start": "NODE_PATH=./build node build/index.js",
    "build": "./node_modules/.bin/tsc -p . && cp -r ./src/data ./build",
    "dev": "./node_modules/.bin/nodemon src/index.ts"
  },
```
So I think that summarizes the changes and additions that was needed to get the production version of docker-compose working with Nginx. 

I also made some minor and optional changes to the apiEndpoint by prepending the path with /api and stored the apiEndpoint path in /client/src/environments/environment*.ts.


## Final Remarks
Okey, so that was quite a lot to take in, but now you should have a fully functional MEAN-stack application running in seperate docker containers, supporting live reload on changes to the source code for both the client and server. The file structure is also scalable, and it includes a super-simple boilerplate example of how to set up services and inject them etc.

Thanks for reading! Hope it was helpfull, took a while to compile all the information when I was learning docker. :)

## Commands for docker-compose

### Start development environment with
```
docker-compose -f docker-compose.dev.yml up --build
```
### Start production environment with
```
docker-compose -f docker-compose.pro.yml up --build
```
