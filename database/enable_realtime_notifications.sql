-- Enable Real-time Notifications for Order Tracking
-- This allows customers to see live order status updates without refreshing

-- 1. Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 2. Enable Realtime for order_items table (for individual item updates)
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- 3. Enable Realtime for order_payments table (for payment status)
ALTER PUBLICATION supabase_realtime ADD TABLE order_payments;

-- Success message
SELECT '✅ Realtime notifications enabled!' as message,
       '📡 Customers will now receive live updates when hawkers change order status' as info;

-- Instructions:
-- After running this SQL:
-- 1. Go to your Supabase Dashboard
-- 2. Click "Database" → "Replication"
-- 3. Make sure "orders", "order_items", and "order_payments" are checked under "Tables"
-- 4. If not, toggle them ON manually in the UI
