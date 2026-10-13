#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { StatefulMockServer } = require('../lib/server');

function printUsage() {
  console.error(`
ts-mocktail v1.0.0
Zero-config TypeScript contract-driven stateful HTTP mock server

Usage:
  ts-mocktail <types.ts> [options]

Options:
  -p, --port <number>    HTTP port to bind (default: 4000)
  --once                 Run once for smoke test, exit immediately
  -v, --version          Print version information
  -h, --help             Print this help screen

Examples:
  ts-mocktail models.ts --port 4000
  ts-mocktail api.dto.ts
`);
}

function main() {
  const args = process.argv.slice(2);
  let filePath = null;
  let port = 4000;
  let once = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    }
    if (arg === '-v' || arg === '--version') {
      console.log('ts-mocktail v1.0.0');
      process.exit(0);
    }
    if (arg === '--once') {
      once = true;
    }
    if ((arg === '-p' || arg === '--port') && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if (!arg.startsWith('-') && !filePath) {
      filePath = arg;
    }
  }

  if (!filePath) {
    console.error('Error: TypeScript models file path is required.');
    printUsage();
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const tsCode = fs.readFileSync(filePath, 'utf8');
  const server = new StatefulMockServer({ port });
  server.loadTypeScript(tsCode);

  server.start((boundPort) => {
    console.log(`\n\x1b[1;36m=== 🍸 ts-mocktail: Stateful Mock Server Running ===\x1b[0m`);
    console.log(`\x1b[32m✔ Listening on: http://localhost:${boundPort}\x1b[0m\n`);
    console.log('Discovered TypeScript Models & Endpoints:');
    for (const [name] of server.models) {
      const ep = `/${name.toLowerCase()}`;
      console.log(`  \x1b[1;33m${name}\x1b[0m $\\to$ \x1b[36mhttp://localhost:${boundPort}${ep}\x1b[0m (CRUD supported)`);
    }
    console.log('\n\x1b[90mPress Ctrl+C to terminate server.\x1b[0m\n');

    if (once) {
      console.log('✔ Smoke test (--once) executed successfully.');
      server.stop(() => process.exit(0));
    }
  });
}

main();
