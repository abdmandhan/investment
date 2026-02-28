"use client";

import { Table, TableCard } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { TrendUp01, TrendDown01, Award01, ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";

// Fund Performance Table
interface FundPerformance {
  id: number;
  name: string;
  code: string;
  color?: string;
  currentNAV: number;
  performance: number;
  trend: "positive" | "negative";
  aum?: number;
  investorCount?: number;
}

interface FundPerformanceTableProps {
  funds: FundPerformance[];
  className?: string;
  loading?: boolean;
  showAUM?: boolean;
  showInvestorCount?: boolean;
  maxRows?: number;
}

export const FundPerformanceTable = ({
  funds,
  className,
  loading = false,
  showAUM = false,
  showInvestorCount = false,
  maxRows = 5,
}: FundPerformanceTableProps) => {
  const displayFunds = funds.slice(0, maxRows);

  if (loading) {
    return (
      <TableCard.Root className={className}>
        <TableCard.Header title="Fund Performance" />
        <div className="p-8 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded mb-2"></div>
          ))}
        </div>
      </TableCard.Root>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <TableCard.Root className={className}>
      <TableCard.Header
        title="Top Performing Funds"
        badge={funds.length}
      />
      <Table>
        <Table.Header>
          <Table.Head label="Fund" />
          <Table.Head label="NAV" />
          <Table.Head label="Performance" />
          {showAUM && <Table.Head label="AUM" />}
          {showInvestorCount && <Table.Head label="Investors" />}
        </Table.Header>
        <Table.Body>
          {displayFunds.map((fund) => (
            <Table.Row key={fund.id}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: fund.color || '#7F56D9' }}
                  />
                  <div>
                    <span className="font-medium text-secondary block">{fund.name}</span>
                    <span className="text-xs text-tertiary">{fund.code}</span>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="font-medium text-secondary">
                  {fund.currentNAV.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className={cx("flex items-center gap-1",
                  fund.trend === 'positive' ? 'text-success-primary' : 'text-error-primary'
                )}>
                  {fund.trend === 'positive' ? (
                    <TrendUp01 className="size-4" />
                  ) : (
                    <TrendDown01 className="size-4" />
                  )}
                  <span className="font-medium">
                    {fund.performance > 0 ? '+' : ''}{fund.performance}%
                  </span>
                </div>
              </Table.Cell>
              {showAUM && (
                <Table.Cell>
                  <span className="text-tertiary">Rp {formatCurrency(fund.aum || 0)}</span>
                </Table.Cell>
              )}
              {showInvestorCount && (
                <Table.Cell>
                  <span className="text-tertiary">{fund.investorCount?.toLocaleString('id-ID')}</span>
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
};

// Agent Ranking Table
interface AgentRanking {
  id: number;
  code: string;
  name: string;
  level: string;
  totalAUM: number;
  investorCount?: number;
  monthlySales?: number;
}

interface AgentRankingTableProps {
  agents: AgentRanking[];
  className?: string;
  loading?: boolean;
  showLevel?: boolean;
  maxRows?: number;
}

export const AgentRankingTable = ({
  agents,
  className,
  loading = false,
  showLevel = true,
  maxRows = 5,
}: AgentRankingTableProps) => {
  const displayAgents = agents.slice(0, maxRows);

  if (loading) {
    return (
      <TableCard.Root className={className}>
        <TableCard.Header title="Top Performers" />
        <div className="p-8 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded mb-2"></div>
          ))}
        </div>
      </TableCard.Root>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  const rankColors = ["text-warning-primary", "text-quaternary", "text-orange-600"];

  return (
    <TableCard.Root className={className}>
      <TableCard.Header
        title="Agent Performance Ranking"
        badge={agents.length}
      />
      <Table>
        <Table.Header>
          <Table.Head label="Rank" />
          <Table.Head label="Agent" />
          {showLevel && <Table.Head label="Level" />}
          <Table.Head label="AUM" />
        </Table.Header>
        <Table.Body>
          {displayAgents.map((agent, index) => (
            <Table.Row key={agent.id}>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  {index < 3 ? (
                    <Award01 className={cx("size-5", rankColors[index])} />
                  ) : (
                    <span className="w-5 text-center text-tertiary font-medium">{index + 1}</span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div>
                  <span className="font-medium text-secondary block">{agent.name}</span>
                  <span className="text-xs text-tertiary">{agent.code}</span>
                </div>
              </Table.Cell>
              {showLevel && (
                <Table.Cell>
                  <Badge color="gray" size="sm">{agent.level}</Badge>
                </Table.Cell>
              )}
              <Table.Cell>
                <span className="font-medium text-secondary">
                  Rp {formatCurrency(agent.totalAUM)}
                </span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
};

// Top Investors Table
interface TopInvestor {
  id: string;
  name: string;
  email?: string;
  aum: number;
  since?: string;
}

interface TopInvestorsTableProps {
  investors: TopInvestor[];
  className?: string;
  loading?: boolean;
  maxRows?: number;
}

export const TopInvestorsTable = ({
  investors,
  className,
  loading = false,
  maxRows = 5,
}: TopInvestorsTableProps) => {
  const displayInvestors = investors.slice(0, maxRows);

  if (loading) {
    return (
      <TableCard.Root className={className}>
        <TableCard.Header title="Top Investors" />
        <div className="p-8 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded mb-2"></div>
          ))}
        </div>
      </TableCard.Root>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <TableCard.Root className={className}>
      <TableCard.Header
        title="Top Investors by AUM"
        badge={investors.length}
      />
      <Table>
        <Table.Header>
          <Table.Head label="Investor" />
          <Table.Head label="AUM" />
        </Table.Header>
        <Table.Body>
          {displayInvestors.map((investor) => (
            <Table.Row key={investor.id}>
              <Table.Cell>
                <div>
                  <span className="font-medium text-secondary block">{investor.name}</span>
                  {investor.email && (
                    <span className="text-xs text-tertiary">{investor.email}</span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="font-medium text-secondary">
                  Rp {formatCurrency(investor.aum)}
                </span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div className="px-5 py-3 border-t border-secondary">
        <Button color="link-gray" size="sm" iconTrailing={ChevronRight}>
          View all investors
        </Button>
      </div>
    </TableCard.Root>
  );
};
