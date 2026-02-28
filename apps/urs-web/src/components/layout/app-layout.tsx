'use client';;
import { HomeLine, Settings01 } from "@untitledui/icons";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-primary lg:flex-row">
      <SidebarNavigationSimple
        hideBorder
        items={[
          {
            label: "Home",
            href: "/",
            icon: HomeLine,
            items: [
              { label: "Overview", href: "/" },
              { label: "Funds", href: "/Funds" },
              { label: "Transactions", href: "/transactions" },
              { label: "Investors", href: "/investors" },
            ],
          },
          // {
          //   label: "Dashboard",
          //   href: "/dashboard",
          //   icon: BarChartSquare02,
          //   items: [
          //     { label: "Overview", href: "/dashboard/overview" },
          //     { label: "Notifications", href: "/dashboard/notifications", badge: 10 },
          //     { label: "Analytics", href: "/dashboard/analytics" },
          //     { label: "Saved reports", href: "/dashboard/saved-reports" },
          //   ],
          // },
          // {
          //   label: "Projects",
          //   href: "/projects",
          //   icon: Rows01,
          //   items: [
          //     { label: "View all", href: "/projects/all" },
          //     { label: "Personal", href: "/projects/personal" },
          //     { label: "Team", href: "/projects/team" },
          //     { label: "Shared with me", href: "/projects/shared-with-me" },
          //     { label: "Archive", href: "/projects/archive" },
          //   ],
          // },
          // {
          //   label: "Tasks",
          //   href: "/tasks",
          //   icon: CheckDone01,
          //   badge: 8,
          //   items: [
          //     { label: "My tasks", href: "/tasks/my-tasks" },
          //     { label: "Assigned to me", href: "/tasks/assigned" },
          //     { label: "Completed", href: "/tasks/completed" },
          //     { label: "Upcoming", href: "/tasks/upcoming" },
          //   ],
          // },
          // {
          //   label: "Reporting",
          //   href: "/reporting",
          //   icon: PieChart03,
          //   items: [
          //     { label: "Dashboard", href: "/reporting/dashboard" },
          //     { label: "Revenue", href: "/reporting/revenue" },
          //     { label: "Performance", href: "/reporting/performance" },
          //     { label: "Export data", href: "/reporting/export" },
          //   ],
          // },
          // {
          //   label: "Users",
          //   href: "/users",
          //   icon: Users01,
          //   items: [
          //     { label: "All users", href: "/users/all" },
          //     { label: "Admins", href: "/users/admins" },
          //     { label: "Team members", href: "/users/team" },
          //     { label: "Permissions", href: "/users/permissions" },
          //   ],
          // },
        ]}
        footerItems={[
          {
            label: "Settings",
            href: "/settings",
            icon: Settings01,
          },
          // {
          //   label: "Support",
          //   href: "/support",
          //   icon: MessageChatCircle,
          //   badge: (
          //     <BadgeWithDot size="sm" color="success" type="modern">
          //       Online
          //     </BadgeWithDot>
          //   ),
          // },
          // {
          //   label: "Open in browser",
          //   href: "https://www.google.com",
          //   icon: LayoutAlt01,
          // },
        ]}
        className="border-r-0"
      />
      <main className="min-w-0 flex-1 lg:pt-2 h-screen overflow-y-auto">
        <div className="flex h-full flex-col gap-8 border-secondary bg-secondary_subtle pt-8 pb-12 shadow-xs lg:rounded-tl-[32px] lg:border-t lg:border-l">
          {children}
        </div>
      </main>
    </div>
  );
}



