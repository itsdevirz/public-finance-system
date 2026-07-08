import fetch from "node-fetch";

async function run() {
  try {
    const res = await fetch("http://localhost:8000/api/credits/requests");
    console.log("STATUS:", res.status);
    const json = await res.json();
    console.log("RESPONSE:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
