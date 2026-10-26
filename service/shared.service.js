import { eq , and} from "drizzle-orm";
import { db } from "../db/connect.js";


import { urlshortner } from "../db/urlshortner.js";
import { usersTable } from "../db/user.js";



export class sharedService{
    
 getAllUrls = async (userId) => {
      const returnedData = await db.select().from(urlshortner).where(eq(urlshortner.userId, userId));
      // console.log(returnedData)
    return returnedData;
    };

     async getUserById(userId)
      {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id,userId));
        return user;
      };

    async updateShortCodeById(id,userId, shortCode, url)
    {
        const [updated] = await db.update(urlshortner).set({shortCode,url})
        .where(and (eq(urlshortner.id,id),eq(urlshortner.userId,userId))).returning();

        if(typeof updated === undefined)
        {
            return {
                success: false,
                message: "cannot find the the Id requested to update"
            }
        }
        else{
            return {
                success: true,
                message: "updated Successfully",
                data: updated
            }
        }
    }



    async DeleteShortCodeById(id,userId)
    {
        const [deleted] = await db.delete(urlshortner)
        .where(and (eq(urlshortner.id,id),eq(urlshortner.userId,userId))).returning();

        if(typeof deleted === undefined)
        {
            return {
                success: false,
                message: "cannot find the the Id requested to update"
            }
        }
        else{
            return {
                success: true,
                message: "Deleted successfully",
                data: deleted
            }
        }
    }

    
}