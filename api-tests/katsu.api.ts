import { test, expect, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const BASE_URL = `${process.env.BASE_URL}:8008/v3`

/**************************************
 * TESTING API CALLS THROUGH KATSU
 * 
 * These tests call some of Katsu's discovery and authorized endpoints to 
 * measure response times under various load conditions. 
 * Note: Access tokens are used for authentication during these calls.
 **************************************/

/*
 * =======================
 * Begin: Helper functions
 * =======================
 */
async function getEndpoint(page, request, endpoint, serviceToken = "") {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find((cookie) => cookie.name === "access_token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionCookie?.value}`,
  };
  if (serviceToken) {
    headers["X-Service-Token"] = serviceToken;
  }
  const url = `${BASE_URL}/${endpoint}`;
  return request.get(url, { headers });
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
test("service-info", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "service-info");
  expect(response.status()).toBe(200);
});

/*
 * =============
 * End: baseline
 * =============
 */

/*
 * ==========================
 * Begin: Discovery endpoints
 * ==========================
 */
test("discover programs", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "discovery/programs/");
  expect(response.status()).toBe(200);
});

test("discover individual_count", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "discovery/overview/individual_count/"
  );
  expect(response.status()).toBe(200);
});

/*
 * ========================
 * End: Discovery endpoints
 * ========================
 */

/*
 * ===========================
 * Begin: Authorized endpoints
 * ===========================
 */
test("Authorized donors", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "authorized/donors/");
  expect(response.status()).toBe(200);
});

test("Authorized treatments", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "authorized/treatments/");
  expect(response.status()).toBe(200);
});

test("Authorized donors with clinical data", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "authorized/donor_with_clinical_data/program/SYNTH_02/donor/DONOR_0021"
  );
  expect(response.status()).toBe(200);
});

/*
 * =========================
 * End: Authorized endpoints
 * =========================
 */

/*
 * =========================
 * Begin: Explorer endpoints
 * =========================
 */
test("Explorer donors", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "explorer/donors/",
    process.env.QUERY_SERVICE_TOKEN
  );
  expect(response.status()).toBe(200);
});

/*
 * =======================
 * End: Explorer endpoints
 * =======================
 */
