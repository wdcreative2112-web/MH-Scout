const https = require("https");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const enginesDir = path.join(__dirname, "..", "node_modules", "@prisma", "engines");
fs.mkdirSync(enginesDir, { recursive: true });

const targetFile = path.join(enginesDir, "schema-engine-windows.exe");

if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 1000000) {
  console.log("schema-engine-windows.exe already exists:", targetFile);
  process.exit(0);
}

const url = "https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/windows/schema-engine.exe.gz";
console.log("Mengunduh schema-engine dari:", url);

function download(fileUrl) {
  https.get(fileUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location);
    }
    if (res.statusCode !== 200) {
      console.error("Gagal mengunduh, status code:", res.statusCode);
      process.exit(1);
    }

    const gunzip = zlib.createGunzip();
    const out = fs.createWriteStream(targetFile);

    res.pipe(gunzip).pipe(out);

    out.on("finish", () => {
      console.log("Berhasil mengunduh dan mengekstrak schema-engine-windows.exe!");
      process.exit(0);
    });

    gunzip.on("error", (err) => {
      console.error("Error decompressing:", err);
      process.exit(1);
    });
  }).on("error", (err) => {
    console.error("Error downloading:", err.message);
    process.exit(1);
  });
}

download(url);
