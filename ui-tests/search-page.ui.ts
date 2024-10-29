import { test, expect } from "@playwright/test";
import { executionAsyncId } from "async_hooks";
import exp from "constants";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("Search page", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    // Setup context and login once
    context = await browser.newContext({
      viewport: {
        width: 1920,
        height: 1080
      }
    });
    page = await context.newPage();
    await page.goto(process.env.CANDIG_URL!);
    await page.getByLabel("Username or email").click();
    await page.getByLabel("Username or email").fill(process.env.CANDIG_USER2_USERNAME!);
    await page.getByLabel("Password", { exact: true }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.CANDIG_USER2_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole('button', { name: 'Clinical & Genomic Search' }).click();
    await page.waitForLoadState('networkidle', { timeout: 1200000 });
    await page.screenshot({ path: 'clinical-search-page.png', fullPage: true });
  });

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
   * ==================
   * Anchor Navigation
   * ==================
   */
  test("Anchor Navigation", async () => {
    const buttonTexts = [
        "Cohorts Summary",
        "Patient Counts",
        "Data Visualization",
        "Authorized Cohorts",
        "Clinical Data",
        "Genomic Data"
    ];

    for (const text of buttonTexts) {
        const anchorTag = await page.locator(`button:has-text("${text}")`);
        await expect(anchorTag).toBeVisible();
    }
  });

  /*
   * ====================
   * Header Verification
   * ====================
   */

  test("Header Verification", async () => {
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.log(`Console error: ${msg.text()}`);
        }
      });
    const headerTexts = [
      "Cohorts Summary",
      "Authorized Cohorts"
    ];
    
    for (const text of headerTexts) {
        const headerTag = page.locator('h3', { hasText: `${text}` });

      await expect(headerTag).toBeVisible();
    }
  });

  /*
   * ========================
   * Patient Data Componenet
   * ========================
   */

  test("Patient Data Component", async () => {
    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify the data prior to expanding
    const locationText = await patientDataSection.locator('span:has-text("LOCAL")');
    await expect(locationText).toBeVisible();

    const patientsInSearch = await patientDataSection.locator('p:has-text("84")').nth(0);
    await expect(patientsInSearch).toBeVisible();

    const totalPatients = await patientDataSection.locator('p:has-text("84")').nth(1);
    await expect(totalPatients).toBeVisible();

    const totalCohorts = await patientDataSection.locator('p:has-text("4")').nth(2);
    await expect(totalCohorts).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
});

/*
* ===================================
* Test: Data Visualization Component
* ===================================
*/

/*
* ===============================
* Test: Age at First Diagnosis
* ===============================
*/
  test("Data Visualization: total number of patients in range 30-39 is: 11", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 0,
      expectedLabel: "30-39",
      expectedValue: "11",
    });
  });

  test("Data Visualization: total number of patients in range 40-49 is: 24", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 1,
      expectedLabel: "40-49",
      expectedValue: "24",
    });
  });

  test("Data Visualization: total number of patients in range 50-59 is: 31", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 2,
      expectedLabel: "50-59",
      expectedValue: "31",
    });
  });

  test("Data Visualization: total number of patients in range null is: 18", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Age at First Diagnosis",
      barIndex: 3,
      expectedLabel: "None",
      expectedValue: "18",
    });
  });

  /*
   * ==================
   * Test: Treatment
   * ==================
   */

  test("Data Visualization: systemic therapy is: 168", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 0,
      expectedLabel: "Systemic therapy",
      expectedValue: "168",
    });
  });

  test("Data Visualization: surgery is: 92", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 1,
      expectedLabel: "Surgery",
      expectedValue: "92",
    });
  });

  test("Data Visualization: radiation therapy is: 77", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 2,
      expectedLabel: "Radiation therapy",
      expectedValue: "77",
    });
  });

  test("Data Visualization: Targeted molecular therapy is: 34", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 3,
      expectedLabel: "Targeted molecular therapy",
      expectedValue: "34",
    });
  });

  test("Data Visualization: bone marrow transplant is: 33", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 4,
      expectedLabel: "Bone marrow transplant",
      expectedValue: "33",
    });
  });

  test("Data Visualization: Stem cell transplant is: 30", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 5,
      expectedLabel: "Stem cell transplant",
      expectedValue: "30",
    });
  });

  test("Data Visualization: Other targeting molecular therapy is: 24", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Treatment Type Distribution",
      barIndex: 6,
      expectedLabel: "Other - 24 (5.04%) total number of treatments",
      expectedValue: "24",
    });
  });

  /*
   * =====================
   * Test: Primary Site
   * =====================
   */
  test("Data Visualization: None is: 18", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 0,
      expectedLabel: "None",
      expectedValue: "18",
    });
  });

  test("Data Visualization: breast is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 1,
      expectedLabel: "Breast",
      expectedValue: "16",
    });
  });

  test("Data Visualization: Bronchus and lung is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 2,
      expectedLabel: "Bronchus and lung",
      expectedValue: "16",
    });
  });

  test("Data Visualization: colon is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 3,
      expectedLabel: "Colon",
      expectedValue: "16",
    });
  });

  test("Data Visualization: Skin is: 16", async () => {
    await testBarGraphHoverText({
      page,
      graphTitle: "Tumour Primary Site Distribution",
      barIndex: 4,
      expectedLabel: "Skin",
      expectedValue: "16",
    });
  });

  test("Data Visualization: floor of mouth is: hidden since less than 5", async () => {
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
   * ===============
   * Test: Cohort
   * ===============
   */
  test("Data Visualization: synthetic dataset 2 is 20", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 1,
      expectedLabel: "SYNTH_02",
      expectedValue: "20",
    });
  });

  test("Data Visualization: synthetic dataset 3 is 20", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 2,
      expectedLabel: "SYNTH_03",
      expectedValue: "20",
    });
  });

  test("Data Visualization: synthetic dataset 1 is 24", async () => {
    await testStackedBarGraphHoverText({
      page,
      graphTitle: "Distribution of Cohort by Node",
      barIndex: 0,
      expectedLabel: "SYNTH_01",
      expectedValue: "24",
    });
  });

  test("Data Visualization:  synthetic dataset 4 is 20", async () => {
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
   * Clinical Table
   * ======================
   */
  test("Clinical Table", async () => {
    const clinicalTable = await page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Clinical Data Donor' })
      .nth(-2); // For the second last occurrence, or use -1 for the last one
    expect(clinicalTable).toBeVisible();
    expect(clinicalTable).toContainText('DONOR_0026');
    // getByText('Genomic Variants: Please query from the sidebar to populateNodeDonor IDCohort')
  });

  /*
   * ======================
   * Genomic Table
   * ======================
   */
  test("Genomic Table", async () => {
    const genomicTable = await page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Genomic Variants: Please query from the sidebar to populate' })
      .locator('text=No rows');
  
    expect(genomicTable).toBeVisible();
    expect(genomicTable).toContainText('No rows');
  });
  /*
   * ========================
   * Querying and Filtering
   * ========================
   */
  test("Sidebar: Tumour Priamry Site = Breast", async () => {
    await page.fill('#checkboxes-tags-primary_site', 'Breast');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify the data prior to expanding
    const locationText = await patientDataSection.locator('span:has-text("LOCAL")');
    await expect(locationText).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '4', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Treatment=Targeted molecular therapy", async () => {
    await page.fill('#checkboxes-tags-treatment', 'Targeted molecular therapy');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '13', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Treatment=Systemic therapy & Systemic therapy drug name=Carboplatin", async () => {
    await page.fill('#checkboxes-tags-treatment', 'Systemic therapy');
    await page.keyboard.press('Enter');

    await page.fill('#checkboxes-tags-drug_name', 'Carboplatin');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '13', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Systemic therapy drug names=”Durvalumab”, “Atezolizumab”, “Tamoxifen”", async () => {
    await page.fill('#checkboxes-tags-drug_name', 'Durvalumab');
    await page.keyboard.press('Enter');

    await page.fill('#checkboxes-tags-drug_name', 'Atezolizumab');
    await page.keyboard.press('Enter');

    await page.fill('#checkboxes-tags-drug_name', 'Tamoxifen');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '30-40', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '11', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '11', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '8', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Gene search=LOC102723996", async () => {
    const geneSearchLabel = await page.locator('label:has-text("Gene Search")');
    const inputField = await geneSearchLabel.locator('xpath=./ancestor::fieldset//input[@type="text"]');
    await inputField.fill('LOC102723996');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '1-11', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '1', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Gene search=SLX9", async () => {
    const geneSearchLabel = await page.locator('label:has-text("Gene Search")');
    const inputField = await geneSearchLabel.locator('xpath=./ancestor::fieldset//input[@type="text"]');
    await inputField.fill('SLX9');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '0', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Positional search: chr=21, start=10522300, end=10530000", async () => {
    const chromosomeLabel = await page.locator('label:has-text("Chromosome")');
    const chromosomeInput = chromosomeLabel.locator('xpath=following-sibling::div//input');
    await chromosomeInput.fill('21');
    await page.keyboard.press('Enter');

    const startLabel = await page.locator('label:has-text("Start")');
    const startInput = startLabel.locator('xpath=following-sibling::div//input');
    await startInput.fill('10522300');
    await page.keyboard.press('Enter');

    const endLabel = await page.locator('label:has-text("End")');
    const endInput = endLabel.locator('xpath=following-sibling::div//input');
    await endInput.fill('10530000');
    await page.keyboard.press('Enter');

    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '1-11', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
        { name: 'SYNTH_02', firstNumber: '1', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Node selection", async () => {
    await page.locator('label:has-text("LOCAL") input[type="checkbox"]').uncheck();
    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '0', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL0844' },
        { name: 'SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_03020Request Access' },
        { name: 'SYNTH_01', firstNumber: '0', secondNumber: '24', thirdNumber: '', full: 'SYNTH_01024Request Access' },
        { name: 'SYNTH_02', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_02020' }, 
        { name: 'SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_04020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }

    await page.locator('label:has-text("LOCAL") input[type="checkbox"]').check();
    // Locating Patient Data section
    const patientDataSectionCheck = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButtonCheck = await patientDataSectionCheck.locator('button[type="button"]');
    await expect(expandButtonCheck).toBeVisible();
    await expandButtonCheck.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValuesCheck = [
      { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
      { name: 'SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
      { name: 'SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
      { name: 'SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
      { name: 'SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
  ];

    // Wait for the table rows to be visible after expanding
    const rowsCheck = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rowsCheck.count(); i++) {
        await expect(rowsCheck.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rowsCheck.count(); i++) {
        const rowCheck = rowsCheck.nth(i);
        await expect(rowCheck).toBeVisible();

        const receivedTextArray = await rowCheck.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValuesCheck[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Sidebar: Cohort selection", async () => {
    await page.locator('label:has-text("SYNTH_01") input[type="checkbox"]').uncheck();
    // Locating Patient Data section
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    // Values in patient data section after expanding
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '60', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL60844' },
        { name: 'SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
        { name: 'SYNTH_01', firstNumber: '0', secondNumber: '24', thirdNumber: '', full: 'SYNTH_01024Request Access' },
        { name: 'SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
        { name: 'SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
    ];

    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        await expect(row).toBeVisible();

        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }

    await page.locator('label:has-text("SYNTH_01") input[type="checkbox"]').check();
    // Locating Patient Data section
    const patientDataSectionCheck = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    // Verify expanding
    const expandButtonCheck = await patientDataSectionCheck.locator('button[type="button"]');
    await expect(expandButtonCheck).toBeVisible();
    await expandButtonCheck.click(); // Click to expand

    // Values in patient data section after expanding
    const expectedValuesCheck = [
      { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
      { name: 'SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
      { name: 'SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
      { name: 'SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
      { name: 'SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
  ];

    // Wait for the table rows to be visible after expanding
    const rowsCheck = await page.locator('div.PatientCountSingle-container');

    for ( let i = 0; i < await rowsCheck.count(); i++) {
        await expect(rowsCheck.nth(i)).toBeVisible();
    }

    for (let i = 0; i < await rowsCheck.count(); i++) {
        const rowCheck = rowsCheck.nth(i);
        await expect(rowCheck).toBeVisible();

        const receivedTextArray = await rowCheck.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValuesCheck[i].full.trim(); // Trim expected value as well

        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');

        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  });

  test("Data Visualization: Add and Remove graph", async () => {
    const editButton = page.locator('button:has(.tabler-icon-edit)');
    await editButton.click();

    const addButton = page.locator('button:has(.tabler-icon-plus)');
    await addButton.click();

    const confirmButton = page.locator('button:has-text("Confirm")');
    await confirmButton.click();

    const graphLocator = page.locator('[data-highcharts-chart="5"]');
    await expect(graphLocator).toHaveCount(1); 

    const deleteButton = page.locator('button:has(.tabler-icon-trash)');
    await deleteButton.click();

    const graphLocatorDeleted = page.locator('[data-highcharts-chart="5"]');
    await expect(graphLocatorDeleted).toHaveCount(0); 
  });

    test("Search Page Visual Test", async () => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(page).toHaveScreenshot("full-search-page.png", {
          threshold: 0.01,
          fullPage: true,
        });
      });

    test("logout", async () => {
        await page.getByRole("banner").getByRole("button").nth(4).click();
        await page.getByRole("link", { name: "Logout" }).click();
        await expect(
            page.getByRole("heading", { name: "Sign in to your account" })
        ).toBeVisible();
        await page.screenshot({ path: 'patient-data-debug-SIGNOUT.png', fullPage: true });
    });

    test.afterAll(async () => {
        // Cleanup after all tests
        await page.close();
        await context.close();
    });
});
