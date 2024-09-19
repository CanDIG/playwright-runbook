import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("Search page", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    // Setup context and login once
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto(process.env.CANDIG_URL!);
    await page.getByLabel("Username or email").click();
    await page.getByLabel("Username or email").fill(process.env.CANDIG_USERNAME!);
    await page.getByLabel("Password", { exact: true }).click();
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.CANDIG_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole('button', { name: 'Clinical & Genomic Search' }).click();
    await page.waitForLoadState('networkidle', { timeout: 1200000 });
    // await page.screenshot({ path: 'clinical-search-page.png', fullPage: true });
  });

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

  test("Patient Data Component", async () => {
    const patientDataSection = await page.locator('#counts').locator('..');
    await expect(patientDataSection).toBeVisible();

    const locationText = await patientDataSection.locator('span:has-text("LOCAL")');
    await expect(locationText).toBeVisible();

    const patientsInSearch = await patientDataSection.locator('p:has-text("84")').nth(0);
    await expect(patientsInSearch).toBeVisible();

    const totalPatients = await patientDataSection.locator('p:has-text("84")').nth(1);
    await expect(totalPatients).toBeVisible();

    // This could be targeting the wrong element, so updating it:
    const totalCohorts = await patientDataSection.locator('p:has-text("4")').nth(2);
    await expect(totalCohorts).toBeVisible();

    // Verify expanding works within the focused section
    const expandButton = await patientDataSection.locator('button[type="button"]');
    await expect(expandButton).toBeVisible();
    await expandButton.click(); // Click to expand

    // Add a wait to ensure the section expands properly
    await page.waitForSelector('div.PatientCountSingle-container'); // Wait for rows to appear

    const expectedValues = [
        { name: 'LOCAL', firstNumber: '84', secondNumber: '84', thirdNumber: '4', full: 'LLOCAL84844' },
        { name: 'SYNTH_03', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_032020Request Access' }, // Example row 1
        { name: 'SYNTH_01', firstNumber: '24', secondNumber: '24', thirdNumber: '', full: 'SYNTH_012424' },   // Example row 2
        { name: 'SYNTH_02', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_022020' },  // Example row 3
        { name: 'SYNTH_04', firstNumber: '20', secondNumber: '20', thirdNumber: '', full: 'SYNTH_042020Request Access' }    // Example row 4
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

    test('test', async () => {
        await page.locator('fieldset').filter({ hasText: 'Tumour Primary' }).getByLabel('Open').click();
        await page.getByRole('combobox', { name: 'primary_site' }).fill('skin');
        await page.getByRole('option', { name: 'Skin' }).getByRole('checkbox').check();
        await page.getByRole('combobox', { name: 'primary_site' }).fill('thy');
        await page.getByRole('option', { name: 'Thyroid gland' }).getByRole('checkbox').check();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL8-18844$/ }).getByRole('button').click();
        await expect(page.getByText('SYNTH_03<520Request Access')).toBeVisible();
        await expect(page.getByText('SYNTH_02420')).toBeVisible();
        await expect(page.locator('#highcharts-k6m52k6-235').getByText('Attention: Totals do not')).toBeVisible();
        await page.locator('#highcharts-k6m52k6-234').getByText('Attention: Totals do not').click();
        await page.getByRole('button', { name: 'Clear' }).click();
        await page.getByLabel('treatment', { exact: true }).click();
        await page.getByRole('combobox', { name: 'treatment', exact: true }).fill('');
        await page.getByRole('option', { name: 'Systemic therapy' }).getByRole('checkbox').check();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL84844$/ }).getByRole('button').click();
        await page.getByText('24').first().click();
        await page.getByRole('combobox', { name: 'drug_name' }).fill('b');
        await page.getByRole('option', { name: 'Buserelin' }).getByRole('checkbox').check();
        await page.getByRole('option', { name: 'Carboplatin' }).getByRole('checkbox').check();
        await page.getByRole('option', { name: 'Tamoxifen' }).getByRole('checkbox').check();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL61844$/ }).getByRole('button').click();
        await expect(page.getByText('12')).toBeVisible();
        await page.getByRole('button', { name: 'Clear' }).click();
        await page.getByLabel('treatment').fill('sys');
        await page.getByRole('listbox', { name: 'treatment' }).getByRole('checkbox').check();
        await page.locator('fieldset').filter({ hasText: 'Systemic Therapy Drug' }).getByLabel('Clear').click();
        await page.getByLabel('drug_name').fill('');
        await page.getByRole('option', { name: 'Buserelin' }).getByRole('checkbox').check();
        await page.getByRole('option', { name: 'Carboplatin' }).getByRole('checkbox').check();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL57844$/ }).getByRole('button').click();
        await expect(page.getByText('SYNTH_02920')).toBeVisible();
        await page.getByText('SYNTH_01824').click();
        await page.getByRole('button', { name: 'Clear' }).click();
        await page.getByRole('button', { name: 'Clear' }).click();
        await page.locator('fieldset').filter({ hasText: 'Gene Search' }).getByRole('combobox').fill('S');
        await page.locator('fieldset').filter({ hasText: 'Gene Search' }).getByRole('combobox').click();
        await page.locator('fieldset').filter({ hasText: 'Gene Search' }).getByRole('combobox').fill('SlX');
        await page.getByRole('option', { name: 'SLX9' }).click();
        await expect(page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL1844$/ }).getByRole('button')).toBeVisible();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL1844$/ }).getByRole('button').click();
        await expect(page.getByText('SYNTH_01124')).toBeVisible();
        await expect(page.getByLabel('Open Patient View').getByText('DONOR_ALL_0001')).toBeVisible();
        await expect(page.getByText('44940965').first()).toBeVisible();
        await page.getByLabel('Clear').click();
        await page.locator('fieldset').filter({ hasText: 'PositionChromosomeChromosomeStartStartEndEnd' }).getByLabel('Open').click();
        await page.getByRole('option', { name: '1', exact: true }).click();
        await page.getByLabel('Start').click();
        await page.getByLabel('Start').fill('16565700');
        await page.getByLabel('End').click();
        await page.getByLabel('End').fill('16565800');
        await page.getByLabel('End').press('Enter');
        await expect(page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL1844$/ }).getByRole('button')).toBeVisible();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL1844$/ }).getByRole('button').click();
        await expect(page.getByText('SYNTH_01124')).toBeVisible();
        await expect(page.getByText('16565781').first()).toBeVisible();
        await page.getByLabel('LOCAL').uncheck();
        await expect(page.getByText('LLOCAL0844')).toBeVisible();
        await page.getByLabel('LOCAL').check();
        await expect(page.getByLabel('Clear')).toBeVisible();
        await page.getByRole('button', { name: 'Reset Filters' }).click();
        await expect(page.getByText('LLOCAL84844')).toBeVisible();
        await page.getByLabel('SYNTH_03').uncheck();
        await page.locator('div').filter({ hasText: /^Patient DataPatients In SearchTotal PatientsTotal CohortsLLOCAL64844$/ }).getByRole('button').click();
        await expect(page.getByText('SYNTH_03020Request Access')).toBeVisible();
        await page.getByRole('button', { name: 'Reset Filters' }).click();
        await page.locator('div:nth-child(3) > div > .MuiButtonBase-root').click();
        await page.locator('.MuiBox-root > button:nth-child(3)').click();
        await page.locator('label').filter({ hasText: 'Data: Distribution of Cohort' }).locator('#types').selectOption('diagnosis_age_count');
        await page.getByRole('button', { name: 'Confirm' }).click();
        await page.locator('.MuiGrid-root > div:nth-child(2) > div > .MuiButtonBase-root').click();
        await page.locator('.MuiBox-root > button').first().click();
        await page.locator('div:nth-child(2) > div > .MuiPaper-root > .MuiCardContent-root > div:nth-child(2) > div:nth-child(2) > label > #types').selectOption('line');
        await expect(page.getByText('Chart Types:').nth(1)).toBeVisible();
    });

    test("Search Page Appearance ", async () => {
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
