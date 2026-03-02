import { cellBase } from "@/components/application/table/data-table";
import { thBase } from "@/components/application/table/data-table";
import { trpc } from "@/trpc/client";
import { cx } from "@/utils/cx";
import { formatCurrency } from "@/utils/number";



export function PortfolioTab({ selectedInvestor }: { selectedInvestor: string }) {

  const { data: portfolioData } = trpc.investors.portfolio.useQuery({
    id: selectedInvestor ?? ""
  }, { enabled: !!selectedInvestor });

  return (
    <div>
      {portfolioData && (<div>
        <table className="w-full overflow-x-hidden">
          <thead className={cx("relative bg-secondary", "h-9")}>
            <tr>
              <th className={thBase}>Fund</th>
              <th className={thBase}>Code</th>
              <th className={thBase}>Units</th>
              <th className={thBase}>NAV/Unit</th>
              <th className={thBase}>Modal</th>
              <th className={thBase}>Avg Price</th>
              <th className={thBase}>Value</th>
              <th className={thBase}>P&amp;L</th>
              <th className={thBase}>Return</th>
            </tr>
          </thead>
          <tbody>
            {portfolioData.map((p) => (
              <tr key={p.fund_id}>
                <td className={cellBase}>{p.fund?.name?.toUpperCase() ?? "—"}</td>
                <td className={cellBase}>{p.fund?.code?.toUpperCase() ?? "—"}</td>
                <td className={cellBase}>{p.units_after}</td>
                <td className={cellBase}>{p.fund?.latest_nav?.nav_per_unit != null ? (Number(p.fund.latest_nav.nav_per_unit)) : "—"}</td>
                <td className={cellBase}>{formatCurrency(p.modal)}</td>
                <td className={cellBase}>{formatCurrency(p.avg_price)}</td>
                <td className={cellBase}>{formatCurrency(p.value)}</td>
                <td className={cellBase}>{formatCurrency(p.profit_and_loss)}</td>
                <td className={cellBase}>{p.return_pct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>)}
    </div>
  );
}
