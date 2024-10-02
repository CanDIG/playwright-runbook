import { test, expect, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
  let url = "http://localhost:5080/federation/v1/fanout";
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
  const url = `http://localhost:5080/${endpoint}`;
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
test("service-info", async ({ request }) => {
  const response = await request.get("http://localhost:5080/hello");
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
test("summary individual_count", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary primary_site_count", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary cohort_count", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary patients_per_cohort", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary treatment_type_count", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary diagnosis_age_count", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary authorized donors", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/authorized/donors/",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary discovery program", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/programs",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("summary genomic_completeness", async ({ page, request }) => {
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
test("search sidebar", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/sidebar_list",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search patients_per_cohort", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/patients_per_cohort",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search authorized program", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/authorized/programs",
    payload: {},
    service: "katsu",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search genes", async ({ page, request }) => {
  const response = await postThroughTyk(
    page,
    request,
    "/genomics/htsget/v1/genes"
  );
  expect(response.status()).toBe(200);
});

test("search discovery query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/query",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("search authorized query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "query",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});
test("search authorized donor with clinical", async ({ page, request }) => {
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
test("completeness discovery query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/programs",
    payload: {},
    service: "query",
  };
  const response = await fanoutThroughFederation(page, request, data);
  expect(response.status()).toBe(200);
});

test("completeness authorized query", async ({ page, request }) => {
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
