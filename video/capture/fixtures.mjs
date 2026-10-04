// One fictional dataset threaded through every beat of the video.
// Nothing here is real: acme.dev hosts, customers, and the JWT are all made up.

const orders = [
  { id: 104201, customer: "ada@acme.dev", total: 129.5, currency: "USD", status: "paid", items: 3, created_at: "2026-10-01T09:14:00Z" },
  { id: 104202, customer: "lin@acme.dev", total: 48, currency: "EUR", status: "refunded", items: 1, created_at: "2026-10-01T11:02:00Z" },
  { id: 104203, customer: "sam@acme.dev", total: 310.75, currency: "USD", status: "paid", items: 5, created_at: "2026-10-02T16:40:00Z" },
  { id: 104204, customer: "ravi@acme.dev", total: 19.99, currency: "INR", status: "pending", items: 1, created_at: "2026-10-03T08:27:00Z" },
];

// Order ids the API knows about (left list) vs. ids present in the database
// (right list): some never made it to the database, some exist only there.
const FIRST_ID = 100001;
const API_COUNT = 5000;
const DB_EXTRA = 188;
const apiIds = Array.from({ length: API_COUNT }, (_, i) => FIRST_ID + i);
const missingInDb = (id) => id % 13 === 5;
const dbIds = [
  ...apiIds.filter((id) => !missingInDb(id)),
  ...Array.from({ length: DB_EXTRA }, (_, i) => FIRST_ID + API_COUNT + i),
];

/** What the list diff must report; the capture script asserts against these. */
export const EXPECTED = {
  left: apiIds.filter(missingInDb).length,
  right: DB_EXTRA,
  common: dbIds.length - DB_EXTRA,
};

/** What a developer actually pastes: a minified API response.
 *  The graph view refuses documents over 1,200 nodes, so the id lists stay out
 *  of the payload and are pasted into the list diff directly. */
export const ORDERS_JSON = JSON.stringify({ orders, page: 1, has_more: false });
export const QUERY = "$.orders[*].customer";
export const IDS_API = apiIds.join("\n");
export const IDS_DB = dbIds.join("\n");

export const CURL_URL = "https://api.acme.dev/v1/orders?status=paid";
export const CURL_COMMAND = `curl "${CURL_URL}" -H "Authorization: Bearer demo_token" -H "Accept: application/json"`;
export const CURL_RESPONSE = JSON.stringify({ orders: orders.filter((o) => o.status === "paid"), page: 1, has_more: false });

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");
/** Structurally valid JWT with obviously fake claims and a junk signature. */
export const DEMO_JWT = [
  b64url({ alg: "HS256", typ: "JWT" }),
  b64url({ sub: "cus_demo_88", name: "Ada Example", role: "admin", iss: "api.acme.dev", iat: 1790000000, exp: 1790003600 }),
  b64url("demo-signature-not-a-real-secret"),
].join(".");

export const BASE64_TEXT = '{"order":104201,"status":"paid"}';
