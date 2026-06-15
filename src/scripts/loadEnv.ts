import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const val = valueParts.join("=").replace(/(^['"]|['"]$)/g, ""); // strip quotes
        process.env[key.trim()] = val.trim();
      }
    }
    console.log("✅ .env.local loaded manually.");
  } else {
    console.warn("⚠️ .env.local not found at process.cwd().");
  }
} catch (e) {
  console.error("❌ Failed to load .env.local manually:", e);
}
