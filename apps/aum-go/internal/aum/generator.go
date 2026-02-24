package aum

import (
	"context"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// Lower values reduce memory/shared-memory pressure on PostgreSQL (avoids "No space left on device").
	batchSize    = 10000   // rows per aum_investor_daily insert batch
	maxWorkers   = 8      // parallel date workers
	queryTimeout = 5 * time.Minute
)

// Generator runs AUM (Assets Under Management) generation with parallel date processing.
type Generator struct {
	pool *pgxpool.Pool
}

// NewGenerator creates a new AUM generator connected to the given database URL.
func NewGenerator(dbURL string) (*Generator, error) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("parse db url: %w", err)
	}
	config.MaxConns = 32 // limit connections to reduce PostgreSQL shared memory usage
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	return &Generator{pool: pool}, nil
}

// Close releases the database connection pool.
func (g *Generator) Close() {
	g.pool.Close()
}

// Generate runs the full AUM generation with goroutines for parallel date processing.
func (g *Generator) Generate() error {
	ctx := context.Background()
	log.Println("\n=== Generating AUM (Assets Under Management) ===\n")

	// Load reference data once (shared by all workers)
	navDates, err := g.loadNAVDates(ctx)
	if err != nil {
		return err
	}
	log.Printf("Found %d unique NAV dates\n", len(navDates))

	aumDailyDates, err := g.loadAumDailyDates(ctx)
	if err != nil {
		return err
	}
	// Only process dates that don't already have aum_daily (skip re-calculation)
	var toProcess []navDateRow
	for _, nd := range navDates {
		if !aumDailyDates[nd.DateStr] {
			toProcess = append(toProcess, nd)
		}
	}
	skipped := len(navDates) - len(toProcess)
	if skipped > 0 {
		log.Printf("Skipping %d dates already in aum_daily\n", skipped)
	}
	log.Printf("Processing %d dates\n", len(toProcess))
	if len(toProcess) == 0 {
		log.Println("\n✅ No new dates to process.")
		return g.Verify()
	}
	navDates = toProcess

	fundMap, err := g.loadFunds(ctx)
	if err != nil {
		return err
	}
	log.Printf("Found %d funds\n", len(fundMap))

	investorAgentMap, err := g.loadAgentInvestors(ctx)
	if err != nil {
		return err
	}
	log.Printf("Found %d investor-agent relationships\n", len(investorAgentMap))

	fundDateDaysMap, err := g.precalcDays(ctx)
	if err != nil {
		return err
	}
	log.Printf("Pre-calculated days for %d fund-date combinations\n", len(fundDateDaysMap))

	// Process dates in parallel with worker pool
	var totalProcessed, totalDatesProcessed atomic.Int64
	datesCh := make(chan navDateRow, len(navDates))
	var wg sync.WaitGroup

	for w := 0; w < maxWorkers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for nd := range datesCh {
				n, err := g.processDate(ctx, nd, fundMap, investorAgentMap, fundDateDaysMap)
				if err != nil {
					log.Printf("  ⚠️  date %s: %v\n", nd.DateStr, err)
					continue
				}
				totalProcessed.Add(int64(n))
				totalDatesProcessed.Add(1)
			}
		}()
	}

	for i := range navDates {
		datesCh <- navDates[i]
	}
	close(datesCh)
	wg.Wait()

	log.Println("\n✅ Completed generating AUM")
	log.Printf("   Processed %d dates\n", totalDatesProcessed.Load())
	log.Printf("   Total AUM records: %d\n", totalProcessed.Load())
	log.Println()

	return g.Verify()
}

// processDate loads NAVs and holdings for one date, computes AUM, and inserts in batches.
// Returns the number of AUM records inserted.
func (g *Generator) processDate(
	ctx context.Context,
	nd navDateRow,
	fundMap map[int]fundInfo,
	investorAgentMap map[string]int,
	fundDateDaysMap map[string]int,
) (int, error) {
	ctx, cancel := context.WithTimeout(ctx, queryTimeout)
	defer cancel()

	navMap, err := g.loadNAVsForDate(ctx, nd.DateStr)
	if err != nil {
		return 0, err
	}
	if len(navMap) == 0 {
		log.Printf("  ⚠️  No NAV data found for date %s\n", nd.DateStr)
		return 0, nil
	}

	holdings, err := g.loadHoldingsForDate(ctx, nd.DateStr)
	if err != nil {
		return 0, err
	}
	if len(holdings) == 0 {
		log.Printf("  ⚠️  No holdings found for date %s\n", nd.DateStr)
		return 0, nil
	}

	// Build AUM rows (single-threaded per date; batching is the bottleneck)
	var rows []aumRow
	for _, h := range holdings {
		navPerUnit, ok := navMap[h.FundID]
		if !ok {
			continue
		}
		agentID, ok := investorAgentMap[h.InvestorID]
		if !ok {
			continue
		}
		units := h.UnitsAfter
		aumValue := units * navPerUnit
		fund := fundMap[h.FundID]
		mgmtRate := fund.ManagementFeeRate / 100
		valuationBasis := fund.ValuationBasis
		if valuationBasis == 0 {
			valuationBasis = 365
		}
		daysKey := fmt.Sprintf("%d-%s", h.FundID, nd.DateStr)
		days := fundDateDaysMap[daysKey]
		if days < 1 {
			days = 1
		}
		managementFee := (aumValue * mgmtRate / float64(valuationBasis)) * float64(days)

		rows = append(rows, aumRow{
			InvestorID:    h.InvestorID,
			AgentID:       agentID,
			FundID:        h.FundID,
			DateStr:       nd.DateStr,
			Units:         units,
			NavPerUnit:    navPerUnit,
			AUMValue:      aumValue,
			Days:          days,
			ManagementFee: managementFee,
		})
	}

	inserted := 0
	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		batch := rows[i:end]
		n, err := g.insertAUMBatch(ctx, batch)
		if err != nil {
			return inserted, err
		}
		inserted += n
	}

	// Aggregate totals for this date and upsert into aum_daily
	var totalAUM, totalMgmtFee float64
	for _, r := range rows {
		totalAUM += r.AUMValue
		totalMgmtFee += r.ManagementFee
	}
	if err := g.insertAumDaily(ctx, nd.DateStr, totalAUM, totalMgmtFee); err != nil {
		return inserted, err
	}

	return inserted, nil
}
