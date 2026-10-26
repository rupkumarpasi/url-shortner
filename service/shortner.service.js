

    import { urlshortner } from "../db/urlshortner.js";
    import {db} from "../db/connect.js"
    import { eq, and } from "drizzle-orm";
    import {sharedService} from "./shared.service.js";


export class shortnerService extends sharedService{
  
    
     createUrl = async (links) => {
     try {
        const result = await db
          .insert(urlshortner)
          .values(links)
          .returning();
          
        return { success: true, data: result[0] };
      } catch (error) {
        // Check for PostgreSQL Unique Constraint Violation error code
        const dbError =  error.cause;
        if (dbError && dbError.code === '23505') {
          return { 
            success: false, 
            errorType: 'DUPLICATE_SHORTCODE', 
            message: 'This short code is already taken.' 
          };
        }
        
        // Throw any other unexpected database errors (e.g., connection lost)
        throw error;
      }
    };
    
    
    
     findByShortCode = async (shortCode,userId)=> {
    
    const data = await db.select().from(urlshortner).where
    ( and (eq(urlshortner.shortCode,shortCode),eq(urlshortner.userId,userId)));
    if(data.length<=0){
      return {
        success: false,
        message : `No data exists with shortcode ${shortCode}`
      }
    }
    else{
      return {
        success: true,
        data: data[0]
      }
    }
    }
    
    
     getShortCodeById=async (id,userId)=>
    {
    
    const data = await db.select().from(urlshortner).where(and(eq(urlshortner.id,id), eq(urlshortner.userId,userId)));
    if(data.length>0)
    {
      return {
        success: true,
        data: data
      }
    }
    else{
      return {
        success: false,
        message: "the shortcode with particular id doesnot exits, create it"
      }
    }
    }
}