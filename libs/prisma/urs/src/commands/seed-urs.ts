import prisma from '../index.js';
import seedUsers from './../seeds/users.js';
import { fileURLToPath } from 'node:url';

type SeedStep = {
  name: string;
  run: () => Promise<void>;
  description: string;
};

const ALL_STEPS: SeedStep[] = [
  {
    name: 'users',
    description: 'Seed permissions, roles, and users',
    run: seedUsers,
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

function parseStepsArg(): SeedStep[] {
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
    throw new Error(`Unknown seed step(s): ${unknown.join(', ')}`);
  }

  return ALL_STEPS.filter((step) => selected.includes(step.name));
}

function printAvailableSteps(): void {
  console.log('\nAvailable URS seed steps:');
  for (const step of ALL_STEPS) {
    console.log(`- ${step.name}: ${step.description}`);
  }
  console.log('');
}

export async function runUrsSeedCli(): Promise<void> {
  if (!process.env.URS_DATABASE_URL) {
    throw new Error('Missing required env: URS_DATABASE_URL');
  }

  if (hasFlag('list')) {
    printAvailableSteps();
    return;
  }

  const steps = parseStepsArg();
  console.log(`\nStarting URS seed (${steps.length} step${steps.length === 1 ? '' : 's'})...`);

  for (const step of steps) {
    const startedAt = Date.now();
    console.log(`\n[seed] ${step.name} - started`);
    await step.run();
    console.log(`[seed] ${step.name} - done in ${Date.now() - startedAt}ms`);
  }

  console.log('\nURS seed complete\n');
}

async function runAsCli(): Promise<void> {
  await runUrsSeedCli();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void runAsCli()
    .catch((error) => {
      console.error('\nURS seed failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
