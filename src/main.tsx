import React from "react";
import { createRoot } from "react-dom/client";
import { Activity, ArrowLeft, Trophy, Users } from "lucide-react";
import leaderboardData from "./mock-data/leaderboard.json";
import "./styles.css";

type LeaderboardEntry = {
  userId: string;
  userName: string;
  archetype: string;
  totalPoints: number;
  activityCount: number;
};

type UserActivity = {
  id: string;
  day: number;
  date: string;
  userId: string;
  userName: string;
  archetype: string;
  activityType: "vault" | "direct_lp";
  action: string;
  capitalUsd: number;
  durationDays: number;
  marketImbalance: string;
  rangeWidthPercent?: number;
  rangeQuality?: number;
  timeInRangeRatio?: number;
  exposureSide?: string;
  points: number;
};

const leaderboard = leaderboardData as LeaderboardEntry[];
const userActivityUrls = import.meta.glob("./mock-data/user-activities/*.json", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD",
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatArchetype(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAction(value: string) {
  return formatArchetype(value);
}

function getTimeMultiplier(durationDays: number) {
  if (durationDays <= 7) return 0.5;
  if (durationDays <= 30) return 1.0;
  if (durationDays <= 90) return 1.25;
  return 1.5;
}

function getFormula(activity: UserActivity) {
  const capitalRoot = Math.sqrt(activity.capitalUsd).toFixed(2);
  const timeMultiplier = getTimeMultiplier(activity.durationDays).toFixed(2);

  if (activity.activityType === "vault") {
    return {
      expression: `round(sqrt(${formatCurrency(activity.capitalUsd)}) x ${timeMultiplier})`,
      explanation: `sqrt capital ${capitalRoot} x time multiplier ${timeMultiplier}. Duration ${activity.durationDays} days.`,
    };
  }

  const rangeQuality = (activity.rangeQuality ?? 0).toFixed(2);
  const timeInRangeRatio = (activity.timeInRangeRatio ?? 0).toFixed(2);

  return {
    expression: `round(sqrt(${formatCurrency(activity.capitalUsd)}) x ${rangeQuality} x ${timeInRangeRatio} x ${timeMultiplier})`,
    explanation: `sqrt capital ${capitalRoot} x range quality ${rangeQuality} x time in range ${timeInRangeRatio} x time multiplier ${timeMultiplier}.`,
  };
}

function useHashRoute() {
  const [hash, setHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hash;
}

function Dashboard() {
  const usersCount = leaderboard.length;
  const totalPoints = leaderboard.reduce((sum, user) => sum + user.totalPoints, 0);
  const totalActivities = leaderboard.reduce((sum, user) => sum + user.activityCount, 0);

  const stats = [
    {
      label: "Users Count",
      value: formatNumber(usersCount),
      icon: Users,
    },
    {
      label: "Total Points",
      value: formatNumber(totalPoints),
      icon: Trophy,
    },
    {
      label: "Activities",
      value: formatNumber(totalActivities),
      icon: Activity,
    },
  ];

  return (
    <main className="dashboard">
      <section className="dashboard__header" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">HyperUnicorn Points</p>
          <h1 id="page-title">Leaderboard Dashboard</h1>
        </div>
      </section>

      <section className="stats-grid" aria-label="Dashboard aggregations">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="stat" key={label}>
            <div className="stat__icon" aria-hidden="true">
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="leaderboard" aria-labelledby="leaderboard-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ranked by points</p>
            <h2 id="leaderboard-title">Leaderboard</h2>
          </div>
          <span>{formatNumber(usersCount)} users</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">User</th>
                <th scope="col">Archetype</th>
                <th scope="col" className="numeric">
                  Activities
                </th>
                <th scope="col" className="numeric">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user.userId}>
                  <td>
                    <span className="rank">#{index + 1}</span>
                  </td>
                  <td>
                    <a className="user-cell user-link" href={`#/users/${user.userId}`}>
                      <span>{user.userName.slice(0, 1)}</span>
                      <div>
                        <strong>{user.userName}</strong>
                        <small>{user.userId}</small>
                      </div>
                    </a>
                  </td>
                  <td>{formatArchetype(user.archetype)}</td>
                  <td className="numeric">{formatNumber(user.activityCount)}</td>
                  <td className="numeric points">{formatNumber(user.totalPoints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function UserDetails({ userId }: { userId: string }) {
  const [allActivities, setAllActivities] = React.useState<UserActivity[] | null>(null);
  const [activitiesError, setActivitiesError] = React.useState<string | null>(null);
  const user = leaderboard.find((entry) => entry.userId === userId);

  React.useEffect(() => {
    let isCurrent = true;
    const userActivityUrl = userActivityUrls[`./mock-data/user-activities/${userId}.json`];

    setAllActivities(null);
    setActivitiesError(null);

    if (!userActivityUrl) {
      setActivitiesError(`No activity file found for ${userId}`);
      return () => {
        isCurrent = false;
      };
    }

    fetch(userActivityUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load activities: ${response.status}`);
        }

        return response.json() as Promise<UserActivity[]>;
      })
      .then((data) => {
        if (isCurrent) setAllActivities(data);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setActivitiesError(error instanceof Error ? error.message : "Could not load activities");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const userActivities = (allActivities ?? [])
    .filter((activity) => activity.userId === userId)
    .sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));

  if (!user) {
    return (
      <main className="dashboard">
        <a className="back-link" href="#/">
          <ArrowLeft size={16} />
          Back
        </a>
        <section className="empty-state">
          <h1>User not found</h1>
          <p>No leaderboard entry exists for <strong>{userId}</strong>.</p>
        </section>
      </main>
    );
  }

  const stats = [
    { label: "Total Points", value: formatNumber(user.totalPoints), icon: Trophy },
    { label: "Records", value: formatNumber(userActivities.length), icon: Activity },
    { label: "Archetype", value: formatArchetype(user.archetype), icon: Users },
  ];

  return (
    <main className="dashboard">
      <a className="back-link" href="#/">
        <ArrowLeft size={16} />
        Back to leaderboard
      </a>

      <section className="dashboard__header detail-header" aria-labelledby="user-title">
        <div className="user-title">
          <span>{user.userName.slice(0, 1)}</span>
          <div>
            <p className="eyebrow">{user.userId}</p>
            <h1 id="user-title">{user.userName}</h1>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="User aggregations">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="stat" key={label}>
            <div className="stat__icon" aria-hidden="true">
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p>{label}</p>
              <strong className={label === "Archetype" ? "stat__text-value" : ""}>
                {value}
              </strong>
            </div>
          </article>
        ))}
      </section>

      <section className="leaderboard" aria-labelledby="records-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Formula and explanation</p>
            <h2 id="records-title">User Records</h2>
          </div>
          <span>{formatNumber(user.totalPoints)} total points</span>
        </div>

        {!allActivities && !activitiesError ? (
          <div className="loading-state">Loading user records...</div>
        ) : null}

        {activitiesError ? (
          <div className="loading-state loading-state--error">{activitiesError}</div>
        ) : null}

        {allActivities ? (
        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Action</th>
                <th scope="col" className="numeric">
                  Capital
                </th>
                <th scope="col">Formula</th>
                <th scope="col">Explanation</th>
                <th scope="col" className="numeric">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {userActivities.map((activity) => {
                const formula = getFormula(activity);

                return (
                  <tr key={activity.id}>
                    <td>
                      <strong>{activity.date}</strong>
                      <small>Day {activity.day}</small>
                    </td>
                    <td>
                      <strong>{formatAction(activity.action)}</strong>
                      <small>{formatArchetype(activity.activityType)}</small>
                    </td>
                    <td className="numeric">{formatCurrency(activity.capitalUsd)}</td>
                    <td>
                      <code>{formula.expression}</code>
                    </td>
                    <td>{formula.explanation}</td>
                    <td className="numeric points">{formatNumber(activity.points)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : null}
      </section>
    </main>
  );
}

function App() {
  const hash = useHashRoute();
  const userMatch = hash.match(/^#\/users\/([^/]+)$/);

  if (userMatch) {
    return <UserDetails userId={decodeURIComponent(userMatch[1])} />;
  }

  return <Dashboard />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
