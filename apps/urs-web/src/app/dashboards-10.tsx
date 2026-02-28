"use client";

import { parseDate } from "@internationalized/date";
import {
    BarChartSquare02,
    CheckDone01,
    DownloadCloud02,
    FilterLines,
    HomeLine,
    LayoutAlt01,
    MessageChatCircle,
    PieChart03,
    Plus,
    Rows01,
    Settings01,
    Users01,
} from "@untitledui/icons";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label as RechartsLabel, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis } from "recharts";
import { FeedItem } from "@/components/application/activity-feed/activity-feed";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { ContentDivider } from "@/components/application/content-divider/content-divider";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { MetricsSimple } from "@/components/application/metrics/metrics";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Dot } from "@/components/foundations/dot-icon";
import { useBreakpoint } from "@/hooks/use-breakpoint";

const lineData = [
    {
        date: "2025-01-01",
        A: 600,
        B: 350,
    },
    {
        date: "2025-02-01",
        A: 620,
        B: 370,
    },
    {
        date: "2025-03-01",
        A: 630,
        B: 380,
    },
    {
        date: "2025-04-01",
        A: 650,
        B: 400,
    },
    {
        date: "2025-05-01",
        A: 600,
        B: 350,
    },
    {
        date: "2025-06-01",
        A: 650,
        B: 400,
    },
    {
        date: "2025-07-01",
        A: 620,
        B: 370,
    },
    {
        date: "2025-08-01",
        A: 750,
        B: 500,
    },
    {
        date: "2025-09-01",
        A: 780,
        B: 530,
    },
    {
        date: "2025-10-01",
        A: 750,
        B: 500,
    },
    {
        date: "2025-11-01",
        A: 780,
        B: 530,
    },
    {
        date: "2025-12-01",
        A: 820,
        B: 570,
    },
];

const feedItems = [
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/demi-wilkinson?fm=webp&q=80",
        name: "Demi Wilkinson",
        title: "Webflow 101",
        unseen: true,
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/aliah-lane?fm=webp&q=80",
        name: "Aliah Lane",
        title: "SEO Masterclass",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80",
        name: "Lana Steiner",
        title: "Figma Mockups",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/candice-wu?fm=webp&q=80",
        name: "Candice Wu",
        title: "Webflow 101",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/ava-wright?fm=webp&q=80",
        name: "Ava Wright",
        title: "SEO Masterclass",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/koray-okumus?fm=webp&q=80",
        name: "Koray Okumus",
        title: "SEO Masterclass",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/andi-lane?fm=webp&q=80",
        name: "Andi Lane",
        title: "The Ultimate Guide to Backlinks",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/drew-cano?fm=webp&q=80",
        name: "Drew Cano",
        title: "The Figma Dashboard Bundle",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/zahir-mays?fm=webp&q=80",
        name: "Zahir Mays",
        title: "The Figma Dashboard Bundle",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/rene-wells?fm=webp&q=80",
        name: "Rene Wells",
        title: "The Design Handbook",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/joshua-wilson?fm=webp&q=80",
        name: "Joshua Wilson",
        title: "Phone 13 Mockups",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/lori-bryson?fm=webp&q=80",
        name: "Lori Bryson",
        title: "SEO Masterclass",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/loki-bright?fm=webp&q=80",
        name: "Loki Bright",
        title: "Figma Mockups",
    },
    {
        avatarUrl: "https://www.untitledui.com/images/avatars/anita-cruz?fm=webp&q=80",
        name: "Anita Cruz",
        title: "The Ultimate Guide to Backlinks",
    },
];

const barData = [
    {
        date: "2025-01-01",
        A: 300,
        B: 350,
    },
    {
        date: "2025-02-01",
        A: 320,
        B: 300,
    },
    {
        date: "2025-03-01",
        A: 300,
        B: 240,
    },
    {
        date: "2025-04-01",
        A: 240,
        B: 280,
    },
    {
        date: "2025-05-01",
        A: 320,
        B: 100,
    },
    {
        date: "2025-06-01",
        A: 330,
        B: 130,
    },
    {
        date: "2025-07-01",
        A: 300,
        B: 100,
    },
    {
        date: "2025-08-01",
        A: 350,
        B: 200,
    },
    {
        date: "2025-09-01",
        A: 300,
        B: 100,
    },
    {
        date: "2025-10-01",
        A: 200,
        B: 280,
    },
    {
        date: "2025-11-01",
        A: 240,
        B: 300,
    },
    {
        date: "2025-12-01",
        A: 200,
        B: 350,
    },
];

const colors: Record<string, string> = {
    A: "text-utility-brand-500",
    B: "text-utility-gray-200",
};

export const Dashboard10 = () => {
    const isDesktop = useBreakpoint("lg");

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
                            { label: "Overview", href: "/overview" },
                            { label: "Products", href: "/products" },
                            { label: "Orders", href: "/orders" },
                            { label: "Customers", href: "/customers" },
                        ],
                    },
                    {
                        label: "Dashboard",
                        href: "/dashboard",
                        icon: BarChartSquare02,
                        items: [
                            { label: "Overview", href: "/dashboard/overview" },
                            { label: "Notifications", href: "/dashboard/notifications", badge: 10 },
                            { label: "Analytics", href: "/dashboard/analytics" },
                            { label: "Saved reports", href: "/dashboard/saved-reports" },
                        ],
                    },
                    {
                        label: "Projects",
                        href: "/projects",
                        icon: Rows01,
                        items: [
                            { label: "View all", href: "/projects/all" },
                            { label: "Personal", href: "/projects/personal" },
                            { label: "Team", href: "/projects/team" },
                            { label: "Shared with me", href: "/projects/shared-with-me" },
                            { label: "Archive", href: "/projects/archive" },
                        ],
                    },
                    {
                        label: "Tasks",
                        href: "/tasks",
                        icon: CheckDone01,
                        badge: 8,
                        items: [
                            { label: "My tasks", href: "/tasks/my-tasks" },
                            { label: "Assigned to me", href: "/tasks/assigned" },
                            { label: "Completed", href: "/tasks/completed" },
                            { label: "Upcoming", href: "/tasks/upcoming" },
                        ],
                    },
                    {
                        label: "Reporting",
                        href: "/reporting",
                        icon: PieChart03,
                        items: [
                            { label: "Dashboard", href: "/reporting/dashboard" },
                            { label: "Revenue", href: "/reporting/revenue" },
                            { label: "Performance", href: "/reporting/performance" },
                            { label: "Export data", href: "/reporting/export" },
                        ],
                    },
                    {
                        label: "Users",
                        href: "/users",
                        icon: Users01,
                        items: [
                            { label: "All users", href: "/users/all" },
                            { label: "Admins", href: "/users/admins" },
                            { label: "Team members", href: "/users/team" },
                            { label: "Permissions", href: "/users/permissions" },
                        ],
                    },
                ]}
                footerItems={[
                    {
                        label: "Settings",
                        href: "/settings",
                        icon: Settings01,
                    },
                    {
                        label: "Support",
                        href: "/support",
                        icon: MessageChatCircle,
                        badge: (
                            <BadgeWithDot size="sm" color="success" type="modern">
                                Online
                            </BadgeWithDot>
                        ),
                    },
                    {
                        label: "Open in browser",
                        href: "https://www.google.com",
                        icon: LayoutAlt01,
                    },
                ]}
                className="border-r-0"
            />
            <main className="min-w-0 flex-1 lg:pt-2">
                <div className="flex h-full flex-col gap-8 border-secondary bg-secondary_subtle pt-8 pb-12 shadow-xs lg:rounded-tl-[32px] lg:border-t lg:border-l">
                    <div className="flex flex-col gap-5 px-4 lg:px-8">
                        {/* Page header */}
                        <div className="flex flex-col justify-between gap-4 lg:flex-row">
                            <div className="flex flex-col gap-0.5 lg:gap-1">
                                <p className="text-xl font-semibold text-primary lg:text-display-xs">Sales overview</p>
                                <p className="text-md text-tertiary">Your current sales summary and activity.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button size="md" color="secondary" iconLeading={DownloadCloud02}>
                                    Export report
                                </Button>
                                <Button size="md" iconLeading={Plus}>
                                    Invite
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-4 lg:flex-row">
                            <ButtonGroup defaultSelectedKeys={["saved-view"]}>
                                <ButtonGroupItem id="default">Default</ButtonGroupItem>
                                <ButtonGroupItem
                                    id="saved-view"
                                    iconLeading={<Dot className="mx-[3px] size-2 text-fg-success-secondary in-disabled:text-fg-disabled_subtle" />}
                                >
                                    Saved view
                                </ButtonGroupItem>
                                <ButtonGroupItem id="sdr-view">SDR view</ButtonGroupItem>
                                <ButtonGroupItem id="add-view" iconLeading={Plus} aria-label="Add view" />
                            </ButtonGroup>

                            <div className="flex gap-3">
                                <DateRangePicker
                                    defaultValue={{
                                        start: parseDate("2025-01-10"),
                                        end: parseDate("2025-01-16"),
                                    }}
                                />
                                <Button size="md" color="secondary" iconLeading={FilterLines} className="hidden lg:inline-flex">
                                    Filters
                                </Button>
                                <Button size="md" color="secondary" iconLeading={FilterLines} className="inline-flex lg:hidden" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-10 px-4 lg:flex-row lg:px-8">
                        <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-5">
                            <div className="flex w-full flex-col flex-wrap gap-4 lg:flex-row lg:gap-5">
                                <MetricsSimple
                                    title="$1,280"
                                    subtitle="Today's revenue"
                                    type="modern"
                                    trend="positive"
                                    change="10%"
                                    className="flex-1 lg:min-w-[320px]"
                                />
                                <MetricsSimple
                                    title="14"
                                    subtitle="Today's orders"
                                    type="modern"
                                    trend="positive"
                                    change="12%"
                                    className="flex-1 lg:min-w-[320px]"
                                />
                                <MetricsSimple
                                    title="$91.42"
                                    subtitle="Avg. order value"
                                    type="modern"
                                    trend="negative"
                                    change="2%"
                                    className="flex-1 lg:min-w-[320px]"
                                />
                            </div>

                            <div className="lg:g-primary flex flex-col gap-6 rounded-xl ring-secondary ring-inset lg:gap-5 lg:p-6 lg:shadow-xs lg:ring-1">
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-semibold text-primary">Sales report</p>
                                        <Button size="md" color="secondary">
                                            View report
                                        </Button>
                                    </div>
                                    <Tabs>
                                        <TabList
                                            type="button-gray"
                                            items={[
                                                { id: "12months", label: "12 months" },
                                                { id: "3months", label: "3 months" },
                                                { id: "30days", label: "30 days" },
                                                { id: "7days", label: "7 days" },
                                                { id: "24hours", label: "24 hours" },
                                            ]}
                                        />
                                    </Tabs>
                                </div>

                                <div className="flex h-50 flex-col gap-2">
                                    <ResponsiveContainer className="h-full">
                                        <AreaChart
                                            data={lineData}
                                            className="text-tertiary [&_.recharts-text]:text-xs"
                                            margin={{
                                                left: 5,
                                                right: 5,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="currentColor" className="text-utility-brand-700" stopOpacity="0.7" />
                                                    <stop offset="95%" stopColor="currentColor" className="text-utility-brand-700" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>

                                            <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />

                                            <XAxis
                                                fill="currentColor"
                                                axisLine={false}
                                                tickLine={false}
                                                tickMargin={10}
                                                interval="preserveStartEnd"
                                                dataKey="date"
                                                tickFormatter={(value) => new Date(value).toLocaleString(undefined, { month: "short" })}
                                            >
                                                <RechartsLabel value="Month" fill="currentColor" className="text-xs font-medium" position="bottom" />
                                            </XAxis>

                                            <RechartsTooltip
                                                content={<ChartTooltipContent />}
                                                labelFormatter={(value) => new Date(value).toLocaleString(undefined, { month: "short", year: "numeric" })}
                                                cursor={{
                                                    className: "stroke-utility-brand-600 stroke-2",
                                                }}
                                            />

                                            <Area
                                                isAnimationActive={false}
                                                className="text-utility-brand-600 [&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]"
                                                dataKey="A"
                                                name="Current period"
                                                type="monotone"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                fill="url(#gradient)"
                                                fillOpacity={0.1}
                                                activeDot={{
                                                    className: "fill-bg-primary stroke-utility-brand-600 stroke-2",
                                                }}
                                            />

                                            <Area
                                                isAnimationActive={false}
                                                className="text-utility-brand-400 [&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]"
                                                dataKey="B"
                                                name="Previous period"
                                                type="monotone"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                fill="none"
                                                activeDot={{
                                                    className: "fill-bg-primary stroke-utility-brand-600 stroke-2",
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 rounded-xl ring-secondary ring-inset lg:gap-5 lg:bg-primary lg:p-6 lg:shadow-xs lg:ring-1">
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-semibold text-primary">Store traffic</p>
                                        <Button size="md" color="secondary">
                                            View report
                                        </Button>
                                    </div>
                                    <Tabs>
                                        <TabList
                                            type="button-gray"
                                            items={[
                                                { id: "12months", label: "12 months" },
                                                { id: "3months", label: "3 months" },
                                                { id: "30days", label: "30 days" },
                                                { id: "7days", label: "7 days" },
                                                { id: "24hours", label: "24 hours" },
                                            ]}
                                        />
                                    </Tabs>
                                </div>

                                <ResponsiveContainer className="h-50!">
                                    <BarChart
                                        data={barData}
                                        margin={{
                                            top: 0,
                                            bottom: 0,
                                        }}
                                        className="text-tertiary [&_.recharts-text]:text-xs"
                                    >
                                        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />

                                        <XAxis
                                            fill="currentColor"
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={10}
                                            interval="preserveStartEnd"
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleString(undefined, { month: "short" })}
                                        />

                                        <RechartsTooltip
                                            content={<ChartTooltipContent />}
                                            labelFormatter={(value) => new Date(value).toLocaleString(undefined, { month: "short", year: "numeric" })}
                                            cursor={{
                                                className: "fill-utility-gray-300/30",
                                            }}
                                        />

                                        <Bar
                                            isAnimationActive={false}
                                            className={colors["A"]}
                                            dataKey="A"
                                            name="Mobile"
                                            type="monotone"
                                            stackId="a"
                                            fill="currentColor"
                                            maxBarSize={isDesktop ? 32 : 16}
                                        />
                                        <Bar
                                            isAnimationActive={false}
                                            className={colors["B"]}
                                            dataKey="B"
                                            name="Desktop"
                                            type="monotone"
                                            stackId="a"
                                            fill="currentColor"
                                            maxBarSize={isDesktop ? 32 : 16}
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <ContentDivider type="single-line" className="hidden lg:flex">
                                <Button color="secondary" size="md" iconLeading={Plus}>
                                    Add
                                </Button>
                            </ContentDivider>
                        </div>
                        <div className="hidden flex-col gap-6 lg:flex">
                            <div className="flex justify-between gap-4">
                                <p className="text-lg font-semibold text-primary">Activity</p>
                                <Button size="md" color="link-gray">
                                    View all
                                </Button>
                            </div>
                            <div className="flex w-60 flex-col gap-5">
                                {feedItems.map((item, index) => (
                                    <FeedItem
                                        id={index}
                                        key={index}
                                        size="sm"
                                        unseen={item.unseen}
                                        user={{ avatarUrl: item.avatarUrl, href: "#", name: item.name }}
                                        action={{ href: "#", content: "Purchased", target: item.title }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
