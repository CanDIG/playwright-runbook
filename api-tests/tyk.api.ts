import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const TYK_URL = process.env.CANDIG_URL!

/**************************************
 * TESTING API CALLS THROUGH TYK
 * 
 * These tests simulate the typical API calls a user makes 
 * when interacting with the data-portal.
 * Note: The refresh token is used since these calls are made via the frontend.
 **************************************/

/*
 * =======================
 * Begin: Helper functions
 * =======================
 */
async function fanoutThroughFederation(page, request, data) {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === "refresh_token"
  );
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionCookie?.value}`,
  };
  let url = `${TYK_URL}/federation/v1/fanout`;
  return request.post(url, { headers, data });
}

async function postThroughTyk(page, request, endpoint) {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === "refresh_token"
  );
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionCookie?.value}`,
  };
  const url = `${TYK_URL}/${endpoint}`;
  return request.post(url, { headers });
}

/*
 * =====================
 * End: Helper functions
 * =====================
 */

/*
 * ===============
 * Begin: baseline
 * ===============
 */
test("tyk service-info", async ({ request }) => {
  const response = await request.get(`${TYK_URL}/hello`);
  expect(response.status()).toBe(200);
});

/*
 * =============
 * End: baseline
 * =============
 */

/*
 * =============================
 * Begin: Summary page endpoints
 * =============================
 */
test("summary page katsu v3/discovery/overview/individual_count/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page katsu v3/discovery/overview/primary_site_count/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/primary_site_count/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page katsu v3/discovery/overview/cohort_count/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/cohort_count/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page katsu v3/discovery/overview/patients_per_cohort/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/patients_per_cohort/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page katsu v3/discovery/overview/treatment_type_count/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/treatment_type_count/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page katsu v3/discovery/overview/diagnosis_age_count/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/diagnosis_age_count/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page katsu v3/authorized/donors/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/authorized/donors/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page query discovery/programs", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/programs",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary page query genomic_completeness", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "genomic_completeness",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

/*
 * ===========================
 * End: Summary page endpoints
 * ===========================
 */

/*
 * ============================
 * Start: Search page endpoints
 * ============================
 */
test("search page katsu v3/discovery/sidebar_list/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/sidebar_list/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search page katsu v3/discovery/overview/patients_per_cohort/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/patients_per_cohort/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search page katsu v3/authorized/programs/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/authorized/programs/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search page htsget /genomics/htsget/v1/genes", async ({ page, request }) => {
  const response = await postThroughTyk(
    page,
    request,
    "/genomics/htsget/v1/genes"
  );
  expect(response.status()).toBe(200);
});

test("search page query discovery/query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/query",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search page query query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "query",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search page katsu v3/authorized/donor_with_clinical_data/", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/authorized/donor_with_clinical_data/program/SYNTH_01/donor/DONOR_0001",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

/*
 * ==========================
 * End: Search page endpoints
 * ==========================
 */

/*
 * ==================================
 * Start: Completeness page endpoints
 * ==================================
 */
test("completeness page query discovery/programs", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/programs",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("completeness page query genomic_completeness", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "genomic_completeness",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

/*
 * ================================
 * End: Completeness page endpoints
 * ================================
 */
