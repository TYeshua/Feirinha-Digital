-- Migration: Add stock_quantity to supplier_products
-- Created at: 2025-11-18 23:50:00

ALTER TABLE public.supplier_products
ADD COLUMN IF NOT EXISTS stock_quantity decimal(10, 2) DEFAULT 0;
