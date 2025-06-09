import { expect } from "@playwright/test";

/*
* ==================
* Helper functions
* ==================
*/
export async function login(page, username, password) {
    await page.getByLabel("Username or email").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
}

// Charts
export async function testBarGraphHoverText({
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

export async function testStackedBarGraphHoverText({
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

// Search Page Componenets 
export async function fillCheckbox(page, checkboxSelector, value) {
    // Fill checkbox in dropdowns
    try {
        await page.fill(checkboxSelector, value);
        await page.getByRole('option', { name: `${value}` }).click();
    } catch (error) {
        console.error(`Error filling checkbox with value "${value}":`, error);
        throw error; // Re-throw the error to fail the test
    }
}

export const verifyPatientDataSection = async (page, expectedValues) => {
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
    await expandButton.click(); // Click to un-expand
};

export async function verifyClinicalTable(page, clinicalDataRows) {
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

export async function verifyGenomicTable(page, genomicDataRows) {
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

        
        const fields = [
            { field: "location", value: expected.location },
            { field: "donor_id", value: expected.donor_id },
            { field: "program_id", value: expected.program_id },
            { field: "variant_count", value: expected.variant_count },
            { field: "tumour_normal_designation", value: expected.tumour_normal_designation },
            { field: "submitter_sample_id", value: expected.submitter_sample_id }
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

export const clickSearchButton = async (page) => {
    // const searchButton = page.locator('button:has-text("Search")');
    const searchButton = page.locator('button:text("Search")');
    await searchButton.click();
};

export const clickResetButton = async (page) => {
    // const resetButton = page.locator('button:has-text("Reset")');
    const resetButton = page.locator('button:text("Reset")');
    await resetButton.click();
};

export const verifyPatientData = async (page, expectedValues) => {
    await verifyPatientDataSection(page, expectedValues);
};

export const verifyClinicalData = async (page, clinicalDataRows) => {
    await verifyClinicalTable(page, clinicalDataRows);
};

export const verifyGenomicData = async (page, genomicDataRows) => {
    await verifyGenomicTable(page, genomicDataRows);
};

export const selectPrimarySiteCheckbox = async (page, label) => {
    await fillCheckbox(page, '#checkboxes-tags-primary_site', label);
};

export const selectTreatmentCheckbox = async (page, label) => {
    await fillCheckbox(page, '#checkboxes-tags-treatment', label);
};

export const selectTreatmentAndDrug = async (page, treatment, drug) => {
    await fillCheckbox(page, '#checkboxes-tags-treatment', treatment);
    await fillCheckbox(page, '#checkboxes-tags-drug_name', drug);
};

export const selectDrugs = async (page, drugs) => {
    for (const drug of drugs) {
        await fillCheckbox(page, '#checkboxes-tags-drug_name', drug);
    }
};

// Endpoint call
export async function getEndpoint(page, endpoint, BASE_URL) {
    const { cookies } = await page.context().storageState();
    const sessionCookie = cookies.find(cookie => cookie.name === "session_id");
    const token = sessionCookie.value.split('|')[1]; 
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
    const url = `${BASE_URL}${endpoint}`;
    return fetch(url, { 
      method: "GET",
      headers 
    });
}

// Field Level Completeness 
export async function testFieldLevelHoverText({
    page,
    graphTitle,
    barIndex,
    expectedLabel,
    expectedValue,
  }) {
    // Locate the bar based on the graph title and bar index
    const selectedBar = await page
      .getByText(graphTitle)
      .locator("..")
      .locator("..")
      .locator('.highcharts-root > .highcharts-series-group > .highcharts-series > path')
      .nth(barIndex)

    // Hover over the selected bar
    await expect(selectedBar).toBeVisible();
    // Doesn't seem to work under any circumstances with Highcharts
    /* if (barIndex > 5) {
      // Scroll the scrollbar a bit down
      await page.locator('.highcharts-scrollbar-thumb').hover({ force: true });
      await page.mouse.down();
      await page.mouse.move(page.mouse._x, page.mouse._y + 100);
      await page.mouse.up();
    } */
    // NOTE: force: true is needed because highcharts intercepts the normal hover event
    await selectedBar.hover({ force: true });

    // Locate the tooltip relative to the graph title
    const tooltip = await page
      .getByText(graphTitle)
      .locator("..")
      .locator("..")
      .locator(".highcharts-tooltip")
      .nth(0);

    // Verify the tooltip text
    await expect(tooltip).toContainText(expectedLabel);
    await expect(tooltip).toContainText(expectedValue);
  }

export async function testFieldLevel(page, testCases, programName) {

    const fieldLevelGraph = await page
      .getByText("Field Level")
      .locator("..")
      .locator("..")
      .last();

    await expect(fieldLevelGraph).toHaveScreenshot(`FieldLevel-${programName}.png`, {
      maxDiffPixelRatio: 0.05,
    });
    // Sort the percentages
    testCases.sort((a, b) => a.label.localeCompare(b.label));
    testCases.sort((a, b) => a.pct - b.pct);
    testCases.forEach((datum, index) => {
      datum.value = `${datum.pct}%`;
      datum.barIndex = index;
    });
    for (const {label, value, barIndex } of testCases) {
      // DEBUG: Currently there is no way to scroll this particular graph
      // So, we'll do only one page of results
      if (barIndex > 10) {
        break;
      }
      await testFieldLevelHoverText({
        page,
        graphTitle: "Field Level",
        barIndex,
        expectedLabel: label,
        expectedValue: value,
      });
    }
  }

export async function fieldLevelCompletenessTest(page, BASE_URL) {
    // Wait for the page to finish loading the field level completeness component
    await expect(page.getByText("Field Level")
      .locator("..")
      .locator(".."))
      .toHaveText(/.+Radiations.+/i);
  
    // Use your existing getEndpoint helper to fetch the data
    const response = await getEndpoint(page, "query/discovery/programs", BASE_URL);
    const data = await response.json();
  
    let lastButtonText = /All programs/;
    const allCases = {};
  
    for (const program of data.programs) {
      const programButton = await page.getByText(lastButtonText).first();
      // Switch display to this particular program
      await programButton.click();
  
      lastButtonText = new RegExp(`.+ ${program.program_id}`, "i");
      await page.getByRole('option', { name: lastButtonText }).click();
  
      const completenessData = program.metadata.required_but_missing;
      const categories = Object.keys(completenessData);
  
      const testCases = categories.flatMap(category => 
        Object.keys(completenessData[category]).map(key => {
          const label = `${category}/${key}`;
          const pct = Math.round((1 - (completenessData[category][key].missing / completenessData[category][key].total)) * 100);
  
          // Accumulate for allCases
          if (allCases[label]) {
            allCases[label].missing += completenessData[category][key].missing;
            allCases[label].total += completenessData[category][key].total;
          } else {
            allCases[label] = {
              missing: completenessData[category][key].missing,
              total: completenessData[category][key].total,
            };
          }
  
          return { label, pct, value: 'NA', barIndex: 0 };
        })
      );
  
      await testFieldLevel(page, testCases, program.program_id);
    }
  
    // Final round for "all programs"
    await page.getByText(lastButtonText).first().click();
    await page.getByRole('option', { name: "All programs" }).click();
    await page.waitForTimeout(1000);
  
    const allCasesList = Object.keys(allCases).map(label => ({
      label,
      pct: Math.round((1 - (allCases[label].missing / allCases[label].total)) * 100),
      value: 'NA',
      barIndex: 0,
    }));
  
    await testFieldLevel(page, allCasesList, 'allprograms');
  }
