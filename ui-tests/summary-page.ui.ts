import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT } from "./constants";
import { login, testBarGraphHoverText, testStackedBarGraphHoverText, fieldLevelCompletenessTest } from "./helpers.ts";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = `${process.env.CANDIG_URL}`
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
    provinces: "1",
  },

  ageAtFirstDiagnosis: {
    "30-39": { value: null, barIndex: 0 },
    "40-49": { value: "31", barIndex: 1 },
    "50-59": { value: "32", barIndex: 2 },
    null: { value: "13", barIndex: 3 },
  },

  treatmentDistribution: {
    "Systemic therapy": { value: "168", barIndex: 0 },
    Surgery: { value: "99", barIndex: 1 },
    "Radiation therapy": { value: "81", barIndex: 2 },
    "Photodynamic therapy": { value: "42", barIndex: 3 },
    Other: { value: "35", barIndex: 4 },
    "Stem cell transplant": { value: "34", barIndex: 5 },
    "Targeted molecular therapy": { value: "31", barIndex: 6 },
    "Bone marrow transplant": { value: "30", barIndex: 7 },
  },

  primarySiteDistribution: {
    null: { value: "18", barIndex: 0 },
    Breast: { value: "16", barIndex: 1 },
    Skin: { value: "16", barIndex: 2 },
    Colon: { value: "16", barIndex: 3 },
    "Bronchus and lung": { value: "16", barIndex: 4 },
    "Floor of mouth": { value: null, barIndex: 5 },
  },

  programDistribution: {
    SYNTH_01: { label: "SYNTH_01", value: "24", barIndex: 0 },
    SYNTH_02: { label: "SYNTH_02", value: "20", barIndex: 2 },
    SYNTH_03: { label: "SYNTH_03", value: "20", barIndex: 1 },
    SYNTH_04: { label: "SYNTH_04", value: "20", barIndex: 3 },
  },

  completeClinical: {
    SYNTH_01: { value: "2", barIndex: 0 },
  },

  completeGenomic: {
    SYNTH_01: { value: "6", barIndex: 1 },
    "SYNTH_01 (transcriptomes)": { value: "1", barIndex: 2 },
    SYNTH_02: { value: "5", barIndex: 4 },
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
        if (!ageData || typeof ageData.barIndex !== "number") {
          console.warn(
            `Skipping test generation for age range "${ageLabel}". Invalid or incomplete data (missing barIndex): ${JSON.stringify(
              ageData
            )}`
          );
          return;
        }

        if (ageData.value === null) {
          test(`bar for age range ${ageLabel} exists at index ${ageData.barIndex} (no value check)`, async () => {
            const selectedBar = await page
              .locator(`text="${graphTitle}"`)
              .locator("..")
              .locator(".highcharts-series > path")
              .nth(ageData.barIndex);

            await expect(selectedBar).not.toBeVisible();
          });
        } else if (ageData.value !== null) {
          test(`tooltip for age range ${ageLabel} (bar index ${ageData.barIndex}) shows value ${ageData.value}`, async () => {
            await testBarGraphHoverText({
              page,
              graphTitle,
              barIndex: ageData.barIndex,
              expectedLabel: ageLabel,
              expectedValue: ageData.value,
            });
          });
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
        if (!treatmentData || typeof treatmentData.barIndex !== "number") {
          console.warn(
            `Skipping test generation for treatment type "${treatmentLabel}". Invalid or incomplete data (missing barIndex): ${JSON.stringify(
              treatmentData
            )}`
          );
          return;
        }

        if (treatmentData.value === null) {
          test(`bar for ${treatmentLabel} exists at index ${treatmentData.barIndex} (no value check)`, async () => {
            const selectedBar = await page
              .locator(`text="${graphTitle}"`)
              .locator("..")
              .locator(".highcharts-series > path")
              .nth(treatmentData.barIndex);

            await expect(selectedBar).not.toBeVisible();
          });
        } else if (treatmentData.value !== null) {
          test(`tooltip for ${treatmentLabel} (bar index ${treatmentData.barIndex}) shows value ${treatmentData.value}`, async () => {
            await testBarGraphHoverText({
              page,
              graphTitle,
              barIndex: treatmentData.barIndex,
              expectedLabel: treatmentLabel,
              expectedValue: treatmentData.value,
            });
          });
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

  test.describe("Field Level Completeness", () => {
    const graphTitle = "Field Level Completeness";

    test("graph screenshot", async () => {
      await page.mouse.move(0, 0);
      const graphElement = await page
        .locator(`text="${graphTitle}"`)
        .locator("..")
        .locator("..");
      await expect(graphElement).toHaveScreenshot(
        "field-level-completeness-graph.png",
        {
          threshold: 0.05,
        }
      );

      await fieldLevelCompletenessTest(page, BASE_URL);
    });
  });

  // ====================== Other Tests  ======================
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
