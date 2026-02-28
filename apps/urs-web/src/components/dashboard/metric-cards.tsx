"use client";

import type { FC, ReactNode } from "react";
import { TrendDown01, TrendUp01, CurrencyDollar, Users01, Building02, Award01, Wallet01 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  trend?: "positive" | "negative" | "neutral";
  icon?: FC<{ className?: string }>;
  iconColor?: "brand" | "success" | "error" | "warning" | "gray";
  footer?: ReactNode;
  className?: string;
  loading?: boolean;
}

export const DashboardMetricCard = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = "vs last month",
  trend = "neutral",
  icon: Icon,
  iconColor = "brand",
  footer,
  className,
  loading = false,
}: DashboardMetricCardProps) => {
  if (loading) {
    return (
      <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5 animate-pulse", className)}>
        <div className="h-4 w-24 bg-secondary rounded mb-4"></div>
        <div className="h-8 w-32 bg-secondary rounded mb-2"></div>
        <div className="h-4 w-20 bg-secondary rounded"></div>
      </div>
    );
  }

  const TrendIcon = trend === "positive" ? TrendUp01 : trend === "negative" ? TrendDown01 : null;
  const trendColor = trend === "positive" ? "text-success-primary" : trend === "negative" ? "text-error-primary" : "text-tertiary";

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
      <div className="relative flex flex-col gap-4 px-4 py-5 md:px-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-tertiary">{title}</h3>
          {Icon && (
            <FeaturedIcon
              color={iconColor}
              theme="light"
              icon={Icon}
              size="md"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-display-sm font-semibold text-primary">{value}</p>

          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2">
              {change !== undefined && (
                <div className={cx("flex items-center gap-1 text-sm font-medium", trendColor)}>
                  {TrendIcon && <TrendIcon className="size-4" />}
                  <span>{change > 0 ? `+${change}%` : `${change}%`}</span>
                </div>
              )}
              {changeLabel && (
                <span className="text-sm text-tertiary">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {footer && (
        <div className="flex items-center justify-end border-t border-secondary px-4 py-3 md:px-5">
          {footer}
        </div>
      )}
    </div>
  );
};

// Pre-configured metric cards for common use cases
export const AUMCard = ({
  value,
  change,
  loading
}: {
  value: number;
  change?: number;
  loading?: boolean;
}) => (
  <DashboardMetricCard
    title="Total AUM"
    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)}
    change={change}
    trend={change && change > 0 ? "positive" : change && change < 0 ? "negative" : "neutral"}
    icon={CurrencyDollar}
    iconColor="brand"
    loading={loading}
  />
);

export const InvestorCountCard = ({
  value,
  change,
  loading
}: {
  value: number;
  change?: number;
  loading?: boolean;
}) => (
  <DashboardMetricCard
    title="Total Investors"
    value={new Intl.NumberFormat('id-ID').format(value)}
    change={change}
    trend={change && change > 0 ? "positive" : change && change < 0 ? "negative" : "neutral"}
    icon={Users01}
    iconColor="success"
    loading={loading}
  />
);

export const FundCountCard = ({
  value,
  loading
}: {
  value: number;
  loading?: boolean;
}) => (
  <DashboardMetricCard
    title="Active Funds"
    value={value}
    icon={Building02}
    iconColor="gray"
    loading={loading}
  />
);

export const AgentCountCard = ({
  value,
  loading
}: {
  value: number;
  loading?: boolean;
}) => (
  <DashboardMetricCard
    title="Sales Agents"
    value={value}
    icon={Award01}
    iconColor="warning"
    loading={loading}
  />
);

export const PortfolioValueCard = ({
  value,
  change,
  loading
}: {
  value: number;
  change?: number;
  loading?: boolean;
}) => (
  <DashboardMetricCard
    title="Portfolio Value"
    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)}
    change={change}
    trend={change && change > 0 ? "positive" : change && change < 0 ? "negative" : "neutral"}
    icon={Wallet01}
    iconColor="success"
    loading={loading}
  />
);
