# CryptoExchange
A high-performance cryptocurrency exchange platform with real-time trading capabilities.  

Full Website:   


CryptoExchange is split up into multiple separate deployables: a web client, API server, Engine, WebSocket server, DB Processor, and a market maker.  

## How to run the application:
Navigate to the every directory and run: 
```
pnpm install
```
Ensure Redis and TimescaleDB are running locally or update the connection strings.  
Navigate to the root directory and run: 
```
yarn start
```
Run tests with: (in each sub-directory)  
```
yarn test
```

## API Server
### Tech Used: 
Express, Node.js    
### Data Flow:    
When a user places an order through the API, the request is validated and authenticated. The order details are then pushed to a Redis queue where the Engine picks it up for processing. Once the Engine processes the order, it publishes the result back through Redis pub/sub, which the API server listens to in order to respond to the client. For real-time updates, users are directed to subscribe via the WebSocket server.  

## Engine
### Tech Used: 
Node.js, Redis  

The Engine is the heart of the exchange, responsible for maintaining orderbooks for various trading pairs and executing trades. It stores user balances and open orders entirely in memory for blazing-fast order matching.
### Data Flow:  
The Engine continuously listens to Redis queues for incoming orders. When an order arrives, it's matched against the existing orderbook using a price-time priority algorithm. If a match is found, the trade is executed immediately, balances are updated in memory, and the trade details are published to Redis pub/sub. The DB Processor picks up these events for persistence, while the WebSocket server broadcasts them to connected clients.  

## WebSocket Server
### Tech Used: 
WebSocket (ws library), Node.js, Redis  

Real-time data is essential for any trading platform. The WebSocket server allows users to subscribe to live orderbook updates, recent trades, and their own order status changes. The native ws library was chosen for its performance and low overhead.  
### Data Flow:  
When a user connects to the WebSocket server, they can subscribe to specific channels (e.g., orderbook.BTC-USD, trades.ETH-USD). The WebSocket server listens to the corresponding Redis pub/sub channels and forwards any messages to subscribed clients in real-time. This architecture ensures that all connected users receive updates simultaneously as soon as the Engine processes them.  

## DB Processor
### Tech Used: 
Node.js, Redis, TimescaleDB  
### Data Flow:  
The DB Processor listens to Redis pub/sub channels for trade executions, order placements, cancellations, and balance updates. These events are batched and written to TimescaleDB. Additionally, the DB Processor generates kline (candlestick) data by aggregating trades into time buckets (1m, 5m, 1h, etc.), which are used by the frontend for charting.

## Market Maker (mm)
### Tech Used: 
Node.js, Redis
### Data Flow:
The market maker periodically generates random orders within a configured spread around the mid-market price. These orders are pushed to Redis queues, picked up by the Engine, and matched like any other order. This creates a more realistic trading environment and allows us to test the system under load.

## Redis
### Tech Used: 
Redis
Redis serves two critical functions in the architecture:   
### Message Queue: 
The API server and market maker push orders to Redis queues, which the Engine consumes. This decouples the services and allows for asynchronous processing.  
Pub/Sub: The Engine publishes trade executions and orderbook updates to Redis channels. The WebSocket server and DB Processor subscribe to these channels to broadcast updates and persist data respectively.  

## TimescaleDB
### Tech Used: 
TimescaleDB (PostgreSQL extension)  
TimescaleDB stores all historical trading data, including:  

Trade executions  
Order history  
Balance changes  
Kline/candlestick data  

The DB Processor aggregates trades into time-bucketed klines (1 minute, 5 minute, 1 hour, etc.) using TimescaleDB's continuous aggregates feature. This allows the frontend to efficiently query and display price charts without computing aggregations on the fly.  

### Architecture Overview

```
User → API Server → Redis Queue → Engine (in-memory orderbook)
                                      ↓
                                 Redis Pub/Sub
                                   ↙     ↘
                    WebSocket Server   DB Processor
                           ↓                ↓
                        User          TimescaleDB
```

<img width="3222" height="1582" alt="image" src="https://github.com/user-attachments/assets/cee363f3-1ed7-479b-96b3-98831d3b38fe" />

