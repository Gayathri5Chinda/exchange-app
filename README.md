# CryptoExchange
A high-performance cryptocurrency exchange platform with real-time trading capabilities.  

Full Website:   


CryptoExchange is split up into multiple separate deployables: `a web client`, `API server, Engine`, `WebSocket server`, `DB Processor`, and `a market maker`.  

## How to run the application:
Navigate to the every directory and run: 
```
pnpm install
```
Ensure Redis and TimescaleDB are running locally or update the connection strings.  
Navigate to the root directory and run: 
```
pnpm start
```
Run tests with: (in each sub-directory)  
```
pnpm test
```

## API Server
### Tech Used: 
Express, Node.js    

The API server acts as the main HTTP interface for users to interact with the exchange through the browser. When a user places an order via POST /api/v1/order, the API server validates and pushes it to a Redis queue for the Engine to process.

### Data Flow:    
- Browser sends POST /api/v1/order with order details
- API Server validates the order and pushes it to Redis Queue
- Engine processes the order and publishes the result via Redis Pub/Sub
- API Server receives the execution result (executedQuantity, fills) and responds to the browser 

## Engine
### Tech Used: 
Node.js, Redis  

The Engine is the heart of the exchange, responsible for maintaining in-memory orderbooks for various trading pairs (like SOL_USDC) and executing trades. It stores user balances and open orders entirely in memory for blazing-fast order matching.
Redis serves dual purposes:

1. **Message Queue** - receives orders from the API
2. **Pub/Sub** - broadcasts trade executions, ticker updates, and orderbook depth

### Data Flow:  
The Engine processes orders from Redis Queue and when trades are executed:
- Publishes trade_created events (price: 200.1, quantity: 5) to a Redis Queue for the Database Processor
- Publishes real-time updates to Redis Pub/Sub channels:
  - `trade@SOL_USDC` - individual trade executions
  - `ticker@SOL_USDC` - price ticker updates
  - `depth@SOL_USDC` - orderbook depth changes
- Sends execution confirmations back to the API (executedQuantity: 5, fills: [])

## WebSocket Server
### Tech Used: 
WebSocket (ws library), Node.js, Redis  

Real-time data is essential for any trading platform. The WebSocket server subscribes to Redis Pub/Sub channels and streams updates directly to the browser for:
- `trade@SOL_USDC` - live trade feed
- `ticker@SOL_USDC` - real-time price updates
- `depth@SOL_USDC` - orderbook depth changes

### Data Flow:  
The Engine publishes events to Redis Pub/Sub → WebSocket Server subscribes to these channels → Browser receives real-time updates via WebSocket connection.

## DB Processor
### Tech Used: 
Node.js, Redis, TimescaleDB 

It consumes trade events from a Redis Queue (separate from the order queue) and writes them to TimescaleDB
### Data Flow:  
The DB Processor listens to Redis pub/sub channels for trade executions, order placements, cancellations, and balance updates. These events are batched and written to TimescaleDB. Additionally, the DB Processor generates kline (candlestick) data by aggregating trades into time buckets (1m, 5m, 1h, etc.), which are used by the frontend for charting.

## Market Maker (mm)
### Tech Used: 
Node.js, Redis
### Data Flow:
The market maker periodically generates random orders within a configured spread around the mid-market price. These orders are pushed to Redis queues, picked up by the Engine, and matched like any other order. This creates a more realistic trading environment and allows us to test the system under load.

## Redis
Redis serves three critical functions:  
- `Order Queue` - API → Engine (order requests)
- `Event Queue` - Engine → Database Processor (trade_created events)
- `Pub/Sub` - Engine → WebSocket/API (real-time updates and execution confirmations)

## TimescaleDB
Stores all historical trading data with timestamps, allowing the Database Processor to create time-bucketed aggregations for price charts and analytics.  

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

