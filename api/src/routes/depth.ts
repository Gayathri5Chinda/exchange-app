
import express from 'express';
import { RedisManager } from "../RedisManager.js";
import { GET_DEPTH } from "../types/index.js";

export const depthRouter: express.Router = express.Router();

depthRouter.get("/", async (req, res) => {
    const { symbol } = req.query;
    const response = await RedisManager.getInstance().sendAndAwait({
        type: GET_DEPTH,
        data: {
            market: symbol as string
        }
    });

    res.json(response.payload);
});