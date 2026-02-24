package aum

import (
	"context"
	"fmt"
	"time"
)

func (g *Generator) loadNAVDates(ctx context.Context) ([]navDateRow, error) {
	rows, err := g.pool.Query(ctx, `
		SELECT DISTINCT date FROM fund_navs ORDER BY date ASC;
	`)
	if err != nil {
		return nil, fmt.Errorf("query nav dates: %w", err)
	}
	defer rows.Close()

	var out []navDateRow
	for rows.Next() {
		var t time.Time
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		out = append(out, navDateRow{Date: t, DateStr: t.Format("2006-01-02")})
	}
	return out, rows.Err()
}

func (g *Generator) loadFunds(ctx context.Context) (map[int]fundInfo, error) {
	rows, err := g.pool.Query(ctx, `
		SELECT id, management_fee_rate, valuation_basis FROM funds;
	`)
	if err != nil {
		return nil, fmt.Errorf("query funds: %w", err)
	}
	defer rows.Close()

	out := make(map[int]fundInfo)
	for rows.Next() {
		var id, vb int
		var rate float64
		if err := rows.Scan(&id, &rate, &vb); err != nil {
			return nil, err
		}
		out[id] = fundInfo{ManagementFeeRate: rate, ValuationBasis: vb}
	}
	return out, rows.Err()
}

func (g *Generator) loadAgentInvestors(ctx context.Context) (map[string]int, error) {
	rows, err := g.pool.Query(ctx, `
		SELECT investor_id, agent_id
		FROM (
			SELECT investor_id, agent_id,
				ROW_NUMBER() OVER (PARTITION BY investor_id ORDER BY effective_date DESC) AS rn
			FROM agent_investors
		) sub
		WHERE rn = 1;
	`)
	if err != nil {
		return nil, fmt.Errorf("query agent_investors: %w", err)
	}
	defer rows.Close()

	out := make(map[string]int)
	for rows.Next() {
		var investorID string
		var agentID int
		if err := rows.Scan(&investorID, &agentID); err != nil {
			return nil, err
		}
		out[investorID] = agentID
	}
	return out, rows.Err()
}

func (g *Generator) precalcDays(ctx context.Context) (map[string]int, error) {
	rows, err := g.pool.Query(ctx, `
		SELECT fund_id, date,
			COALESCE((date - LAG(date) OVER (PARTITION BY fund_id ORDER BY date))::integer, 1) AS days
		FROM fund_navs
		ORDER BY fund_id, date;
	`)
	if err != nil {
		return nil, fmt.Errorf("query days: %w", err)
	}
	defer rows.Close()

	out := make(map[string]int)
	for rows.Next() {
		var fundID, days int
		var t time.Time
		if err := rows.Scan(&fundID, &t, &days); err != nil {
			return nil, err
		}
		if days < 1 {
			days = 1
		}
		out[fmt.Sprintf("%d-%s", fundID, t.Format("2006-01-02"))] = days
	}
	return out, rows.Err()
}

// loadAumDailyDates returns the set of dates that already have a row in aum_daily (skip re-calculation).
func (g *Generator) loadAumDailyDates(ctx context.Context) (map[string]bool, error) {
	rows, err := g.pool.Query(ctx, `SELECT date FROM aum_daily`)
	if err != nil {
		return nil, fmt.Errorf("query aum_daily dates: %w", err)
	}
	defer rows.Close()

	out := make(map[string]bool)
	for rows.Next() {
		var t time.Time
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		out[t.Format("2006-01-02")] = true
	}
	return out, rows.Err()
}

func (g *Generator) loadNAVsForDate(ctx context.Context, dateStr string) (map[int]float64, error) {
	rows, err := g.pool.Query(ctx, `
		SELECT fund_id, nav_per_unit FROM fund_navs WHERE date = $1::date;
	`, dateStr)
	if err != nil {
		return nil, fmt.Errorf("query navs: %w", err)
	}
	defer rows.Close()

	out := make(map[int]float64)
	for rows.Next() {
		var fundID int
		var nav float64
		if err := rows.Scan(&fundID, &nav); err != nil {
			return nil, err
		}
		out[fundID] = nav
	}
	return out, rows.Err()
}

func (g *Generator) loadHoldingsForDate(ctx context.Context, dateStr string) ([]holdingRow, error) {
	rows, err := g.pool.Query(ctx, `
		WITH ranked_holdings AS (
			SELECT ih.investor_id, ih.fund_id, ih.units_after,
				ROW_NUMBER() OVER (PARTITION BY ih.investor_id, ih.fund_id ORDER BY t.transaction_date DESC, ih.id DESC) AS rn
			FROM investor_holdings ih
			INNER JOIN transactions t ON t.id = ih.transaction_id
			WHERE t.transaction_date <= $1::date
		)
		SELECT investor_id, fund_id, units_after::float8
		FROM ranked_holdings
		WHERE rn = 1 AND units_after > 0;
	`, dateStr)
	if err != nil {
		return nil, fmt.Errorf("query holdings: %w", err)
	}
	defer rows.Close()

	var out []holdingRow
	for rows.Next() {
		var h holdingRow
		if err := rows.Scan(&h.InvestorID, &h.FundID, &h.UnitsAfter); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	return out, rows.Err()
}
