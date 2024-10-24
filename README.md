# CanDIGv2 Playwright Runbook

This repository provides a Playwright-based framework for automated UI and API performance testing of CanDIG systems. It includes scripts to run tests on local, development, or production server (with limited access) to make sure both frontend and backend meet expectations.

## Installing Playwright

[Playwright](https://playwright.dev/) requires [Node.js](https://nodejs.org/en/download/package-manager).

Clone the repository and execute the following commands:

```bash
cd playwright-runbook
npm install
npx playwright install
```

## Configuring Environment Variables

Rename `.env.sample` to `.env`, and update the environment values. Credentials can be found in the `CanDIGv2/tmp/keycloak` folder.

For local testing:

- Set the URL to `localhost` or `candig.docker.internal`.

For dev testing:

- Set the URL to your dev server (e.g., `candig-dev.hpc4health.local`)

For prod testing:

- Set the URL to your production server (e.g., `candig.uhnresearch.ca`).

Note: The `QUERY_SERVICE_TOKEN` can be ignored unless you want to run katsu explorer api.

## Running Tests

It is recommended to run UI or API tests separately with specific settings. Make sure the URL is set and the target server (local/dev/prod) is running.

### For UI

```bash
npx playwright test --project=ui --workers=1          # Run all tests with a single worker
npx playwright test --project=ui --ui                 # Run interactive mode
npx playwright test summary                           # Run a specific file
npx playwright test summary -g "diagnosis graph"      # Run a single test
```

### For API

```bash
npx playwright test --project=api --workers=100 --repeat-each=100   # Adjust the number as needed
npx playwright test tyk                                # Run a specific file
npx playwright test tyk -g "tyk service-info"          # Run a single test
```

## Test Folders

There are two main groups of tests, each organized into its own folder: `ui-tests` and `api-tests`.

### UI Tests

The `ui-tests` folder contains tests that simulate user interactions with the data portal. These tests verify basic frontend functionality, such as:

- Page loading
- Component rendering
- Button clicks
- URL redirection
- Display of expected results (e.g., number of cohorts, patients)

All UI tests should be placed in the `ui-tests` folder and use the `.ui.ts` extension for proper test matching.

### API Tests

The `api-tests` folder contains a series of API calls to assess service performance, primarily focusing on API response times. It is recommended to run API tests only with parallel workers and repeat tests multiple times to gather sufficient data for later [analysis](https://github.com/CanDIG/playwright-notebook).

All api tests should be placed in the `api-tests` folder and use the `.api.ts` extension for proper test matching.

Note: Only the Tyk API test is needed for general performance.

## Checklist

The test results assumed using a small dataset and login as user2.

Below is a list of the tests covered on the Summary page:

| **Category**                     | **Subcategory**                       | **Expected Value**                            |
|----------------------------------|---------------------------------------|--------------------------------------|
| **Overview**                     | Number of patients                    | 84                                   |
|                                  | Number of cohorts                     | 4                                    |
|                                  | Number of nodes                       | 1                                    |
|                                  | Number of provinces                   | 1                                    |
| **Diagnosis**                    | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/0b0f4dc3-4ead-4368-bb20-361afd59f7c4)                                   |
|                                  | Patients (30-39)                      | 11                                   |
|                                  | Patients (40-49)                      | 24                                   |
|                                  | Patients (50-59)                      | 31                                   |
|                                  | Patients (null)                       | 18                                   |
| **Treatment**                    | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/b0e39872-357d-4082-acfa-c23b6c3b6b07)  |
|                                  | Systemic therapy                      | 168                                  |
|                                  | Surgery                               | 92                                   |
|                                  | Radiation therapy                     | 77                                   |
|                                  | Targeted molecular therapy            | 34                                   |
|                                  | Bone marrow transplant                | 33                                   |
|                                  | Stem cell transplant                  | 30                                   |
|                                  | Other                                 | 24                                   |
|                                  | Photodynamic                          | 18                                   |
| **Primary Site**                 | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/56e68024-9f4b-47ab-b82a-19e1c2a182de)  |
|                                  | Null                                  | 26                                   |
|                                  | Breast                                | 16                                   |
|                                  | Skin                                  | 16                                   |
|                                  | Colon                                 | 16                                   |
|                                  | Bronchus and lung                     | 16                                   |
|                                  | Floor of mouth                        | Hidden (less than 10)                 |
| **Cohort**                       | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/9f8ab2c6-11bd-4edd-b436-483faf174f12)  |
|                                  | Synthetic dataset 1                   | 24                                   |
|                                  | Synthetic dataset 2                   | 20                                   |
|                                  | Synthetic dataset 3                   | 20                                   |
|                                  | Synthetic dataset 4                   | 20                                   |
| **Clinical**                     | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/a5c4d3bf-91d6-4c61-9c6c-8ef3976ca4cb)  |
| **Genomic**                      | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/cf1c90c3-4667-46d8-9a25-295e5611f9ae)  |
|                                  | Synthetic dataset 1                   | 6                                    |
|                                  | Synthetic dataset 2                   | 5                                    |
| **Footer**                       | Graph                                 | ![Diagnosis Graph](https://github.com/user-attachments/assets/2a1c2933-e4d0-48a0-b929-a51743f17a5d) |
| **Link Section**                 | CanDIG                                | Yes                                  |
|                                  | CanDIG GitHub                         | Yes                                  |
|                                  | CanDIG version                        | Yes                                  |
|                                  | TFRI                                  | Yes                                  |
|                                  | UHN                                   | Yes                                  |
|                                  | BCGSC                                 | Yes                                  |
|                                  | C3G                                   | Yes                                  |
|                                  | Logo                                  | Yes                                  |
|                                  | Log in                                | Yes                                  |
|                                  | Log out                               | Yes                                  |

## Updating the Tests

Adjust the test for different dataset or different user.

### UI Tests

For UI tests, delete all the snapshots inside the `snapshots` folder and rerun the tests. This will generate new snapshots. Then, update the expected values in each test accordingly.

### API Tests

API tests do not verify the returned values. Simply create or delete the relevant endpoint tests as needed.

## Report

Test reports are available in the `playwright-report` and `blob-report` directories.

**Note:** Reports are overwritten each time the tests are run. To keep a report, rename the files before running new tests.
