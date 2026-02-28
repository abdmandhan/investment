"use client";

import { Activity, AlertCircle, CheckCircle, Clock, UsersPlus, CurrencyDollar } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Badge } from "@/components/base/badges/badges";

interface ActivityItem {
  id: string | number;
  type: 'transaction' | 'approval' | 'investor' | 'system' | 'alert';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'error' | 'info';
  metadata?: Record<string, string | number>;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
  title?: string;
  loading?: boolean;
  maxItems?: number;
}

const activityConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  transaction: {
    icon: CurrencyDollar,
    color: "text-brand-secondary",
    bgColor: "bg-brand-secondary/10"
  },
  approval: {
    icon: CheckCircle,
    color: "text-success-primary",
    bgColor: "bg-success-secondary/10"
  },
  investor: {
    icon: UsersPlus,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  system: {
    icon: Activity,
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  },
  alert: {
    icon: AlertCircle,
    color: "text-warning-primary",
    bgColor: "bg-warning-secondary/10"
  },
};

const statusConfig: Record<string, { label: string; color: any }> = {
  success: { label: "Completed", color: "success" },
  pending: { label: "Pending", color: "warning" },
  error: { label: "Failed", color: "error" },
  info: { label: "Info", color: "brand" },
};

export const ActivityFeed = ({
  activities,
  className,
  title = "Recent Activity",
  loading = false,
  maxItems = 10,
}: ActivityFeedProps) => {
  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
        <div className="px-5 py-4 border-b border-secondary">
          <h3 className="text-md font-semibold text-primary">{title}</h3>
        </div>
        <div className="p-5 animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-secondary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-secondary rounded"></div>
                <div className="h-3 w-1/2 bg-secondary rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
      <div className="px-5 py-4 border-b border-secondary">
        <h3 className="text-md font-semibold text-primary">{title}</h3>
      </div>
      <div className="divide-y divide-secondary">
        {displayActivities.map((activity) => {
          const config = activityConfig[activity.type] || activityConfig.system;
          const Icon = config.icon;
          const status = activity.status ? statusConfig[activity.status] : null;

          return (
            <div key={activity.id} className="flex gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors">
              <div className={cx("shrink-0 w-10 h-10 rounded-full flex items-center justify-center", config.bgColor)}>
                <Icon className={cx("size-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-secondary truncate">{activity.title}</p>
                  {status && (
                    <Badge color={status.color} size="sm">
                      {status.label}
                    </Badge>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm text-tertiary mt-0.5">{activity.description}</p>
                )}
                {activity.metadata && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <span key={key} className="text-xs text-quaternary bg-secondary px-2 py-0.5 rounded">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-quaternary mt-2 flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {activities.length === 0 && (
        <div className="px-5 py-8 text-center">
          <Activity className="size-8 text-quaternary mx-auto mb-2" />
          <p className="text-tertiary">No recent activity</p>
        </div>
      )}
    </div>
  );
};

// Pending Approvals Component
interface PendingApproval {
  id: number;
  entity: string;
  action: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PendingApprovalsProps {
  approvals: PendingApproval[];
  className?: string;
  loading?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export const PendingApprovals = ({
  approvals,
  className,
  loading = false,
  onApprove,
  onReject,
}: PendingApprovalsProps) => {
  if (loading) {
    return (
      <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5 animate-pulse", className)}>
        <div className="h-6 w-40 bg-secondary rounded mb-4"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-secondary rounded mb-2"></div>
        ))}
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const actionLabels: Record<string, string> = {
    CREATE: 'Create',
    UPDATE: 'Update',
    DELETE: 'Delete',
    RESTORE: 'Restore',
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)}>
      <div className="px-5 py-4 border-b border-secondary">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-primary">Pending Approvals</h3>
          {approvals.length > 0 && (
            <Badge color="warning" size="sm">
              {approvals.length} pending
            </Badge>
          )}
        </div>
      </div>
      <div className="divide-y divide-secondary">
        {approvals.map((approval) => (
          <div key={approval.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-secondary">
                  {actionLabels[approval.action] || approval.action} {approval.entity}
                </p>
                <p className="text-sm text-tertiary mt-0.5">
                  Requested by {approval.requestedBy} • {formatDate(approval.requestedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onReject?.(approval.id)}
                  className="px-3 py-1.5 text-sm font-medium text-error-primary hover:bg-error-primary/10 rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove?.(approval.id)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-brand-solid hover:bg-brand-solid_hover rounded-lg transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        ))}
        {approvals.length === 0 && (
          <div className="px-5 py-8 text-center">
            <CheckCircle className="size-8 text-success-primary mx-auto mb-2" />
            <p className="text-tertiary">No pending approvals</p>
          </div>
        )}
      </div>
    </div>
  );
};
