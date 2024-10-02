import { test, expect, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**************************************
 * TESTING LOGIN PROCESS
 *
 * These tests simulate the user login process on
 * the data portal before interacting with it.
 * The goal is to measure response times and limit under different load conditions
 **************************************/

test("login", async ({ page }) => {
  await page.goto(process.env.CANDIG_URL!);
  await page.getByLabel("Username or email").click();
  await page.getByLabel("Username or email").fill(process.env.CANDIG_USERNAME!);
  await page.getByLabel("Password", { exact: true }).click();
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.CANDIG_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveTitle("CanDIG Data Portal");
  //  Wait for all the 6 graphs to load
  await expect(page.locator(".highcharts-loading-hidden")).toHaveCount(6, {
    timeout: 30000,
  });
});
