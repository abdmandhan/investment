import siar from '@investment/siar';
import prisma from '../index.js';
// import { generateAum } from '../siar/aum.js';
import { importManagementFee } from './../siar/fee.js';
import { generateHoldings } from './../siar/holdings.js';
import { migrateMissingTransactions } from './../siar/migrate-missing.js';
import { migrateNav } from './../siar/nav.js';
import { importFromSiar } from './../siar/references.js';
import { importTransaction } from './../siar/transaction.js';
import { fileURLToPath } from 'node:url';

type MigrationStep = {
  name: string;
  description: string;
  run: () => Promise<void>;
};

const ALL_STEPS: MigrationStep[] = [
  {
    name: 'references',
    description: 'Import references, banks, agents, funds, and investors from SIAR',
    run: importFromSiar,
  },
  {
    name: 'transactions',
    description: 'Import approved transactions from SIAR',
    run: importTransaction,
  },
  {
    name: 'missing-transactions',
    description: 'Reconcile and import missing SIAR transactions',
    run: migrateMissingTransactions,
  },
  {
    name: 'nav',
    description: 'Import missing NAV records',
    run: migrateNav,
  },
  {
    name: 'management-fee',
    description: 'Sync management fee and valuation basis',
    run: importManagementFee,
  },
  {
    name: 'holdings',
    description: 'Generate investor holdings snapshots',
    run: generateHoldings,
  },
];

function parseOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parseStepsArg(): MigrationStep[] {
  const raw = parseOption('steps');
  if (!raw) {
    return ALL_STEPS;
  }

  const selected = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const unknown = selected.filter((name) => !ALL_STEPS.some((step) => step.name === name));
  if (unknown.length > 0) {
    throw new Error(`Unknown migration step(s): ${unknown.join(', ')}`);
  }

  return ALL_STEPS.filter((step) => selected.includes(step.name));
}

function printAvailableSteps(): void {
  console.log('\nAvailable SIAR migration steps:');
  for (const step of ALL_STEPS) {
    console.log(`- ${step.name}: ${step.description}`);
  }
  console.log('');
}

export async function runSiarMigrationCli(): Promise<void> {
  if (!process.env.URS_DATABASE_URL) {
    throw new Error('Missing required env: URS_DATABASE_URL');
  }
  if (!process.env.SIAR_DATABASE_URL) {
    throw new Error('Missing required env: SIAR_DATABASE_URL');
  }

  if (hasFlag('list')) {
    printAvailableSteps();
    return;
  }

  const steps = parseStepsArg();
  console.log(`\nStarting SIAR migration (${steps.length} step${steps.length === 1 ? '' : 's'})...`);

  for (const step of steps) {
    const startedAt = Date.now();
    console.log(`\n[migrate] ${step.name} - started`);
    await step.run();
    console.log(`[migrate] ${step.name} - done in ${Date.now() - startedAt}ms`);
  }

  console.log('\nSIAR migration complete\n');
}

async function runAsCli(): Promise<void> {
  await runSiarMigrationCli();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void runAsCli()
    .catch((error) => {
      console.error('\nSIAR migration failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await Promise.allSettled([
        prisma.$disconnect(),
        (siar as unknown as { $disconnect?: () => Promise<void> }).$disconnect?.() ?? Promise.resolve(),
      ]);
    });
}
