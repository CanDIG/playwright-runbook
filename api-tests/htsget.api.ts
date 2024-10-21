import { test, expect, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const BASE_URL = 'http://localhost:3333' // local

/*************************************
 * TESTING API CALLS THROUGH HTSGET
 *
 * These tests call some of Htsget's endpoints to
 * measure response times under various load conditions.
 * Note: Access tokens are used for authentication during these calls.
 *************************************/

/*
 * =======================
 * Begin: Helper functions
 * =======================
 */
async function getEndpoint(page, request, endpoint, serviceToken = "") {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === "access_token"
  );
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionCookie?.value}`,
  };
  const url = `${BASE_URL}/${endpoint}`;
  return request.get(url, { headers });
}

async function postEndpoint(page, request, endpoint, data) {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === "access_token"
  );
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionCookie?.value}`,
  };
  const url = `${BASE_URL}/${endpoint}`;
  return request.get(url, { headers, data });
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
  const response = await getEndpoint(
    page,
    request,
    "ga4gh/drs/v1/service-info"
  );
  expect(response.status()).toBe(200);
});

/*
 * =============
 * End: baseline
 * =============
 */

/*
 * ==========================
 * Begin: htsget endpoints
 * ==========================
 */
test("completeness", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "htsget/v1/samples");
  expect(response.status()).toBe(200);
});

test("genes", async ({ page, request }) => {
  const response = await getEndpoint(page, request, "htsget/v1/genes");
  expect(response.status()).toBe(200);
});

test("samples", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "htsget/v1/samples/SAMPLE_NULL_0001"
  );
  expect(response.status()).toBe(200);
});

test("variant", async ({ page, request }) => {
  const response = await getEndpoint(
    page,
    request,
    "htsget/v1/variants/data/multisample_1"
  );
  expect(response.status()).toBe(200);
});

/*
 * ========================
 * End: htsget endpoints
 * ========================
 */

/*
 * ===========================
 * Begin: beacon endpoints
 * ===========================
 */
test("beacon gene_id", async ({ page, request }) => {
  const data = {
    query: {
      requestParameters: {
        gene_id: "SLX9",
      },
    },
    meta: {
      apiVersion: "v2",
    },
  };
  const response = await postEndpoint(
    page,
    request,
    "beacon/v2/g_variants",
    data
  );
  expect(response.status()).toBe(200);
});

test("beacon pos", async ({ page, request }) => {
  const data = {
    query: {
      requestParameters: {
        assemblyId: "hg38",
        referenceName: "1",
        start: [16565700],
        end: [16565800],
      },
    },
    meta: {
      apiVersion: "v2",
    },
  };
  const response = await postEndpoint(
    page,
    request,
    "beacon/v2/g_variants",
    data
  );
  expect(response.status()).toBe(200);
});

/*
 * ===========================
 * End: beacon endpoints
 * ===========================
 */
