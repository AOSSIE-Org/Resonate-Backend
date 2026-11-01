import { Client, TablesDB, Query } from "node-appwrite";
import { throwIfMissing } from "./utils.js";
import {
    DEFAULT_BADGES,
    loadBadgeCatalogue,
    evaluateBadges,
    autoShowcase,
    pruneShowcase,
} from "./achievements.js";
import { fromRow, toRowData, utcToday } from "./stats.js";

const PAGE_SIZE = 100;

// Nightly fallback for the event-driven awards, and the thresholds seeder.
// Reconciles badge assignment only; counters have no history to recompute from.
export default async ({ res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "USER_DATA_DATABASE_ID",
        "USER_STATS_TABLE_ID",
        "THRESHOLDS_TABLE_ID",
    ]);

    const tables = new TablesDB(
        new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY)
    );

    try {
        const seeded = await seedThresholds(tables, { log, error });
        const catalogue = await loadBadgeCatalogue(tables, { log, error });
        const today = utcToday();

        let scanned = 0;
        let repaired = 0;
        let cursor = null;

        for (;;) {
            const queries = [Query.limit(PAGE_SIZE), Query.orderAsc("$id")];
            if (cursor) queries.push(Query.cursorAfter(cursor));

            const page = await tables.listRows({
                databaseId: process.env.USER_DATA_DATABASE_ID,
                tableId: process.env.USER_STATS_TABLE_ID,
                queries,
            });
            if (page.rows.length === 0) break;

            for (const row of page.rows) {
                scanned += 1;
                const before = fromRow(row);
                const after = reconcile(before, catalogue, today);
                if (JSON.stringify(toRowData(before)) === JSON.stringify(toRowData(after))) {
                    continue;
                }
                try {
                    await tables.updateRow({
                        databaseId: process.env.USER_DATA_DATABASE_ID,
                        tableId: process.env.USER_STATS_TABLE_ID,
                        rowId: row.$id,
                        data: toRowData(after),
                    });
                    repaired += 1;
                } catch (err) {
                    // One bad row must not abort the sweep.
                    error(`Could not reconcile ${row.$id}: ${err}`);
                }
            }

            cursor = page.rows[page.rows.length - 1].$id;
            if (page.rows.length < PAGE_SIZE) break;
        }

        log(`Reconciled ${repaired} of ${scanned} stats rows (seeded ${seeded} thresholds)`);
        return res.json({ scanned, repaired, seeded });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Reconciliation failed" }, 500);
    }
};

function reconcile(stats, catalogue, today) {
    const badges = evaluateBadges(stats, catalogue, stats.badges);
    // A stale allowance would silently stop a user's interactions counting.
    const dailyInteractions = stats.lastActiveDate === today ? stats.dailyInteractions : 0;
    let next = { ...stats, badges, dailyInteractions };
    next = { ...next, ...autoShowcase(next, stats.badges, catalogue) };
    return { ...next, ...pruneShowcase(next) };
}

// Writes the built-in catalogue into the thresholds table if it is empty.
async function seedThresholds(tables, { log, error }) {
    let existing;
    try {
        existing = await tables.listRows({
            databaseId: process.env.USER_DATA_DATABASE_ID,
            tableId: process.env.THRESHOLDS_TABLE_ID,
            queries: [Query.limit(1)],
        });
    } catch (err) {
        error("Could not read achievement_thresholds, skipping the seed: " + err);
        return 0;
    }
    if (existing.total > 0) return 0;

    let seeded = 0;
    for (const badge of DEFAULT_BADGES) {
        try {
            await tables.createRow({
                databaseId: process.env.USER_DATA_DATABASE_ID,
                tableId: process.env.THRESHOLDS_TABLE_ID,
                rowId: badge.badgeId,
                data: badge,
            });
            seeded += 1;
        } catch (err) {
            if (err.code !== 409) error(`Could not seed ${badge.badgeId}: ${err}`);
        }
    }
    log(`Seeded ${seeded} achievement thresholds`);
    return seeded;
}
