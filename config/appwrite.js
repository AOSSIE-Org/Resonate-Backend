import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client()
  .setEndpoint(`${process.env.APPWRITE_ENDPOINT}`) // Your Appwrite Endpoint
  .setProject(`${process.env.APPWRITE_PROJECT_ID}`) // Your project ID
  .setKey(`${process.env.APPWRITE_SECRET_API_KEY}`); // Your secret API key

const db = new Databases(client);

export { db };
