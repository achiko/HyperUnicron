# **Background Information: HyperUnicorn**

HyperUnicorn is a hypothetical protocol that enables users to trade perpetual-style exposure using liquidity positions on an automated market maker (AMM), such as Uniswap.

Instead of relying on a traditional order book, HyperUnicorn uses liquidity positions as the core primitive for expressing financial exposure.

---

## **Perpetual Futures (Conceptual Overview)**

A perpetual futures contract (“perp”) allows users to take long or short exposure to an asset without an expiration date.

Key properties:

* No expiry — positions can be held indefinitely  
* Funding mechanism — periodic payments between participants keep prices aligned with the underlying asset  
* Long / short symmetry — users can express directional views in either direction

---

## **Structure of Perps (Simplified)**

Let:

* S\_t \= price of the underlying asset  
* F\_t \= price of the perpetual contract

A perp is structured such that:

* users can enter and exit at any time  
* one side pays the other continuously while the position is open

The funding rate governs these payments:

rho\_t \= k \* (F\_t \- S\_t) \+ i \* S\_t

Where:

* k controls how aggressively price differences are corrected  
* i represents an interest-like component

The total payment over time is:

P\_t \= integral of rho\_t over time

This mechanism:

* incentivizes traders to push F\_t toward S\_t  
* keeps the perpetual price aligned with the underlying asset

---

## **Core Primitive: Liquidity Positions**

In HyperUnicorn, users do not trade perps directly.

Instead, they create liquidity positions:

* defined over a price range  
* composed of two assets (e.g. ETH / USDC)

These positions:

* Earn or pay funding fees  
* gain or lose value depending on price movement  
* continuously change composition as price moves

---

## **Option-Like Behavior**

Liquidity positions naturally exhibit option-like characteristics:

* providing liquidity exposes the user to asymmetric outcomes  
* fees earned resemble option premium  
* risk depends on how price moves relative to the chosen range

Because of this, liquidity positions can be used as building blocks to replicate more complex financial exposures.

---

## **Synthetic Perpetual Exposure**

HyperUnicorn allows users to construct synthetic perpetual exposure by combining option-like positions.

A common construction:

### **Long Exposure**

* long call (at-the-money)  
* short put (at-the-money)

### **Short Exposure**

* short call  
* long put

These combinations replicate the payoff of holding the underlying asset (long or short), but through structured positions.

---

## **Funding in Synthetic Systems**

Unlike traditional perps (which use explicit funding rates), synthetic systems rely on:

* AMM liquidity provider fees  
* HyperUnicorn liquidity demand and supply  
  * imbalance between different types of positions

A simplified way to think about this:

* if more users want one type of exposure, it becomes more expensive  
* costs and rewards adjust dynamically based on supply and demand