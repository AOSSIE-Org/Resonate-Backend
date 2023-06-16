import { Client, Databases } from "node-appwrite";

const client = new Client()
  .setEndpoint("http://localhost/v1") // Your Appwrite Endpoint
  .setProject("648c22fd861787e6f32c") // Your project ID
  .setKey(
    "f5218f502b78169d54748cd8bbf5504cbd634446d82a9d15beb1188395422137273cbd42e26dde2100c7b7acc8d9afc2d60ab516ba3bbda2354500596a4d5e7b129a2f9ed087b1dc27fd8192ae1cf3a915f5119f75443505fcabfae0f8d409d7c6ec74916444a2382c0268cd60b1f0b4641ff16a9e0503dd3445b424f325c1ba"
  ); // Your secret API key

const db = new Databases(client);

export { db };
