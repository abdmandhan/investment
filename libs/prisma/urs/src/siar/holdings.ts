
import { prisma } from '../index.js'

const sql = `
INSERT INTO investor_holdings (
  investor_id,
  investor_account_id,
  transaction_id,
  fund_id,
  units_before,
  units_after,
  delta_units,
  created_at,
  updated_at
)
SELECT
  t.investor_id,
  t.investor_account_id,
  t.id AS transaction_id,
  t.fund_id,

  COALESCE(
    SUM(
      CASE t.transaction_type::text
        WHEN 'SUBSCRIPTION'  THEN  t.units
        WHEN 'SWITCHING_IN'  THEN  t.units
        WHEN 'REDEMPTION'    THEN -t.units
        WHEN 'SWITCHING_OUT' THEN -t.units
      END
    ) OVER (
      PARTITION BY t.investor_account_id, t.fund_id
      ORDER BY t.transaction_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ),
    0::numeric
  ) AS units_before,

  SUM(
    CASE t.transaction_type::text
      WHEN 'SUBSCRIPTION'  THEN  t.units
      WHEN 'SWITCHING_IN'  THEN  t.units
      WHEN 'REDEMPTION'    THEN -t.units
      WHEN 'SWITCHING_OUT' THEN -t.units
    END
  ) OVER (
    PARTITION BY t.investor_account_id, t.fund_id
    ORDER BY t.transaction_date, t.id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS units_after,

  (CASE t.transaction_type::text
     WHEN 'SUBSCRIPTION'  THEN  t.units
     WHEN 'SWITCHING_IN'  THEN  t.units
     WHEN 'REDEMPTION'    THEN -t.units
     WHEN 'SWITCHING_OUT' THEN -t.units
   END) AS delta_units,

  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM transactions t
LEFT JOIN investor_holdings ih
  ON ih.transaction_id = t.id
WHERE ih.transaction_id IS NULL
ORDER BY t.investor_account_id, t.fund_id, t.transaction_date, t.id;
`

export const generateHoldings = async () => {
  await prisma.$queryRawUnsafe(sql)
}
