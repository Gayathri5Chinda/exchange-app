import { createClient, } from "redis";
import { Engine } from "./trade/Engine";


async function main() {
    const engine = new Engine(); 

    //create redis client
    const redisClient = createClient();
    await redisClient.connect();
    console.log("connected to redis");
    

    //infinitely pull messages from queue
    while (true) {
        const response = await redisClient.rPop("messages" as string)
        if (!response) {

        }  else {
            //process function is called
            engine.process(JSON.parse(response));
        }        
    }

    //notice nothing is asynchronous here
    // all code is executed in a single thread
    // this means we need to be careful about blocking operations

}

main();