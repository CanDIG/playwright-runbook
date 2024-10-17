import { test as setup, expect } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const authFile = path.join(__dirname, "../.auth/user.json");

const BASE_URL = 'http://candig.docker.internal:8080' // local
// const BASE_URL = 'http://candig-dev.hpc4healthlocal:8080' // dev
const CLIENT_ID = "local_candig"

setup("authenticate", async ({ page }) => {
  const response = await fetch(
    `${BASE_URL}/auth/realms/candig/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: process.env.CANDIG_USERNAME!,
        password: process.env.CANDIG_PASSWORD!,
        client_id: CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET!,
        grant_type: "password",
        scope: "openid",
      }),
    }
  );

  if (response.ok) {
    const { access_token, refresh_token } = await response.json();

    await page.context().addCookies([
      {
        name: "refresh_token",
        value: refresh_token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
      {
        name: "access_token",
        value: access_token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
    await page.context().storageState({ path: authFile });
  } else {
    throw new Error(`Failed to authenticate: ${response.status}`);
  }
});