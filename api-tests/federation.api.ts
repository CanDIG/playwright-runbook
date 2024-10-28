import { test, expect, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const BASE_URL = `${process.env.BASE_URL}:4232/federation/v1`

/*****************************************
 * TESTING API CALLS THROUGH FEDERATION
 * 
 * These tests call some of Federation's Katsu and Query endpoints to 
 * measure response times under various load conditions. 
 * Note: Access tokens are used for authentication during these calls.
 *****************************************/

/*
 * =======================
 * Begin: Helper functions
 * =======================
 */
async function postEndpoint(page, request, data) {
  const { cookies } = await page.context().storageState();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === "access_token"
  );
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionCookie?.value}`,
  };
  let url = `${BASE_URL}/fanout`;
  return request.post(url, { headers, data });
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
  const response = await request.get(
    `${BASE_URL}/service-info`
  );
  expect(response.status()).toBe(200);
});

/*
 * =============
 * End: baseline
 * =============
 */

/*
 * ======================
 * Begin: Katsu endpoints
 * ======================
 */
test("federation individual_count", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/discovery/overview/individual_count",
    payload: {},
    service: "katsu",
  };
  const response = await postEndpoint(page, request, data);
  expect(response.status()).toBe(200);
});

test("federation authorized donors", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "v3/authorized/donors/",
    payload: {},
    service: "katsu",
  };
  const response = await postEndpoint(page, request, data);
  expect(response.status()).toBe(200);
});

/*
 * ====================
 * End: Katsu endpoints
 * ====================
 */

/*
 * ======================
 * Begin: Query endpoints
 * ======================
 */
test("federation discovery program", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/programs",
    payload: {},
    service: "query",
  };
  const response = await postEndpoint(page, request, data);
  expect(response.status()).toBe(200);
});

test("federation genomic_completeness", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "genomic_completeness",
    payload: {},
    service: "query",
  };
  const response = await postEndpoint(page, request, data);
  expect(response.status()).toBe(200);
});

test("federation discovery query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "discovery/query",
    payload: {},
    service: "query",
  };
  const response = await postEndpoint(page, request, data);
  expect(response.status()).toBe(200);
});

test("federation authorized query", async ({ page, request }) => {
  const data = {
    method: "GET",
    path: "query",
    payload: {},
    service: "query",
  };
  const response = await postEndpoint(page, request, data);
  expect(response.status()).toBe(200);
});

/*
 * ====================
 * End: Query endpoints
 * ====================
 */