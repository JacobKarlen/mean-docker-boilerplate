import express from "express";
import { config } from "./config";
import mongoose from "mongoose";
import { router } from "./routes";

import { UserModel } from "./models/user";
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
mongoose.connection.on('open', function() {
    mongoose.connection.db.listCollections({name: 'UserModel'})
        .next(function(err, collinfo) {
            if (collinfo) {
                UserModel.collection.deleteMany({}).then(() => console.log("All users deleted"));
                UserModel.collection.insertMany(USERS).then(() => console.log("Inserted users from JSON"));
            }
        });
});

 
// Cross Origin middleware
app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 next();
});

app.use("/", router);
 
app.listen(config.port, () => console.log(`Example app listening on ${config.port}!`));
