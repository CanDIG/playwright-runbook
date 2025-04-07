import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT } from './constants';
import {
  login,
} from './helpers.ts';
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
    "30-39": { value: "11", barIndex: 0 },
    "40-49": { value: "24", barIndex: 1 },
    "50-59": { value: "31", barIndex: 2 },
    "null":  { value: "18", barIndex: 3 }
  },

  treatmentDistribution: {
    "Systemic therapy":         { value: "168", barIndex: 0 },
    "Surgery":                  { value: "92",  barIndex: 1 },
    "Radiation therapy":        { value: "77",  barIndex: 2 },
    "Targeted molecular therapy":{ value: "34",  barIndex: 3 },
    "Bone marrow transplant":   { value: "33",  barIndex: 4 },
    "Stem cell transplant":     { value: "30",  barIndex: 5 },
    "Other":                    { value: "24",  barIndex: 6 },
    "Photodynamic therapy":     { value: "18",  barIndex: 7 }
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
    await expect(page.locator(".highcharts-loading-hidden")).toHaveCount(6, {
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

  // ====================== Test: Genomic Distribution ======================
  /**
   * Verifies that UI_VALUES.genomicDistribution displays the correct counts.
   */
  test.describe("Complete Genomic", () => {
    const graphTitle = "Complete Genomic";
    test("graph screenshot", async () => {
      await page.mouse.move(0, 0);
      const graphElement = await page
        .locator(`text="${graphTitle}"`)
        .locator("..")
        .last();
      await expect(graphElement).toHaveScreenshot(
        "genomic-distribution-graph.png",
        {
          threshold: 0.05,
        }
      );
    });

    Object.entries(UI_VALUES.genomicDistribution).forEach(
      ([genomicLabel, genomicData]) => {
        if (
          genomicData &&
          typeof genomicData.barIndex === "number" &&
          genomicData.value
        ) {
          test(`tooltip for ${genomicLabel} (segment index ${genomicData.barIndex}) shows value ${genomicData.value}`, async () => {
            await testStackedBarGraphHoverText({
              page,
              graphTitle,
              barIndex: genomicData.barIndex,
              expectedLabel: genomicLabel,
              expectedValue: genomicData.value,
            });
          });
        } else {
          console.warn(
            `Skipping test generation for genomic dataset "${genomicLabel}". Invalid or incomplete data: ${JSON.stringify(
              genomicData
            )}`
          );
        }
      }
    );
  });

  // ====================== Other Tests  ======================

  test("clinical graph screenshot", async () => {
    await page.mouse.move(0, 0);
    const clinicalGraph = await page
      .locator('text="Complete Clinical"')
      .locator("..")
      .last();
    await expect(clinicalGraph).toHaveScreenshot("clinical.png", {
      threshold: 0.01,
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