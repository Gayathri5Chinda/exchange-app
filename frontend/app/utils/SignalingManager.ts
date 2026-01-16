import { Ticker } from "./types";

export const BASE_URL = "wss://ws.backpack.exchange/"

export class SignalingManager {
    private ws: WebSocket;
    private static instance: SignalingManager;
    private bufferedMessages: any[] = [];
    private callbacks: { [type: string]: { callback: any, id: string }[] } = {};
    private id: number;
    private initialized: boolean = false;

    //A class which has private constructor is called singleton class and You cannot create multiple instances of this class.
    private constructor() {
        //you need to make sure single websocket is created
        this.ws = new WebSocket(BASE_URL);
        this.bufferedMessages = [];
        this.id = 1;
        this.init();
    }

    //For static instance you dont need to create any instance. Can directly call as SignalingManager.getInstance()
    public static getInstance() {
        //checking if instance exists
        if (!this.instance)  {
            this.instance = new SignalingManager();
        }
        return this.instance;
    }

    init() {
        this.ws.onopen = () => {
            this.initialized = true;
            this.bufferedMessages.forEach(message => {
                this.ws.send(JSON.stringify(message));
            });
            this.bufferedMessages = [];
        }
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const type = message.data.e;
            if (this.callbacks[type]) {
                this.callbacks[type].forEach(({ callback }) => {
                    
                    if (type === "ticker") {
                        // Create a new ticker object and set its properties to make frontend easy to understand
                        const newTicker: Partial<Ticker> = {
                            lastPrice: message.data.c,
                            high: message.data.h,
                            low: message.data.l,
                            volume: message.data.v,
                            quoteVolume: message.data.V,
                            symbol: message.data.s,
                        }
                        
                        callback(newTicker);
                   }
                   if (type === "depth") {
                        const newTicker: Partial<Ticker> = {
                             lastPrice: message.data.c,
                             high: message.data.h,
                             low: message.data.l,
                             volume: message.data.v,
                             quoteVolume: message.data.V,
                             symbol: message.data.s,
                        }
                        console.log(newTicker);
                        callback(newTicker);
                        const updatedBids = message.data.b;
                        const updatedAsks = message.data.a;
                        callback({ bids: updatedBids, asks: updatedAsks });
                    }
                });
            }
        }
    }

    sendMessage(message: any) {
        const messageToSend = {
            ...message,
            id: this.id++
        }
        //if connections is not established yet. websocket takes time to initialize
        if (!this.initialized) {
            this.bufferedMessages.push(messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend));
    }

    async registerCallback(type: string, callback: any, id: string) {
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({ callback, id });
        // "ticker" => callback
    }

    async deRegisterCallback(type: string, id: string) {
        if (this.callbacks[type]) {
            const index = this.callbacks[type].findIndex(callback => callback.id === id);
            if (index !== -1) {
                this.callbacks[type].splice(index, 1);
            }
        }
    }
}