import express, { Request, Response, } from "express";
import { Error } from "mongoose";
import { UserModel, UserDoc } from "../models/user";

export const router = express.Router();

router.get('/users', async (req: Request, res: Response) => {
    // route for getting all users from the db
    UserModel.find({}, async (err: Error, users: UserDoc) => {
        res.json(users);
    });
});