/* ---------------------------------------------------
   GLOBAL API URL + WRAPPER
--------------------------------------------------- */

/*const API_URL = "https://script.google.com/macros/s/AKfycbzVbE9nbp_ly3IeGe7gs4BN39sCZ09E8LKbACU9kqYWGfzhv8PFJEDwASBsVU0wp9ZCfw/exec";*/

/* ---------------------------------------------------
   API CALL WRAPPER
--------------------------------------------------- */
/*async function api(action, params = {}) {
    const query = new URLSearchParams({ action, ...params }).toString();
    const url = `${API_URL}?${query}`;

    const res = await fetch(url);
    return res.json();
}*/

// Replace with your deployed Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbzVbE9nbp_ly3IeGe7gs4BN39sCZ09E8LKbACU9kqYWGfzhv8PFJEDwASBsVU0wp9ZCfw/exec";

async function api(module, data = {}) {
  const payload = { module, ...data };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("Network error");
  }

  return res.json();
}
