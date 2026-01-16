
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import type { MessageFromOrderbook } from "./types/index.js";
import type { MessageToEngine } from "./types/to.js";

export class RedisManager {
    private client: RedisClientType;
    private publisher: RedisClientType;
    private static instance: RedisManager;

    private constructor() {
        this.client = createClient();
        this.client.connect();
        this.publisher = createClient();
        this.publisher.connect();
    }

    public static getInstance() {
        if (!this.instance)  {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public sendAndAwait(message: MessageToEngine) {
        //returning a promise (await is created and promise is returned)
        return new Promise<MessageFromOrderbook>((resolve) => {
            //it first generates a random id
            const id = this.getRandomClientId();

            //subscribe the pubsub on that random id  -> step - 1
            this.client.subscribe(id, (message) => {
                //whenever the engine processes it and respond back, control reaches here  -> step - 3
                this.client.unsubscribe(id);
                //we let the parent know that this is the thing that engine return -> step - 4 (engine return us how much order was placed, how much is filled)
                resolve(JSON.parse(message));
            });
            //publish on the messages queue  -> step - 2
            this.publisher.lPush("messages", JSON.stringify({ clientId: id, message }));
        });
    }

    public getRandomClientId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

}