import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("summary page", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test.
    await page.goto(process.env.CANDIG_URL!);
    await page.getByLabel("Username or email").click();
    await page.getByLabel("Username or email").fill(process.env.USERNAME!);
    await page.getByLabel("Password", { exact: true }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
  });

  test("page loading", async ({ page }) => {
    // wait for all the 6 graphs to load
    await expect(page.locator(".highcharts-loading-hidden")).toHaveCount(6);

    // test Provinces number is 84
    // Locate the element by text "Provinces" and get its sibling h4 value
    const provinceValue = await page
      .locator("text=Number of Patients")
      .locator("..")
      .locator("h4");
    await expect(provinceValue).toHaveText("84");

    // test Cohorts number is 4
    const cohortValue = await page
      .locator("text=Cohorts")
      .locator("..")
      .locator("h4");
    await expect(cohortValue).toHaveText("4");

    // test age at first diagnosis
    // Locate the element containing the text "Age at First Diagnosis"
    const diagnosisGraph = await page
      .locator('text="Age at First Diagnosis"')
      .locator("..");
    await expect(diagnosisGraph).toHaveScreenshot({ threshold: 0.01 });

    // test treatment type distribution
    const treatmentGraph = await page
      .locator('text="Treatment Type Distribution"')
      .locator("..");
    await expect(treatmentGraph).toHaveScreenshot({ threshold: 0.01 });

    // test primary site distribution
    const primarySiteGraph = await page
      .locator('text="Tumour Primary Site Distribution"')
      .locator("..");
    await expect(primarySiteGraph).toHaveScreenshot({ threshold: 0.01 });

    // test cohort by node
    const cohortGraph = await page
      .locator('text="Distribution of Cohort by Node"')
      .locator("..");
    await expect(cohortGraph).toHaveScreenshot({ threshold: 0.01 });

    // test complete clinical
    const clinicalGraph = await page
      .locator('text="Complete Clinical"')
      .locator("..");
    await expect(clinicalGraph).toHaveScreenshot({ threshold: 0.01 });

    // test complete genomic
    const genomicGraph = await page
      .locator('text="Complete Genomic"')
      .locator("..");
    await expect(genomicGraph).toHaveScreenshot({ threshold: 0.01 });

    // test footer
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot({ threshold: 0.01 });

    // test whole page look
    await expect(page).toHaveScreenshot({
      threshold: 0.01,
      fullPage: true,
    });
  });
});
