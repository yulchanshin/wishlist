import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PackageIcon, ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

/**
 * SharedWishlistPage - Public viewing page for shared wishlists
 * 
 * This page allows ANYONE (authenticated or not) to view a wishlist
 * by accessing the unique share URL: /share/:slug
 * 
 * Flow:
 * 1. Extract slug from URL params
 * 2. Query database for wishlist with matching share_slug
 * 3. If found, fetch all items for that wishlist
 * 4. Display items in a grid with images, prices, and product links
 * 
 * Security:
 * - No authentication required (public viewing)
 * - Read-only access (cannot modify items)
 * - RLS policies allow SELECT on wishlists and wishlist_items tables
 * 
 * Error Handling:
 * - Invalid slug → Show "Link not available" message
 * - No items → Show empty state
 * - Database error → Show error message
 */
function SharedWishlistPage() {
  const { slug } = useParams() // Extract slug from URL: /share/:slug
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    /**
     * Fetches the shared wishlist and its items from the database
     * 
     * Two-step process:
     * 1. Find wishlist by share_slug (the unique identifier in URL)
     * 2. If found, fetch all items belonging to that wishlist
     * 
     * Note: This works WITHOUT authentication because RLS policies
     * allow public SELECT on both wishlists and wishlist_items tables
     */
    const fetchSharedWishlist = async () => {
      setLoading(true)
      setError(null)
      
      // Step 1: Find the wishlist by its unique share_slug
      const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id, share_slug, owner_id')
        .eq('share_slug', slug)
        .single()

      if (wishlistError || !wishlist) {
        setError('This wishlist link is invalid or has been disabled.')
        setLoading(false)
        return
      }

      // Step 2: Fetch all items for this wishlist
      const { data: itemsData, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('id, name, price, image, link, created_at')
        .eq('wishlist_id', wishlist.id)
        .order('created_at', { ascending: false })

      if (itemsError) {
        setError('Unable to load shared wishlist.')
        setLoading(false)
        return
      }

      setItems(itemsData ?? [])
      setLoading(false)
    }

    fetchSharedWishlist()
  }, [slug])

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="loading loading-spinner loading-lg" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <PackageIcon className="size-16 text-base-content/40" />
        <h1 className="text-2xl font-semibold">Link not available</h1>
        <p className="text-base-content/60">{error}</p>
        <Link to="/" className="btn btn-primary gap-2">
          <ArrowLeftIcon className="size-5" /> Back to wishlist
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3 text-center">
        <span className="badge badge-outline">
          Shared wishlist
        </span>
        <h1 className="text-3xl font-semibold">Wishlist Inspiration</h1>
        <p className="text-base-content/70">
          Explore the items on this wishlist. Each item includes optional links so you can check them out instantly.
        </p>
        <Link to="/" className="btn btn-ghost gap-2">
          <ArrowLeftIcon className="size-4" />
          Create your own wishlist
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-base-content/10 bg-base-100 p-12 text-center shadow-lg">
          <PackageIcon className="size-14 text-base-content/30" />
          <h2 className="text-2xl font-semibold">No items yet</h2>
          <p className="text-base-content/70">
            When items are added to this wishlist, they&apos;ll appear here with links and pricing details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const priceValue = Number.parseFloat(item.price ?? '')
            const priceLabel = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '—'

            return (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-base-content/5 bg-base-100 shadow-xl">
              <div className="relative h-56 overflow-hidden">
                <img src={item.image} alt={item.name} className="size-full object-cover" />
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-base-100/90 px-3 py-1 text-sm font-semibold shadow">
                  ${priceLabel}
                </div>
              </div>
              <div className="space-y-3 p-6">
                <h3 className="text-lg font-semibold leading-tight">{item.name}</h3>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                  >
                    View product
                    <ExternalLinkIcon className="size-4" />
                  </a>
                )}
              </div>
            </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default SharedWishlistPage
