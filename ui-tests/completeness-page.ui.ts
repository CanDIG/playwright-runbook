import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT, TIMEOUTS, DEBUG, FILE_PATHS } from './constants';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = `${process.env.CANDIG_URL}`

test.describe("Completeness page", async () => {
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
      .locator(".highcharts-series > path")
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
    /* const selectedBar = await page
      .getByText(graphTitle)
      .locator("..")
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(barIndex); */
    const selectedBar = await page
      .getByText(graphTitle)
      .locator("..")
      .locator("..")
      .locator('.highcharts-root > .highcharts-series-group > .highcharts-series > path')
      .nth(barIndex)

    // Hover over the selected bar
    await expect(selectedBar).toBeVisible();
    /* if (barIndex > 5) {
      // Scroll the scrollbar a bit down
      // Doesn't seem to work under any circumstances with Highcharts
      await page.locator('.highcharts-scrollbar-thumb').hover({ force: true });
      await page.mouse.down();
      await page.mouse.move(page.mouse._x, page.mouse._y + 100);
      await page.mouse.up();
    } */
    // NOTE: force: true is needed because highcharts intercepts the normal hover event
    await selectedBar.hover({ force: true });

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

  async function testFieldLevel(page, testCases) {
    // Sort the percentages
    testCases.sort((a, b) => a.label.localeCompare(b.label));
    testCases.sort((a, b) => a.pct - b.pct);
    testCases.forEach((datum, index) => {
      datum.value = `${datum.pct}%`;
      datum.barIndex = index;
    });
    for (const {label, value, barIndex } of testCases) {
      // DEBUG: Currently there is no way to scroll this particular graph
      // So, we'll do only one page of results
      if (barIndex > 10) {
        break;
      }
      await testFieldLevelHoverText({
        page,
        graphTitle: "Field Level",
        barIndex,
        expectedLabel: label,
        expectedValue: value,
      });
    }
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
  test('Field-level Completeness', async ({ request }) => {
    async function getEndpoint(page, endpoint) {
      const { cookies } = await page.context().storageState();
      const sessionCookie = cookies.find(cookie => cookie.name === "session_id");
      let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionCookie.value}`,
      };
      const url = `${BASE_URL}/${endpoint}`;
      return fetch(url, { headers });
    }

    // Wait for the page to finish loading the field level completeness
    await expect(page.getByText("Field Level")
      .locator("..")
      .locator(".."))
      .toHaveText(/.+Radiations.+/i);
    const fieldLevelGraph = await page
      .getByText("Field Level")
      .locator("..")
      .locator("..")
      .last();
    await expect(fieldLevelGraph).toHaveScreenshot("fieldLevel.png", {
      threshold: 0.01,
    });

    // Query the discovery/programs endpoint
    const response = await getEndpoint(page, "query/discovery/programs");
    await response.json().then(async (data) => {
      let lastButtonText = /All programs/;
      const allCases = {};
      for (const program of data.programs) {
        const programButton = await page.getByText(lastButtonText).first();
        // 1: Switch the display to being this particular program
        await programButton.click();
        lastButtonText = new RegExp(`.+ ${program.program_id}`, "i");
        await page.getByRole('option', { name: lastButtonText }).click();

        const completenessData = program.metadata.required_but_missing;
        const categories = Object.keys(completenessData);
        const testCases = categories.map((category) => {
          return Object.keys(completenessData[category]).map((key) => {
            const label = `${category}/${key}`;
            const pct = Math.round((1 - (completenessData[category][key]['missing'] / completenessData[category][key]['total'])) * 100);

            // Fill out the allCases for the final round
            if (label in allCases) {
              allCases[label]['missing'] += completenessData[category][key]['missing'];
              allCases[label]['total'] += completenessData[category][key]['total'];
            } else {
              allCases[label] = {
                'missing': completenessData[category][key]['missing'],
                'total': completenessData[category][key]['total']
              }
            }
            return { label, pct, value: 'NA', barIndex: 0 };
          });
        }).flat(1);

        await testFieldLevel(page, testCases);
      }

      // Do one final round for the final cases
      await page.getByText(lastButtonText).first().click();
      await page.getByRole('option', { name: "All programs" }).click();
      await page.waitForTimeout(1000);

      const allCasesList = Object.keys(allCases).map((thisCase) => {
        return ({
          label: thisCase,
          pct: Math.round((1 - (allCases[thisCase].missing / allCases[thisCase].total)) * 100),
          value: 'NA',
          barIndex: 0
        });
      });
      await testFieldLevel(page, allCasesList);
    });
  });
  //#endregion

  test.afterAll(async () => {
    // Cleanup after all tests
    await page.close();
    await context.close();
  });
});