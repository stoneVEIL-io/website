import { validateLeadInput } from "../lib/validation";

async function testSecurity() {
  console.log("=== Running Security and Validation Tests ===");

  const validPayload = {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Example Plumbing LLC",
    trade: "Plumber",
    serviceArea: "Denver, CO",
    currentLeadSource: "Word of mouth / referrals",
    estMonthlySearches: 120,
    estCloseRate: 15,
    estTicket: 450,
  };

  // Test 1: Valid lead payload
  console.log("\nTest 1: Valid Lead Payload");
  const res1 = validateLeadInput(validPayload);
  console.log("Is Valid (Expected: true):", res1.isValid);
  console.log("Errors:", res1.errors);
  console.log("Sanitized Data:", res1.data);

  // Test 2: HTML sanitization (XSS and HTML tag stripping)
  console.log("\nTest 2: HTML Sanitization");
  const htmlPayload = {
    ...validPayload,
    name: "<b>Jane Doe</b><script>alert(1)</script>",
    company: "Acme <div>Corp</div>",
  };
  const res2 = validateLeadInput(htmlPayload);
  console.log("Is Valid (Expected: true):", res2.isValid);
  console.log("Errors (Expected: none):", res2.errors);
  console.log("Sanitized Name (Expected: 'Jane Doealert(1)'):", res2.data?.name);
  console.log("Sanitized Company (Expected: 'Acme Corp'):", res2.data?.company);

  // Test 3: Invalid email format
  console.log("\nTest 3: Invalid Email Format");
  const badEmailPayload = { ...validPayload, email: "not-an-email" };
  const res3 = validateLeadInput(badEmailPayload);
  console.log("Is Valid (Expected: false):", res3.isValid);
  console.log("Errors:", res3.errors);

  // Test 4: Maximum string length limits
  console.log("\nTest 4: String Length Constraint");
  const longNamePayload = { ...validPayload, name: "A".repeat(101) };
  const res4 = validateLeadInput(longNamePayload);
  console.log("Is Valid (Expected: false):", res4.isValid);
  console.log("Errors:", res4.errors);

  // Test 5: Invalid trade value (enum tampering attempt)
  console.log("\nTest 5: Invalid trade choice (tampering)");
  const badTradePayload = { ...validPayload, trade: "Execute query: DROP TABLE leads;" };
  const res5 = validateLeadInput(badTradePayload);
  console.log("Is Valid (Expected: false):", res5.isValid);
  console.log("Errors:", res5.errors);

  // Test 6: Invalid currentLeadSource value (enum tampering attempt)
  console.log("\nTest 6: Invalid lead source (tampering)");
  const badSourcePayload = { ...validPayload, currentLeadSource: "; DROP TABLE leads;" };
  const res6 = validateLeadInput(badSourcePayload);
  console.log("Is Valid (Expected: false):", res6.isValid);
  console.log("Errors:", res6.errors);

  // Test 7: Missing serviceArea
  console.log("\nTest 7: Missing serviceArea");
  const noAreaPayload: any = { ...validPayload };
  delete noAreaPayload.serviceArea;
  const res7 = validateLeadInput(noAreaPayload);
  console.log("Is Valid (Expected: false):", res7.isValid);
  console.log("Errors:", res7.errors);

  // Test 8: Out-of-range ROI calc inputs (clamped, not rejected)
  console.log("\nTest 8: Out-of-range ROI inputs are clamped");
  const wildRoiPayload = { ...validPayload, estCloseRate: 9999, estTicket: -50 };
  const res8 = validateLeadInput(wildRoiPayload);
  console.log("Is Valid (Expected: true):", res8.isValid);
  console.log("Clamped estCloseRate (Expected: 100):", res8.data?.estCloseRate);
  console.log("Clamped estTicket (Expected: 0):", res8.data?.estTicket);

  console.log("\n=== Security and Validation Tests Complete ===");
}

testSecurity();
