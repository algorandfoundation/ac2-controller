"use strict";
const fs = require("fs");
const path = require("path");

// 1. Add shebang to the CLI entry so it's executable as `ac2-validate`
const cliPath = path.join("dist", "esm", "cli.js");
const cliContent = fs.readFileSync(cliPath, "utf8");
if (!cliContent.startsWith("#!")) {
  fs.writeFileSync(cliPath, "#!/usr/bin/env node\n" + cliContent);
}
fs.chmodSync(cliPath, 0o755);

// 2. Write a package.json into dist/cjs/ so Node treats that subtree as CommonJS
fs.writeFileSync(
  path.join("dist", "cjs", "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
);

console.log("postbuild: ok");
