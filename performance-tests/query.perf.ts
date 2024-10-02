import { test, expect, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/************************************
 * TESTING API CALLS THROUGH QUERY
 * 
 * These tests call some of Query's discovery and authorized endpoints to 
 * measure response times under various load conditions. 
 * Note: Access tokens are used for authentication during these calls.
 *************************************/

/*
 * =======================
 * Begin: Helper functions
 * =======================
 */
async function getEndpoint(page, request, endpoint) {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find(cookie => cookie.name === "access_token");
  let headers = {
    "Content-Type": "application/json",
     "Authorization": `Bearer ${sessionCookie.value}`,
  };
  const url = `http://localhost:1236/${endpoint}`;
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
  const response = await getEndpoint(page, request, "discovery/programs");
  expect(response.status()).toBe(200);
});

test("genomic_completeness", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "genomic_completeness");
  expect(response.status()).toBe(200);
});

test("discover query", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "discovery/query");
  expect(response.status()).toBe(200);
});

test("discover query with htsget", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "discovery/query?assembly=hg38&gene=LOC102723996"
  );
  expect(response.status()).toBe(200);
});

test("discover query with htsget and katsu", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "discovery/query?assembly=hg38&gene=LOC102723996&drug_name=Atezolizumab"
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
test("query", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "query");
  expect(response.status()).toBe(200);
});

test("query with htsget", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "query?assembly=hg38&gene=LOC102723996"
  );
  expect(response.status()).toBe(200);
});

test("query with htsget and katsu", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "query?assembly=hg38&gene=LOC102723996&drug_name=Atezolizumab",
  );
  expect(response.status()).toBe(200);
});

/*
 * =========================
 * End: Authorized endpoints
 * =========================
 */
