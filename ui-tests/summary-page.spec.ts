import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("summary page", () => {
  let context;
  let page;

  /*
   * ========
   * Setup
   * ========
   */
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto(process.env.CANDIG_URL!);
    await page.getByLabel("Username or email").click();
    await page
      .getByLabel("Username or email")
      .fill(process.env.CANDIG_USERNAME!);
    await page.getByLabel("Password", { exact: true }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.CANDIG_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Make sure we can login
    await expect(page.getByRole("button", { name: "Summary" })).toBeVisible();

    // Wait for all the 6 graphs to load
    await expect(page.locator(".highcharts-loading-hidden")).toHaveCount(6, {
      timeout: 10000,
    });
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });
  /*
   * ===============
   * End of Setup
   * ===============
   */

  /*
   * ==================
   * Helper functions
   * ==================
   */
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

    // const baseLocator = page.locator(`text="${graphTitle}"`).locator("..");
    // const tooltip = await (tooltipType === 1
    //   ? baseLocator.locator("..").locator(".highcharts-tooltip").nth(1)
    //   : baseLocator.locator(".highcharts-tooltip"));

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
  /*
   * =========================
   * End of Helper function
   * =========================
   */

  /*
   * ======================
   * Test: Page Overview
   * ======================
   */
  test("number of patients is 84", async () => {
    const textValue = await page
      .locator("text=Number of Patients")
      .locator("..")
      .locator("h4");
    await expect(textValue).toHaveText("84");
  });

  test("number of cohorts is 4", async () => {
    const textValue = await page
      .locator("text=Cohorts")
      .locator("..")
      .locator("h4");
    await expect(textValue).toHaveText("4");
  });
  /*
   * ==============================
   * End of Test: Page overview
   * ==============================
   */

  /*
   * ===============================
   * Test: Age at First Diagnosis
   * ===============================
   */
  test("diagnosis graph", async () => {
    await page.mouse.move(0, 0);
    const diagnosisGraph = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..");
    await expect(diagnosisGraph).toHaveScreenshot("age.png", {
      threshold: 0.01,
    });
  });

  test("total number of patients in range 30-39 is: 12", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 0,
      expectedLabel: "30-39",
      expectedValue: "12",
    });
  });

  test("total number of patients in range 40-49 is: 27", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 1,
      expectedLabel: "40-49",
      expectedValue: "27",
    });
  });

  test("total number of patients in range 50-59 is: 32", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 2,
      expectedLabel: "50-59",
      expectedValue: "32",
    });
  });

  test("total number of patients in range null is: 13", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 3,
      expectedLabel: "null",
      expectedValue: "13",
    });
  });

  /*
   * ======================================
   * End of Test: Age at First Diagnosis
   * ======================================
   */

  /*
   * ==================
   * Test: Treatment
   * ==================
   */
  test("treatment graph", async () => {
    await page.mouse.move(0, 0);
    const treatmentGraph = await page
      .locator('text="Treatment Type Distribution"')
      .locator("..");
    await expect(treatmentGraph).toHaveScreenshot("treatment.png", {
      threshold: 0.01,
    });
  });

  test("systemic therapy is: 168", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 0,
      expectedLabel: "Systemic therapy",
      expectedValue: "168",
    });
  });

  test("surgery is: 99", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 1,
      expectedLabel: "Surgery",
      expectedValue: "99",
    });
  });

  test("radiation therapy is: 86", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 2,
      expectedLabel: "Radiation therapy",
      expectedValue: "86",
    });
  });

  test("stem cell transplant is: 31", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 3,
      expectedLabel: "Stem cell transplant",
      expectedValue: "31",
    });
  });

  test("bone marrow transplant is: 30", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 4,
      expectedLabel: "Bone marrow transplant",
      expectedValue: "30",
    });
  });

  test("other targeting molecular therapy is: 28", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 5,
      expectedLabel: "Other targeting molecular therapy",
      expectedValue: "28",
    });
  });

  test("photodynamic therapy is: 26", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 6,
      expectedLabel: "Photodynamic therapy",
      expectedValue: "26",
    });
  });

  /*
   * =========================
   * End of Test: Treatment
   * =========================
   */

  /*
   * =====================
   * Test: Primary Site
   * =====================
   */
  test("primary site graph", async () => {
    await page.mouse.move(0, 0);
    const primarySiteGraph = await page
      .locator('text="Tumour Primary Site Distribution"')
      .locator("..");
    await expect(primarySiteGraph).toHaveScreenshot("primary.png", {
      threshold: 0.01,
    });
  });

  test("null is: 26", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 0,
      expectedLabel: "null",
      expectedValue: "18",
    });
  });

  test("breast is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 1,
      expectedLabel: "Breast",
      expectedValue: "16",
    });
  });

  test("skin is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 2,
      expectedLabel: "Skin",
      expectedValue: "16",
    });
  });

  test("colon is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 3,
      expectedLabel: "Colon",
      expectedValue: "16",
    });
  });

  test("bronchus and lung is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 4,
      expectedLabel: "Bronchus and lung",
      expectedValue: "16",
    });
  });

  test("floor of mouth is: hidden since less than 5", async () => {
    const selectedBar = await page
      .locator(`text="Tumour Primary Site Distribution"`)
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(5);

    await expect(selectedBar).not.toBeVisible();

    const caption = await page
      .locator(`text="Tumour Primary Site Distribution"`)
      .locator("..")
      .locator("..")
      .locator("..")
      .locator(".highcharts-caption");

    await expect(caption).toContainText(
      "Totals do not include counts of less than 5"
    );
  });
  /*
   * ============================
   * End of Test: Primary Site
   * ============================
   */

  /*
   * ===============
   * Test: Cohort
   * ===============
   */
  test("cohort graph", async () => {
    await page.mouse.move(0, 0);
    const cohortGraph = await page
      .locator('text="Distribution of Cohort by Node"')
      .locator("..");
    await expect(cohortGraph).toHaveScreenshot("cohort.png", {
      threshold: 0.01,
    });
  });

  test("synthetic dataset 1 is 24", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 1,
      expectedLabel: "SYNTH_01",
      expectedValue: "24",
    });
  });

  test("synthetic dataset 2 is 20", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 2,
      expectedLabel: "SYNTH_02",
      expectedValue: "20",
    });
  });

  test("synthetic dataset 3 is 20", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 0,
      expectedLabel: "SYNTH_03",
      expectedValue: "20",
    });
  });

  test("synthetic dataset 4 is 20", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 3,
      expectedLabel: "SYNTH_04",
      expectedValue: "20",
    });
  });

  /*
   * ======================
   * End of Test: Cohort
   * ======================
   */

  /*
   * =================
   * Test: Clinical
   * =================
   */
  test("clinical graph", async () => {
    await page.mouse.move(0, 0);
    const clinicalGraph = await page
      .locator('text="Complete Clinical"')
      .locator("..");
    await expect(clinicalGraph).toHaveScreenshot("clinical.png", {
      threshold: 0.01,
    });
  });
  /*
   * ========================
   * End of Test: Clinical
   * ========================
   */

  /*
   * =================
   * Test: Genomic
   * =================
   */
  test("genomic graph", async () => {
    await page.mouse.move(0, 0);
    const genomicGraph = await page
      .locator('text="Complete Genomic"')
      .locator("..");
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
  /*
   * =======================
   * End of Test: Genomic
   * =======================
   */

  /*
   * ===============
   * Test: Footer
   * ===============
   */
  test("footer graph", async () => {
    await page.mouse.move(0, 0);
    const footer = page.locator("footer");
    await expect(footer).toHaveScreenshot("footer.png", { threshold: 0.01 });
  });

  test("open CanDIG GitHub link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "CanDIG GitHub" }).click();
    const newPage = await pagePromise;
    await expect(
      newPage.getByRole("heading", { name: "CanDIG" })
    ).toBeVisible();
    await expect(newPage.getByText("© 2024 GitHub, Inc.")).toBeVisible();
  });

  test("open CanDIG link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "CanDIG", exact: true }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle("CanDIG");
    await expect(newPage.getByText("Copyright © CanDIG")).toBeVisible();
  });

  /*
   * ======================
   * End of Test: Footer
   * ======================
   */

  /*
   * ==================
   * Test: Full page
   * ==================
   */
  test("full page graph", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot("full-page.png", {
      threshold: 0.01,
      fullPage: true,
    });
  });

  /*
   * =========================
   * End of Test: Full page
   * =========================
   */

  /*
   * ===============
   * Test: Logout
   * ===============
   */
  test("display logged in user", async () => {
    await page.getByRole("banner").getByRole("button").nth(4).click();
    await expect(page.getByText("site_admin@test.ca, LOCAL")).toBeVisible(); // assumed using site_admin
  });

  test("logout", async () => {
    await page.getByRole("banner").getByRole("button").nth(4).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" })
    ).toBeVisible();
  });

  test("login again", async () => {
    await page.goto(process.env.CANDIG_URL!);
    await page.getByLabel("Username or email").click();
    await page
      .getByLabel("Username or email")
      .fill(process.env.CANDIG_USERNAME!);
    await page.getByLabel("Password", { exact: true }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.CANDIG_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(
      page.getByRole("button", { name: "candig-logo" })
    ).toBeVisible();
  });
  /*
   * ======================
   * End of Test: Logout
   * ======================
   */
});
