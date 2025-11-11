#!/usr/bin/env node

// Wrapper para garantir que .env.local seja carregado antes de executar o TypeScript
require('dotenv').config({ path: '.env.local' });

// Agora executar o script TypeScript
require('child_process').execSync(
  'tsx scripts/sync-group-members.ts ' + process.argv.slice(2).join(' '),
  { stdio: 'inherit', env: process.env }
);
