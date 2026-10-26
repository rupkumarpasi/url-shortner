import { relations } from "drizzle-orm/_relations";
import { usersTable } from "./user.js";
import { urlshortner } from "./urlshortner.js";
import { boolean, integer, pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { param, sql } from "drizzle-orm";

export const sessionTable = pgTable("session",{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(()=>
        usersTable.id, {onDelete: "cascade"}
    ),
    valid: boolean().default(true),
    userAgent: text("user_agent"),
    ip: varchar({length: 255}),
     createdAt : timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate().notNull(),
});


export const emailVerficationTokenTable = pgTable("email_tokens",{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().references(()=>usersTable.id, {onDelete: 'cascade'}),
    token: varchar({length: 8}).notNull(),
    expiresAt: timestamp("expires_at").default(sql`NOW() + '1 day'`).notNull(),
  createdAt : timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate().notNull(),
});


export const forgotPasswordTokenTable = pgTable("forgot_token",{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().references(()=>usersTable.id,{onDelete: 'cascade'}),
    hashToken: varchar("hash_token",{length: 255}).notNull(),
    expiresAt: timestamp("expires_At").default(sql`Now() + '15 minutes'`).notNull(),
      createdAt : timestamp("created_at").defaultNow(),

});


export const providerEnum = pgEnum('provider',["google","github"])
export const oauthAccountsTable = pgTable("oauth_account",{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().references(()=>usersTable.id,{onDelete: 'cascade'}),
    provider: providerEnum("provider").notNull(),
    providerAccountId: varchar('provider_account_id',{length: 255}).notNull().unique(),
     createdAt : timestamp("created_at").defaultNow(),
})

export const userrelation = relations(usersTable,(params)=>({
    shortlink : params.many(urlshortner),
    session: params.many(sessionTable),
    emailToken: params.many(emailVerficationTokenTable),
    forgotToken: params.many(forgotPasswordTokenTable),
    oauthTable : params.one(oauthAccountsTable),
}));


export const shortlinkrelation = relations(urlshortner,({one})=>({
users: one(usersTable,{
    fields: [urlshortner.userId], // foreign key
    references: [usersTable.id],

})
}));

export const SessionRelationWithUser = relations(usersTable,({one})=>({
    sessionTable: one(usersTable,{
        fields: [sessionTable.userId],
        references: [usersTable.id],
    })
}))


export const emailTokenRelationWithUser = relations(usersTable,({one})=>({
emailVerficationTokenTable: one(usersTable,{
    fields: [emailVerficationTokenTable.userId], // foreign key
    references: [usersTable.id]
})
}));

export const forgotTokenRelationWithUser = relations(usersTable,({one})=>({
    forgotPasswordTokenTable: one(usersTable,{
        fields: [forgotPasswordTokenTable.userId],
        references: [usersTable.id]
    })
}))


export const oauthAccountsTableRelationWithUser = relations(usersTable,({one})=>({
    oauthAccountsTable: one(usersTable,{
        fields: [oauthAccountsTable.userId],
        references: [usersTable.id]
    })
}))