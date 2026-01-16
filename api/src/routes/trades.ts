import express from "express";

export const tradesRouter: express.Router = express.Router();

tradesRouter.get("/", async (req, res) => {
    const { market } = req.query;
    // get from DB
    res.json({});
})