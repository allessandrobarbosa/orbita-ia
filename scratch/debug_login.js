import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/orbita_db.json");

function testLogin(identifier, password) {
  const raw = fs.readFileSync(DB_PATH, "utf-8").replace(/^\uFEFF/, "");
  const data = JSON.parse(raw);
  const users = data.users || [];
  
  console.log("Total users in database:", users.length);
  console.log("User 0 in database:", JSON.stringify(users[0], null, 2));

  const cleanId = identifier.replace(/\D/g, "");
  const matchedProfile = users.find((p) => 
    p.email === identifier || p.id === identifier || (p.cpf && p.cpf.replace(/\D/g, "") === cleanId)
  );

  if (!matchedProfile) {
    console.log("MATCH FAILED: Profile not found by identifier:", identifier);
    return;
  }

  console.log("Profile matched successfully:", matchedProfile.id);

  const validPassword = matchedProfile.password || matchedProfile.pin;
  const isPassValid = (validPassword === password);
  console.log("Password check:", isPassValid ? "VALID" : "INVALID", `(Expected: "${validPassword}", Got: "${password}")`);
}

testLogin("41652649115", "Cmnsg@102030");
