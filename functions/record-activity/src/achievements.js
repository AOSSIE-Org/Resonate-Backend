import { Query } from "node-appwrite";

// Seeds achievement_thresholds and stands in when it cannot be read; the table
// is the source of truth once it has rows.
export const DEFAULT_BADGES = [
    { badgeId: "welcomer", category: "hosting", metric: "roomsHosted", threshold: 10, tier: 1 },
    { badgeId: "icon", category: "hosting", metric: "roomsHosted", threshold: 25, tier: 2 },
    { badgeId: "maestro", category: "hosting", metric: "roomsHosted", threshold: 50, tier: 3 },
    { badgeId: "guard", category: "moderation", metric: "roomsModerated", threshold: 10, tier: 1 },
    { badgeId: "sentinel", category: "moderation", metric: "roomsModerated", threshold: 25, tier: 2 },
    { badgeId: "warden", category: "moderation", metric: "roomsModerated", threshold: 50, tier: 3 },
    { badgeId: "echo", category: "echo", metric: "interactions", threshold: 50, tier: 1 },
    { badgeId: "rhythm", category: "rhythm", metric: "longestStreak", threshold: 7, tier: 1 },
    { badgeId: "core", category: "core", metric: "activeDays", threshold: 30, tier: 1 },
];

const CATEGORY_ORDER = ["hosting", "moderation", "echo", "rhythm", "core"];

export const MAX_PILL_BADGES = 2;

// Never throws: a broken read degrades to the built-in defaults.
export async function loadBadgeCatalogue(tables, { log, error }) {
    try {
        const result = await tables.listRows({
            databaseId: process.env.USER_DATA_DATABASE_ID,
            tableId: process.env.THRESHOLDS_TABLE_ID,
            queries: [Query.limit(100)],
        });
        const badges = result.rows
            .map((row) => ({
                badgeId: row.badgeId,
                category: row.category,
                metric: row.metric,
                threshold: Number(row.threshold),
                tier: Number(row.tier),
            }))
            .filter((b) => b.badgeId && b.category && b.metric && Number.isFinite(b.threshold));

        if (badges.length === 0) {
            log("achievement_thresholds is empty, using the built-in catalogue");
            return DEFAULT_BADGES;
        }
        return badges;
    } catch (err) {
        error("Could not read achievement_thresholds, using the built-in catalogue: " + err);
        return DEFAULT_BADGES;
    }
}

function metricValue(stats, metric) {
    const value = stats?.[metric];
    return Number.isFinite(value) ? value : 0;
}

function sortBadges(badges) {
    return badges.sort((a, b) => {
        const byCategory =
            CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        return byCategory !== 0 ? byCategory : a.threshold - b.threshold;
    });
}

// Highest eligible per category, unioned with what is held: never revokes, only
// upgrades. A badge dropped from the catalogue is the one exception.
export function evaluateBadges(stats, catalogue, held = []) {
    const byId = new Map(catalogue.map((b) => [b.badgeId, b]));
    const best = new Map();

    const consider = (badge) => {
        const current = best.get(badge.category);
        if (!current || badge.threshold > current.threshold) {
            best.set(badge.category, badge);
        }
    };

    for (const badgeId of held) {
        const badge = byId.get(badgeId);
        if (badge) consider(badge);
    }
    for (const badge of catalogue) {
        if (metricValue(stats, badge.metric) >= badge.threshold) consider(badge);
    }

    return sortBadges([...best.values()]).map((b) => b.badgeId);
}

export function newlyEarned(previous, next) {
    const before = new Set(previous ?? []);
    return (next ?? []).filter((badgeId) => !before.has(badgeId));
}

// A newly earned badge shows on the profile without being picked, and an upgrade
// takes the slot of the badge it replaced instead of emptying it.
export function autoShowcase(stats, previousBadges, catalogue) {
    const categoryOf = new Map(catalogue.map((b) => [b.badgeId, b.category]));
    const held = stats.badges ?? [];
    const displayed = [...(stats.displayedBadges ?? [])];
    let avatarBadge = stats.avatarBadge ?? null;

    for (const badgeId of newlyEarned(previousBadges, held)) {
        const category = categoryOf.get(badgeId);
        const replacedByThis = (id) =>
            categoryOf.get(id) === category && !held.includes(id);

        const slot = displayed.findIndex(replacedByThis);
        if (slot !== -1) {
            displayed[slot] = badgeId;
        } else if (displayed.length < MAX_PILL_BADGES && !displayed.includes(badgeId)) {
            displayed.push(badgeId);
        }

        if (avatarBadge !== null && replacedByThis(avatarBadge)) avatarBadge = badgeId;
    }

    return { displayedBadges: displayed, avatarBadge };
}

// Drops showcased badges no longer held and enforces the display caps.
export function pruneShowcase(stats) {
    const earned = new Set(stats.badges ?? []);
    const displayedBadges = (stats.displayedBadges ?? [])
        .filter((badgeId) => earned.has(badgeId))
        .slice(0, MAX_PILL_BADGES);
    const avatarBadge = earned.has(stats.avatarBadge) ? stats.avatarBadge : null;
    return { displayedBadges, avatarBadge };
}
