import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { APP_CONFIG, VIEWPORT, TIMEOUTS, DEBUG, FILE_PATHS } from './constants';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("Search page", () => {
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
  
      await page.getByRole('button', { name: 'Clinical & Genomic Search' }).click();
      await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE });
  
      if (DEBUG) {
        await page.screenshot({ path: FILE_PATHS.CLINICAL_SEARCH_SCREENSHOT, fullPage: true });
      }
    } catch (error) {
      console.error("Error during test setup:", error);
      throw error;
    }
  });

  /*
  * ==================
  * Helper functions
  * ==================
  */
  async function login(page, username, password) {
    await page.getByLabel("Username or email").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
  }

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
    try {
      await page.fill(checkboxSelector, value);
      await page.getByRole('option', { name: `${value}` }).click();
    } catch (error) {
      console.error(`Error filling checkbox with value "${value}":`, error);
      throw error; // Re-throw the error to fail the test
    }
  }

  const verifyPatientDataSection = async (expectedValues) => {
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();
  
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand
  
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
        console.log(row);
        expect(joinedReceivedText).toEqual(expectedText);
    }
  };

  async function verifyClinicalTable(clinicalDataRows) {
    const clinicalTable = await page.getByRole('grid').first();
    expect(clinicalTable).toBeVisible();

    const tableRowsLocator = clinicalTable.getByRole('row');
    const rowCount = await tableRowsLocator.count();
    
    console.log("Total rows in table:", rowCount);
    expect(rowCount).toEqual(clinicalDataRows.length+1);

    for (const expected of clinicalDataRows) {
      // Locate the row based on the submitterDonorId
      const rowLocator = tableRowsLocator.locator(`text=${expected.submitterDonorId}`).first().locator('..').locator('..').locator('..');
      
      await clinicalTable.scrollIntoViewIfNeeded();
      await expect(rowLocator).toBeVisible();

      // Fields to verify
      const fields = [
        { field: "location", value: expected.location },
        { field: "program_id", value: expected.programId },
        { field: "deceased", value: expected.deceased },
        { field: "sex_at_birth", value: expected.sexAtBirth },
        { field: "date_of_birth", value: expected.dateOfBirth },
        { field: "date_of_death", value: expected.dateOfDeath }
      ];
      
      for (const { field, value } of fields) {
        const fieldLocator = rowLocator.locator(`[data-field="${field}"]`).locator(`text=${value}`);
        await expect(fieldLocator)[value === '' ? 'toBeHidden' : 'toBeVisible']();
      }
    }
  }

  async function verifyGenomicTable(genomicDataRows) {
    try {
      // Locate the genomic table and verify visibility
      const genomicTable = page.getByRole('grid').nth(1);
      await expect(genomicTable).toBeVisible();
  
      // Get the table rows and validate row count
      const tableRowsLocator = genomicTable.getByRole('row');
      const rowCount = await tableRowsLocator.count();
      console.log("Total rows in table:", rowCount);
      expect(rowCount).toEqual(genomicDataRows.length + 1); // +1 for header row
  
      // Iterate over each expected row and verify content
      for (let index = 0; index < genomicDataRows.length; index++) {
        const expected = genomicDataRows[index];
        const rowLocator = tableRowsLocator.nth(index + 1); // Skip header row
  
        await genomicTable.scrollIntoViewIfNeeded();
        await expect(rowLocator).toBeVisible();
  
        // Fields to verify
        const fields = [
          { field: "location", value: expected.location },
          { field: "donor_id", value: expected.donor_id },
          { field: "program_id", value: expected.cohort_id },
          { field: "position", value: expected.position },
          { field: "tumour_normal_designation", value: expected.tumour_normal_designation },
          { field: "submitter_specimen_id", value: expected.submitter_specimen_id },
          { field: "genotypeLabel", value: expected.genotype },
          { field: "zygosityLabel", value: expected.zygosity }
        ];
  
        // Verify each field
        for (const { field, value } of fields) {
          const fieldLocator = rowLocator.locator(`[data-field="${field}"]`).locator(`text=${value}`);
          await expect(fieldLocator)[value === '' ? 'toBeHidden' : 'toBeVisible']();
        }
      }
    } catch (error) {
      console.error("Error verifying genomic table:", error);
      throw error;
    }
  }

  const clickSearchButton = async () => {
    const searchButton = page.locator('button:has-text("Search")');
    await searchButton.click();
  };

  const verifyPatientData = async (expectedValues) => {
    await verifyPatientDataSection(expectedValues);
  };

  const verifyClinicalData = async (clinicalDataRows) => {
    await verifyClinicalTable(clinicalDataRows);
  };

  const verifyGenomicData = async (genomicDataRows) => {
    await verifyGenomicTable(genomicDataRows);
  };

  const selectPrimarySiteCheckbox = async (label) => {
    await fillCheckbox('#checkboxes-tags-primary_site', label);
  };

  const selectTreatmentCheckbox = async (label) => {
    await fillCheckbox('#checkboxes-tags-treatment', label);
  };

  const selectTreatmentAndDrug = async (treatment, drug) => {
    await fillCheckbox('#checkboxes-tags-treatment', treatment);
    await fillCheckbox('#checkboxes-tags-drug_name', drug);
  };

  const selectDrugs = async (drugs) => {
    for (const drug of drugs) {
      await fillCheckbox('#checkboxes-tags-drug_name', drug);
    }
  };


  /*
  * ==================
  * Anchor Navigation
  * ==================
  */
  test("Anchor Navigation", async () => {
  const buttonTexts = [
    "Patient Counts",
    "Data Visualization",
    "Clinical Data",
    "Genomic Data"
  ];

  for (const text of buttonTexts) {
    const anchorButton = page.locator(`button:has-text("${text}")`);
    await expect(anchorButton).toBeVisible();
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
      "All Cohorts",
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
      const normalizeText = (text) => text.replace(/\u00A0/g, ' ').trim();

      // Locate Patient Data section
      const patientDataSection = page.locator('#counts').locator('..');
      await expect(patientDataSection).toBeVisible();

      // Verify initial data prior to expanding
      const locationText = patientDataSection.locator('span:has-text("LOCAL")');
      await expect(locationText).toBeVisible();

      const patientsInSearch = patientDataSection.locator('p:has-text("84")').nth(0);
      await expect(patientsInSearch).toBeVisible();

      const totalPatients = patientDataSection.locator('p:has-text("84")').nth(1);
      await expect(totalPatients).toBeVisible();

      const totalCohorts = patientDataSection.locator('p:has-text("4")').nth(2);
      await expect(totalCohorts).toBeVisible();

      const expandButton = patientDataSection.locator('button[type="button"]');
      await expandButton.click();

      const expectedValues = [
          { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
          { name: 'LOCAL-SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_012424Request Access' },
          { name: 'LOCAL-SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_032020Request Access' },
          { name: 'LOCAL-SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_022020' }, 
          { name: 'LOCAL-SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_042020Request Access' }
      ];

    const rows = page.locator('div.PatientCountSingle-container');
    const rowCount = await rows.count();
    expect(rowCount).toEqual(expectedValues.length);

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      await expect(row).toBeVisible();

      const receivedText = normalizeText((await row.allTextContents()).join(''));
      const expectedText = normalizeText(expectedValues[i].full);

      expect(receivedText).toContain(expectedText);
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
    await selectPrimarySiteCheckbox('Breast');
    await clickSearchButton();
  
    // Expected patient data values after selecting 'Breast'
    const expectedValues = [
      { name: 'LOCAL', firstNumber: '4-34', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL4-34844' },
      { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01<1024Request Access' },
      { name: 'LOCAL-SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03<1020Request Access' },
      { name: 'LOCAL-SYNTH_02', firstNumber: '4', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02420' },
      { name: 'LOCAL-SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04<1020Request Access' }
    ];
  
    await verifyPatientData(expectedValues);
  
    // Expected clinical data rows
    const clinicalDataRows = [
      { submitterDonorId: 'DONOR_0031', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0036', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'true', dateOfBirth: '38', dateOfDeath: '53' },
      { submitterDonorId: 'DONOR_0021', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '42', dateOfDeath: '77' },
      { submitterDonorId: 'DONOR_0026', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Male', deceased: 'false', dateOfBirth: '', dateOfDeath: '' }
    ];
  
    await verifyClinicalData(clinicalDataRows);
  });

  test("Treatment = Targeted molecular therapy", async () => {  
    await selectTreatmentCheckbox('Targeted molecular therapy');
    await clickSearchButton();
  
    // Expected patient data values after selecting 'Targeted molecular therapy'
    const expectedValues = [
      { name: 'LOCAL', firstNumber: '13-43', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL13-43844' },
      { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01<1024Request Access' },
      { name: 'LOCAL-SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03<1020Request Access' },
      { name: 'LOCAL-SYNTH_02', firstNumber: '13', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_021320' },
      { name: 'LOCAL-SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04<1020Request Access' }
    ];
  
    // Step 3: Verify the patient data section
    await verifyPatientData(expectedValues);
  
    // TODO: Add clinical data rows
    /*
    *  More than 10 patients unpredictability in the data
    */
  });

  test("Treatment = Systemic therapy & Drug name = Carboplatin", async () => {
    await selectTreatmentAndDrug('Systemic therapy', 'Carboplatin');
    await clickSearchButton();
  
    // Expected patient data values after applying filters
    const expectedValues = [
      { name: 'LOCAL', firstNumber: '13-43', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL7-37844' },
      { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01<1024Request Access' },
      { name: 'LOCAL-SYNTH_03', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03<1020Request Access' },
      { name: 'LOCAL-SYNTH_02', firstNumber: '7', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02720' }, 
      { name: 'LOCAL-SYNTH_04', firstNumber: '<10', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04<1020Request Access' }
    ];
  
    await verifyPatientData(expectedValues);
  
    // Clinical data rows to verify
    const clinicalDataRows = [
      { submitterDonorId: 'DONOR_0025', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'true', dateOfBirth: '44', dateOfDeath: '89' },
      { submitterDonorId: 'DONOR_0027', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'false', dateOfBirth: '45', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0037', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'false', dateOfBirth: '', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0034', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Male', deceased: 'true', dateOfBirth: '', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0021', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '42', dateOfDeath: '77' },
      { submitterDonorId: 'DONOR_0024', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'false', dateOfBirth: '57', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0031', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '', dateOfDeath: '' }
    ];
  
    await verifyClinicalData(clinicalDataRows);
  });

  test("Systemic therapy drug names = 'Durvalumab', 'Atezolizumab', 'Tamoxifen'", async () => {
    await selectDrugs(['Durvalumab', 'Atezolizumab', 'Tamoxifen']);
    await clickSearchButton();
  
    // Expected patient data values after applying filters
    const expectedValues = [
      { name: 'LOCAL', firstNumber: '48', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL48844' },
      { name: 'LOCAL-SYNTH_01', firstNumber: '13', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_011324Request Access' },
      { name: 'LOCAL-SYNTH_03', firstNumber: '15', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_031520Request Access' },
      { name: 'LOCAL-SYNTH_02', firstNumber: '9', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02920' }, 
      { name: 'LOCAL-SYNTH_04', firstNumber: '11', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_041120Request Access' }
    ];
  
    await verifyPatientData(expectedValues);
  
    // Clinical data rows to verify
    const clinicalDataRows = [
      { submitterDonorId: 'DONOR_0029', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'false', dateOfBirth: '', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0027', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'false', dateOfBirth: '45', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0026', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Male', deceased: 'false', dateOfBirth: '', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0035', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Male', deceased: 'false', dateOfBirth: '55', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0033', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'false', dateOfBirth: '49', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0038', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Male', deceased: 'true', dateOfBirth: '38', dateOfDeath: '61' },
      { submitterDonorId: 'DONOR_0021', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '42', dateOfDeath: '77' },
      { submitterDonorId: 'DONOR_0031', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '', dateOfDeath: '' },
      { submitterDonorId: 'DONOR_0036', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: '', deceased: 'true', dateOfBirth: '38', dateOfDeath: '53' }
    ];
  
    await verifyClinicalData(clinicalDataRows);
  });
    
  // Genomic test: SLC2A5, LOC102723996, and SLX9. Positional test: chr=21, start=5030000, end=5030847

  test("Gene search=LOC102723996", async () => { 
    await page.waitForTimeout(2000); 
    const geneSearchLabel = await page.locator('label:has-text("Gene Search")');
    const inputField = await geneSearchLabel.locator('xpath=./ancestor::fieldset//input[@type="text"]');
    await inputField.fill('LOC102723996');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); 
    
    await clickSearchButton();
    
    await page.waitForLoadState('networkidle');

    const searchValue = await inputField.inputValue();
    expect(searchValue).toBe('LOC102723996');

    const expectedValues = [
        { name: 'LOCAL', firstNumber: '1-11', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL1-11844' },
        { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01<1024Request Access' },
        { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03020Request Access' },
        { name: 'LOCAL-SYNTH_02', firstNumber: '1', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02120' }, 
        { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04020Request Access' }
    ];

    await verifyPatientDataSection(expectedValues);

    const clinicalDataRows = [
      { submitterDonorId: 'DONOR_0021', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '42', dateOfDeath: '77' }
    ];

    await verifyClinicalData(clinicalDataRows);

    const genomicDataRows = [
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030550', tumour_normal_designation: 'Normal', submitter_specimen_id: 'LOCAL-SAMPLE_0061', genotype: '0/0', zygosity: 'homozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030550', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030551A>C)', zygosity: 'simple heterozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030550', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030551=)', zygosity: 'simple heterozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030637', tumour_normal_designation: 'Normal', submitter_specimen_id: 'LOCAL-SAMPLE_0061', genotype: '0/0', zygosity: 'homozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030637', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030638A>T)', zygosity: 'simple heterozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030637', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030638=)', zygosity: 'simple heterozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030846', tumour_normal_designation: 'Normal', submitter_specimen_id: 'LOCAL-SAMPLE_0061', genotype: '0/0', zygosity: 'homozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030846', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030847T>A)', zygosity: 'simple heterozygous' },
      { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030846', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030847=)', zygosity: 'simple heterozygous' }
    ];

    await verifyGenomicData(genomicDataRows);
  });
  
  test("Gene search=SLX9", async () => {
    await page.waitForTimeout(2000); 
    const geneSearchLabel = await page.locator('label:has-text("Gene Search")');
    const inputField = await geneSearchLabel.locator('xpath=./ancestor::fieldset//input[@type="text"]');
    await inputField.fill('SLX9');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); 

    await clickSearchButton();
  
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '0', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL0-10844' },
          { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01<1024Request Access' },
          { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03020Request Access' },
          { name: 'LOCAL-SYNTH_02', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02020' }, 
          { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04020Request Access' }
      ];
  
      await verifyPatientDataSection(expectedValues);

      const clinicalDataRows = [];

      await verifyClinicalData(clinicalDataRows);

      const genomicDataRows = [];

      await verifyGenomicData(genomicDataRows);
  });
    
  test("Positional search: chr=21, start=5030000, end=5030847", async () => {
    const chromosomeLabel = await page.locator('label:has-text("Chromosome")');
    const chromosomeInput = chromosomeLabel.locator('xpath=following-sibling::div//input');
    await chromosomeInput.fill('21');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const startLabel = await page.locator('label:has-text("Start")');
    const startInput = startLabel.locator('xpath=following-sibling::div//input');
    await startInput.fill('5030000');
    await page.keyboard.press('Enter');

    const endLabel = await page.locator('label:has-text("End")');
    const endInput = endLabel.locator('xpath=following-sibling::div//input');
    await endInput.fill('5030847');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(2000); 

    
    await clickSearchButton();
  
      const expectedValues = [
          { name: 'LOCAL', firstNumber: '1-11', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL1-11844' },
          { name: 'LOCAL-SYNTH_01', firstNumber: '<10', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01<1024Request Access' },
          { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03020Request Access' },
          { name: 'LOCAL-SYNTH_02', firstNumber: '1', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02120' }, 
          { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04020Request Access' }
      ];
  
      await verifyPatientDataSection(expectedValues);

      const clinicalDataRows = [
        { submitterDonorId: 'DONOR_0021', location: 'LOCAL', programId: 'LOCAL-SYNTH_02', sexAtBirth: 'Other', deceased: 'true', dateOfBirth: '42', dateOfDeath: '77' }
      ];

      await verifyClinicalData(clinicalDataRows);

      const genomicDataRows = [
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030550', tumour_normal_designation: 'Normal', submitter_specimen_id: 'LOCAL-SAMPLE_0061', genotype: '0/0', zygosity: 'homozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030550', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030551A>C)', zygosity: 'simple heterozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030550', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030551=)', zygosity: 'simple heterozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030637', tumour_normal_designation: 'Normal', submitter_specimen_id: 'LOCAL-SAMPLE_0061', genotype: '0/0', zygosity: 'homozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030637', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030638A>T)', zygosity: 'simple heterozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030637', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030638=)', zygosity: 'simple heterozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030846', tumour_normal_designation: 'Normal', submitter_specimen_id: 'LOCAL-SAMPLE_0061', genotype: '0/0', zygosity: 'homozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030846', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030847T>A)', zygosity: 'simple heterozygous' },
        { donor_id: 'DONOR_0021', location: 'LOCAL', cohort_id: 'LOCAL-SYNTH_02', position: '5030846', tumour_normal_designation: 'Tumour', submitter_specimen_id: 'LOCAL-SAMPLE_0062', genotype: '0/1 (NC_000021.9:g.5030847=)', zygosity: 'simple heterozygous' }
      ];

      await verifyGenomicData(genomicDataRows);
  });
    
  test("Node selection", async () => {
    const fieldset = await page.locator('fieldset:has(label:text("Node"))');

    // Uncheck LOCAL Node
    await fieldset.locator('label:has-text("LOCAL") input[type="checkbox"]').uncheck();

    const searchButton = page.locator('button:has-text("Search")');
    await searchButton.click();

    // Expected values after unchecking LOCAL
    const expectedValues = [
        { name: 'LOCAL', firstNumber: '0', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL0844' },
        { name: 'LOCAL-SYNTH_01', firstNumber: '0', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_01024Request Access' },
        { name: 'LOCAL-SYNTH_03', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_03020Request Access' },
        { name: 'LOCAL-SYNTH_02', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_02020' },
        { name: 'LOCAL-SYNTH_04', firstNumber: '0', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_04020Request Access' }
    ];

    // Verify patient data
    await verifyPatientDataSection(expectedValues);

    // Check LOCAL Node
    await fieldset.locator('label:has-text("LOCAL") input[type="checkbox"]').check();

    // Expected values after re-checking LOCAL
    const expectedValuesCheck = [
        { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL0844' },
        { name: 'LOCAL-SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'LOCAL-SYNTH_012424Request Access' },
        { name: 'LOCAL-SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_032020Request Access' },
        { name: 'LOCAL-SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_022020' },
        { name: 'LOCAL-SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'LOCAL-SYNTH_042020Request Access' }
    ];

    // Verify updated patient data
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

  test.afterAll(async () => {
      // Cleanup after all tests
      await page.close();
      await context.close();
  });
});
