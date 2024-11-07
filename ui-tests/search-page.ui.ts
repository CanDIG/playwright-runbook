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

  async function fillCheckbox(checkboxSelector, value) {
    // Fill checkbox in dropdowns
    await page.fill(checkboxSelector, value);
    await page.getByRole('option', { name: `${value}` }).click();
    await  page.locator(checkboxSelector).press('Enter');
  }

  const verifyPatientDataSection = async (expectedValues) => {
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();
  
    // Verify expanding
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand
  
    // Wait for the table rows to be visible after expanding
    const rows = await page.locator('div.PatientCountSingle-container');
  
    for (let i = 0; i < await rows.count(); i++) {
        await expect(rows.nth(i)).toBeVisible();
  
        const row = rows.nth(i);
        const receivedTextArray = await row.allTextContents();
        let joinedReceivedText = receivedTextArray.join('').trim(); // Join array and trim any extra whitespace
        const expectedText = expectedValues[i].full.trim(); // Trim expected value as well
  
        // Normalize non-breaking spaces to regular spaces
        joinedReceivedText = joinedReceivedText.replace(/\u00A0/g, ' ');
  
        // Compare the normalized text
        expect(joinedReceivedText).toEqual(expectedText);
    }
  };

  async function verifyClinicalTable(clinicalDataRows) {
    const clinicalTable = await page.getByRole('grid').first();
    expect(clinicalTable).toBeVisible();

    const tableRowsLocator = clinicalTable.getByRole('rowgroup');
    console.log(tableRowsLocator.count());
    expect(tableRowsLocator.count()==clinicalDataRows.length);
    for (const expected of clinicalDataRows) {
      await clinicalTable.scrollIntoViewIfNeeded();
      await expect(await tableRowsLocator.locator(`text=${expected.submitterDonorId}`).first()).toBeVisible();
      await expect(await tableRowsLocator.locator(`text=${expected.location}`).first()).toBeVisible();
      await expect(await tableRowsLocator.locator(`text=${expected.programId}`).first()).toBeVisible();
      await expect(await tableRowsLocator.locator(`text=${expected.sexAtBirth}`).first()).toBeVisible();
      await expect(await tableRowsLocator.locator(`text=${expected.deceased}`).first()).toBeVisible();
      await expect(await tableRowsLocator.locator(`text=${expected.dateOfBirth}`).first()).toBeVisible();
      await expect(await tableRowsLocator.locator(`text=${expected.dateOfDeath}`).first()).toBeVisible();
    }
  }
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
          { name: 'LOCAL-SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_012424Request Access' },
          { name: 'LOCAL-SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_022020' }, 
          { name: 'LOCAL-SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_032020Request Access' },
          { name: 'LOCAL-SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_042020Request Access' }
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
          expect(joinedReceivedText).toContain(expectedText);
      }
  });

  /*
  * ===================================
  * Data Visualization Component
  * ===================================
  */

  test.describe("Data Visualization", () => {

    /*
     * 
     * Test: Age at First Diagnosis
     * 
     */
    test.describe("Age at First Diagnosis", () => {
      const testCases = [
        { label: "30-39", value: "11", barIndex: 0 },
        { label: "40-49", value: "24", barIndex: 1 },
        { label: "50-59", value: "31", barIndex: 2 },
        { label: "None", value: "18", barIndex: 3 },
      ];
  
      testCases.forEach(({ label, value, barIndex }) => {
        test(`Total number of patients in range ${label} is: ${value}`, async () => {
          await testBarGraphHoverText({
            page,
            graphTitle: "Age at First Diagnosis",
            barIndex,
            expectedLabel: label,
            expectedValue: value,
          });
        });
      });
    });
  
    /*
     * 
     * Test: Treatment Graph
     * 
     */
    test.describe("Treatment Graph", () => {
      const testCases = [
        { label: "Systemic therapy", value: "168", barIndex: 0 },
        { label: "Surgery", value: "92", barIndex: 1 },
        { label: "Radiation therapy", value: "77", barIndex: 2 },
        { label: "Targeted molecular therapy", value: "34", barIndex: 3 },
        { label: "Bone marrow transplant", value: "33", barIndex: 4 },
        { label: "Stem cell transplant", value: "30", barIndex: 5 },
        { label: "Other - 24 (5.04%) total number of treatments", value: "24", barIndex: 6 },
      ];
  
      testCases.forEach(({ label, value, barIndex }) => {
        test(`Treatment Type: ${label} is: ${value}`, async () => {
          await testBarGraphHoverText({
            page,
            graphTitle: "Treatment Type Distribution",
            barIndex,
            expectedLabel: label,
            expectedValue: value,
          });
        });
      });
    });
  
    /*
     * 
     * Test: Primary Site Graph
     * 
     */
    test.describe("Primary Site Graph", () => {
      const testCases = [
        { label: "None", value: "18", barIndex: 0 },
        { label: "Breast", value: "16", barIndex: 1 },
        { label: "Bronchus and lung", value: "16", barIndex: 2 },
        { label: "Colon", value: "16", barIndex: 3 },
        { label: "Skin", value: "16", barIndex: 4 },
      ];
  
      testCases.forEach(({ label, value, barIndex }) => {
        test(`Tumour Primary Site: ${label} is: ${value}`, async () => {
          await testBarGraphHoverText({
            page,
            graphTitle: "Tumour Primary Site Distribution",
            barIndex,
            expectedLabel: label,
            expectedValue: value,
          });
        });
      });
  
      test("Tumour Primary Site: floor of mouth is hidden since less than 5", async () => {
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
    });
  
    /*
     * 
     * Test: Cohort Graph
     * 
     */
    test.describe("Cohort Graph", () => {
      const testCases = [
        { label: "SYNTH_01", value: "24", barIndex: 0 },
        { label: "SYNTH_02", value: "20", barIndex: 1 },
        { label: "SYNTH_03", value: "20", barIndex: 2 },
        { label: "SYNTH_04", value: "20", barIndex: 3 },
      ];
  
      testCases.forEach(({ label, value, barIndex }) => {
        test(`Synthetic dataset ${label} is ${value}`, async () => {
          await testStackedBarGraphHoverText({
            page,
            graphTitle: "Distribution of Cohort by Node",
            barIndex,
            expectedLabel: label,
            expectedValue: value,
          });
        });
      });
    });

    /*
     * 
     * Test: Functionality
     * 
     */
    test("Data Visualization: Add graph", async () => {
      const editButton = page.locator('button:has(.tabler-icon-edit)');
      await editButton.click();
  
      const addButton = page.locator('button:has(.tabler-icon-plus)');
      await addButton.click();
  
      const confirmButton = page.locator('button:has-text("Confirm")');
      await confirmButton.click();
  
      const graphLocator = page.locator(`text="Distribution of Cohort by Node"`);
      await expect(graphLocator).toHaveCount(9); 
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
      .nth(-2);
    expect(clinicalTable).toBeVisible();
    expect(clinicalTable).toContainText('DONOR_0026');
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


test.describe('Sidebar Tests', () => {
    test("Tumour Primary Site = Breast", async () => {
      await fillCheckbox('#checkboxes-tags-primary_site', 'Breast');
      const searchButton = page.locator('button:has-text("Search")');
      await searchButton.click();
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
          { name: 'SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
          { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
          { name: 'SYNTH_02', firstNumber: '4', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
          { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
      ];
      await verifyPatientDataSection(expectedValues);

      const clinicalDataRows = [
        { submitterDonorId: 'DONOR_0031', location: 'LOCAL', programId: 'SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '', dateOfDeath: '' },
        { submitterDonorId: 'DONOR_0036', location: 'LOCAL', programId: 'SYNTH_02', sexAtBirth: '', deceased: 'true', dateOfBirth: '38', dateOfDeath: '53' },
        { submitterDonorId: 'DONOR_0021', location: 'LOCAL', programId: 'SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '42', dateOfDeath: '77' },
        { submitterDonorId: 'DONOR_0026', location: 'LOCAL', programId: 'SYNTH_02', sexAtBirth: 'Male', deceased: 'false', dateOfBirth: '25', dateOfDeath: '55' }
    ];

      await verifyClinicalTable(clinicalDataRows);
    });

    test("Treatment = Targeted molecular therapy", async () => {
      await fillCheckbox('#checkboxes-tags-treatment', 'Targeted molecular therapy');
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
          { name: 'SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
          { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
          { name: 'SYNTH_02', firstNumber: '13', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
          { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
      ];
      await verifyPatientDataSection(expectedValues);
    });

    test("Treatment = Systemic therapy & Drug name = Carboplatin", async () => {
      await fillCheckbox('#checkboxes-tags-treatment', 'Systemic therapy');
      await fillCheckbox('#checkboxes-tags-drug_name', 'Carboplatin');
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
          { name: 'SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
          { name: 'SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
          { name: 'SYNTH_02', firstNumber: '13', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
          { name: 'SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
      ];
      await verifyPatientDataSection(expectedValues);
    });

    test("Systemic therapy drug names=”Durvalumab”, “Atezolizumab”, “Tamoxifen”", async () => {
      await fillCheckbox('#checkboxes-tags-drug_name', 'Durvalumab');
      await fillCheckbox('#checkboxes-tags-drug_name', 'Atezolizumab');
      await fillCheckbox('#checkboxes-tags-drug_name', 'Tamoxifen');
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '30-40', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
          { name: 'LOCAL-SYNTH_03', firstNumber: '11', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
          { name: 'LOCAL-SYNTH_01', firstNumber: '11', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
          { name: 'LOCAL-SYNTH_02', firstNumber: '8', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
          { name: 'LOCAL-SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
      ];
      await verifyPatientDataSection(expectedValues);
    });

    test("Gene search=LOC102723996", async () => {
      const geneSearchLabel = await page.locator('label:has-text("Gene Search")');
      const inputField = await geneSearchLabel.locator('xpath=./ancestor::fieldset//input[@type="text"]');
      await inputField.fill('LOC102723996');
      await page.keyboard.press('Enter');
  
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '1-11', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
          { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
          { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
          { name: 'LOCAL-SYNTH_02', firstNumber: '1', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
          { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
      ];
  
      await verifyPatientDataSection(expectedValues);
    });
  
    test("Gene search=SLX9", async () => {
        const geneSearchLabel = await page.locator('label:has-text("Gene Search")');
        const inputField = await geneSearchLabel.locator('xpath=./ancestor::fieldset//input[@type="text"]');
        await inputField.fill('SLX9');
        await page.keyboard.press('Enter');
    
        const expectedValues = [
            { name: 'LOCAL', firstNumber: '0', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
            { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
            { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
            { name: 'LOCAL-SYNTH_02', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
            { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
        ];
    
        await verifyPatientDataSection(expectedValues);
    });
    
    test("Positional search: chr=21, start=10522300, end=10530000", async () => {
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
    
        const expectedValues = [
            { name: 'LOCAL', firstNumber: '1-11', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
            { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
            { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
            { name: 'LOCAL-SYNTH_02', firstNumber: '1', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
            { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
        ];
    
        await verifyPatientDataSection(expectedValues);
    });
    
    test("Node selection", async () => {
        await page.locator('label:has-text("LOCAL") input[type="checkbox"]').uncheck();
        const expectedValues = [
            { name: 'LOCAL', firstNumber: '0', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL0844' },
            { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_03020Request Access' },
            { name: 'LOCAL-SYNTH_01', firstNumber: '0', secondNumber: '24', thirdNumber: '', full: 'SYNTH_01024Request Access' },
            { name: 'LOCAL-SYNTH_02', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_02020' }, 
            { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'SYNTH_04020Request Access' }
        ];
    
        await verifyPatientDataSection(expectedValues);
    
        await page.locator('label:has-text("LOCAL") input[type="checkbox"]').check();
    
        const expectedValuesCheck = [
            { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
            { name: 'LOCAL-SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' },
            { name: 'LOCAL-SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424Request Access' },
            { name: 'LOCAL-SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' }, 
            { name: 'LOCAL-SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }
        ];
    
        await verifyPatientDataSection(expectedValuesCheck);
    });
  });

  // test("Search Page Visual Test", async () => {
  //     await page.evaluate(() => window.scrollTo(0, 0));
  //     await expect(page).toHaveScreenshot({
  //       threshold: 0.01,
  //       fullPage: true,
  //     });
  //   });

  test("logout", async () => {
      await page.getByRole("banner").getByRole("button").nth(4).click();
      await page.getByRole("link", { name: "Logout" }).click();
      await expect(
          page.getByRole("heading", { name: "Sign in to your account" })
      ).toBeVisible();
  });

  test.afterAll(async () => {
      // Cleanup after all tests
      await page.close();
      await context.close();
  });
});
