import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { VIEWPORT } from './constants';
import {
  login,
} from './helpers.ts';

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
        await page.goto(`${config.url}patientView?patientId=local-DONOR_0021&programId=local-SYNTH_02&location=local`);
    } catch (error) {
      console.error("Error during test setup:", error);
      throw error;
    }
  });

async function verifyPatientInfoTable(fields, patientInfoDataRows, additionalMatchField = null) {
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


  test("Biomarkers", async () => {
    
    const fields = [
        { field: "er_percent_positive" },
        { field: "er_status" },
        { field: "her2_ihc_status" },
        { field: "her2_ish_status" },
        { field: "hpv_ihc_status" },
        { field: "hpv_pcr_status" },
        { field: "hpv_strain" },
        { field: "pr_percent_positive" },
        { field: "pr_status" }
    ];

    const patientInfoDataRows = [
        {
            er_percent_positive: "86.03",
            er_status: "Positive",
            her2_ihc_status: "Positive",
            her2_ish_status: "Cannot be determined",
            hpv_ihc_status: "Positive",
            hpv_pcr_status: "Not available",
            hpv_strain: "HPV16, HPV66, HPV52",
            pr_percent_positive: "61.31",
            pr_status: "Positive"
        }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
  });

  test("Primary Diagnoses", async () => {
    await page.getByRole('button', { name: 'Primary Diagnoses' }).click();
    
    const fields = [
      { field: "submitter_primary_diagnosis_id" },
      { field: "basis_of_diagnosis" },
      { field: "clinical_stage_group" },
      { field: "clinical_tumour_staging_system" },
      { field: "date_of_diagnosis" },
      { field: "pathological_stage_group" },
      { field: "pathological_tumour_staging_system" },
      { field: "primary_site"}
  ];
    const patientInfoDataRows = [
        {
          submitter_primary_diagnosis_id: "local-DIAG_0021",
          basis_of_diagnosis: "Clinical",
          clinical_stage_group: "Stage III",
          clinical_tumour_staging_system: "St Jude staging system",
          date_of_diagnosis: "39",
          pathological_stage_group: "In situ",
          pathological_tumour_staging_system: "International Neuroblastoma Risk Group Staging System",
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
      { field: "percent_tumour_cells_measurement_method" },
      { field: "percent_tumour_cells_range" },
      { field: "reference_pathology_confirmed_tumour_presence" },
      { field: "specimen_anatomic_location" },
      { field: "specimen_collection_date"},
      { field: "specimen_laterality" },
      { field: "specimen_processing" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_specimen_id: "local-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        percent_tumour_cells_measurement_method: "Pathology estimate by percent nuclei",
        percent_tumour_cells_range: "51-100%",
        reference_pathology_confirmed_tumour_presence: "Not available",
        specimen_anatomic_location: "C10.4",
        specimen_collection_date: "0y 2m 17d",
        specimen_laterality: "Left",
        specimen_processing: "Other"
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
      { field: "specimen_type"},
      { field: "tumour_normal_designation" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_sample_id: "local-SAMPLE_0061",
        submitter_specimen_id: "local-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        sample_type: "Other DNA enrichments",
        specimen_tissue_source: "Bone marrow fluid",
        specimen_type: "",
        tumour_normal_designation: "Normal"
      },
      { 
        submitter_sample_id: "local-SAMPLE_0062",
        submitter_specimen_id: "local-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        sample_type: "rRNA-depleted RNA",
        specimen_tissue_source: "Pancreatic fluid",
        specimen_type: "Primary tumour",
        tumour_normal_designation: "Tumour"
      },
      { 
        submitter_sample_id: "local-SAMPLE_0063",
        submitter_specimen_id: "local-SPECIMEN_0021",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        sample_type: "Amplified DNA",
        specimen_tissue_source: "Bone marrow fluid",
        specimen_type: "Primary tumour - additional new primary",
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
      { field: "status_of_treatment"},
      { field: "treatment_end_date" },
      { field: "treatment_intent" },
      { field: "treatment_start_date" },
      { field: "treatment_type" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "local-TREATMENT_0041",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        is_primary_treatment: "Yes",
        response_to_treatment: "Immune stable disease (iSD)",
        status_of_treatment: "",
        treatment_end_date: "0y 8m 24d",
        treatment_intent: "",
        treatment_start_date: "0y 4m 8d",
        treatment_type: "Other, Bone marrow transplant, Surgery, Systemic therapy"
      },
      { 
        submitter_treatment_id: "local-TREATMENT_0042",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        is_primary_treatment: "No",
        response_to_treatment: "Complete remission without measurable residual disease (CR MRD-)",
        status_of_treatment: "Treatment incomplete due to technical or organizational problems",
        response_to_treatment_criteria_method: "RECIST 1.1",
        treatment_end_date: "0y 9m 15d",
        treatment_intent: "Palliative",
        treatment_start_date: "0y 3m 8d",
        treatment_type: "Other, Systemic therapy, Stem cell transplant, Radiation therapy"
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
      { field: "date_of_followup"},
      { field: "disease_status_at_followup" },
      { field: "method_of_progression_status"},
      { field: "relapse_type" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_follow_up_id: "local-FOLLOW_UP_0011",
        submitter_treatment_id: "local-TREATMENT_0041",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        date_of_followup: "1y 4m 17d",
        disease_status_at_followup: "Progression not otherwise specified",
        method_of_progression_status: "Physical examination procedure (procedure), Imaging (procedure), Laboratory data interpretation (procedure)",
        relapse_type: "Progression"
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
      { field: "margin_types_not_assessed"},
      { field: "margin_types_not_involved"},
      { field: "perineural_invasion"},
      { field: "residual_tumour_classification" }
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "local-TREATMENT_0041",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        greatest_dimension_tumour: "10",
        lymphovascular_invasion: "Not applicable",
        margin_types_involved: "Distal margin",
        margin_types_not_assessed: "Common bile duct margin, Circumferential resection margin, Proximal margin",
        margin_types_not_involved: "Common bile duct margin, Distal margin, Proximal margin",
        perineural_invasion: "Not applicable",
        residual_tumour_classification: "R0"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  // Duplicate Matching Ids
  // test("Systemic Therapies", async () => {
  //   await page.getByText('Treatments').first().click();
  //   await page.getByText('Systemic Therapies').click();
    
  //   const fields = [
  //     { field: "submitter_treatment_id" },
  //     { field: "submitter_primary_diagnosis_id" },
  //     { field: "actual_cumulative_drug_dose" },
  //     { field: "days_per_cycle" },
  //     { field: "drug_dose_units" },
  //     { field: "drug_name" },
  //     { field: "drug_reference_database" },
  //     { field: "drug_reference_identifier" },
  //     { field: "end_date" }
  //   ];
  //   const patientInfoDataRows = [
  //     { 
  //       submitter_treatment_id: "local-TREATMENT_0041",
  //       submitter_primary_diagnosis_id: "local-DIAG_0021",
  //       actual_cumulative_drug_dose: "99.6",
  //       days_per_cycle: "11",
  //       drug_dose_units: "mg/kg",
  //       drug_name: "Carboplatin",
  //       drug_reference_database: "PubChem",
  //       drug_reference_identifier: "426756",
  //       end_date: "0y 6m 10d"
  //     },
  //     { 
  //       submitter_treatment_id: "local-TREATMENT_0041",
  //       submitter_primary_diagnosis_id: "local-DIAG_0021",
  //       actual_cumulative_drug_dose: "87.3",
  //       days_per_cycle: "16",
  //       drug_dose_units: "",
  //       drug_name: "Degarelix",
  //       drug_reference_database: "NCI Thesaurus",
  //       drug_reference_identifier: "C48385",
  //       end_date: "0y 8m 10d"
  //     },
  //     { 
  //       submitter_treatment_id: "local-TREATMENT_0041",
  //       submitter_primary_diagnosis_id: "local-DIAG_0021",
  //       actual_cumulative_drug_dose: "",
  //       days_per_cycle: "2",
  //       drug_dose_units: "",
  //       drug_name: "Paclitaxel",
  //       drug_reference_database: "RxNorm",
  //       drug_reference_identifier: "56946",
  //       end_date: "0y 9m 15d"
  //     },
  //     { 
  //       submitter_treatment_id: "local-TREATMENT_0042",
  //       submitter_primary_diagnosis_id: "local-DIAG_0021",
  //       actual_cumulative_drug_dose: "54.7",
  //       days_per_cycle: "26",
  //       drug_dose_units: "IU/kg",
  //       drug_name: "Fluoxymesterone",
  //       drug_reference_database: "RxNorm",
  //       drug_reference_identifier: "4494",
  //       end_date: "0y 8m 22d"
  //     }
  //   ];

  //   await verifyPatientInfoTable(fields, patientInfoDataRows);
  //   await page.getByText('Treatments').first().click();
  // });

  test("Radiations", async () => {
    await page.getByText('Treatments').first().click();
    await page.getByText('Radiations').click();
    
    const fields = [
      { field: "submitter_treatment_id" },
      { field: "submitter_primary_diagnosis_id" },
      { field: "anatomical_site_irradiated" },
      { field: "radiation_boost" },
      { field: "radiation_therapy_modality" },
      { field: "radiation_therapy_type"}
    ];
    const patientInfoDataRows = [
      { 
        submitter_treatment_id: "local-TREATMENT_0042",
        submitter_primary_diagnosis_id: "local-DIAG_0021",
        anatomical_site_irradiated: "WHOLE BODY - SKIN",
        radiation_boost: "No",
        radiation_therapy_modality: "Teleradiotherapy using electrons (procedure)",
        radiation_therapy_type: "External"
      }
    ];

    await verifyPatientInfoTable(fields, patientInfoDataRows);
    await page.getByText('Treatments').first().click();
  });

  test("Timeline", async () => {
    const timelineGraph = await page.getByText("Patient Timeline").locator("..");

    await expect(timelineGraph).toHaveScreenshot(`timelineGraph.png`, { threshold: 0.2, timeout: 10_000 });
  });

  test.afterAll(async () => {
      // Cleanup after all tests
      await page.close();
      await context.close();
  });
});