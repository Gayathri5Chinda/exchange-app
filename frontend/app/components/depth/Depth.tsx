"use client";
//you can do server-side rendering with this component

import { useEffect, useState } from "react";
import { getDepth, getKlines, getTicker, getTrades } from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { SignalingManager } from "@/app/utils/SignalingManager";

//take market as input and render a order book
export function Depth({ market }: {market: string}) {
    const [bids, setBids] = useState<[string, string][]>();
    const [asks, setAsks] = useState<[string, string][]>();
    const [price, setPrice] = useState<string>();

    useEffect(() => {
        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            if (!data) return;

            // update bids if payload contains bids array
            if (Array.isArray(data.bids) && data.bids.length > 0) {
                setBids((originalBids) => {
                    // initialize from payload if local state is empty
                    if (!originalBids || originalBids.length === 0) {
                        return [...data.bids].reverse();
                    }
                    // merge updates by price key
                    return originalBids.map((b) => {
                        const match = data.bids.find((nb: any) => nb[0] === b[0]);
                        return match ? [b[0], match[1]] : b;
                    });
                });
            }

            // update asks if payload contains asks array
            if (Array.isArray(data.asks) && data.asks.length > 0) {
                setAsks((originalAsks) => {
                    if (!originalAsks || originalAsks.length === 0) {
                        return [...data.asks];
                    }
                    return originalAsks.map((a) => {
                        const match = data.asks.find((na: any) => na[0] === a[0]);
                        return match ? [a[0], match[1]] : a;
                    });
                });
            }
        }, `DEPTH-${market}`);
        

        SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`depth.${market}`]});

        getDepth(market).then(d => {
            setBids(d.bids.reverse());
            setAsks(d.asks);
        });

        getTicker(market).then(t => setPrice(t.lastPrice));
        getTrades(market).then(t => setPrice(t[0].price));
        // getKlines(market, "1h", 1640099200, 1640100800).then(t => setPrice(t[0].close));
        return () => {
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth.200ms.${market}`]});
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
        }
    }, [])
    
    return <div>
        <TableHeader />
        {asks && <AskTable asks={asks} />}
        {price && <div>{price}</div>}
        {bids && <BidTable bids={bids} />}
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs">
    <div className="text-white">Price</div>
    <div className="text-slate-500">Size</div>
    <div className="text-slate-500">Total</div>
</div>
}