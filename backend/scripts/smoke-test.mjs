const API_URL = "http://localhost:5001/api";

let passed = 0;
let failed = 0;

function logPass(message) {
  passed++;
  console.log(`✅ PASS: ${message}`);
}

function logFail(message, error = "") {
  failed++;
  console.log(`❌ FAIL: ${message}`);
  if (error) {
    console.log(`   ${error}`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      raw: text,
    };
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testCreateClaim() {
  const result = await request("/claims", {
    method: "POST",
    body: JSON.stringify({
      claimant: "Smoke Test User",
      date: "2026-10-03",
      category: "Meals",
      amount: 1500,
      currency: "INR",
      description: "Dinner with client - smoke test",
      receiptAvailable: true,
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "success should be true");
  assert(result.data.data?.id, "claim ID should be returned");

  logPass("Create claim");

  return result.data.data;
}

async function testGetClaims() {
  const result = await request("/claims");

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "success should be true");
  assert(Array.isArray(result.data.data), "claims should be an array");

  logPass("Get claims");

  return result.data.data;
}

async function testValidation(claimId) {
  const result = await request(`/claims/${claimId}/validate`, {
    method: "POST",
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "validation should succeed");
  assert(
    result.data.data &&
      Array.isArray(result.data.data.errors) &&
      Array.isArray(result.data.data.warnings),
    "validation should return errors and warnings arrays"
  );

  logPass("Deterministic validation");

  return result.data.data;
}

async function testMissingReceipt() {
  const result = await request("/claims", {
    method: "POST",
    body: JSON.stringify({
      claimant: "Smoke Receipt Test",
      date: "2026-10-03",
      category: "Meals",
      amount: 1500,
      currency: "INR",
      description: "Dinner without receipt",
      receiptAvailable: false,
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);

  const claimId = result.data.data?.id;

  assert(claimId, "claim ID should be returned");

  const validation = await request(`/claims/${claimId}/validate`, {
    method: "POST",
  });

  assert(validation.ok, `HTTP ${validation.status}`);

  const allMessages = [
    ...(validation.data.data?.errors || []),
    ...(validation.data.data?.warnings || []),
  ]
    .join(" ")
    .toLowerCase();

  assert(
    allMessages.includes("receipt"),
    "validation should mention missing receipt"
  );

  logPass("Missing receipt validation");
}

async function testAmountLimit() {
  const result = await request("/claims", {
    method: "POST",
    body: JSON.stringify({
      claimant: "Smoke Limit Test",
      date: "2026-10-03",
      category: "Meals",
      amount: 2500,
      currency: "INR",
      description: "Dinner above policy limit",
      receiptAvailable: true,
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);

  const claimId = result.data.data?.id;

  assert(claimId, "claim ID should be returned");

  const validation = await request(`/claims/${claimId}/validate`, {
    method: "POST",
  });

  assert(validation.ok, `HTTP ${validation.status}`);

  const errors = validation.data.data?.errors || [];

  assert(
    errors.some((error) =>
      error.toLowerCase().includes("exceeds")
    ),
    "validation should detect amount exceeding policy limit"
  );

  logPass("Policy amount limit validation");

  return claimId;
}

async function testDuplicateClaim(originalClaim) {
  const result = await request("/claims", {
    method: "POST",
    body: JSON.stringify({
      claimant: originalClaim.claimant,
      date: originalClaim.date,
      category: originalClaim.category,
      amount: originalClaim.amount,
      currency: originalClaim.currency,
      description: originalClaim.description,
      receiptAvailable: originalClaim.receiptAvailable,
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);

  const duplicateId = result.data.data?.id;

  assert(duplicateId, "duplicate claim ID should be returned");

  const validation = await request(`/claims/${duplicateId}/validate`, {
    method: "POST",
  });

  assert(validation.ok, `HTTP ${validation.status}`);

  const allMessages = [
    ...(validation.data.data?.errors || []),
    ...(validation.data.data?.warnings || []),
  ]
    .join(" ")
    .toLowerCase();

  assert(
    allMessages.includes("duplicate"),
    "validation should detect duplicate claim"
  );

  logPass("Duplicate claim detection");
}

async function testAIReview(claimId) {
  console.log("⏳ Running real AI review...");

  const result = await request(`/claims/${claimId}/ai-review`, {
    method: "POST",
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "AI review should succeed");

  const data = result.data.data;

  assert(data?.category, "AI category should exist");
  assert(
    typeof data?.confidence === "number",
    "AI confidence should be a number"
  );
  assert(data?.explanation, "AI explanation should exist");
  assert(data?.policyEvidence, "policy evidence should exist");

  logPass("AI review");
}

async function testApprove(claimId) {
  const result = await request(`/claims/${claimId}/review`, {
    method: "POST",
    body: JSON.stringify({
      action: "APPROVE",
      reason: "",
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "approve should succeed");

  assert(
    result.data.data?.claim?.status === "APPROVED",
    "claim status should become APPROVED"
  );

  logPass("Reviewer approve");
}

async function testReject(claimId) {
  const result = await request(`/claims/${claimId}/review`, {
    method: "POST",
    body: JSON.stringify({
      action: "REJECT",
      reason: "Smoke test rejection reason",
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "reject should succeed");

  assert(
    result.data.data?.claim?.status === "REJECTED",
    "claim status should become REJECTED"
  );

  logPass("Reviewer reject");
}

async function testClarification(claimId) {
  const result = await request(`/claims/${claimId}/review`, {
    method: "POST",
    body: JSON.stringify({
      action: "REQUEST_CLARIFICATION",
      reason: "Please provide additional information.",
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(
    result.data.success === true,
    "clarification should succeed"
  );

  assert(
    result.data.data?.claim?.status === "CLARIFICATION",
    "claim status should become CLARIFICATION"
  );

  logPass("Request clarification");
}

async function testOverride(claimId) {
  const result = await request(`/claims/${claimId}/review`, {
    method: "POST",
    body: JSON.stringify({
      action: "OVERRIDE",
      reason: "Smoke test AI override reason",
    }),
  });

  assert(result.ok, `HTTP ${result.status}`);
  assert(
    result.data.success === true,
    "override should succeed"
  );

  assert(
    result.data.data?.claim?.status === "NEEDS_REVIEW",
    "claim status should become NEEDS_REVIEW"
  );

  logPass("Override AI classification");
}

async function testReasonValidation(claimId) {
  const result = await request(`/claims/${claimId}/review`, {
    method: "POST",
    body: JSON.stringify({
      action: "REJECT",
      reason: "",
    }),
  });

  assert(
    result.status >= 400,
    "reject without reason should fail"
  );

  logPass("Reviewer reason validation");
}

async function testHistory(claimId) {
  const result = await request(`/claims/${claimId}/history`);

  assert(result.ok, `HTTP ${result.status}`);
  assert(result.data.success === true, "history request should succeed");
  assert(Array.isArray(result.data.data), "history should be an array");

  assert(
    result.data.data.length > 0,
    "history should contain review records"
  );

  logPass("Review history");
}

async function main() {
  console.log("");
  console.log("======================================");
  console.log(" Expense Claim Smoke Test");
  console.log("======================================");
  console.log("");

  let mainClaim;
  let limitClaimId;

  try {
    // 1
    mainClaim = await testCreateClaim();

    // 2
    await testGetClaims();

    // 3
    await testValidation(mainClaim.id);

    // 4
    await testMissingReceipt();

    // 5
    limitClaimId = await testAmountLimit();

    // 6
    await testDuplicateClaim(mainClaim);

    // 7
    await testAIReview(mainClaim.id);

    // 8
    await testApprove(mainClaim.id);

    // 9
    await testReasonValidation(limitClaimId);

    // 10
    await testReject(limitClaimId);

    // 11
    await testClarification(mainClaim.id);

    // 12
    await testOverride(mainClaim.id);

    // 13
    await testHistory(mainClaim.id);
  } catch (error) {
    logFail(
      "Smoke test stopped",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("");
  console.log("======================================");
  console.log(" Test Summary");
  console.log("======================================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log("");

  if (failed > 0) {
    process.exit(1);
  }

  console.log("🎉 ALL SMOKE TESTS PASSED");
}

main();