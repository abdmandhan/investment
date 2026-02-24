package aum

import (
	"context"
	"fmt"
	"log"
	"time"
)

// Verify checks AUM records and reports summary and any missing NAV dates.
func (g *Generator) Verify() error {
	ctx := context.Background()
	log.Println("=== Verifying AUM Records ===\n")

	navDates, err := g.loadNAVDates(ctx)
	if err != nil {
		return fmt.Errorf("load nav dates: %w", err)
	}

	var aumCount int
	err = g.pool.QueryRow(ctx, `SELECT COUNT(*) FROM aum_investor_daily`).Scan(&aumCount)
	if err != nil {
		return fmt.Errorf("count aum: %w", err)
	}

	var holdingsCount int
	err = g.pool.QueryRow(ctx, `SELECT COUNT(*) FROM investor_holdings`).Scan(&holdingsCount)
	if err != nil {
		return fmt.Errorf("count holdings: %w", err)
	}

	log.Printf("📊 Summary:\n")
	log.Printf("   NAV dates: %d\n", len(navDates))
	log.Printf("   AUM records: %d\n", aumCount)
	log.Printf("   Holdings records: %d\n", holdingsCount)

	rows, err := g.pool.Query(ctx, `SELECT DISTINCT date FROM aum_investor_daily ORDER BY date ASC`)
	if err != nil {
		return fmt.Errorf("query aum dates: %w", err)
	}
	defer rows.Close()

	aumDateSet := make(map[string]bool)
	for rows.Next() {
		var t time.Time
		if err := rows.Scan(&t); err != nil {
			return err
		}
		aumDateSet[t.Format("2006-01-02")] = true
	}
	if err := rows.Err(); err != nil {
		return err
	}

	var missing []string
	for _, nd := range navDates {
		if !aumDateSet[nd.DateStr] {
			missing = append(missing, nd.DateStr)
		}
	}

	if len(missing) == 0 {
		log.Println("\n✅ SUCCESS: AUM records generated for all NAV dates!")
	} else {
		log.Printf("\n⚠️  WARNING: %d NAV dates without AUM records\n", len(missing))
		if len(missing) <= 10 {
			log.Printf("   Missing dates: %v\n", missing)
		} else {
			log.Printf("   Missing dates (first 10): %v\n", missing[:10])
			log.Printf("   ... and %d more\n", len(missing)-10)
		}
	}
	log.Println()
	return nil
}
