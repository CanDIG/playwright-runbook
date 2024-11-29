import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT, TIMEOUTS, DEBUG, FILE_PATHS } from './constants';
import {
  login,
  clickSearchButton,
  selectPrimarySiteCheckbox,
} from './helpers.ui.ts';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("Patient page", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const config = {
      url: process.env.CANDIG_URL,
      username: process.env.CANDIG_USERNAME,
      password: process.env.CANDIG_PASSWORD,
    };

    context = await browser.newContext({
      viewport: { width: VIEWPORT.WIDTH, height: VIEWPORT.HEIGHT },
    });
  
    page = await context.newPage();
  
    try {
        await page.goto(config.url);
        await login(page, config.username, config.password);

        await page.getByRole('button', { name: 'Clinical & Genomic Search' }).click();
        await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE });

        await selectPrimarySiteCheckbox(page, 'Breast');
        await clickSearchButton(page);
        
    } catch (error) {
      console.error("Error during test setup:", error);
      throw error;
    }
  });

  /*
  * ==================
  * Tests
  * ==================
  */



  test.afterAll(async () => {
      // Cleanup after all tests
      await page.close();
      await context.close();
  });
});
