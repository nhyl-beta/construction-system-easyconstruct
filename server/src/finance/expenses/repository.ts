import { and, ilike, or, eq, desc } from "drizzle-orm";

import { db } from "../../db/connection.js";
import { expenses } from "../../db/schema/finance.js";

import type { CreateExpenseInput, ListExpensesQuery } from "../expenses/types.js";

export const expensesRepository = {
  async findMany({ query, category, page = 1, pageSize = 20 }: ListExpensesQuery) {
    const conditions = [];

    if (query) {
      conditions.push(
        or(ilike(expenses.vendor, `%${query}%`), ilike(expenses.id, `%${query}%`)),
      );
    }
    if (category && category !== "all") {
      conditions.push(eq(expenses.category, category));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(expenses)
      .where(whereClause)
      .orderBy(desc(expenses.submittedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return rows;
  },

  async create(input: CreateExpenseInput) {
    const id = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const [row] = await db
      .insert(expenses)
      .values({ id, ...input, amount: String(input.amount), status: "pending" })
      .returning();
    return row;
  },

  async updateStatus(id: string, status: "approved" | "rejected") {
    const [row] = await db
      .update(expenses)
      .set({ status })
      .where(eq(expenses.id, id))
      .returning();
    return row;
  },
};