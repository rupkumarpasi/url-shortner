

import argon2 from "argon2";
import crypto from "node:crypto";


export async function hashPassword(password)
{
    return await argon2.hash(password);

}

export async function verifyPassword(hashedPassword,password)
{
    try{
    return await argon2.verify(hashedPassword,password);
      } catch (error) {
        // Instead of crashing, safely log the error for yourself and return false
        console.error("Password verification error (malformed hash):", error.message);
        return false; 
    }
}


export const generateTokenHash = (plainToken) => {
    return crypto
        .createHash('sha256') // Deterministic! Same input = same output every time.
        .update(plainToken)
        .digest('hex');
};