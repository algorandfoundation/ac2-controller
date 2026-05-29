import { Command } from "commander";
import { readFileSync } from "node:fs";
import { decode } from "./decoder.js";
import { AC2MessageTypes } from "./types.js";
import { validate } from "./validator.js";

const program = new Command();

program
  .name("ac2-validate")
  .description("Validate and decode AC2 protocol messages")
  .version("0.1.0");

program
  .argument("[json]", "AC2 message as a JSON string")
  .option("-f, --file <path>", "read JSON from a file")
  .option("--json", "output machine-readable JSON")
  .option("--list-types", "list all supported AC2 message types")
  .action(
    (jsonArg: string | undefined, opts: { file?: string; json?: boolean; listTypes?: boolean }) => {
      if (opts.listTypes) {
        const types = Object.values(AC2MessageTypes);
        if (opts.json) {
          console.log(JSON.stringify(types, null, 2));
        } else {
          console.log("Supported AC2 message types:");
          for (const t of types) console.log(`  ${t}`);
        }
        return;
      }

      let raw: string;
      if (opts.file) {
        try {
          raw = readFileSync(opts.file, "utf8");
        } catch (err) {
          console.error(`Error reading file: ${(err as NodeJS.ErrnoException).message}`);
          process.exitCode = 2;
          return;
        }
      } else if (jsonArg) {
        raw = jsonArg;
      } else {
        program.help();
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error("Error: invalid JSON");
        process.exitCode = 2;
        return;
      }

      const result = validate(parsed);
      const { message } = decode(raw);

      if (opts.json) {
        console.log(JSON.stringify({ message, validation: result }, null, 2));
        process.exitCode = result.valid ? 0 : 1;
        return;
      }

      // Human-readable output
      const icon = result.valid ? "\u2705" : "\u274c";
      console.log(`\n${icon} ${result.valid ? "Valid" : "Invalid"} AC2 message`);

      const p = parsed as Record<string, unknown>;
      console.log(`  Type:  ${typeof p.type === "string" ? p.type : "(missing)"}`);
      console.log(`  ID:    ${typeof p.id === "string" ? p.id : "(missing)"}`);
      console.log(`  From:  ${typeof p.from === "string" ? p.from : "(missing)"}`);

      if (result.errors.length > 0) {
        console.log("\nErrors:");
        for (const e of result.errors) console.log(`  \u2022 ${e}`);
      }

      if (result.warnings.length > 0) {
        console.log("\nWarnings:");
        for (const w of result.warnings) console.log(`  \u26a0 ${w}`);
      }

      console.log("");
      process.exitCode = result.valid ? 0 : 1;
    },
  );

program.parse(process.argv);
