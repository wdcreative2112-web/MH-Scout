const fs = require("fs");
const path = require("path");

const enginesDir = path.join(__dirname, "..", "node_modules", "@prisma", "engines");
const clientDir = path.join(__dirname, "..", "node_modules", ".prisma", "client");

const src = path.join(enginesDir, "query_engine-windows.dll.node");
const dest = path.join(clientDir, "query_engine-windows.dll.node");

if (fs.existsSync(src)) {
  fs.mkdirSync(clientDir, { recursive: true });
  try {
    fs.copyFileSync(src, dest);
    console.log("Successfully copied correct Prisma 6 engine to .prisma/client");
  } catch (err) {
    console.warn("Could not copy directly (file might be locked by running process):", err.message);
  }
} else {
  console.log("Source not found:", src);
}
