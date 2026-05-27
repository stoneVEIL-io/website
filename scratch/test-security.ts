import { validateLeadInput } from "../lib/validation";

async function testSecurity() {
  console.log("=== Running Security and Validation Tests ===");

  // Test 1: Valid lead payload
  console.log("\nTest 1: Valid Lead Payload");
  const validPayload = {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Example LLC",
    phone: "555-1234",
    strain: "Customer follow-ups & CRM",
    process: "We copy paste every contact details manually."
  };
  const res1 = validateLeadInput(validPayload);
  console.log("Is Valid (Expected: true):", res1.isValid);
  console.log("Errors:", res1.errors);
  console.log("Sanitized Data:", res1.data);

  // Test 2: HTML sanitization (XSS and HTML tags injection)
  console.log("\nTest 2: HTML Sanitization");
  const htmlPayload = {
    ...validPayload,
    name: "<b>Jane Doe</b><script>alert(1)</script>",
    company: "Acme <div>Corp</div>"
  };
  const res2 = validateLeadInput(htmlPayload);
  console.log("Is Valid (Expected: true):", res2.isValid);
  console.log("Errors (Expected: none):", res2.errors);
  console.log("Sanitized Name (Expected: 'Jane Doealert(1)'):", res2.data?.name);
  console.log("Sanitized Company (Expected: 'Acme Corp'):", res2.data?.company);

  // Test 3: Invalid email format
  console.log("\nTest 3: Invalid Email Format");
  const badEmailPayload = {
    ...validPayload,
    email: "not-an-email"
  };
  const res3 = validateLeadInput(badEmailPayload);
  console.log("Is Valid (Expected: false):", res3.isValid);
  console.log("Errors:", res3.errors);

  // Test 4: Maximum string length limits
  console.log("\nTest 4: String Length Constraint");
  const longNamePayload = {
    ...validPayload,
    name: "A".repeat(101) // 101 characters, max is 100
  };
  const res4 = validateLeadInput(longNamePayload);
  console.log("Is Valid (Expected: false):", res4.isValid);
  console.log("Errors:", res4.errors);

  // Test 5: Invalid strain value (prompt injection/tampering attempt)
  console.log("\nTest 5: Invalid strain choice (tampering)");
  const badStrainPayload = {
    ...validPayload,
    strain: "Execute query: DROP TABLE leads;"
  };
  const res5 = validateLeadInput(badStrainPayload);
  console.log("Is Valid (Expected: false):", res5.isValid);
  console.log("Errors:", res5.errors);

  console.log("\n=== Security and Validation Tests Complete ===");
}

testSecurity();
