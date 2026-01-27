# 🔗 Share Feature Guide

## Overview

This wishlist application includes a **complete share-with-link feature** that allows users to share their wishlists with anyone via a unique URL. No authentication is required for viewers to see shared wishlists.

---

## 🗄️ Database Structure

### Tables

#### 1. `wishlists` Table
Stores each user's wishlist with a unique shareable slug.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `created_at` | TIMESTAMP | Creation timestamp (UTC) |
| `owner_id` | UUID | Foreign key to `auth.users` (CASCADE delete) |
| `share_slug` | TEXT | Unique 12-character identifier for sharing (UNIQUE constraint) |

**Security Policies (RLS):**
- ✅ **SELECT**: Anyone can read (enables public sharing)
- ✅ **INSERT**: Users can create their own wishlist
- ✅ **UPDATE**: Users can only update their own wishlist

#### 2. `wishlist_items` Table
Stores individual items within a wishlist.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `created_at` | TIMESTAMP | Creation timestamp (UTC) |
| `wishlist_id` | UUID | Foreign key to `wishlists` (CASCADE delete) |
| `name` | TEXT | Item name (required) |
| `price` | NUMERIC | Item price (optional) |
| `image` | TEXT | Image URL (optional) |
| `link` | TEXT | Product link URL (optional) |

**Security Policies (RLS):**
- ✅ **SELECT**: Anyone can read (enables public viewing of shared items)
- ✅ **INSERT**: Only wishlist owner can add items
- ✅ **UPDATE**: Only wishlist owner can update items
- ✅ **DELETE**: Only wishlist owner can delete items

### Database Relationships

```
┌─────────────────┐
│   auth.users    │
│  (Supabase)     │
└────────┬────────┘
         │ 1
         │ owner_id (CASCADE DELETE)
         │
         ↓ N
┌─────────────────┐
│   wishlists     │
│ - id            │
│ - owner_id      │
│ - share_slug ✨ │ ← Unique identifier for sharing
└────────┬────────┘
         │ 1
         │ wishlist_id (CASCADE DELETE)
         │
         ↓ N
┌─────────────────┐
│ wishlist_items  │
│ - id            │
│ - wishlist_id   │
│ - name          │
│ - price         │
│ - image         │
│ - link          │
└─────────────────┘
```

**Key Points:**
- Each user can have one wishlist (enforced by application logic)
- When a wishlist is deleted, all items are automatically deleted (CASCADE)
- When a user account is deleted, their wishlist is automatically deleted (CASCADE)

---

## 🚀 How Share Feature Works

### 1. **Automatic Wishlist Creation**

When a user signs in for the first time, a wishlist is automatically created with a unique `share_slug`:

```javascript
// In useProductStore.js - ensureWishlist()
const newSlug = generateShareSlug()  // e.g., "7a8b9c0d1e2f"
await supabase
  .from('wishlists')
  .insert({ 
    owner_id: user.id, 
    share_slug: newSlug 
  })
```

**Slug Generation:**
- Uses `crypto.randomUUID()` when available (browser API)
- Falls back to `Math.random()` for older browsers
- Results in a 12-character alphanumeric string
- Unique constraint ensures no duplicates

### 2. **Share URL Construction**

The share URL is built using the current domain + share slug:

```javascript
// buildShareUrl(slug)
const shareUrl = `${window.location.origin}/share/${slug}`
// Example: https://wishlist-app.com/share/7a8b9c0d1e2f
```

### 3. **User Actions**

#### Copy Share Link
```javascript
// In HomePage.jsx
<button onClick={copyShareLink}>
  Copy share link
</button>

// Copies URL to clipboard using navigator.clipboard API
await navigator.clipboard.writeText(shareUrl)
```

#### Regenerate Share Link
```javascript
// In HomePage.jsx
<button onClick={regenerateShareLink}>
  Regenerate link
</button>

// Creates new slug and updates database
const newSlug = generateShareSlug()
await supabase
  .from('wishlists')
  .update({ share_slug: newSlug })
  .eq('id', wishlist.id)
```

**Why Regenerate?**
- Privacy: Invalidate old links
- Security: If link was shared unwantedly
- Fresh start: New sharing session

### 4. **Public Viewing Flow**

```
User shares link → Friend clicks link
    ↓
Browser navigates to /share/7a8b9c0d1e2f
    ↓
SharedWishlistPage.jsx loads
    ↓
Query database:
  1. Find wishlist WHERE share_slug = '7a8b9c0d1e2f'
  2. Fetch all wishlist_items WHERE wishlist_id = found_id
    ↓
Display items with name, price, image, and product links
```

**Code Flow:**
```javascript
// In SharedWishlistPage.jsx
const { slug } = useParams()  // Get slug from URL

// Fetch wishlist by slug
const { data: wishlist } = await supabase
  .from('wishlists')
  .select('id, share_slug, owner_id')
  .eq('share_slug', slug)
  .single()

// Fetch all items for this wishlist
const { data: items } = await supabase
  .from('wishlist_items')
  .select('id, name, price, image, link, created_at')
  .eq('wishlist_id', wishlist.id)
  .order('created_at', { ascending: false })
```

---

## 🔒 Security & Privacy

### Row Level Security (RLS)
- Public can **read** wishlists and items (for sharing)
- Only owner can **create, update, delete** items
- Enforced at database level (can't be bypassed from frontend)

### Privacy Controls
- **Regenerate Link**: Creates new slug, invalidating old URLs
- **Cascade Deletion**: Deleting wishlist removes all items
- **No Personal Info**: Only wishlist content is shared, not user identity

### Access Control
```sql
-- Users can only modify their OWN wishlist items
CREATE POLICY "Users can update items in their wishlist" 
ON public.wishlist_items FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists 
    WHERE id = wishlist_id AND owner_id = auth.uid()
  )
);
```

---

## 📱 User Interface

### HomePage (Owner View)
```
┌─────────────────────────────────────┐
│  [Add Item] [Refresh] [Copy Link]   │
│                                      │
│  Share link: https://...share/abc123 │ ← Clickable to copy
│  (click to regenerate)               │
└─────────────────────────────────────┘
```

**Features:**
- ✅ Share button shows once wishlist is created
- ✅ Displays full URL for easy viewing
- ✅ One-click copy to clipboard
- ✅ One-click regenerate for new link

### SharedWishlistPage (Public View)
```
┌─────────────────────────────────────┐
│      🎁 Shared Wishlist             │
│      Wishlist Inspiration           │
│                                      │
│  [← Create your own wishlist]       │
│                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │ Item 1 │  │ Item 2 │  │ Item 3 ││
│  │ $19.99 │  │ $29.99 │  │ $39.99 ││
│  │ [View] │  │ [View] │  │ [View] ││
│  └────────┘  └────────┘  └────────┘│
└─────────────────────────────────────┘
```

**Features:**
- ✅ No login required to view
- ✅ Shows all items with images
- ✅ Links to buy products (if provided)
- ✅ Friendly error messages for invalid links

---

## 🛠️ Implementation Files

### Core Files

| File | Purpose |
|------|---------|
| `frontend/src/store/useProductStore.js` | Share link logic, slug generation |
| `frontend/src/pages/HomePage.jsx` | Share buttons and UI |
| `frontend/src/pages/SharedWishlistPage.jsx` | Public viewing page |
| `frontend/src/App.jsx` | Route definition `/share/:slug` |

### Key Functions

```javascript
// Generate unique 12-char slug
generateShareSlug()

// Build full URL from slug  
buildShareUrl(slug)

// Update wishlist with new slug
regenerateShareLink()

// Copy URL to clipboard
copyShareLink()

// Ensure user has a wishlist
ensureWishlist()
```

---

## 🎯 Usage Examples

### For Wishlist Owner

1. **Sign in** with Google
2. **Add items** to your wishlist
3. **Click "Copy share link"** button
4. **Share the link** via text, email, social media, etc.
5. **Regenerate link** if needed for privacy

### For Recipients

1. **Click the share link** (e.g., `https://app.com/share/abc123`)
2. **View all items** without signing in
3. **Click product links** to buy items
4. **Create your own wishlist** with the call-to-action button

---

## 🚀 Extending the Feature

### Potential Enhancements

1. **QR Code Generation**
   - Generate QR codes for easier mobile sharing
   - Library: `qrcode.react` or similar

2. **Social Media Share Buttons**
   - Pre-filled messages for WhatsApp, Facebook, Twitter
   - Use Web Share API: `navigator.share()`

3. **View Analytics**
   - Track how many times link was viewed
   - Add `view_count` column to `wishlists` table

4. **Password Protection**
   - Optional password for private wishlists
   - Add `password_hash` column (nullable)

5. **Expiration Dates**
   - Auto-expire links after certain date
   - Add `expires_at` column (nullable)

6. **Multiple Wishlists**
   - Allow users to create multiple wishlists
   - Remove "one wishlist per user" constraint

7. **Collaboration**
   - Allow multiple users to edit same wishlist
   - Add `wishlist_collaborators` junction table

---

## 🐛 Troubleshooting

### "Link not available" Error
**Cause:** Invalid or regenerated slug
**Solution:** Get a new share link from the wishlist owner

### Copy Button Not Working
**Cause:** Browser doesn't support Clipboard API or lacks HTTPS
**Solution:** Manually copy the displayed URL

### Items Not Showing
**Cause:** RLS policies or network issues
**Solution:** Check Supabase logs and RLS policies

---

## 📚 Related Documentation

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Router v7](https://reactrouter.com/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

---

## Summary

✅ **Fully Functional**: Share feature is complete and production-ready  
✅ **Secure**: RLS policies protect user data  
✅ **User-Friendly**: One-click sharing and viewing  
✅ **Privacy-Focused**: Regenerate links anytime  
✅ **No Auth Required**: Public viewing without sign-in  

The share feature provides a seamless way to share wishlists while maintaining security and privacy. Recipients can view all items, including images, prices, and purchase links, without needing an account.
