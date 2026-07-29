import fetch from 'node-fetch';

async function sync() {
  console.log("Triggering sync-local on port 3000...");
  try {
    const res = await fetch("http://localhost:3000/api/acordaos/sync-local", { method: "POST" });
    const data = await res.json();
    console.log("SYNC RESULT:", data);
  } catch (err) {
    console.error("Error triggering sync:", err);
  }
}

sync();
