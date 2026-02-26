// ===============================
// CONFIG
// ===============================

// TODO: replace with your deployed GAS Web App URL
const GAS_URL = "https://script.google.com/macros/s/YOUR_DEPLOYED_ID/exec";

// ===============================
// CORE API WRAPPER
// ===============================
async function api(module, data = {}) {
  const payload = {
    module,
    ...data
  };

  let res;
  try {
    res = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Network error:", err);
    throw new Error("Network error. Please try again.");
  }

  if (!res.ok) {
    console.error("HTTP error:", res.status, res.statusText);
    throw new Error("Server error. Please try again.");
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    console.error("Invalid JSON:", err);
    throw new Error("Invalid server response.");
  }

  if (!json.success) {
    throw new Error(json.message || "Unknown error");
  }

  return json;
}
