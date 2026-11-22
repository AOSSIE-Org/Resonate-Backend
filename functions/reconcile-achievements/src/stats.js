export const EMPTY_STATS = {
    roomsHosted: 0,
    roomsModerated: 0,
    interactions: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    dailyInteractions: 0,
    badges: [],
    displayedBadges: [],
    avatarBadge: null,
};

const COUNTER_KEYS = [
    "roomsHosted",
    "roomsModerated",
    "interactions",
    "activeDays",
    "currentStreak",
    "longestStreak",
    "dailyInteractions",
];

// Tolerates the nulls on a freshly created row.
export function fromRow(row) {
    const stats = { ...EMPTY_STATS };
    if (!row) return stats;
    for (const key of COUNTER_KEYS) {
        const value = Number(row[key]);
        stats[key] = Number.isFinite(value) ? value : 0;
    }
    stats.lastActiveDate = row.lastActiveDate ?? null;
    stats.badges = row.badges ?? [];
    stats.displayedBadges = row.displayedBadges ?? [];
    stats.avatarBadge = row.avatarBadge ?? null;
    return stats;
}

// Only the writable columns, so an update never echoes back Appwrite's $ keys.
export function toRowData(stats) {
    return {
        roomsHosted: stats.roomsHosted,
        roomsModerated: stats.roomsModerated,
        interactions: stats.interactions,
        activeDays: stats.activeDays,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastActiveDate: stats.lastActiveDate,
        dailyInteractions: stats.dailyInteractions,
        badges: stats.badges,
        displayedBadges: stats.displayedBadges,
        avatarBadge: stats.avatarBadge,
    };
}

// UTC everywhere, so a streak cannot be gamed by changing time zone.
export function utcToday(now = new Date()) {
    return now.toISOString().slice(0, 10);
}

export function previousDay(day) {
    const [year, month, date] = day.split("-").map(Number);
    const stamp = Date.UTC(year, month - 1, date) - 86400000;
    return new Date(stamp).toISOString().slice(0, 10);
}

// Unchanged when today was already counted, so activeDays cannot be inflated.
export function applyDailyActivity(stats, today = utcToday()) {
    if (stats.lastActiveDate === today) return stats;

    const continuing = stats.lastActiveDate === previousDay(today);
    const currentStreak = continuing ? stats.currentStreak + 1 : 1;

    return {
        ...stats,
        activeDays: stats.activeDays + 1,
        currentStreak,
        longestStreak: Math.max(stats.longestStreak, currentStreak),
        lastActiveDate: today,
        dailyInteractions: 0,
    };
}

// Capped per day: chat and poll interactions cannot be verified server-side.
export function applyInteractions(stats, amount, dailyCap) {
    const requested = Math.floor(Number(amount));
    if (!Number.isFinite(requested) || requested <= 0) return stats;

    const remaining = Math.max(0, dailyCap - stats.dailyInteractions);
    const granted = Math.min(requested, remaining);
    if (granted === 0) return stats;

    return {
        ...stats,
        interactions: stats.interactions + granted,
        dailyInteractions: stats.dailyInteractions + granted,
    };
}
