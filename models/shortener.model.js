import { readFile, writeFile } from "fs/promises";
import path from "path";
import { urlshortner } from "../db/urlshortner.js";
import {db} from "../db/connect.js"
import { eq, and } from "drizzle-orm";


const DATA_FILE = path.join("data", "links.json");

export const loadLinks = async (userId) => {
  // try {
  //   const data = await readFile(DATA_FILE, "utf-8");
  //   return JSON.parse(data);
  // } catch (error) {
  //   if (error.code === "ENOENT") {
  //     await writeFile(DATA_FILE, JSON.stringify({}));
  //     return {};
  //   }
  //   throw error;
  // }
  const returnedData = await db.select().from(urlshortner).where(eq(urlshortner.userId, userId));
  // console.log(returnedData)
return returnedData;
};

export const saveLinks = async (links) => {
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



export const findByShortCode = async (shortCode)=> {

const data = await db.select().from(urlshortner).where(eq(urlshortner.shortCode,shortCode));
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


export const getShortCodeById=async (id,userId)=>
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
    message: "Data fetched successfully"
  }
}
}