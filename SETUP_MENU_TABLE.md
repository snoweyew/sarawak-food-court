# 🛠️ Setup Menu Items Table in Supabase

## Problem
The `menu_items` table doesn't exist in your Supabase database yet, so menu items cannot be saved.

## Solution
Follow these steps to create the table:

---

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Login to your account
3. Select your project: **mtmkghuhhrerlcubhzot**

### Step 2: Go to SQL Editor
1. Click **"SQL Editor"** in the left sidebar (it has a database icon 🗄️)
2. Click the **"New Query"** button

### Step 3: Copy and Paste the SQL Script
1. Open the file: `create_menu_items_table.sql` in this project
2. Copy ALL the SQL code (the entire file)
3. Paste it into the SQL Editor

### Step 4: Run the Script
1. Click the **"Run"** button (or press `Ctrl+Enter`)
2. Wait a few seconds
3. You should see: **"menu_items table created successfully!"** in the results

### Step 5: Verify the Table
1. Click **"Table Editor"** in the left sidebar
2. You should now see a new table called **`menu_items`**
3. Click on it to see the structure

The table will have these columns:
- `id` - Auto-incrementing ID
- `stall_id` - Reference to hawker_stalls
- `name` - Item name
- `description` - Item description
- `price` - Price in RM
- `category` - Main/Side/Drink/Dessert
- `image_url` - Image URL
- `availability` - 'available' or 'unavailable'
- `is_popular` - Boolean flag
- `preparation_time` - Time in minutes
- `created_at` - Timestamp
- `updated_at` - Auto-updated timestamp

---

## Method 2: Using the Automated Tool

1. Open the file: `run-menu-table-setup.html` in your browser
2. Click the **"Create menu_items Table"** button
3. Wait for confirmation

---

## After Creating the Table

1. Go back to your hawker menu page: `hawker/menu-management.html`
2. Login as a hawker
3. Try adding a menu item again
4. It should now save successfully to Supabase! ✅

You can verify by:
- Checking `check-menu-database.html` to see if items appear
- Using `test-menu-upload.html` to test the functionality

---

## Troubleshooting

### Error: "relation does not exist"
- The table hasn't been created yet. Follow the steps above.

### Error: "permission denied"
- Make sure you're using the correct Supabase project
- Check that your ANON_KEY is correct in the code

### Error: "foreign key constraint"
- Make sure the `hawker_stalls` table exists first
- The stall_id must reference a valid stall

### Items not appearing
- Check the browser console for errors
- Verify your stall_id is correct
- Use `test-menu-upload.html` to debug

---

## SQL Script Location
The complete SQL script is in: **`create_menu_items_table.sql`**

## Testing Tools
- `test-menu-upload.html` - Test menu operations
- `check-menu-database.html` - View all menu items
- `check-database.html` - View hawkers and stalls

---

**Need help?** Check the browser console (F12) for detailed error messages.
