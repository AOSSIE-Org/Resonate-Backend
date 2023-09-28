import { Client, Account } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const verifyAppwriteToken = async (authorizationHeader) => {
  try {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const appwriteToken = authorizationHeader.substring("Bearer ".length);
    console.log(appwriteToken);

    // Init SDK
    const client = new Client();

    const account = new Account(client);

    client
      .setEndpoint(`${process.env.APPWRITE_ENDPOINT}`) // Your API Endpoint
      .setProject(`${process.env.APPWRITE_PROJECT_ID}`) // Your project ID
      .setJWT(appwriteToken); // Received secret JSON Web Token

    const tokenUser = await account.get();
    console.log(tokenUser);
    return tokenUser;
  } catch (e) {
    console.log("Invalid Token");
    return null;
  }
};

export { verifyAppwriteToken };
