# 🗄️ Database Architecture & Schema

## Entity-Relationship Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                              │
│                     (Supabase Auth Service)                            │
│                                                                        │
│  ┌──────────────────────────────────────────────────┐                │
│  │              auth.users (Managed by Supabase)     │                │
│  │  ┌────────────────────────────────────────────┐  │                │
│  │  │  id: UUID (Primary Key)                    │  │                │
│  │  │  email: TEXT                                │  │                │
│  │  │  created_at: TIMESTAMP                     │  │                │
│  │  │  ... (other auth fields)                   │  │                │
│  │  └────────────────────────────────────────────┘  │                │
│  └──────────────────┬───────────────────────────────┘                │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     │ ONE-TO-ONE (enforced by app logic)
                     │ owner_id (FK)
                     │ ON DELETE CASCADE
                     ↓
┌────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                              │
│                    (Public Schema - RLS Enabled)                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────┐                │
│  │              public.wishlists                    │                │
│  │  ┌────────────────────────────────────────────┐  │                │
│  │  │  id: UUID (PK, auto-generated)             │  │                │
│  │  │  created_at: TIMESTAMP (default: now())    │  │                │
│  │  │  owner_id: UUID (FK → auth.users.id)       │◄─┼─ Identifies owner
│  │  │  share_slug: TEXT (UNIQUE, indexed) ★      │◄─┼─ For public sharing
│  │  └────────────────────────────────────────────┘  │                │
│  └──────────────────┬───────────────────────────────┘                │
│                     │                                                 │
│                     │ ONE-TO-MANY                                     │
│                     │ wishlist_id (FK)                                │
│                     │ ON DELETE CASCADE                               │
│                     ↓                                                 │
│  ┌──────────────────────────────────────────────────┐                │
│  │            public.wishlist_items                 │                │
│  │  ┌────────────────────────────────────────────┐  │                │
│  │  │  id: UUID (PK, auto-generated)             │  │                │
│  │  │  created_at: TIMESTAMP (default: now())    │  │                │
│  │  │  wishlist_id: UUID (FK → wishlists.id)     │  │                │
│  │  │  name: TEXT (NOT NULL)                     │  │                │
│  │  │  price: NUMERIC (nullable)                 │  │                │
│  │  │  image: TEXT (nullable, URL)               │  │                │
│  │  │  link: TEXT (nullable, URL)                │  │                │
│  │  └────────────────────────────────────────────┘  │                │
│  └──────────────────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────────────┘

★ The share_slug is the KEY to the sharing feature!
```

---

## Data Flow Diagrams

### 1. Wishlist Creation Flow

```
User Signs In
     │
     ↓
┌─────────────────────┐
│ ensureWishlist()    │
│ Check if user has   │
│ wishlist            │
└──────┬──────────────┘
       │
       ├─→ Wishlist EXISTS ──→ Return existing wishlist + share URL
       │
       ├─→ Wishlist NOT EXISTS
       │        │
       │        ↓
       │   ┌──────────────────────┐
       │   │ generateShareSlug()  │ ──→ "7a8b9c0d1e2f"
       │   └──────────────────────┘
       │        │
       │        ↓
       │   ┌──────────────────────────────────┐
       │   │ INSERT INTO wishlists            │
       │   │ VALUES (uuid, user_id, slug)     │
       │   └──────────────────────────────────┘
       │        │
       │        ↓
       │   ┌──────────────────────────────────┐
       │   │ buildShareUrl(slug)              │
       │   │ → "https://app.com/share/slug"   │
       │   └──────────────────────────────────┘
       │        │
       └────────┴──→ Store in Zustand state: { wishlist, shareUrl }
```

### 2. Adding Items Flow

```
User Clicks "Add Item"
     │
     ↓
┌─────────────────────┐
│ Fill Form:          │
│ - name (required)   │
│ - price (optional)  │
│ - image (optional)  │
│ - link (optional)   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Submit Form         │
│ addProduct(event)   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────────────────┐
│ INSERT INTO wishlist_items      │
│ VALUES (uuid, wishlist_id, ...) │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────┐
│ Refresh products    │
│ fetchProducts()     │
└──────┬──────────────┘
       │
       ↓
Display updated list
```

### 3. Share Link Flow

```
Owner Side:
┌─────────────────────┐
│ User clicks         │
│ "Copy share link"   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────────────────┐
│ copyShareLink()                 │
│ navigator.clipboard.writeText() │
└──────┬──────────────────────────┘
       │
       ↓
Link copied! → User shares via text/email/social

Recipient Side:
┌─────────────────────┐
│ Click share link:   │
│ /share/7a8b9c0d1e2f │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ SharedWishlistPage loads         │
│ Extract slug from URL params     │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Query 1: Get wishlist by slug    │
│ SELECT * FROM wishlists          │
│ WHERE share_slug = '7a8b...'     │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Query 2: Get all items           │
│ SELECT * FROM wishlist_items     │
│ WHERE wishlist_id = found_id     │
│ ORDER BY created_at DESC         │
└──────┬───────────────────────────┘
       │
       ↓
Display public wishlist (no auth required!)
```

### 4. Regenerate Link Flow

```
User clicks "Regenerate"
     │
     ↓
┌─────────────────────────────────┐
│ regenerateShareLink()           │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│ Generate new slug:              │
│ newSlug = generateShareSlug()   │ → "z9y8x7w6v5u4"
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│ UPDATE wishlists                │
│ SET share_slug = newSlug        │
│ WHERE id = wishlist.id          │
└──────┬──────────────────────────┘
       │
       ↓
Old link invalidated! 
New link ready to share.
```

---

## Row Level Security (RLS) Policies

### Wishlists Table Policies

```sql
-- 1. Everyone can READ wishlists (required for public sharing)
CREATE POLICY "Enable read access for all users" 
ON public.wishlists FOR SELECT 
USING (true);  -- No restrictions on SELECT

-- 2. Users can only INSERT their own wishlist
CREATE POLICY "Users can insert their own wishlist" 
ON public.wishlists FOR INSERT 
WITH CHECK (auth.uid() = owner_id);
-- ✓ Allows: INSERT where owner_id matches current user
-- ✗ Denies: INSERT where owner_id is someone else

-- 3. Users can only UPDATE their own wishlist
CREATE POLICY "Users can update their own wishlist" 
ON public.wishlists FOR UPDATE 
USING (auth.uid() = owner_id)      -- Must own to update
WITH CHECK (auth.uid() = owner_id); -- Must still own after update
```

### Wishlist Items Table Policies

```sql
-- 1. Everyone can READ items (required for public viewing)
CREATE POLICY "Enable read access for all users" 
ON public.wishlist_items FOR SELECT 
USING (true);  -- No restrictions on SELECT

-- 2. Users can INSERT items to THEIR wishlist only
CREATE POLICY "Users can insert items to their wishlist" 
ON public.wishlist_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE id = wishlist_id 
      AND owner_id = auth.uid()  -- Verify ownership via join
  )
);

-- 3. Users can UPDATE items in THEIR wishlist only
CREATE POLICY "Users can update items in their wishlist" 
ON public.wishlist_items FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE id = wishlist_id 
      AND owner_id = auth.uid()
  )
);

-- 4. Users can DELETE items from THEIR wishlist only
CREATE POLICY "Users can delete items from their wishlist" 
ON public.wishlist_items FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE id = wishlist_id 
      AND owner_id = auth.uid()
  )
);
```

### How RLS Works

```
┌───────────────────────────────────────────────────────┐
│               User makes request                      │
└────────────────────┬──────────────────────────────────┘
                     │
                     ↓
┌───────────────────────────────────────────────────────┐
│          Is user authenticated?                       │
├───────────────────────────────────────────────────────┤
│  YES → auth.uid() returns user UUID                   │
│  NO  → auth.uid() returns NULL                        │
└────────────────────┬──────────────────────────────────┘
                     │
                     ↓
┌───────────────────────────────────────────────────────┐
│         PostgreSQL evaluates RLS policies             │
├───────────────────────────────────────────────────────┤
│  SELECT: Check USING clause                           │
│  INSERT: Check WITH CHECK clause                      │
│  UPDATE: Check USING + WITH CHECK                     │
│  DELETE: Check USING clause                           │
└────────────────────┬──────────────────────────────────┘
                     │
                     ↓
┌───────────────────────────────────────────────────────┐
│              Allow or Deny request                    │
├───────────────────────────────────────────────────────┤
│  ✓ Policy passes → Execute query                      │
│  ✗ Policy fails → Return 0 rows / error               │
└───────────────────────────────────────────────────────┘
```

**Example Scenarios:**

```sql
-- Scenario 1: Anonymous user views shared wishlist
-- SELECT on wishlists WHERE share_slug = 'abc123'
-- ✓ ALLOWED: SELECT policy is USING (true)

-- Scenario 2: User A tries to delete User B's item
-- DELETE FROM wishlist_items WHERE id = item_belonging_to_B
-- ✗ DENIED: Policy checks ownership via EXISTS subquery

-- Scenario 3: User A updates their own item
-- UPDATE wishlist_items SET price = 99.99 WHERE id = their_item
-- ✓ ALLOWED: Policy verifies wishlist.owner_id = auth.uid()
```

---

## Database Indexes

### Recommended Indexes

```sql
-- Primary Keys (automatically indexed)
-- ✓ wishlists.id
-- ✓ wishlist_items.id

-- Unique Constraint (automatically indexed)
-- ✓ wishlists.share_slug (UNIQUE)

-- Foreign Keys (should be indexed)
CREATE INDEX idx_wishlists_owner_id 
ON public.wishlists (owner_id);

CREATE INDEX idx_wishlist_items_wishlist_id 
ON public.wishlist_items (wishlist_id);

-- Query Optimization
CREATE INDEX idx_wishlist_items_created_at 
ON public.wishlist_items (created_at DESC);
-- Speeds up: ORDER BY created_at DESC
```

### Query Performance

```sql
-- Fast query (uses index on share_slug)
SELECT * FROM wishlists WHERE share_slug = 'abc123';

-- Fast query (uses index on wishlist_id)
SELECT * FROM wishlist_items WHERE wishlist_id = uuid;

-- Fast query (uses index on created_at)
SELECT * FROM wishlist_items 
WHERE wishlist_id = uuid 
ORDER BY created_at DESC;
```

---

## Data Lifecycle

### 1. User Lifecycle

```
User Signs Up
     │
     ↓
Wishlist Auto-Created
     │
     ├─→ User adds items → Items stored
     │
     ├─→ User shares link → Others view
     │
     ├─→ User regenerates → New slug created
     │
     └─→ User deletes account → CASCADE DELETE
              │
              ├─→ Wishlist deleted
              │
              └─→ All items deleted
```

### 2. Wishlist Lifecycle

```
Wishlist Created
     │
     ├─→ share_slug generated
     │
     ├─→ Items added/removed
     │
     ├─→ share_slug regenerated (if needed)
     │
     └─→ Wishlist deleted → CASCADE DELETE all items
```

### 3. Share Link Lifecycle

```
Link Generated
     │
     ├─→ Link shared publicly
     │
     ├─→ Anonymous users view items
     │
     ├─→ Link regenerated? → Old link invalid
     │
     └─→ Wishlist deleted? → Link returns 404
```

---

## Cascade Delete Examples

### Example 1: User Deletes Account

```sql
-- User with id '123-abc' deletes account

-- Step 1: Supabase deletes from auth.users
DELETE FROM auth.users WHERE id = '123-abc';

-- Step 2: CASCADE triggers delete on wishlists
-- Automatically deleted:
DELETE FROM public.wishlists WHERE owner_id = '123-abc';

-- Step 3: CASCADE triggers delete on wishlist_items
-- Automatically deleted:
DELETE FROM public.wishlist_items WHERE wishlist_id IN (
  SELECT id FROM wishlists WHERE owner_id = '123-abc'
);

-- Result: All user data removed in one transaction!
```

### Example 2: User Deletes Item

```sql
-- User manually deletes an item

DELETE FROM wishlist_items WHERE id = 'item-xyz';

-- Result: Only that item deleted, wishlist remains
```

---

## Storage Considerations

### What's Stored

- ✅ Item names, prices, and product links
- ✅ Image URLs (NOT the images themselves)
- ✅ Wishlist metadata (id, owner, slug)
- ✅ Timestamps for ordering

### What's NOT Stored

- ❌ Actual image files (only URLs)
- ❌ User browsing history
- ❌ View counts (could be added)
- ❌ Purchase history

### Data Size Estimates

```
Typical wishlist:
- Wishlist record: ~100 bytes
- Per item: ~500 bytes (text fields + URLs)
- 50 items = ~25 KB total
- 1000 users = ~25 MB

Very manageable for most databases!
```

---

## Migration & Backup

### Full Schema Backup

```sql
-- Export entire schema
pg_dump -h your-supabase-host \
        -U postgres \
        -d postgres \
        --schema=public \
        --file=backup.sql

-- Restore schema
psql -h your-supabase-host \
     -U postgres \
     -d postgres \
     -f backup.sql
```

### Data-Only Backup

```sql
-- Export only data
pg_dump -h your-supabase-host \
        -U postgres \
        -d postgres \
        --schema=public \
        --data-only \
        --file=data.sql
```

---

## Summary

✅ **Simple Schema**: Only 2 tables + auth  
✅ **Clear Relationships**: One-to-many with cascade  
✅ **Secure by Default**: RLS on all tables  
✅ **Share-Ready**: Unique slug for each wishlist  
✅ **Performant**: Proper indexes on keys  
✅ **Maintainable**: Self-documenting structure  

The database architecture is designed for simplicity, security, and scalability. The `share_slug` field is the core of the sharing feature, allowing public access while maintaining privacy and security through RLS policies.
