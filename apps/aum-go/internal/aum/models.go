package aum

import "time"

type navDateRow struct {
	Date    time.Time
	DateStr string
}

type fundInfo struct {
	ManagementFeeRate float64
	ValuationBasis    int
}

type holdingRow struct {
	InvestorID string
	FundID     int
	UnitsAfter float64
}

type aumRow struct {
	InvestorID    string
	AgentID       int
	FundID        int
	DateStr       string
	Units         float64
	NavPerUnit    float64
	AUMValue      float64
	Days          int
	ManagementFee float64
}
