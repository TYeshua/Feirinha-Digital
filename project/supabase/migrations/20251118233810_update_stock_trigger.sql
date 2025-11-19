-- Migration: Update stock after order
-- Created at: 2025-11-18 23:38:10

-- Function to update stock and check for negative balance
CREATE OR REPLACE FUNCTION public.update_stock_after_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the stock quantity in products table
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;

  -- Check if stock became negative (Optional requirement implemented)
  IF EXISTS (
    SELECT 1
    FROM public.products
    WHERE id = NEW.product_id
    AND stock_quantity < 0
  ) THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto ID %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after insertion into order_items
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;

CREATE TRIGGER on_order_item_created
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_after_order();
