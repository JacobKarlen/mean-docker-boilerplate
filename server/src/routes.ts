import express, { Request, Response, } from "express";

export const router = express.Router();

router.get('/helloworld', async (req: Request, res: Response) => {
  res.json({"hello": "world"})
});

router.get('/', async (req: Request, res: Response) => {
  res.send("hello world");
});