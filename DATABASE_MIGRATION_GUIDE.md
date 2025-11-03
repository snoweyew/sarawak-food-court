# Database Migration Guide - Orders System

## 🎯 What We're Doing
Migrating orders from localStorage (browser storage) to Supabase database to solve:
- ❌ localStorage quota exceeded errors
- ❌ Orders lost when browser clears data
- ❌ Can't access orders from different devices
- ❌ Hawkers can't see customer orders in real-time

## 📋 Step-by-Step Instructions

### Step 1: Create Database Tables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `mtmkghuhhrerlcubhzot`
3. Click on **SQL Editor** in the left menu
4. Click **New Query**
5. Copy and paste the entire content from `database/orders_migration.sql`
6. Click **Run** button
7. You should see: "Orders tables created successfully!"

This creates 3 tables:
- `orders` - Main order information
- `order_items` - Individual items in each order
- `order_payments` - Payment status per stall

### Step 2: Test the New System

1. **Commit and push changes:**
   ```powershell
   cd "c:\UTS_SYLLABUS\Year 2 sem 3\digital_innivation\Asigment\Sarawak_Hub_Centrel"
   git add -A
   git commit -m "Migrate orders to database - fix localStorage quota issue"
   git push origin main
   ```

2. **Wait for Netlify deployment** (2-3 minutes)
   - Go to: https://app.netlify.com/sites/sarawak-order
   - Wait for build to complete

3. **Test the order flow:**
   - Go to: https://sarawak-order.netlify.app
   - Login as customer
   - Add items to cart
   - Go to payment page
   - Mark stalls as paid
   - Click "Confirm Payment & Place Order"
   - Should redirect to order tracking

4. **Verify in database:**
   - Go back to Supabase Dashboard
   - Click **Table Editor**
   - Check `orders` table - should see your new order
   - Check `order_items` table - should see the items
   - Check `order_payments` table - should see payment records

### Step 3: Verify Order Tracking

1. Order tracking page should load from database
2. Should show current order status
3. Order history should display previous orders
4. No more localStorage errors!

## 🔍 What Changed

### Before (localStorage):
```javascript
// Saved to browser storage (limited to 5-10 MB)
localStorage.setItem('orders', JSON.stringify(orders));
```

### After (Database):
```javascript
// Saved to Supabase database (unlimited)
await supabase.from('orders').insert({
    order_id: orderId,
    table_number: table,
    user_id: user.id,
    total: total,
    status: 'pending'
});
```

## 📁 Files Modified

1. **database/orders_migration.sql** (NEW)
   - SQL script to create tables
   - Creates indexes for performance
   - Sets up security policies (RLS)

2. **customer/payment.html** (UPDATED)
   - Changed `confirmPayment()` to async function
   - Saves orders to Supabase database
   - Creates order items records
   - Creates payment records per stall
   - No more localStorage quota errors!

3. **customer/order-tracking.html** (UPDATED)
   - Loads orders from database
   - Displays current order from database
   - Shows order history from database
   - Real-time updates capability

## ✅ Benefits

| Feature | localStorage (Old) | Database (New) |
|---------|-------------------|----------------|
| Storage Limit | 5-10 MB | Unlimited |
| Persistence | Browser only | Permanent |
| Multi-device | ❌ No | ✅ Yes |
| Real-time | ❌ No | ✅ Yes |
| Backup | ❌ No | ✅ Automatic |
| Hawker Access | ❌ No | ✅ Yes |
| Reports | ❌ No | ✅ Yes |

## 🎉 Next Steps (Future Enhancements)

1. **Hawker Dashboard**: Create page for hawkers to see incoming orders
2. **Real-time Updates**: Use Supabase subscriptions for live order updates
3. **Order Status Updates**: Allow hawkers to update order status
4. **Sales Reports**: Generate daily/weekly sales reports
5. **Customer Notifications**: SMS/Email when order is ready

## 🐛 Troubleshooting

**If you get "User not authenticated" error:**
- Make sure you're logged in
- Check browser console for errors

**If tables already exist:**
- The SQL uses `IF NOT EXISTS` so it's safe to run again
- Or manually delete the tables first and rerun

**If orders don't appear:**
- Check browser console for errors
- Verify user is logged in
- Check Supabase Table Editor to see if data is saved

**If you still get localStorage errors:**
- Make sure code is deployed to Netlify
- Clear browser cache and localStorage
- Hard refresh the page (Ctrl+Shift+R)

## 📞 Support

Check these if you have issues:
1. Supabase logs: Dashboard → Logs
2. Browser console: F12 → Console tab
3. Network tab: F12 → Network tab (see API calls)
4. Netlify deploy logs: Check for build errors
