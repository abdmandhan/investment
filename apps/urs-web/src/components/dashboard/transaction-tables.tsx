"use client";

import { Table, TableCard } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { ArrowDownLeft, ArrowUpRight, SwitchHorizontal01, Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  units: number;
  date: string;
  investorName?: string;
  fundName: string;
  fundCode: string;
  navPerUnit?: number;
  fee?: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  className?: string;
  title?: string;
  showInvestor?: boolean;
  showFund?: boolean;
  showActions?: boolean;
  loading?: boolean;
  maxRows?: number;
}

const transactionTypeConfig: Record<string, { label: string; color: any; icon: any }> = {
  SUBSCRIPTION: {
    label: "Subscription",
    color: "success",
    icon: ArrowDownLeft
  },
  REDEMPTION: {
    label: "Redemption",
    color: "error",
    icon: ArrowUpRight
  },
  SWITCHING_IN: {
    label: "Switch In",
    color: "brand",
    icon: SwitchHorizontal01
  },
  SWITCHING_OUT: {
    label: "Switch Out",
    color: "warning",
    icon: SwitchHorizontal01
  },
};

export const TransactionsTable = ({
  transactions,
  className,
  title = "Recent Transactions",
  showInvestor = true,
  showFund = true,
  showActions = false,
  loading = false,
  maxRows = 10,
}: TransactionsTableProps) => {
  const displayTransactions = transactions.slice(0, maxRows);

  if (loading) {
    return (
      <TableCard.Root className={className}>
        <TableCard.Header title={title} />
        <div className="p-8 animate-pulse">
          {[...Array(5)].map((_, i) => (
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <TableCard.Root className={className}>
      <TableCard.Header
        title={title}
        badge={transactions.length}
        contentTrailing={showActions && (
          <Button size="sm" color="secondary" iconLeading={Download01}>
            Export
          </Button>
        )}
      />
      <Table.Root>
        <Table.Header>
          <Table.Head label="Type" />
          {showInvestor && <Table.Head label="Investor" />}
          {showFund && <Table.Head label="Fund" />}
          <Table.Head label="Amount" />
          <Table.Head label="Units" />
          <Table.Head label="Date" />
        </Table.Header>
        <Table.Body>
          {displayTransactions.map((transaction) => {
            const config = transactionTypeConfig[transaction.type] || {
              label: transaction.type,
              color: "gray",
              icon: null
            };
            const Icon = config.icon;

            return (
              <Table.Row key={transaction.id}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className={cx("size-4",
                      transaction.type === 'SUBSCRIPTION' ? 'text-success-primary' :
                        transaction.type === 'REDEMPTION' ? 'text-error-primary' :
                          transaction.type === 'SWITCHING_IN' ? 'text-brand-secondary' :
                            'text-warning-primary'
                    )} />}
                    <Badge color={config.color} size="sm">
                      {config.label}
                    </Badge>
                  </div>
                </Table.Cell>
                {showInvestor && (
                  <Table.Cell>
                    <span className="font-medium text-secondary">
                      {transaction.investorName || '-'}
                    </span>
                  </Table.Cell>
                )}
                {showFund && (
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span className="font-medium text-secondary">
                        {transaction.fundName}
                      </span>
                      <span className="text-xs text-tertiary">
                        {transaction.fundCode}
                      </span>
                    </div>
                  </Table.Cell>
                )}
                <Table.Cell>
                  <span className="font-medium text-secondary">
                    {formatCurrency(transaction.amount)}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-tertiary">
                    {transaction.units.toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary">
                    {formatDate(transaction.date)}
                  </span>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
      {transactions.length > maxRows && (
        <div className="flex justify-center py-3 border-t border-secondary">
          <Button color="link-gray" size="sm">
            View all {transactions.length} transactions
          </Button>
        </div>
      )}
    </TableCard.Root>
  );
};

// Simplified transaction list for investor dashboard
interface TransactionListProps {
  transactions: Transaction[];
  className?: string;
  loading?: boolean;
}

export const TransactionList = ({ transactions, className, loading }: TransactionListProps) => {
  if (loading) {
    return (
      <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
      <div className="px-5 py-4 border-b border-secondary">
        <h3 className="text-md font-semibold text-primary">Recent Transactions</h3>
      </div>
      <div className="divide-y divide-secondary">
        {transactions.map((transaction) => {
          const config = transactionTypeConfig[transaction.type] || {
            label: transaction.type,
            color: "gray",
            icon: null
          };
          const Icon = config.icon;
          const isPositive = transaction.type === 'SUBSCRIPTION' || transaction.type === 'SWITCHING_IN';

          return (
            <div key={transaction.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cx("p-2 rounded-lg",
                  transaction.type === 'SUBSCRIPTION' ? 'bg-success-secondary/20' :
                    transaction.type === 'REDEMPTION' ? 'bg-error-secondary/20' :
                      transaction.type === 'SWITCHING_IN' ? 'bg-brand-secondary/20' :
                        'bg-warning-secondary/20'
                )}>
                  {Icon && <Icon className={cx("size-5",
                    transaction.type === 'SUBSCRIPTION' ? 'text-success-primary' :
                      transaction.type === 'REDEMPTION' ? 'text-error-primary' :
                        transaction.type === 'SWITCHING_IN' ? 'text-brand-secondary' :
                          'text-warning-primary'
                  )} />}
                </div>
                <div>
                  <p className="font-medium text-secondary">{config.label}</p>
                  <p className="text-sm text-tertiary">{transaction.fundName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cx("font-medium",
                  isPositive ? 'text-success-primary' : 'text-error-primary'
                )}>
                  {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-tertiary">{formatDate(transaction.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
