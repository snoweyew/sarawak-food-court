-- RESET Orders Tables - Delete old and create fresh
-- ⚠️ WARNING: This will DELETE all existing order data!
-- Only run this if you want to start fresh

-- 1. Drop all existing tables (this deletes all data!)
DROP TABLE IF EXISTS order_payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Also drop old policies and functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Success message for deletion
SELECT '✅ Old tables deleted successfully!' as message;

-- 2. Now create fresh tables
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    table_number TEXT NOT NULL,
    user_id UUID REFERENCES users(id),  -- NULL allowed for guest orders
    subtotal DECIMAL(10, 2) NOT NULL,
    service_charge DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    stall_id UUID REFERENCES hawker_stalls(id),
    item_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stall_id UUID REFERENCES hawker_stalls(id),
    stall_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_stall_id ON order_items(stall_id);
CREATE INDEX idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX idx_order_payments_stall_id ON order_payments(stall_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies (Guest-friendly!)

-- Orders: Anyone can create, view their own or guest orders
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "View own orders or guest orders"
    ON orders FOR SELECT
    USING (
        user_id IS NULL OR  -- Guest orders (no login)
        auth.uid() = user_id OR  -- Own orders
        EXISTS (  -- Admins can see all
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Order items: Anyone can view and create
CREATE POLICY "Anyone can view order items"
    ON order_items FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create order items"
    ON order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Hawkers can view their stall's order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM hawker_stalls
            WHERE hawker_stalls.id = order_items.stall_id
            AND hawker_stalls.owner_id = auth.uid()
        )
    );

-- Order payments: Anyone can view and create
CREATE POLICY "Anyone can view order payments"
    ON order_payments FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create order payments"
    ON order_payments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update order payments"
    ON order_payments FOR UPDATE
    USING (true);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for orders table
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Final success message
SELECT '🎉 Orders tables created successfully! Guest orders enabled!' as message;
