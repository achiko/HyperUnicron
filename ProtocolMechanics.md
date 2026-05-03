# HyperUnicorn Protocol Mechanics

## Background Information: HyperUnicorn
- Vault activity - users deposit into a vault, which actively market-makes and manages positions on their behalf.
- Direct trading activity — advanced users create and manage their own custom positions.


### How I approached the problem

First, I tried to understand the protocol mechanics. As I don't have a background in perpetual protocols, I tried to follow the steps. Still, I didn't fully understand how some mechanisms work — for example, the funding system: `HyperUnicorn liquidity demand and supply`, `imbalance between different types of positions`, and how costs and rewards adjust dynamically based on supply and demand. These are very general descriptions, and without knowledge of a real protocol, they are hard to understand.

**So I decided to set this complicated part aside and focus on the parts I understood fully, relying only on those.**

These parts are:

**1. Vault users (passive)**
- Deposit assets into the vault.
- Their "activity" is essentially: deposit / hold / withdraw.

**2. Direct traders (active)**
- Create and manage their own custom Uniswap LP positions — choosing price ranges, sizing, and which assets to provide.
- Can combine option-like LP positions to construct synthetic exposures (e.g. long call + short put = synthetic long).
- Manage their positions over time (open, adjust, close).

To keep things simple, I stopped here and decided to cover only two types of activity: **depositing funds** and **managing Uniswap LP positions**.

**Why I made this decision:** these two cover protocol activity for essentially all user types, and they are easier to reason about and explain.

I also iterated several times, and one factor stood out as critical across all activities: **time**. For example, for deposited funds, duration is the key signal of protocol loyalty — together, of course, with volume.

For LP positions, duration matters too, but there are additional factors:

1. **Liquidity range size** — if an LP provides a very wide range, it's a strong sign of lazy/farming behavior.
2. **Fake liquidity** — when the range sits far from the current price and is never actually in range. This kind of farming is detectable.

---

## Actor Types and Behavior Patterns

| Actor | Activity Type | Behavior Pattern | Key Signals | Quality |
|---|---|---|---|---|
| **Loyal Vault Depositor** | Vault (passive) | Deposits and holds for long durations; rarely withdraws | Long deposit duration, stable balance, low withdrawal frequency | High |
| **Vault Farmer / Flipper** | Vault (passive) | Deposits briefly to capture points, then withdraws; may rotate in and out | Short deposit duration, frequent deposit/withdraw cycles | Low |
| **Active Market Maker** | Direct LP (active) | Creates focused LP positions near the current price; actively manages and rebalances | Narrow-to-moderate range, high time-in-range ratio, long position duration | High |
| **Lazy Liquidity Provider** | Direct LP (active) | Sets a very wide range and leaves it; minimal management | Very wide range, long duration, low capital efficiency | Medium |
| **Fake Liquidity Farmer** | Direct LP (active) | Opens positions with ranges far from spot price purely to accumulate points | Range out of band, low/zero time-in-range, no real fee earnings | Low (gaming) |
| **Short-Term LP Flipper** | Direct LP (active) | Opens and closes LP positions quickly to game activity-based metrics | Very short position duration, frequent open/close cycles | Low |
| **Hybrid User** | Vault + Direct LP | Uses the vault for passive capital and runs LPs for active exposure | Mixed signals across both activities | High |



## Point Calculation Formulas 


### Vault points (per day)

```python   
vault_points_daily = sqrt(deposit_amount) × time_multiplier
```
Where:
**sqrt(deposit_amount)** — sub-linear capital reward. A 10,000 USDC depositor gets ~3.16x the points of a 1,000 USDC depositor, not 10x.
**time_multiplier** — grows with how long the deposit has been held continuously:


- Days 1–7: 0.5x (cooling-off period; discourages quick deposit-flips)
- Days 8–30: 1.0x
- Days 31–90: 1.25x
- Days 90+: 1.5x (loyalty bonus, capped)

**Note:** multipliers are not final and can be adjusted.**


### Direct LP points (per day)

```ptyhon 
    lp_points_daily = sqrt(position_size) × range_quality × time_in_range_ratio × duration_multiplier
```

**Where:**

**sqrt(position_size)** — same sub-linear capital scaling as vault.
range_quality — penalizes lazy and gaming behavior:

- Range width is measured as a percentage around spot price. 
- A "tight enough" range (say, within ±20% of spot at open) → 1.0
- Very wide range (±100% or wider) → 0.3
- Linear interpolation between these.

**time_in_range_ratio** — fraction of the day the position's range actually contained the spot price.

- In range all day → 1.0
- Never in range → 0.0
- This single multiplier kills "fake liquidity" farming. Out-of-range positions earn ~zero.

**duration_multiplier** — same shape as vault's time_multiplier, rewarding long-lived positions.





