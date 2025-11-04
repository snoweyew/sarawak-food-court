-- Add UPDATE policy for orders table
-- This allows hawkers to update order status

-- Add policy to allow anyone to update orders (for status changes)
CREATE POLICY "Anyone can update order status"
    ON orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Success message
SELECT '✅ Order UPDATE policy added! Hawkers can now update order status.' as message;
