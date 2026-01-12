-- Full-Text Search Migration
-- Adds tsvector columns and GIN indexes for fast search

-- ====================================
-- EMPLOYEES TABLE
-- ====================================

-- Add search vector column for employees
ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('french', coalesce("firstName", '')), 'A') ||
  setweight(to_tsvector('french', coalesce("lastName", '')), 'A') ||
  setweight(to_tsvector('french', coalesce("email", '')), 'B') ||
  setweight(to_tsvector('french', coalesce("dept", '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Employee_searchVector_idx" ON "Employee" USING GIN("searchVector");

-- ====================================
-- ASSET ITEMS TABLE
-- ====================================

-- Add search vector column for asset items
ALTER TABLE "AssetItem"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('french', coalesce("assetTag", '')), 'A') ||
  setweight(to_tsvector('french', coalesce("serial", '')), 'A') ||
  setweight(to_tsvector('french', coalesce("notes", '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "AssetItem_searchVector_idx" ON "AssetItem" USING GIN("searchVector");

-- ====================================
-- ASSET MODELS TABLE
-- ====================================

-- Add search vector column for asset models
ALTER TABLE "AssetModel"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('french', coalesce("type", '')), 'A') ||
  setweight(to_tsvector('french', coalesce("brand", '')), 'B') ||
  setweight(to_tsvector('french', coalesce("modelName", '')), 'A')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "AssetModel_searchVector_idx" ON "AssetModel" USING GIN("searchVector");

-- ====================================
-- STOCK ITEMS TABLE
-- ====================================

-- Add search vector column for stock items (via notes)
ALTER TABLE "StockItem"
ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  to_tsvector('french', coalesce("notes", ''))
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "StockItem_searchVector_idx" ON "StockItem" USING GIN("searchVector");

-- ====================================
-- COMMENTS
-- ====================================

-- The generated tsvector columns will automatically update when source columns change
-- Weight hierarchy: A (highest) > B > C > D (lowest)
-- GIN indexes enable fast @@ (matches) and ts_rank queries
-- French language configuration handles accents and stopwords properly
