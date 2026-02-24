# AUM Go — Assets Under Management (Go)

Go CLI that generates **AUM (Assets Under Management)** and daily management fee records for the URS database. It replicates the logic of `libs/shared/prisma/urs/src/siar/aum.ts` with **parallel date processing** using goroutines for faster runs.

## Requirements

- **Go 1.22+**
- **PostgreSQL** (URS database)
- **Environment:** `URS_DATABASE_URL` (e.g. `postgresql://user:pass@host:5432/urs_2`)

## Usage

### Run via Nx (recommended)

From the workspace root:

```bash
# Load env then run (e.g. from .env at repo root)
export URS_DATABASE_URL="postgresql://default:secret@nuc.test:5432/urs_2"
pnpm nx run aum-go:run
```

Build the binary:

```bash
pnpm nx run aum-go:build
# Binary: apps/aum-go/dist/aum-go
./apps/aum-go/dist/aum-go
```

### Run directly with Go

From `apps/aum-go`:

```bash
cd apps/aum-go
export URS_DATABASE_URL="postgresql://..."
go run .
```

### Verify only

Run verification (counts and missing-date check) without generating:

```bash
pnpm nx run aum-go:run --configuration=with-verify
# or
go run . --verify
```

## What it does

1. **Loads reference data** (NAV dates, funds, agent–investor mapping, pre-calculated “days” per fund/date).
2. **Skips dates already in `aum_daily`** — only processes NAV dates that do not yet have a total-AUM row, so re-runs do not re-calculate existing dates.
3. **Processes each remaining date** in parallel (worker pool of 8 by default):
   - Fetches NAVs and holdings for that date.
   - Computes AUM and management fee per investor/fund/agent.
   - Inserts into `aum_investor_daily` in batches of 10,000 with `ON CONFLICT DO NOTHING`.
   - Aggregates totals for the date and upserts one row into **`aum_daily`** (total `aum_value`, total `management_fee`).
4. **Runs verification**: summary counts and list of NAV dates that have no AUM records.

## Improvements over the TypeScript version

- **Goroutines:** Multiple dates are processed concurrently (`maxWorkers = 3` by default), reducing total time when there are many dates.
- **Connection pooling:** pgx pool with configurable max connections.
- **Batch inserts:** Uses pgx batch for bulk `INSERT ... ON CONFLICT DO NOTHING`.
- **Same business logic:** Same formulas and data sources as the Prisma/TS script (holdings as-of date, agent assignment by latest `effective_date`, days from LAG over `fund_navs`).
- **`aum_daily`:** Writes one row per processed date with total AUM and total management fee; dates that already have an `aum_daily` row are skipped on subsequent runs.

## Configuration

- **Concurrency:** Edit `maxWorkers` and `batchSize` in `internal/aum/generator.go` if needed. Defaults (3 workers, 5000 batch) keep memory use lower to avoid PostgreSQL shared memory issues.
- **Database:** Only `URS_DATABASE_URL` is required; no config file.

## Troubleshooting

- **`could not resize shared memory segment ... No space left on device`**  
  PostgreSQL is out of shared memory (often `/dev/shm`) or disk. On the **database server**:
  1. Check disk: `df -h` and free space under `/dev/shm`.
  2. Free space or increase shared memory.
  3. Or run this app with lower load: it now uses 3 workers and 5000 batch size by default; you can set `maxWorkers = 1` and/or smaller `batchSize` in `generator.go` to reduce pressure further.

find . -maxdepth 1 ! -name '18' ! -name '.' ! -name '..' -exec mv {} 18/docker/ \;
