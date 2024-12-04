import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT } from './constants';
import {
  login,
  testBarGraphHoverText,
} from './helpers.ui.ts';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

test.describe("Patient Info Page", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    const config = {
      url: process.env.CANDIG_URL,
      username: process.env.CANDIG_USERNAME,
      password: process.env.CANDIG_PASSWORD,
    };

    context = await browser.newContext({
      viewport: { width: VIEWPORT.WIDTH, height: VIEWPORT.HEIGHT },
    });
  
    page = await context.newPage();
  
    try {
        await page.goto(config.url);
        await login(page, config.username, config.password);
        await page.goto("http://candig.docker.internal:5080/patientView?patientId=LOCAL-DONOR_0021&programId=LOCAL-SYNTH_02&location=LOCAL");
    
    } catch (error) {
      console.error("Error during test setup:", error);
      throw error;
    }
  });

async function verifyPatientInfoTable(fields, patientInfoDataRows) {
    await page.waitForTimeout(2000); 
    const patientInfoTable = await page.getByRole('grid').first();
    await expect(patientInfoTable).toBeVisible();

    const tableRowsLocator = patientInfoTable.getByRole('row');
    const rowCount = await tableRowsLocator.count();

    console.log("Total rows in table:", rowCount);
    await expect(rowCount).toEqual(patientInfoDataRows.length + 1);

    for (const expected of patientInfoDataRows) {
        // Locate the row based on the first field in the expected object
        const [firstField] = Object.keys(expected);
        const rowLocator = tableRowsLocator
            .locator(`text=${expected[firstField]}`)
            .first()
            .locator('..')
            .locator('..');

        await patientInfoTable.scrollIntoViewIfNeeded();
        await expect(rowLocator).toBeVisible();

        for (const { field } of fields) {
            const value = expected[field];
            const fieldLocator = rowLocator.locator(`[data-field="${field}"]`).locator(`text=${value}`);
            await expect(fieldLocator)[value === '' ? 'toBeHidden' : 'toBeVisible']();
        }
    }
}

  
  /*
  * ==================
  * Tests
  * ==================
  */


  test("Landing Page", async () => {
    
    const fields = [
        { field: "cea" },
        { field: "er_status" },
        { field: "her2_ihc_status" },
        { field: "her2_ish_status" },
        { field: "hpv_ihc_status" },
        { field: "hpv_pcr_status" },
        { field: "pr_status" },
        { field: "psa_level" }
    ];

    const patientInfoDataRows = [
        {
            cea: "95",
            er_status: "Negative",
            her2_ihc_status: "Equivocal",
            her2_ish_status: "Negative",
            hpv_ihc_status: "Cannot be determined",
            hpv_pcr_status: "Positive",
            pr_status: "Cannot be determined",
            psa_level: "64"
        }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
  });

  test("Priamry Site", async () => {
    await page.getByRole('button', { name: 'Primary Diagnoses' }).click();
    
    const fields = [
      { field: "submitter_primary_diagnosis_id" },
      { field: "cancer_type_code" },
      { field: "clinical_stage_group" },
      { field: "date_of_diagnosis" },
      { field: "laterality" },
      { field: "pathological_stage_group" },
      { field: "pathological_tumour_staging_system"},
      { field: "primary_site" }
  ];
    const patientInfoDataRows = [
        {
          submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
          cancer_type_code: "C17",
          clinical_stage_group: "Stage IA2",
          date_of_diagnosis: "42",
          laterality: "Midline",
          pathological_stage_group: "Localized",
          pathological_tumour_staging_system: "Not available",
          primary_site: "Breast"
        }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
  });

  test("Specimens", async () => {
    await page.getByText('Specimens').first().click();
    
    const fields = [
      { field: "submitter_specimen_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "percent_tumour_cells_range" },
      { field: "reference_pathology_confirmed_diagnosis" },
      { field: "specimen_anatomic_location" },
      { field: "specimen_laterality" },
      { field: "specimen_processing"},
      { field: "specimen_storage" },
      { field: "tumour_grade" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_specimen_id: "LOCAL-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        percent_tumour_cells_range: "51-100%",
        reference_pathology_confirmed_diagnosis: "No",
        specimen_anatomic_location: "C33.9",
        specimen_laterality: "Not available",
        specimen_processing: "Cryopreservation in dry ice (dead tissue)",
        specimen_storage: "Other",
        tumour_grade: "High"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Specimens').first().click();
  });

  test("Sample Registrations", async () => {
    await page.getByText('Specimens').first().click();
    await page.getByText('Sample Registrations').click();
    
    const fields = [
      { field: "submitter_sample_id" },
      { field: "submitter_specimen_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "sample_type" },
      { field: "specimen_tissue_source" },
      { field: "tumour_normal_designation" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_sample_id: "LOCAL-SAMPLE_0061",
        submitter_specimen_id: "LOCAL-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        sample_type: "Other DNA enrichments",
        specimen_tissue_source: "Pancreatic fluid",
        tumour_normal_designation: "Normal"
      },
      { 
        submitter_sample_id: "LOCAL-SAMPLE_0062",
        submitter_specimen_id: "LOCAL-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        sample_type: "Other DNA enrichments",
        specimen_tissue_source: "Bone marrow fluid",
        tumour_normal_designation: "Tumour"
      },
      { 
        submitter_sample_id: "LOCAL-SAMPLE_0063",
        submitter_specimen_id: "LOCAL-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        sample_type: "Total DNA",
        specimen_tissue_source: "Pancreatic fluid",
        tumour_normal_designation: ""
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Specimens').first().click();
  });

  test("Treatments", async () => {
    await page.getByText('Treatments').first().click();
    
    const fields = [
      { field: "submitter_treatment_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "is_primary_treatment" },
      { field: "response_to_treatment" },
      { field: "response_to_treatment_criteria_method" },
      { field: "treatment_end_date" },
      { field: "treatment_intent" },
      { field: "treatment_start_date" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0041",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        is_primary_treatment: "No",
        response_to_treatment: "",
        response_to_treatment_criteria_method: "Physician Assessed Response Criteria",
        treatment_end_date: "0y 9m 28d",
        treatment_intent: "",
        treatment_start_date: "0y 4m 18d"
      },
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0042",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        is_primary_treatment: "Yes",
        response_to_treatment: "No evidence of disease (NED)",
        response_to_treatment_criteria_method: "RECIST 1.1",
        treatment_end_date: "0y 8m 9d",
        treatment_intent: "Palliative",
        treatment_start_date: ""
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  test("Followups", async () => {
    await page.getByText('Treatments').first().click();
    await page.getByText('Followups').click();
    
    const fields = [
      { field: "submitter_follow_up_id" },
      { field: "submitter_treatment_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "method_of_progression_status" },
      { field: "relapse_type" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_follow_up_id: "LOCAL-FOLLOW_UP_0011",
        submitter_treatment_id: "LOCAL-TREATMENT_0041",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        method_of_progression_status: "Imaging (procedure), Tumor marker measurement (procedure)",
        relapse_type: "Biochemical progression"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  test("Surgeries", async () => {
    await page.getByText('Treatments').first().click();
    await page.getByText('Surgeries').click();

    const fields = [
      { field: "submitter_treatment_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "greatest_dimension_tumour" },
      { field: "lymphovascular_invasion" },
      { field: "margin_types_involved" },
      { field: "residual_tumour_classification" },
      { field: "surgery_location" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0041",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        greatest_dimension_tumour: "6",
        lymphovascular_invasion: "Not applicable",
        margin_types_involved: "Proximal margin",
        residual_tumour_classification: "Not applicable",
        surgery_location: "Local recurrence"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  test("Systemic Therapies", async () => {
    await page.getByText('Treatments').first().click();
    await page.getByText('Systemic Therapies').click();
    
    const fields = [
      { field: "submitter_treatment_id" },
      { field: "submitter_primary_diagnosis_id" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0041",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021"
      },
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0041",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021"
      },
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0042",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021"
      },
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0042",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  test("Radiations", async () => {
    await page.getByText('Treatments').first().click();
    await page.getByText('Radiations').click();
    
    const fields = [
      { field: "submitter_treatment_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "anatomical_site_irradiated" },
      { field: "radiation_boost" },
      { field: "radiation_therapy_modality" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "LOCAL-TREATMENT_0042",
        submitter_primary_diagnosis_id: "LOCAL-DIAG_0021",
        anatomical_site_irradiated: "COCCYX",
        radiation_boost: "No",
        radiation_therapy_modality: "Teleradiotherapy neutrons (procedure)"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  test.afterAll(async () => {
      // Cleanup after all tests
      await page.close();
      await context.close();
  });
});
