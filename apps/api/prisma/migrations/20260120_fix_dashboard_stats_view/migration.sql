-- Drop and recreate the dashboard_stats materialized view without deletedAt
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;

CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM "Employee") as total_employees,
  (SELECT COUNT(*) FROM "AssetItem") as total_assets,
  (SELECT COUNT(*) FROM "AssetItem" WHERE status = 'EN_STOCK') as available_assets,
  (SELECT COUNT(*) FROM "Loan" WHERE status = 'OPEN') as active_loans,
  (SELECT COUNT(*) FROM "StockItem" WHERE quantity < 5) as low_stock_items,
  (SELECT COUNT(*) FROM "StockItem" WHERE quantity = 0) as out_of_stock_items,
  NOW() as last_updated;

-- CreateIndex
CREATE UNIQUE INDEX dashboard_stats_last_updated_idx ON dashboard_stats (last_updated);

-- Comment
COMMENT ON MATERIALIZED VIEW dashboard_stats IS 'Materialized view for dashboard statistics - refreshed every 5 minutes';
