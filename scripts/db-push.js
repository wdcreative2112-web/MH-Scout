const { fork } = require("child_process");
const path = require("path");
const fs = require("fs");

// 1. Ensure engine file exists in @prisma/engines
const engineSrc = path.join(__dirname, "..", "node_modules", ".prisma", "client", "query_engine-windows.dll.node");
const enginesDir = path.join(__dirname, "..", "node_modules", "@prisma", "engines");
const engineDest = path.join(enginesDir, "query_engine-windows.dll.node");

if (fs.existsSync(engineDest)) {
  fs.mkdirSync(path.dirname(engineSrc), { recursive: true });
  if (!fs.existsSync(engineSrc)) {
    try {
      fs.copyFileSync(engineDest, engineSrc);
    } catch {}
  }
}

const chosenEngine = fs.existsSync(engineDest) ? engineDest : engineSrc;

const schemaEngine = path.join(enginesDir, "schema-engine-windows.exe");

const env = {
  ...process.env,
  PRISMA_QUERY_ENGINE_LIBRARY: chosenEngine,
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: "1",
};

if (fs.existsSync(schemaEngine)) {
  env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEngine;
}

// 2. Configure proxy support if present
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
if (proxyUrl) {
  env.HTTPS_PROXY = proxyUrl;
  env.HTTP_PROXY = proxyUrl;
}

// 3. Run Prisma CLI with db push
const prismaCli = path.join(__dirname, "..", "node_modules", "prisma", "build", "index.js");
const child = fork(prismaCli, ["db", "push", ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
