import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Ask user to visit this URL
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});
console.log("Authorize this app by visiting this URL:\n", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nEnter the code from that page here: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("\nYour Gmail Refresh Token:\n", tokens.refresh_token);
  rl.close();
});
