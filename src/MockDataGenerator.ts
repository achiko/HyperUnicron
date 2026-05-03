// @ts-expect-error This script runs in Node, but the app does not install Node typings.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
// @ts-expect-error This script runs in Node, but the app does not install Node typings.
import { resolve } from "node:path";

const OUTPUT_DIRECTORY = "./src/mock-data";
const USERS_FILE_NAME = "users.json";
const MARKET_FILE_NAME = "market.json";
const ACTIVITIES_FILE_NAME = "activities.json";
const LEADERBOARD_FILE_NAME = "leaderboard.json";
const FULL_DATA_FILE_NAME = "three-month-mock-data.json";
const USER_ACTIVITIES_DIRECTORY_NAME = "user-activities";

const DAYS_TO_GENERATE = 30;
const USERS_TO_GENERATE = 30;
const START_DATE = "2026-01-01";
const INITIAL_ETH_PRICE = 2_000;
const MIN_ETH_PRICE = 1_300;
const MIN_PRICE_MOVE = -90;
const MAX_PRICE_MOVE = 90;
const HIGH_VOLATILITY = 1.45;
const NORMAL_VOLATILITY = 1.0;
const HIGH_VOLATILITY_CHANCE = 0.24;

const TIGHT_RANGE_WIDTH_PERCENT = 20;
const VERY_WIDE_RANGE_WIDTH_PERCENT = 100;
const TIGHT_RANGE_QUALITY = 1.0;
const VERY_WIDE_RANGE_QUALITY = 0.3;
const OUT_OF_RANGE_QUALITY = 0.1;

const TIME_IN_RANGE_ALL_DAY = 1.0;
const TIME_IN_RANGE_MOST_DAY = 0.78;
const TIME_IN_RANGE_HALF_DAY = 0.5;
const TIME_IN_RANGE_LOW = 0.18;
const TIME_IN_RANGE_ZERO = 0.0;

const LONG_LIVED_POSITION_CHANCE = 0.74;
const ACTIVE_REBALANCE_CHANCE = 0.3;
const VAULT_WITHDRAW_CHANCE = 0.18;
const HYBRID_DIRECT_ACTIVITY_CHANCE = 0.68;

const LOYAL_VAULT_CAPITAL_USD = { MIN: 5_000, MAX: 35_000 };
const LOYAL_VAULT_DURATION_DAYS = { MIN: 31, MAX: 90 };
const VAULT_FARMER_CAPITAL_USD = { MIN: 20_000, MAX: 120_000 };
const VAULT_FARMER_DURATION_DAYS = { MIN: 1, MAX: 6 };
const ACTIVE_MARKET_MAKER_CAPITAL_USD = { MIN: 4_000, MAX: 30_000 };
const ACTIVE_MARKET_MAKER_DURATION_DAYS = { MIN: 14, MAX: 70 };
const LAZY_LP_CAPITAL_USD = { MIN: 8_000, MAX: 80_000 };
const LAZY_LP_DURATION_DAYS = { MIN: 31, MAX: 90 };
const FAKE_LIQUIDITY_CAPITAL_USD = { MIN: 30_000, MAX: 160_000 };
const FAKE_LIQUIDITY_DURATION_DAYS = { MIN: 7, MAX: 45 };
const SHORT_TERM_LP_CAPITAL_USD = { MIN: 700, MAX: 8_000 };
const SHORT_TERM_LP_DURATION_DAYS = { MIN: 0, MAX: 2 };
const HYBRID_VAULT_CAPITAL_USD = { MIN: 3_000, MAX: 22_000 };
const HYBRID_DIRECT_CAPITAL_USD = { MIN: 2_000, MAX: 16_000 };
const HYBRID_DURATION_DAYS = { MIN: 20, MAX: 80 };

const MARKET_IMBALANCES: MarketImbalance[] = [
  "long_heavy",
  "short_heavy",
  "balanced",
];
const EXPOSURE_SIDES: ExposureSide[] = ["long", "short", "neutral"];

type ActivityType = "vault" | "direct_lp";
type ActivityAction =
  | "vault_deposit"
  | "vault_withdraw"
  | "open_position"
  | "adjust_position"
  | "close_position";

type ExposureSide = "long" | "short" | "neutral";
type MarketImbalance = "long_heavy" | "short_heavy" | "balanced";

type UserArchetype =
  | "loyal_vault_depositor"
  | "vault_farmer_flipper"
  | "active_market_maker"
  | "lazy_liquidity_provider"
  | "fake_liquidity_farmer"
  | "short_term_lp_flipper"
  | "hybrid_user";

type User = {
  id: string;
  name: string;
  archetype: UserArchetype;
};

type MarketDay = {
  day: number;
  date: string;
  ethPrice: number;
  volatility: number;
  imbalance: MarketImbalance;
};

type Activity = {
  id: string;
  day: number;
  date: string;
  userId: string;
  userName: string;
  archetype: UserArchetype;
  activityType: ActivityType;
  action: ActivityAction;
  capitalUsd: number;
  durationDays: number;
  marketImbalance: MarketImbalance;
  rangeWidthPercent?: number;
  rangeQuality?: number;
  timeInRangeRatio?: number;
  exposureSide?: ExposureSide;
  points: number;
};

const USER_ARCHETYPES: UserArchetype[] = [
  "loyal_vault_depositor",
  "vault_farmer_flipper",
  "active_market_maker",
  "lazy_liquidity_provider",
  "fake_liquidity_farmer",
  "short_term_lp_flipper",
  "hybrid_user",
];

const USER_NAME_SEEDS = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Frank",
  "Grace",
  "Helen",
  "Ivan",
  "Judy",
  "Kevin",
  "Laura",
  "Mallory",
  "Nia",
  "Oscar",
  "Priya",
  "Quinn",
  "Ravi",
  "Sara",
  "Tomas",
  "Uma",
  "Victor",
  "Wendy",
  "Xavier",
  "Yara",
  "Zane",
];

function generateUsers(count = USERS_TO_GENERATE): User[] {
  return Array.from({ length: count }, (_, index) => {
    const idNumber = index + 1;
    const seedName = USER_NAME_SEEDS[index % USER_NAME_SEEDS.length];
    const archetype = USER_ARCHETYPES[index % USER_ARCHETYPES.length];

    return {
      id: `u${idNumber}`,
      name: `${seedName}-${String(idNumber).padStart(3, "0")}`,
      archetype,
    };
  });
}

const USERS = generateUsers();

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function randomDecimalBetween(min: number, max: number): number {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatDate(day: number): string {
  const date = new Date(START_DATE);
  date.setDate(date.getDate() + day - 1);

  return date.toISOString().slice(0, 10);
}

function generateMarketQuarter(days = DAYS_TO_GENERATE): MarketDay[] {
  let ethPrice = INITIAL_ETH_PRICE;

  return Array.from({ length: days }, (_, i) => {
    const volatility =
      Math.random() < HIGH_VOLATILITY_CHANCE
        ? HIGH_VOLATILITY
        : NORMAL_VOLATILITY;
    const priceMove = randomBetween(MIN_PRICE_MOVE, MAX_PRICE_MOVE) * volatility;
    ethPrice = Math.max(MIN_ETH_PRICE, Math.round(ethPrice + priceMove));

    return {
      day: i + 1,
      date: formatDate(i + 1),
      ethPrice,
      volatility,
      imbalance: pick(MARKET_IMBALANCES),
    };
  });
}

function getTimeMultiplier(durationDays: number): number {
  if (durationDays <= 7) return 0.5;
  if (durationDays <= 30) return 1.0;
  if (durationDays <= 90) return 1.25;
  return 1.5;
}

function getRangeQuality(rangeWidthPercent: number): number {
  if (rangeWidthPercent <= TIGHT_RANGE_WIDTH_PERCENT)
    return TIGHT_RANGE_QUALITY;

  if (rangeWidthPercent >= VERY_WIDE_RANGE_WIDTH_PERCENT)
    return VERY_WIDE_RANGE_QUALITY;

  const rangeProgress =
    (rangeWidthPercent - TIGHT_RANGE_WIDTH_PERCENT) /
    (VERY_WIDE_RANGE_WIDTH_PERCENT - TIGHT_RANGE_WIDTH_PERCENT);

  return Number(
    (
      TIGHT_RANGE_QUALITY -
      rangeProgress * (TIGHT_RANGE_QUALITY - VERY_WIDE_RANGE_QUALITY)
    ).toFixed(2)
  );
}

function getHelpfulExposureSide(imbalance: MarketImbalance): ExposureSide {
  if (imbalance === "long_heavy") return "short";
  if (imbalance === "short_heavy") return "long";
  return pick(["long", "short"]);
}

function calculateVaultPoints(params: {
  capitalUsd: number;
  durationDays: number;
}): number {
  return Math.round(
    Math.sqrt(params.capitalUsd) * getTimeMultiplier(params.durationDays)
  );
}

function calculateDirectLpPoints(params: {
  capitalUsd: number;
  rangeQuality: number;
  timeInRangeRatio: number;
  durationDays: number;
}): number {
  return Math.round(
    Math.sqrt(params.capitalUsd) *
      params.rangeQuality *
      params.timeInRangeRatio *
      getTimeMultiplier(params.durationDays)
  );
}

function createVaultActivity(params: {
  user: User;
  marketDay: MarketDay;
  action: ActivityAction;
  capitalUsd: number;
  durationDays: number;
  idSuffix: string;
}): Activity {
  return {
    id: `${params.user.id}-${params.marketDay.day}-${params.idSuffix}`,
    day: params.marketDay.day,
    date: params.marketDay.date,
    userId: params.user.id,
    userName: params.user.name,
    archetype: params.user.archetype,
    activityType: "vault",
    action: params.action,
    capitalUsd: params.capitalUsd,
    durationDays: params.durationDays,
    marketImbalance: params.marketDay.imbalance,
    points: calculateVaultPoints({
      capitalUsd: params.capitalUsd,
      durationDays: params.durationDays,
    }),
  };
}

function createDirectLpActivity(params: {
  user: User;
  marketDay: MarketDay;
  action: ActivityAction;
  capitalUsd: number;
  durationDays: number;
  rangeWidthPercent: number;
  timeInRangeRatio: number;
  exposureSide: ExposureSide;
  idSuffix: string;
}): Activity {
  const rangeQuality = getRangeQuality(params.rangeWidthPercent);

  return {
    id: `${params.user.id}-${params.marketDay.day}-${params.idSuffix}`,
    day: params.marketDay.day,
    date: params.marketDay.date,
    userId: params.user.id,
    userName: params.user.name,
    archetype: params.user.archetype,
    activityType: "direct_lp",
    action: params.action,
    capitalUsd: params.capitalUsd,
    durationDays: params.durationDays,
    marketImbalance: params.marketDay.imbalance,
    rangeWidthPercent: params.rangeWidthPercent,
    rangeQuality,
    timeInRangeRatio: params.timeInRangeRatio,
    exposureSide: params.exposureSide,
    points: calculateDirectLpPoints({
      capitalUsd: params.capitalUsd,
      rangeQuality,
      timeInRangeRatio: params.timeInRangeRatio,
      durationDays: params.durationDays,
    }),
  };
}

function generateActivityForUser(
  user: User,
  marketDay: MarketDay
): Activity[] {
  switch (user.archetype) {
    case "loyal_vault_depositor": {
      const capitalUsd = randomBetween(
        LOYAL_VAULT_CAPITAL_USD.MIN,
        LOYAL_VAULT_CAPITAL_USD.MAX
      );
      const durationDays = randomBetween(
        LOYAL_VAULT_DURATION_DAYS.MIN,
        LOYAL_VAULT_DURATION_DAYS.MAX
      );

      return [
        createVaultActivity({
          user,
          marketDay,
          action: "vault_deposit",
          capitalUsd,
          durationDays,
          idSuffix: "loyal-vault",
        }),
      ];
    }

    case "vault_farmer_flipper": {
      const activities: Activity[] = [];
      const capitalUsd = randomBetween(
        VAULT_FARMER_CAPITAL_USD.MIN,
        VAULT_FARMER_CAPITAL_USD.MAX
      );
      const durationDays = randomBetween(
        VAULT_FARMER_DURATION_DAYS.MIN,
        VAULT_FARMER_DURATION_DAYS.MAX
      );

      activities.push(
        createVaultActivity({
          user,
          marketDay,
          action: "vault_deposit",
          capitalUsd,
          durationDays,
          idSuffix: "farmer-deposit",
        })
      );

      if (Math.random() < VAULT_WITHDRAW_CHANCE) {
        activities.push(
          createVaultActivity({
            user,
            marketDay,
            action: "vault_withdraw",
            capitalUsd,
            durationDays,
            idSuffix: "farmer-withdraw",
          })
        );
      }

      return activities;
    }

    case "active_market_maker": {
      const capitalUsd = randomBetween(
        ACTIVE_MARKET_MAKER_CAPITAL_USD.MIN,
        ACTIVE_MARKET_MAKER_CAPITAL_USD.MAX
      );
      const durationDays =
        Math.random() < LONG_LIVED_POSITION_CHANCE
          ? randomBetween(
              ACTIVE_MARKET_MAKER_DURATION_DAYS.MIN,
              ACTIVE_MARKET_MAKER_DURATION_DAYS.MAX
            )
          : randomBetween(8, 20);
      const action =
        Math.random() < ACTIVE_REBALANCE_CHANCE
          ? "adjust_position"
          : "open_position";

      return [
        createDirectLpActivity({
          user,
          marketDay,
          action,
          capitalUsd,
          durationDays,
          rangeWidthPercent: randomBetween(8, 28),
          timeInRangeRatio: randomDecimalBetween(
            TIME_IN_RANGE_MOST_DAY,
            TIME_IN_RANGE_ALL_DAY
          ),
          exposureSide: getHelpfulExposureSide(marketDay.imbalance),
          idSuffix: "active-lp",
        }),
      ];
    }

    case "lazy_liquidity_provider": {
      const capitalUsd = randomBetween(LAZY_LP_CAPITAL_USD.MIN, LAZY_LP_CAPITAL_USD.MAX);
      const durationDays = randomBetween(
        LAZY_LP_DURATION_DAYS.MIN,
        LAZY_LP_DURATION_DAYS.MAX
      );

      return [
        createDirectLpActivity({
          user,
          marketDay,
          action: "open_position",
          capitalUsd,
          durationDays,
          rangeWidthPercent: randomBetween(90, 180),
          timeInRangeRatio: randomDecimalBetween(
            TIME_IN_RANGE_HALF_DAY,
            TIME_IN_RANGE_MOST_DAY
          ),
          exposureSide: "neutral",
          idSuffix: "lazy-lp",
        }),
      ];
    }

    case "fake_liquidity_farmer": {
      const capitalUsd = randomBetween(
        FAKE_LIQUIDITY_CAPITAL_USD.MIN,
        FAKE_LIQUIDITY_CAPITAL_USD.MAX
      );
      const durationDays = randomBetween(
        FAKE_LIQUIDITY_DURATION_DAYS.MIN,
        FAKE_LIQUIDITY_DURATION_DAYS.MAX
      );

      return [
        {
          ...createDirectLpActivity({
            user,
            marketDay,
            action: "open_position",
            capitalUsd,
            durationDays,
            rangeWidthPercent: randomBetween(120, 240),
            timeInRangeRatio: TIME_IN_RANGE_ZERO,
            exposureSide: pick(EXPOSURE_SIDES),
            idSuffix: "fake-liquidity",
          }),
          rangeQuality: OUT_OF_RANGE_QUALITY,
          points: 0,
        },
      ];
    }

    case "short_term_lp_flipper": {
      const activities: Activity[] = [];
      const activityCount = randomBetween(2, 5);

      for (let i = 0; i < activityCount; i++) {
        const capitalUsd = randomBetween(
          SHORT_TERM_LP_CAPITAL_USD.MIN,
          SHORT_TERM_LP_CAPITAL_USD.MAX
        );
        const durationDays = randomBetween(
          SHORT_TERM_LP_DURATION_DAYS.MIN,
          SHORT_TERM_LP_DURATION_DAYS.MAX
        );

        activities.push(
          createDirectLpActivity({
            user,
            marketDay,
            action: i % 2 === 0 ? "open_position" : "close_position",
            capitalUsd,
            durationDays,
            rangeWidthPercent: randomBetween(18, 70),
            timeInRangeRatio: randomDecimalBetween(
              TIME_IN_RANGE_LOW,
              TIME_IN_RANGE_HALF_DAY
            ),
            exposureSide: pick(EXPOSURE_SIDES),
            idSuffix: `flipper-${i}`,
          })
        );
      }

      return activities;
    }

    case "hybrid_user": {
      const activities: Activity[] = [];
      const durationDays = randomBetween(
        HYBRID_DURATION_DAYS.MIN,
        HYBRID_DURATION_DAYS.MAX
      );

      activities.push(
        createVaultActivity({
          user,
          marketDay,
          action: "vault_deposit",
          capitalUsd: randomBetween(
            HYBRID_VAULT_CAPITAL_USD.MIN,
            HYBRID_VAULT_CAPITAL_USD.MAX
          ),
          durationDays,
          idSuffix: "hybrid-vault",
        })
      );

      if (Math.random() < HYBRID_DIRECT_ACTIVITY_CHANCE) {
        activities.push(
          createDirectLpActivity({
            user,
            marketDay,
            action: "open_position",
            capitalUsd: randomBetween(
              HYBRID_DIRECT_CAPITAL_USD.MIN,
              HYBRID_DIRECT_CAPITAL_USD.MAX
            ),
            durationDays,
            rangeWidthPercent: randomBetween(15, 45),
            timeInRangeRatio: randomDecimalBetween(
              TIME_IN_RANGE_HALF_DAY,
              TIME_IN_RANGE_ALL_DAY
            ),
            exposureSide: getHelpfulExposureSide(marketDay.imbalance),
            idSuffix: "hybrid-lp",
          })
        );
      }

      return activities;
    }
  }
}

function generateMockData(days = DAYS_TO_GENERATE): {
  market: MarketDay[];
  activities: Activity[];
} {
  const market = generateMarketQuarter(days);
  const activities: Activity[] = [];

  for (const marketDay of market) {
    for (const user of USERS) {
      activities.push(...generateActivityForUser(user, marketDay));
    }
  }

  return { market, activities };
}

function buildLeaderboard(activities: Activity[]) {
  const totals = new Map<
    string,
    {
      userId: string;
      userName: string;
      archetype: UserArchetype;
      totalPoints: number;
      activityCount: number;
    }
  >();

  for (const activity of activities) {
    const current = totals.get(activity.userId) ?? {
      userId: activity.userId,
      userName: activity.userName,
      archetype: activity.archetype,
      totalPoints: 0,
      activityCount: 0,
    };

    current.totalPoints += activity.points;
    current.activityCount += 1;
    totals.set(activity.userId, current);
  }

  return Array.from(totals.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
}

function writeJsonFile(outputDirectory: string, fileName: string, data: unknown) {
  writeFileSync(
    resolve(outputDirectory, fileName),
    `${JSON.stringify(data, null, 2)}\n`
  );
}

function saveUserActivityFiles(outputDirectory: string, activities: Activity[]) {
  const userActivitiesDirectory = resolve(
    outputDirectory,
    USER_ACTIVITIES_DIRECTORY_NAME
  );
  const groupedActivities = new Map<string, Activity[]>();

  rmSync(userActivitiesDirectory, { force: true, recursive: true });
  mkdirSync(userActivitiesDirectory, { recursive: true });

  for (const activity of activities) {
    const userActivities = groupedActivities.get(activity.userId) ?? [];
    userActivities.push(activity);
    groupedActivities.set(activity.userId, userActivities);
  }

  for (const [userId, userActivities] of groupedActivities) {
    writeJsonFile(
      userActivitiesDirectory,
      `${userId}.json`,
      userActivities.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id))
    );
  }
}

function saveGeneratedFiles(params: {
  outputDirectory: string;
  users: User[];
  market: MarketDay[];
  activities: Activity[];
  leaderboard: ReturnType<typeof buildLeaderboard>;
}) {
  mkdirSync(params.outputDirectory, { recursive: true });

  writeJsonFile(params.outputDirectory, USERS_FILE_NAME, params.users);
  writeJsonFile(params.outputDirectory, MARKET_FILE_NAME, params.market);
  writeJsonFile(params.outputDirectory, ACTIVITIES_FILE_NAME, params.activities);
  writeJsonFile(
    params.outputDirectory,
    LEADERBOARD_FILE_NAME,
    params.leaderboard
  );
  saveUserActivityFiles(params.outputDirectory, params.activities);
  writeJsonFile(params.outputDirectory, FULL_DATA_FILE_NAME, {
    users: params.users,
    market: params.market,
    activities: params.activities,
    leaderboard: params.leaderboard,
  });
}

const outputDirectory = resolve(OUTPUT_DIRECTORY);
const { market, activities } = generateMockData(DAYS_TO_GENERATE);
const leaderboard = buildLeaderboard(activities);

saveGeneratedFiles({
  outputDirectory,
  users: USERS,
  market,
  activities,
  leaderboard,
});

console.log(`Generated ${DAYS_TO_GENERATE} days of mock data in ${outputDirectory}`);
