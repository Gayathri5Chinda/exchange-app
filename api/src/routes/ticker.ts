
import express from "express";

//export const tickersRouter = Router();
export const tickersRouter: express.Router = express.Router();


tickersRouter.get("/", async (req, res) => {    
    res.json({});
});