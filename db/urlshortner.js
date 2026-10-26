
import {timestamp, integer, pgTable, varchar } from "drizzle-orm/pg-core"
import { usersTable } from "./user.js";

export const urlshortner = pgTable("url_shortner", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    shortCode : varchar({length: 255}).notNull(),
    url: varchar({length: 255}).notNull(),
    created_at : timestamp().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate().notNull(),
    userId : integer("user_id").notNull().references(()=>usersTable.id,{onDelete: 'cascade'})
});