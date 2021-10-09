import { Schema, model, Document } from "mongoose";

export interface User {
    first_name: string,
    last_name: string,
    email: string,
    gender: string,
    city: string,
    ip_address: string
}

export interface UserDoc extends Document, User {}; // type that queries of UserModel will return

const userSchema = new Schema<User>({
    "first_name": { type: String , required: true },
    "last_name": { type: String , required: true },
    "email": { type: String , required: true },
    "gender": { type: String , required: true },
    "city": { type: String , required: true },
    "ip_address": { type: String , required: true },
});

export const UserModel = model<User>('User', userSchema);