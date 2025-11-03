-- Create menu_items table for hawker menu management
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.menu_items (
    id BIGSERIAL PRIMARY KEY,
    stall_id BIGINT NOT NULL REFERENCES public.hawker_stalls(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'Main',
    image_url TEXT,
    availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'unavailable')),
    is_popular BOOLEAN NOT NULL DEFAULT false,
    preparation_time INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_items_stall_id ON public.menu_items(stall_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON public.menu_items(availability);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read menu items (public access for customers)
CREATE POLICY "Allow public read access" ON public.menu_items
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to insert menu items
CREATE POLICY "Allow authenticated insert" ON public.menu_items
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users to update menu items
CREATE POLICY "Allow authenticated update" ON public.menu_items
    FOR UPDATE
    TO public
    USING (true);

-- Allow authenticated users to delete menu items
CREATE POLICY "Allow authenticated delete" ON public.menu_items
    FOR DELETE
    TO public
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'menu_items table created successfully!' AS status;
