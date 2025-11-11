#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
require('child_process').execSync(
  'tsx scripts/get-group-id.ts ' + process.argv.slice(2).join(' '),
  { stdio: 'inherit', env: process.env }
);
