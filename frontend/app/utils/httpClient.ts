import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

const BASE_URL = "https://exchange-proxy-4t4y.onrender.com/api/v1";

//current price of the selected market
export async function getTicker(market: string): Promise<Ticker> {
    const tickers = await getTickers();
    const ticker = tickers.find(t => t.symbol === market);
    if (!ticker) {
        throw new Error(`No ticker found for ${market}`);
    }
    return ticker;
}

//current price of every market
export async function getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${BASE_URL}/tickers`);
    return response.data;
}

//order book for the selected market
export async function getDepth(market: string): Promise<Depth> {
    //Depth - shape designed to match the backend response
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
    return response.data;
}

//trades for the selected market
export async function getTrades(market: string): Promise<Trade[]> {
    const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
    return response.data;
}

//bunch of candles of the selected market
export async function getKlines(market: string, interval: string, startTime: number, endTime: number): Promise<KLine[]> {
    const response = await axios.get(`${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
    const data: KLine[] = response.data;
    return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}


export async function getMarkets(): Promise<string[]> {
    const response = await axios.get(`${BASE_URL}/markets`);
    return response.data;
}