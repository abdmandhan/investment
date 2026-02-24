package aum

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

func (g *Generator) insertAUMBatch(ctx context.Context, rows []aumRow) (int, error) {
	if len(rows) == 0 {
		return 0, nil
	}

	batch := &pgx.Batch{}
	for _, r := range rows {
		batch.Queue(`
			INSERT INTO aum_investor_daily (investor_id, agent_id, fund_id, date, units, nav_per_unit, aum_value, days, management_fee)
			VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9)
			ON CONFLICT (investor_id, fund_id, date) DO NOTHING;
		`, r.InvestorID, r.AgentID, r.FundID, r.DateStr, r.Units, r.NavPerUnit, r.AUMValue, r.Days, r.ManagementFee)
	}

	br := g.pool.SendBatch(ctx, batch)
	defer br.Close()

	for i := 0; i < len(rows); i++ {
		if _, err := br.Exec(); err != nil {
			return i, fmt.Errorf("exec row %d: %w", i, err)
		}
	}
	return len(rows), nil
}

// insertAumDaily upserts one row into aum_daily (total AUM and management fee for the date).
// Passes created_at and updated_at from Go because updated_at has NOT NULL and no DEFAULT in the DB.
func (g *Generator) insertAumDaily(ctx context.Context, dateStr string, aumValue, managementFee float64) error {
	now := time.Now()
	_, err := g.pool.Exec(ctx, `
		INSERT INTO aum_daily (date, aum_value, management_fee, created_at, updated_at)
		VALUES ($1::date, $2, $3, $4, $5)
		ON CONFLICT (date) DO UPDATE SET
			aum_value = EXCLUDED.aum_value,
			management_fee = EXCLUDED.management_fee,
			updated_at = $5;
	`, dateStr, aumValue, managementFee, now, now)
	if err != nil {
		return fmt.Errorf("insert aum_daily: %w", err)
	}
	return nil
}
