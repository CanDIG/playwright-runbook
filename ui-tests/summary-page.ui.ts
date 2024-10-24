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
    await expect(page).toHaveTitle("CanDIG Data Portal");

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
  test("number of nodes is 1", async () => {
    const textValue = await page
      .locator("text=Nodes")
      .locator("..")
      .locator("h4");
    await expect(textValue).toHaveText("1");
  });

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

  test("number of provinces is 1", async () => {
    const textValue = await page
      .locator("text=Provinces")
      .locator("..")
      .locator("h4");
    await expect(textValue).toHaveText("1");
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
      .locator("..")
      .last();
    await expect(diagnosisGraph).toHaveScreenshot("age.png", {
      threshold: 0.01,
    });
  });

  test("total number of patients in range 30-39 is: 11", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 0,
      expectedLabel: "30-39",
      expectedValue: "11",
    });
  });

  test("total number of patients in range 40-49 is: 24", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 1,
      expectedLabel: "40-49",
      expectedValue: "24",
    });
  });

  test("total number of patients in range 50-59 is: 31", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 2,
      expectedLabel: "50-59",
      expectedValue: "31",
    });
  });

  test("total number of patients in range null is: 18", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 3,
      expectedLabel: "null",
      expectedValue: "18",
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
      .locator("..")
      .last();
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

  test("surgery is: 92", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 1,
      expectedLabel: "Surgery",
      expectedValue: "92",
    });
  });

  test("radiation therapy is: 77", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 2,
      expectedLabel: "Radiation therapy",
      expectedValue: "77",
    });
  });

  test("targeted molecular therapy is: 34", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 3,
      expectedLabel: "Targeted molecular therapy",
      expectedValue: "34",
    });
  });

  test("bone marrow transplant is: 33", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 4,
      expectedLabel: "Bone marrow transplant",
      expectedValue: "33",
    });
  });

  test("stem cell transplant is: 30", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 5,
      expectedLabel: "Stem cell transplant",
      expectedValue: "30",
    });
  });

  test("other is: 24", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 6,
      expectedLabel: "Other",
      expectedValue: "24",
    });
  });

  test("photodynamic is: 18", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 7,
      expectedLabel: "Photodynamic therapy",
      expectedValue: "18",
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
      .locator("..")
      .last();
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

  test("floor of mouth is: hidden since less than 10", async () => {
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
      "Attention: Totals do not include counts of less than 10 from any node"
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
      .locator("..")
      .last();
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
      .locator("..")
      .last();
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
      .locator("..")
      .last();
    await expect(genomicGraph).toHaveScreenshot("genomic.png", {
      threshold: 0.01,
    });
  });

  // test("synthetic dataset 1 is 6", async () => {
  //   await testStackedBarGraphHoverText({
  //     page,
  //     graphTitle: "Complete Genomic",
  //     barIndex: 1,
  //     expectedLabel: "SYNTH_02",
  //     expectedValue: "6",
  //   });
  // });

  test("synthetic dataset 2 is 5", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Complete Genomic",
      barIndex: 1,
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
   * ======================
   * Test: External link
   * ======================
   */
  test("open CanDIG link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "CanDIG", exact: true }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle("CanDIG");
    await expect(newPage.getByText("Copyright © CanDIG")).toBeVisible();
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

  test("open version", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "CanDIG v4.1.0" }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle(/v4.1.0/);
    await expect(newPage.getByText("© 2024 GitHub, Inc.")).toBeVisible();
  });

  test("open TFRI link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "TFRI" }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle(/Home/);
    await expect(
      newPage.getByText("© 2019 THE TERRY FOX RESEARCH")
    ).toBeVisible();
  });

  test("open UHN link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "UHN DATA" }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle(/UHN DATA/);
    await expect(
      newPage.getByText("Copyright © 2024 The DATA Team")
    ).toBeVisible();
  });

  test("open BCGSC link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "BCGSC" }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle(/Genome Sciences Centre/);
    await expect(newPage.getByText(/Copyright © BC Cancer/)).toBeVisible();
  });
  test("open C3G link", async () => {
    const pagePromise = context.waitForEvent("page");
    await page.getByRole("link", { name: "C3G" }).click();
    const newPage = await pagePromise;
    await expect(newPage).toHaveTitle(
      "Canadian Centre for Computational Genomics – C3G Website"
    );
    await expect(newPage.getByText(/C3G All rights reserved/)).toBeVisible();
  });

  test("open logo link", async () => {
    await page.getByRole("link", { name: "CanDIG logo hyperlink" }).click();
    await expect(page).toHaveTitle("CanDIG Data Portal");
  });

  /*
   * =============================
   * End of Test: External link
   * =============================
   */

  /*
   * ===============
   * Test: Logout
   * ===============
   */
  test("display logged in user", async () => {
    await page.getByRole("banner").getByRole("button").nth(4).click();
    await expect(page.getByText("user2@test.ca, LOCAL")).toBeVisible();
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
