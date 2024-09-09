import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("summary page", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    // Setup context and login once
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto(process.env.CANDIG_URL!);
    await page.getByLabel("Username or email").click();
    await page.getByLabel("Username or email").fill(process.env.USERNAME!);
    await page.getByLabel("Password", { exact: true }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Wait for all the 6 graphs to load
    await expect(page.locator(".highcharts-loading-hidden")).toHaveCount(6, {
      timeout: 10000,
    });
  });

  test.afterAll(async () => {
    // Cleanup after all tests
    await page.close();
    await context.close();
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

  test("full page graph", async () => {
    await expect(page).toHaveScreenshot("full-page.png", {
      threshold: 0.01,
      fullPage: true,
    });
  });

  /* test Age at First Diagnosis start */
  test("age at first diagnosis graph", async () => {
    const diagnosisGraph = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..");
    await expect(diagnosisGraph).toHaveScreenshot("age.png", {
      threshold: 0.01,
    });
  });

  test("total number of patients in range 30-39 is: 12", async () => {
    const selectedBar = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..")
      .locator(".highcharts-series > path")
      .first();
    await selectedBar.hover();
    const tooltip = await page.locator(".highcharts-tooltip").nth(1);
    await expect(tooltip).toHaveText(
      " 30-39 - 12 (14.29%) total number of patients"
    );
  });

  test("total number of patients in range 40-49 is: 27", async () => {
    const selectedBar = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(1);
    await selectedBar.hover();
    const tooltip = await page.locator(".highcharts-tooltip").nth(1);
    await expect(tooltip).toHaveText(
      " 40-49 - 27 (32.14%) total number of patients"
    );
  });

  test("total number of patients in range 50-59 is: 32", async () => {
    const selectedBar = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(2);
    await selectedBar.hover();
    const tooltip = await page.locator(".highcharts-tooltip").nth(1);
    await expect(tooltip).toHaveText(
      " 50-59 - 32 (38.10%) total number of patients"
    );
  });

  test("total number of patients in range null is: 13", async () => {
    const selectedBar = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..")
      .locator(".highcharts-series > path")
      .nth(3);
    await selectedBar.hover();
    const tooltip = await page.locator(".highcharts-tooltip").nth(1);
    await expect(tooltip).toHaveText(
      " null - 13 (15.48%) total number of patients"
    );
    await page.mouse.move(0, 0);
  });
  /* test Age at First Diagnosis end */

  test("diagnosis graph", async () => {
    const diagnosisGraph = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..");
    await expect(diagnosisGraph).toHaveScreenshot("age.png", {
      threshold: 0.01,
    });
  });

  test("treatment graph", async () => {
    const treatmentGraph = await page
      .locator('text="Treatment Type Distribution"')
      .locator("..");
    await expect(treatmentGraph).toHaveScreenshot("treatment.png", {
      threshold: 0.01,
    });
  });

  test("primary site graph", async () => {
    const primarySiteGraph = await page
      .locator('text="Tumour Primary Site Distribution"')
      .locator("..");
    await expect(primarySiteGraph).toHaveScreenshot("primary.png", {
      threshold: 0.01,
    });
  });

  test("cohort graph", async () => {
    const cohortGraph = await page
      .locator('text="Distribution of Cohort by Node"')
      .locator("..");
    await expect(cohortGraph).toHaveScreenshot("cohort.png", {
      threshold: 0.01,
    });
  });

  test("clinical graph", async () => {
    const clinicalGraph = await page
      .locator('text="Complete Clinical"')
      .locator("..");
    await expect(clinicalGraph).toHaveScreenshot("clinical.png", {
      threshold: 0.01,
    });
  });

  test("genomic graph", async () => {
    const genomicGraph = await page
      .locator('text="Complete Genomic"')
      .locator("..");
    await expect(genomicGraph).toHaveScreenshot("genomic.png", {
      threshold: 0.01,
    });
  });

  test("footer graph", async () => {
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

  test("logout", async () => {
    await page.getByRole("banner").getByRole("button").nth(4).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" })
    ).toBeVisible();
  });
});
