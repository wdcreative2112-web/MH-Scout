const fs = require("fs");
const { execSync } = require("child_process");

// Check if PRISMA_QUERY_ENGINE_LIBRARY is set but points to a non-existent file (e.g. Windows dll on Linux Vercel)
if (
  process.env.PRISMA_QUERY_ENGINE_LIBRARY &&
  !fs.existsSync(process.env.PRISMA_QUERY_ENGINE_LIBRARY)
) {
  console.log(
    "Info: Removing invalid PRISMA_QUERY_ENGINE_LIBRARY environment variable for platform:",
    process.platform
  );
  delete process.env.PRISMA_QUERY_ENGINE_LIBRARY;
}

// In Linux/cloud environments, never use Windows query engine library
if (process.platform !== "win32" && process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  delete process.env.PRISMA_QUERY_ENGINE_LIBRARY;
}

const path = require("path");
const prismaCli = path.join(__dirname, "..", "node_modules", "prisma", "build", "index.js");

try {
  if (fs.existsSync(prismaCli)) {
    execSync(`node "${prismaCli}" generate`, { stdio: "inherit", env: process.env });
  } else {
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
  }
} catch (error) {
  console.error("Failed to execute prisma generate:", error.message);
  process.exit(1);
}
