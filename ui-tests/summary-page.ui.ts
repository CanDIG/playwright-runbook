import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT } from './constants';
import {
  login,
} from './helpers.ts';
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = `${process.env.CANDIG_URL}`;

/*
 * ======================
 * Editable test data for the current dataset
 * ======================
 */
const UI_VALUES = {
  pageOverview: {
    nodes: "1",
    patients: "84",
    programs: "4",
    provinces: "1"
  },

  ageAtFirstDiagnosis: {
    // "30-39": { value: "11", barIndex: 0 }, // Gets censored now
    "40-49": { value: "31", barIndex: 1 },
    "50-59": { value: "32", barIndex: 2 },
    "null":  { value: "13", barIndex: 3 }
  },

  treatmentDistribution: {
    "Systemic therapy":         { value: "168", barIndex: 0 },
    "Surgery":                  { value: "99",  barIndex: 1 },
    "Radiation therapy":        { value: "81",  barIndex: 2 },
    "Photodynamic therapy":     { value: "42",  barIndex: 3 },
    "Other":                    { value: "35",  barIndex: 4 },
    "Stem cell transplant":     { value: "34",  barIndex: 5 },
    "Targeted molecular therapy":{ value: "31",  barIndex: 6 },
    "Bone marrow transplant":   { value: "30",  barIndex: 7 }
  },

  primarySiteDistribution: {
    "null":              { value: "18", barIndex: 0 },
    "Breast":            { value: "16", barIndex: 1 },
    "Skin":              { value: "16", barIndex: 2 },
    "Colon":             { value: "16", barIndex: 3 },
    "Bronchus and lung": { value: "16", barIndex: 4 },
    "Floor of mouth":    { value: null, barIndex: 5 }
  },

  programDistribution: {
    "SYNTH_01": { label: "SYNTH_01", value: "24", barIndex: 0 },
    "SYNTH_02": { label: "SYNTH_02", value: "20", barIndex: 2 },
    "SYNTH_03": { label: "SYNTH_03", value: "20", barIndex: 1 },
    "SYNTH_04": { label: "SYNTH_04", value: "20", barIndex: 3 },
  },

  genomicDistribution: {
    "SYNTH_01": { value: "6", barIndex: 1 },
    "SYNTH_02": { value: "5", barIndex: 4 }
}
};
/*
 * =============================
 * End of Editable test data
 * =============================
 */


test.describe("Summary Page Tests", () => {
  let context;
  let page;

  // ====================== Setup ======================
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: VIEWPORT.WIDTH, height: VIEWPORT.HEIGHT },
    });
    page = await context.newPage();
    await page.goto(process.env.CANDIG_URL!);
    await login(page, process.env.CANDIG_USERNAME, process.env.CANDIG_PASSWORD);
    await expect(page).toHaveTitle("CanDIG Data Portal");
    await expect(page.locator(".highcharts-loading-hidden")).toHaveCount(5, {
      timeout: 15000,
    });
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });
  // ====================== End of Setup ======================

  // ====================== Helper Functions ======================
  async function testBarGraphHoverText({
    page,
    graphTitle,
    barIndex,
    expectedLabel,
    expectedValue,
  }) {
    const selectedBar = await page
      .locator("text")
      .filter({ hasText: `${graphTitle}` })
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(barIndex);

    await selectedBar.hover();

    const tooltip = await page
      .locator("text")
      .filter({ hasText: `${graphTitle}` })
      .locator("..")
      .locator("..")
      .locator(".highcharts-tooltip")
      .nth(1);

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
    const selectedBar = await page
      .locator("text")
      .filter({ hasText: `${graphTitle}` })
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(barIndex);

    await selectedBar.hover();

    const tooltip = await page
      .locator("text")
      .filter({ hasText: `${graphTitle}` })
      .locator("..")
      .locator(".highcharts-tooltip");

    await expect(tooltip).toContainText(expectedLabel);
    await expect(tooltip).toContainText(expectedValue);
  }
  // ====================== End of Helper Functions ======================

  // ====================== Test: Page Overview ======================
  /**
   * Verifies that UI_VALUES.pageOverview displays the correct counts.
   */
  test.describe("Page Overview", () => {
    Object.entries(UI_VALUES.pageOverview).forEach(([key, expectedValue]) => {
      const titleCaseKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      const locatorText =
        titleCaseKey === "Patients" ? "Number of Patients" : titleCaseKey;
      test(`displays correct count for ${titleCaseKey}`, async () => {
        const textValue = await page
          .locator(`text=${locatorText}`)
          .locator("..")
          .locator("h4");
        await expect(textValue).toHaveText(expectedValue);
      });
    });
  });

  // ====================== Test: Age at First Diagnosis ======================
  /**
   * Verifies that UI_VALUES.ageAtFirstDiagnosis displays the correct counts.
   */
  test.describe("Age at First Diagnosis", () => {
    const graphTitle = "Age at First Diagnosis";

    test("graph screenshot", async () => {
      await page.mouse.move(0, 0);
      const diagnosisGraph = await page
        .locator(`text="${graphTitle}"`)
        .locator("..")
        .last();
      await expect(diagnosisGraph).toHaveScreenshot("age-diagnosis-graph.png", {
        threshold: 0.05,
      });
    });

    Object.entries(UI_VALUES.ageAtFirstDiagnosis).forEach(
      ([ageLabel, ageData]) => {
        if (ageData && typeof ageData.barIndex === "number" && ageData.value) {
          test(`tooltip for age range ${ageLabel} (bar index ${ageData.barIndex}) shows value ${ageData.value}`, async () => {
            await testBarGraphHoverText({
              page,
              graphTitle,
              barIndex: ageData.barIndex,
              expectedLabel: ageLabel,
              expectedValue: ageData.value,
            });
          });
        } else {
          console.warn(
            `Skipping test generation for age range "${ageLabel}". Invalid data: ${JSON.stringify(
              ageData
            )}`
          );
        }
      }
    );
  });

  // ====================== Test: Treatment ======================
  /**
   * Verifies that UI_VALUES.treatmentDistribution displays the correct counts.
   */
  test.describe("Treatment Type Distribution", () => {
    const graphTitle = "Treatment Type Distribution";

    test("graph screenshot", async () => {
      await page.mouse.move(0, 0);
      const graphElement = await page
        .locator(`text="${graphTitle}"`)
        .locator("..")
        .last();
      await expect(graphElement).toHaveScreenshot(
        "treatment-distribution-graph.png",
        {
          threshold: 0.05,
        }
      );
    });

    Object.entries(UI_VALUES.treatmentDistribution).forEach(
      ([treatmentLabel, treatmentData]) => {
        if (
          treatmentData &&
          typeof treatmentData.barIndex === "number" &&
          treatmentData.value
        ) {
          test(`tooltip for ${treatmentLabel} (bar index ${treatmentData.barIndex}) shows value ${treatmentData.value}`, async () => {
            await testBarGraphHoverText({
              page,
              graphTitle,
              barIndex: treatmentData.barIndex,
              expectedLabel: treatmentLabel,
              expectedValue: treatmentData.value,
            });
          });
        } else {
          console.warn(
            `Skipping test generation for treatment type "${treatmentLabel}". Invalid data: ${JSON.stringify(
              treatmentData
            )}`
          );
        }
      }
    );
  });

  // ====================== Test: Primary Site ======================
  /**
   * Verifies that UI_VALUES.primarySiteDistribution displays the correct counts.
   */
  test.describe("Tumour Primary Site Distribution", () => {
    const graphTitle = "Tumour Primary Site Distribution";

    test("graph screenshot", async () => {
      await page.mouse.move(0, 0);
      const graphElement = await page
        .locator(`text="${graphTitle}"`)
        .locator("..")
        .last();
      await expect(graphElement).toHaveScreenshot(
        "primary-site-distribution-graph.png",
        {
          threshold: 0.05,
        }
      );
    });

    Object.entries(UI_VALUES.primarySiteDistribution).forEach(
      ([siteLabel, siteData]) => {
        if (!siteData || typeof siteData.barIndex !== "number") {
          console.warn(
            `Skipping test generation for primary site "${siteLabel}". Invalid or incomplete data (missing barIndex): ${JSON.stringify(
              siteData
            )}`
          );
          return;
        }

        if (siteData.value === null) {
          test(`bar for ${siteLabel} exists at index ${siteData.barIndex} (no value check)`, async () => {
            const selectedBar = await page
              .locator(`text="${graphTitle}"`)
              .locator("..")
              .locator(".highcharts-series > path")
              .nth(siteData.barIndex);

            await expect(selectedBar).not.toBeVisible();
          });
        } else if (siteData.value !== null) {
          test(`tooltip for ${siteLabel} (bar index ${siteData.barIndex}) shows value ${siteData.value}`, async () => {
            await testBarGraphHoverText({
              page,
              graphTitle,
              barIndex: siteData.barIndex,
              expectedLabel: siteLabel,
              expectedValue: siteData.value,
            });
          });
        }
      }
    );
  });

  // ====================== Test: Program Distribution ======================
  /**
   * Verifies that UI_VALUES.programDistribution displays the correct counts.
   */
  test.describe("Distribution of Program by Node", () => {
    const graphTitle = "Distribution of Program by Node";

    test("graph screenshot", async () => {
      await page.mouse.move(0, 0);
      const graphElement = await page
        .locator(`text="${graphTitle}"`)
        .locator("..")
        .last();
      await expect(graphElement).toHaveScreenshot(
        "program-distribution-graph.png",
        {
          threshold: 0.05,
        }
      );
    });

    Object.entries(UI_VALUES.programDistribution).forEach(
      ([programKey, programData]) => {
        if (
          programData &&
          typeof programData.barIndex === "number" &&
          programData.label &&
          programData.value
        ) {
          test(`tooltip for program ${programData.label} (segment index ${programData.barIndex}) shows value ${programData.value}`, async () => {
            await testStackedBarGraphHoverText({
              page,
              graphTitle,
              barIndex: programData.barIndex,
              expectedLabel: programData.label,
              expectedValue: programData.value,
            });
          });
        } else {
          console.warn(
            `Skipping test generation for program key "${programKey}". Invalid or incomplete data: ${JSON.stringify(
              programData
            )}`
          );
        }
      }
    );
  });

  // ====================== Other Tests  ======================
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
      .locator('.highcharts-root > .highcharts-series-group > .highcharts-series > path')
      .nth(barIndex)

    // Hover over the selected bar
    await expect(selectedBar).toBeVisible();
    // Doesn't seem to work under any circumstances with Highcharts
    /* if (barIndex > 5) {
      // Scroll the scrollbar a bit down
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

  async function testFieldLevel(page, testCases, programName) {

    const fieldLevelGraph = await page
      .getByText("Field Level")
      .locator("..")
      .locator("..")
      .last();

    await expect(fieldLevelGraph).toHaveScreenshot(`FieldLevel-${programName}.png`, {
      maxDiffPixelRatio: 0.05,
    });
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

        await testFieldLevel(page, testCases, program.program_id);
      }

      // Do one final round for the "all programs" option
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
      await testFieldLevel(page, allCasesList, 'allprograms');
    });
  });

  test("footer screenshot", async () => {
    await page.mouse.move(0, 0);
    const footer = page.locator("footer");
    await expect(footer).toHaveScreenshot("footer.png", { threshold: 0.01 });
  });

  test.describe("External link checks", () => {
    const linksToTest = [
      {
        name: "CanDIG",
        exact: true,
        expectedDomain: "https://www.distributedgenomics.ca/",
      },
      { name: "CanDIG GitHub", expectedDomain: "https://github.com/CanDIG" },
      { name: "TFRI", expectedDomain: "https://www.tfri.ca/" },
      { name: "UHN DATA", expectedDomain: "https://uhndata.io/" },
      { name: "BCGSC", expectedDomain: "https://www.bcgsc.ca/" },
      { name: "C3G", expectedDomain: "https://computationalgenomics.ca/" },
    ];

    linksToTest.forEach((linkInfo) => {
      test(`link "${linkInfo.name}" points to a valid URL`, async () => {
        const linkLocator = page.getByRole("link", {
          name: linkInfo.name,
          exact: linkInfo.exact ?? false,
        });
        const linkUrl = await linkLocator.getAttribute("href");
        expect(linkUrl).toBeTruthy();
        expect(linkUrl).toContain(linkInfo.expectedDomain);
      });
    });
  });

  // --- Logout Tests ---
  test.describe("Logout", () => {
    test("display logged in user", async () => {
      await page.getByRole("banner").getByRole("button").nth(4).click();
      await expect(page.getByText(process.env.CANDIG_USERNAME!)).toBeVisible();
      await page.locator("body").click({ position: { x: 0, y: 0 } });
    });

    test("logout", async () => {
      await page.getByRole("banner").getByRole("button").nth(4).click();
      await page.getByRole("link", { name: "Logout" }).click();
      await expect(
        page.getByRole("heading", { name: "Sign in to your account" })
      ).toBeVisible();
    });
  });
});