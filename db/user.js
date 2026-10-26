import { integer,boolean, varchar ,timestamp, pgTable} from "drizzle-orm/pg-core";


export const usersTable = pgTable("users",{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    username : varchar({length: 255}).notNull(),
    avatar: varchar({length:255}),
    email : varchar({length: 255}).unique().notNull(),
    isEmailValid: boolean("is_email_valid").default(false).notNull(),
    password : varchar({length:255}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate().notNull()
})