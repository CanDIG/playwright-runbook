import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT, TIMEOUTS, DEBUG, FILE_PATHS } from './constants';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("Search page", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const config = {
      url: process.env.CANDIG_URL,
      username: process.env.CANDIG_USER2_USERNAME,
      password: process.env.CANDIG_USER2_PASSWORD,
    };

    context = await browser.newContext({
      viewport: { width: VIEWPORT.WIDTH, height: VIEWPORT.HEIGHT },
    });
  
    page = await context.newPage();
  
    try {
      await page.goto(config.url);
      await login(page, config.username, config.password);
  
      await page.getByRole('button', { name: 'Completeness Stats' }).click();
      await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE });
  
      if (DEBUG) {
        await page.screenshot({ path: FILE_PATHS.CLINICAL_SEARCH_SCREENSHOT, fullPage: true });
      }
    } catch (error) {
      console.error("Error during test setup:", error);
      throw error;
    }
  });

  //#region Helper Functions
  async function login(page, username, password) {
    await page.getByLabel("Username or email").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
  }

  async function testBarGraphHoverText({
    page,
    graphTitle,
    barIndex,
    expectedLabel,
    expectedValue,
  }) {
    // Locate the bar based on the graph title and bar index
    const selectedBar = await page
      .locator(`text="${graphTitle}"`)
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(barIndex);

    // Hover over the selected bar
    await selectedBar.hover();

    // Locate the tooltip relative to the graph title
    const tooltip = await page
      .locator(`text="${graphTitle}"`)
      .locator("..")
      .locator("..")
      .locator(".highcharts-tooltip")
      .nth(1);

    // Verify the tooltip text
    await expect(tooltip).toContainText(expectedLabel);
    await expect(tooltip).toContainText(expectedValue);
  }

  async function testStackedBarGraphHoverText({
    page,
    graphTitle,
    barIndex,
    expectedLabel,
    expectedValue,
  }) {
    // Locate the bar based on the graph title and bar index
    const selectedBar = await page
      .locator(`text="${graphTitle}"`)
      .locator("..")
      .locator(".highcharts-series-group > path")
      .nth(barIndex);

    // Hover over the selected bar
    await selectedBar.hover();

    // Locate the tooltip relative to the graph title
    const tooltip = await page
      .locator(`text="${graphTitle}"`)
      .locator("..")
      .locator(".highcharts-tooltip");

    // Verify the tooltip text
    await expect(tooltip).toContainText(expectedLabel);
    await expect(tooltip).toContainText(expectedValue);
  }

  async function testFieldLevelHoverText({
    page,
    graphTitle,
    barIndex,
    expectedLabel,
    expectedValue,
  }) {
    // Locate the bar based on the graph title and bar index
    const selectedBar = await page
      .getByText(graphTitle)
      .locator("..")
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(barIndex);

    // Hover over the selected bar
    await selectedBar.hover();

    // Locate the tooltip relative to the graph title
    const tooltip = await page
      .getByText(graphTitle)
      .locator("..")
      .locator("..")
      .locator(".highcharts-tooltip")
      .nth(0);

    // Verify the tooltip text
    await expect(tooltip).toContainText(expectedLabel);
    await expect(tooltip).toContainText(expectedValue);
  }
  //#endregion

  //#region Page Overview
  test.describe('Page overview', () => {
    test("number of nodes is 1", async () => {
      const textValue = await page
        .getByText("Nodes")
        .locator("..")
        .locator("h4");
      await expect(textValue).toHaveText("1");
    });

    test("number of patients is 84", async () => {
      const textValue = await page
        .getByText("Number of Patients", { exact: true })
        .locator("..")
        .locator("h4");
      await expect(textValue).toHaveText("84");
    });

    // Should we maybe update the input data so that this isn't 0?
    test("number of complete patients is 0", async () => {
      const textValue = await page
        .getByText("Number of Patients With Complete Data")
        .locator("..")
        .locator("h4");
      await expect(textValue).toHaveText("0");
    });

    test("number of provinces is 1", async () => {
      const textValue = await page
        .getByText("Provinces")
        .locator("..")
        .locator("h4");
      await expect(textValue).toHaveText("1");
    });
  });
  //#endregion

  //#region Clinical
  test("clinical graph", async () => {
    await page.mouse.move(0, 0);
    const clinicalGraph = await page
      .locator('text="Complete Clinical"')
      .locator("..")
      .last();
    await expect(clinicalGraph).toHaveScreenshot("clinical.png", {
      threshold: 0.01,
    });
  });
  //#endregion

  //#region Genomic
  test.describe('Genomic graph', () => {
    test("genomic graph", async () => {
      await page.mouse.move(0, 0);
      const genomicGraph = await page
        .locator('text="Complete Genomic"')
        .locator("..")
        .last();
      await expect(genomicGraph).toHaveScreenshot("genomic.png", {
        threshold: 0.01,
      });
    });

    test("synthetic dataset 1 is 6", async () => {
      await testStackedBarGraphHoverText({
        page,
        graphTitle: "Complete Genomic",
        barIndex: 1,
        expectedLabel: "SYNTH_01",
        expectedValue: "6",
      });
    });

    test("synthetic dataset 2 is 5", async () => {
      await testStackedBarGraphHoverText({
        page,
        graphTitle: "Complete Genomic",
        barIndex: 4,
        expectedLabel: "SYNTH_02",
        expectedValue: "5",
      });
    });
  });
  //#endregion

  //#region Field Level
  test.describe('Field-level Completeness', () => {
    const testCases = [
      { label: "Radiations: RADIATION THERAPY DOSAGE", value: "11%", barIndex: 0 },
    ];

    testCases.forEach(({ label, value, barIndex }) => {
      test(`Total number of patients in range ${label} is: ${value}`, async () => {

        const fieldLevel = await page
          .getByText("Field Level")
          .locator("..")
          .locator("..")
          .locator(".highcharts-series > path")
          .nth(0);
        console.log(fieldLevel);
        await expect(fieldLevel).toBeVisible();

        await testFieldLevelHoverText({
          page,
          graphTitle: "Field Level",
          barIndex,
          expectedLabel: label,
          expectedValue: value,
        });
      });
    });
  });
  //#endregion

  test.afterAll(async () => {
    // Cleanup after all tests
    await page.close();
    await context.close();
  });
});