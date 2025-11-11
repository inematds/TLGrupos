#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
require('child_process').execSync(
  'tsx scripts/get-updates.ts',
  { stdio: 'inherit', env: process.env }
);
