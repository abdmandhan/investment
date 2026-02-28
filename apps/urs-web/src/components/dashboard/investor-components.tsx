"use client";

import { Table, TableCard } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { TrendUp01, TrendDown01, Plus, ArrowRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";

// Holdings Table
interface Holding {
  fundId: number;
  fundName: string;
  fundCode: string;
  color?: string;
  units: number;
  navPerUnit: number;
  value: number;
  navDate?: string;
}

interface HoldingsTableProps {
  holdings: Holding[];
  className?: string;
  loading?: boolean;
}

export const HoldingsTable = ({
  holdings,
  className,
  loading = false,
}: HoldingsTableProps) => {
  if (loading) {
    return (
      <TableCard.Root className={className}>
        <TableCard.Header title="Your Holdings" />
        <div className="p-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-secondary rounded mb-2"></div>
          ))}
        </div>
      </TableCard.Root>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <TableCard.Root className={className}>
      <TableCard.Header 
        title="Your Holdings" 
        badge={holdings.length}
      />
      <Table.Root>
        <Table.Header>
          <Table.Head label="Fund" />
          <Table.Head label="Units" />
          <Table.Head label="NAV/Unit" />
          <Table.Head label="Value" />
        </Table.Header>
        <Table.Body>
          {holdings.map((holding) => (
            <Table.Row key={holding.fundId}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: holding.color || '#7F56D9' }}
                  />
                  <div>
                    <span className="font-medium text-secondary block">{holding.fundName}</span>
                    <span className="text-xs text-tertiary">{holding.fundCode}</span>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="text-secondary">
                  {holding.units.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div>
                  <span className="text-secondary">
                    {holding.navPerUnit.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                  {holding.navDate && (
                    <span className="text-xs text-tertiary block">
                      as of {new Date(holding.navDate).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="font-medium text-secondary">
                  {formatCurrency(holding.value)}
                </span>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {holdings.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-tertiary mb-4">You don't have any holdings yet</p>
          <Button color="primary" iconLeading={Plus}>
            Start Investing
          </Button>
        </div>
      )}
    </TableCard.Root>
  );
};

// Available Funds List
interface AvailableFund {
  id: number;
  name: string;
  code: string;
  color?: string;
  currentNAV: number;
  navChange: number;
  trend: "positive" | "negative";
}

interface AvailableFundsListProps {
  funds: AvailableFund[];
  className?: string;
  loading?: boolean;
  onSubscribe?: (fundId: number) => void;
}

export const AvailableFundsList = ({
  funds,
  className,
  loading = false,
  onSubscribe,
}: AvailableFundsListProps) => {
  if (loading) {
    return (
      <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5 animate-pulse", className)}>
        <div className="h-6 w-40 bg-secondary rounded mb-4"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-secondary rounded mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
      <div className="px-5 py-4 border-b border-secondary">
        <h3 className="text-md font-semibold text-primary">Available Funds</h3>
      </div>
      <div className="divide-y divide-secondary">
        {funds.map((fund) => (
          <div key={fund.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${fund.color}20` || '#F4EBFF' }}
              >
                <span 
                  className="text-lg font-bold"
                  style={{ color: fund.color || '#7F56D9' }}
                >
                  {fund.code.slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-medium text-secondary">{fund.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-tertiary">{fund.code}</span>
                  <span className="text-sm text-tertiary">•</span>
                  <span className="text-sm text-secondary">
                    {fund.currentNAV.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cx("flex items-center gap-1 text-sm",
                fund.trend === 'positive' ? 'text-success-primary' : 'text-error-primary'
              )}>
                {fund.trend === 'positive' ? (
                  <TrendUp01 className="size-4" />
                ) : (
                  <TrendDown01 className="size-4" />
                )}
                <span>{fund.navChange > 0 ? '+' : ''}{fund.navChange}%</span>
              </div>
              <Button 
                size="sm" 
                color="primary"
                onClick={() => onSubscribe?.(fund.id)}
              >
                Subscribe
              </Button>
            </div>
          </div>
        ))}
        {funds.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-tertiary">No funds available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Statements List
interface Statement {
  id: string;
  month: string;
  year: number;
  monthNumber: number;
  available: boolean;
}

interface StatementsListProps {
  statements: Statement[];
  className?: string;
  loading?: boolean;
  onDownload?: (statementId: string) => void;
}

export const StatementsList = ({
  statements,
  className,
  loading = false,
  onDownload,
}: StatementsListProps) => {
  if (loading) {
    return (
      <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5 animate-pulse", className)}>
        <div className="h-6 w-40 bg-secondary rounded mb-4"></div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-secondary rounded mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
      <div className="px-5 py-4 border-b border-secondary">
        <h3 className="text-md font-semibold text-primary">Statements</h3>
      </div>
      <div className="divide-y divide-secondary">
        {statements.map((statement) => (
          <div 
            key={statement.id} 
            className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-xs font-medium text-tertiary">
                  {statement.month.slice(0, 3)}
                </span>
              </div>
              <span className="text-secondary">{statement.month}</span>
            </div>
            <Button 
              size="sm" 
              color="secondary"
              disabled={!statement.available}
              onClick={() => onDownload?.(statement.id)}
            >
              Download
            </Button>
          </div>
        ))}
        {statements.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-tertiary">No statements available</p>
          </div>
        )}
      </div>
    </div>
  );
};
