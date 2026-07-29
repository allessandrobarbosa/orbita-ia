import fetch from 'node-fetch';

async function triggerSync() {
  console.log("Triggering sync-local...");
  try {
    const res = await fetch('http://localhost:3001/api/acordaos/sync-local', { method: 'POST' });
    const text = await res.text();
    console.log("Response:", text);
  } catch(e) {
    console.error("Error triggering sync:", e);
  }
}

triggerSync();
