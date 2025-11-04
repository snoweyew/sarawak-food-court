-- Allow Guest Orders (No Login Required)
-- Run this in Supabase SQL Editor to allow orders without user authentication

-- 1. Add user_id column if it doesn't exist (allow NULL for guest orders)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
        RAISE NOTICE 'user_id column added to orders table';
    ELSE
        -- If it exists, make it nullable
        ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'user_id column already exists, made nullable';
    END IF;
END $$;

-- 2. Update RLS policies to allow guest orders

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Create new policies that allow guest orders
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own orders or guest orders by order_id"
    ON orders FOR SELECT
    USING (
        user_id IS NULL OR  -- Guest orders
        auth.uid() = user_id OR  -- Own orders
        EXISTS (  -- Admins can see all
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Update order_items policies to allow viewing without authentication
DROP POLICY IF EXISTS "Anyone can view order items for their orders" ON order_items;

CREATE POLICY "Anyone can view order items"
    ON order_items FOR SELECT
    USING (true);

-- Update order_payments policies
DROP POLICY IF EXISTS "Anyone can view order payments for their orders" ON order_payments;

CREATE POLICY "Anyone can view order payments"
    ON order_payments FOR SELECT
    USING (true);

-- Success message
SELECT 'Guest orders enabled! Customers can now order without login.' as message;
