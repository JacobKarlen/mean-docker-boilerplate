import express from "express";
import { config } from "./config";

import { router } from "./routes";

const app = express();
 
// Cross Origin middleware
app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 next();
});

app.use("/", router);
 
app.listen(config.port, () => console.log(`Example app listening on ${config.port}!`));
