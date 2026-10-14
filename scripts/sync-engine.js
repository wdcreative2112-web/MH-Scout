const fs = require("fs");
const path = require("path");

const enginesDir = path.join(__dirname, "..", "node_modules", "@prisma", "engines");
const clientDir = path.join(__dirname, "..", "node_modules", ".prisma", "client");

const src = path.join(enginesDir, "query_engine-windows.dll.node");
const dest = path.join(clientDir, "query_engine-windows.dll.node");
const tmp = path.join(clientDir, "query_engine-windows.dll.node.tmp15876");

console.log("Checking Prisma query engines...");

if (fs.existsSync(src)) {
  const srcSize = fs.statSync(src).size;
  console.log(`@prisma/engines binary size: ${srcSize} bytes`);

  if (fs.existsSync(dest)) {
    const destSize = fs.statSync(dest).size;
    console.log(`.prisma/client binary size: ${destSize} bytes`);

    if (srcSize !== destSize) {
      console.log("Sizes differ! Replacing old .prisma/client binary with the matching Prisma 6.4 engine...");
      try {
        fs.copyFileSync(src, dest);
        console.log("Successfully copied matching engine into .prisma/client!");
      } catch (err) {
        console.warn("Could not overwrite directly (file might be in use):", err.message);
      }
    } else {
      console.log(".prisma/client binary already matches the correct engine size.");
    }
  } else {
    fs.copyFileSync(src, dest);
    console.log("Copied matching engine to .prisma/client.");
  }
}

// Clean up stale tmp file if present
if (fs.existsSync(tmp)) {
  try {
    fs.unlinkSync(tmp);
    console.log("Cleaned up stale tmp file.");
  } catch {}
}
