# Supabase Connection Pooler Setup for Vercel

## Problem
Supabase free tier uses IPv6-only direct Postgres connections (`db.[project-ref].supabase.co:5432`).  
Vercel's serverless functions don't support IPv6, causing `ENOTFOUND` errors.

## Solution
Use Supabase's **Connection Pooler** which supports IPv4 and works with Vercel.

## Steps

### 1. Get the Pooler Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`hwzuxqfqcfvyvtdpafqd`)
3. Click **Settings** (⚙️) → **Database**
4. Scroll to **"Connection Pooling"** section
5. Select **"Transaction"** mode
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### 2. Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project (Idea-Foundry)
3. Click **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Click **Edit**
6. Replace the value with the pooler connection string from step 1
7. Make sure it's enabled for **Production, Preview, and Development**
8. Click **Save**

### 3. Redeploy

The changes will take effect on the next deployment. You can trigger a redeploy by:
- Pushing a new commit, OR
- Going to Deployments → latest deployment → **...** menu → **Redeploy**

## Verify It Works

After deployment, check the Vercel **Runtime Logs** - you should no longer see `ENOTFOUND db.hwzuxqfqcfvyvtdpafqd.supabase.co` errors.

## Technical Details

- **Direct connection** (port 5432): IPv6-only on free tier ❌ Doesn't work on Vercel
- **Connection Pooler** (port 6543): IPv4-supported ✅ Works on Vercel
- The pooler uses **PgBouncer** in transaction mode
- Each serverless function gets 1 connection max (configured in `server/db.ts`)

## Reference

- Current (broken) format: `postgresql://...@db.hwzuxqfqcfvyvtdpafqd.supabase.co:5432/postgres`
- New (working) format: `postgresql://...@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

