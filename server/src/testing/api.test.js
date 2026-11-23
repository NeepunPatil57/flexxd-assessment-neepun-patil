import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ASHA_ID = "0d7e1728-e8f9-4cd8-a172-64107d409ed3";
const BEN_ID = "727aa029-b720-42cb-b770-67d3595f9e6d";
const MUMBAI_GYM_ID = "1b2fdfad-2898-444d-b545-863eec2a08c4";
const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_ENTRY = fileURLToPath(new URL("../index.js", import.meta.url));

let server;

function waitForServerReady(serverProcess) {
  return new Promise((resolve, reject) => {
    serverProcess.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("running")) {
        resolve();
      }
    });
    serverProcess.on("exit", (code) => reject(new Error(`Server exited with code ${code}`)));
  });
}

async function postJson(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function getJson(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  return { status: response.status, body: await response.json() };
}

before(async () => {
  server = spawn(process.execPath, [SERVER_ENTRY], {
    env: { ...process.env, PORT: String(PORT) },
  });
  await waitForServerReady(server);
});

after(() => {
  server.kill();
});

describe("booking API", () => {
  test("POST /bookings returns 400 when ids are missing or JSON is invalid", async () => {
    const missingVenue = await postJson("/bookings", { userId: ASHA_ID });
    const invalidJson = await postJson("/bookings", "{ bad");

    assert.equal(missingVenue.status, 400);
    assert.equal(invalidJson.status, 400);
  });

  test("POST /bookings returns 404 for unknown user or venue", async () => {
    const unknownUser = await postJson("/bookings", { userId: "nope", venueId: MUMBAI_GYM_ID });
    const unknownVenue = await postJson("/bookings", { userId: ASHA_ID, venueId: "nope" });

    assert.equal(unknownUser.status, 404);
    assert.equal(unknownVenue.status, 404);
  });

  test("POST /bookings returns 402 when the user has no credits", async () => {
    const response = await postJson("/bookings", { userId: BEN_ID, venueId: MUMBAI_GYM_ID });

    assert.equal(response.status, 402);
  });

  test("book, redeem, redeem again, then see it on the user", async () => {
    const booking = await postJson("/bookings", { userId: ASHA_ID, venueId: MUMBAI_GYM_ID });
    assert.equal(booking.status, 201);
    assert.ok(booking.body.redemptionCode);
    assert.ok(booking.body.expiresAt);

    const redeem = await postJson("/bookings/redeem", { redemptionCode: booking.body.redemptionCode });
    assert.equal(redeem.status, 200);
    assert.equal(redeem.body.redeemed, true);

    const redeemAgain = await postJson("/bookings/redeem", { redemptionCode: booking.body.redemptionCode });
    assert.equal(redeemAgain.status, 409);

    const user = await getJson(`/users/${ASHA_ID}`);
    assert.equal(user.status, 200);
    assert.equal(user.body.visitCredits, 2);
    assert.equal(user.body.bookings.length, 1);
    assert.equal(user.body.bookings[0].redeemed, true);
  });

  test("POST /bookings/redeem returns 404 for unknown code and 400 for missing code", async () => {
    const unknownCode = await postJson("/bookings/redeem", { redemptionCode: "ZZZZZZZZ" });
    const missingCode = await postJson("/bookings/redeem", {});

    assert.equal(unknownCode.status, 404);
    assert.equal(missingCode.status, 400);
  });

  test("GET /users/:id returns 404 for unknown user", async () => {
    const response = await getJson("/users/nope");

    assert.equal(response.status, 404);
  });
});
