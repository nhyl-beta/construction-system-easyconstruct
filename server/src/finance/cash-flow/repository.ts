import { asc } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { cashFlowEntries } from "../../db/schema/finance.js";

export const cashFlowRepository = {
  async findRecent(months: number = 6) {
    const rows = await db
      .select()
      .from(cashFlowEntries)
      .orderBy(asc(cashFlowEntries.id))
      .limit(months);
    return rows;
  },
};
