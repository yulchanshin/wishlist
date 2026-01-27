import { create } from 'zustand'
import toast from 'react-hot-toast'

import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './useAuthStore'

/**
 * Generates a unique 12-character alphanumeric slug for sharing
 * Used as the unique identifier in share URLs (e.g., /share/abc123xyz789)
 * 
 * Algorithm:
 * 1. Prefers crypto.randomUUID() for cryptographic randomness (modern browsers)
 * 2. Falls back to Math.random() for older browsers
 * 3. Removes hyphens and truncates to 12 characters
 * 
 * @returns {string} 12-character random alphanumeric string
 * @example generateShareSlug() // "7a8b9c0d1e2f"
 */
const generateShareSlug = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 14)
}

/**
 * Builds the complete shareable URL from a slug
 * Constructs the full public URL that can be shared with others
 * 
 * @param {string} slug - The unique wishlist identifier
 * @returns {string} Complete shareable URL
 * @example buildShareUrl('abc123') // "https://myapp.com/share/abc123"
 */
const buildShareUrl = (slug) => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/share/${slug}`
}

/**
 * Zustand store for managing wishlists, products, and sharing functionality
 * 
 * State:
 * - products: Array of wishlist items
 * - wishlist: Current user's wishlist metadata (id, share_slug)
 * - shareUrl: Full shareable URL (e.g., "https://app.com/share/abc123")
 * - loading: Loading state for async operations
 * - error: Error message if operations fail
 * - currentProduct: Product being viewed/edited
 * - formData: Form state for add/edit operations
 * 
 * Key Features:
 * - Auto-creates wishlist on first use
 * - Generates unique share links
 * - Supports regenerating share links for privacy
 * - Copy-to-clipboard functionality
 */
export const useProductStore = create((set, get) => ({
  products: [], // Array of wishlist items from database
  wishlist: null, // Current wishlist { id, share_slug }
  loading: false, // Loading state for async operations
  error: null, // Error message if any
  currentProduct: null, // Product being edited/viewed
  shareUrl: null, // Full shareable URL (built from share_slug)
  formData: {
    // Form state for add/edit modals
    name: '',
    price: '',
    image: '',
    link: '',
  },

  setFormData: (formData) => set({ formData }),
  resetForm: () =>
    set({
      formData: {
        name: '',
        price: '',
        image: '',
        link: '',
      },
    }),

  /**
   * Ensures the current user has a wishlist, creating one if needed
   * This is the KEY function for the share feature!
   * 
   * Flow:
   * 1. Check if user is authenticated
   * 2. If wishlist exists in state, return it
   * 3. Try to fetch existing wishlist from database
   * 4. If not found, create new wishlist with unique share_slug
   * 5. Build and store the shareable URL
   * 
   * @returns {Promise<Object|null>} Wishlist object with id and share_slug, or null if no user
   */
  /**
   * Ensures the current user has a wishlist, creating one if needed
   * This is the KEY function for the share feature!
   * 
   * Flow:
   * 1. Check if user is authenticated
   * 2. If wishlist exists in state, return it
   * 3. Try to fetch existing wishlist from database
   * 4. If not found, create new wishlist with unique share_slug
   * 5. Build and store the shareable URL
   * 
   * @returns {Promise<Object|null>} Wishlist object with id and share_slug, or null if no user
   */
  ensureWishlist: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      // No user = no wishlist, clear everything
      set({ wishlist: null, shareUrl: null, products: [], currentProduct: null })
      return null
    }

    // If wishlist already in state, return it (avoid duplicate queries)
    const { wishlist } = get()
    if (wishlist) return wishlist

    // Try to fetch existing wishlist from database
    const { data, error } = await supabase
      .from('wishlists')
      .select('id, share_slug')
      .eq('owner_id', user.id)

    if (error) {
      console.error('Fetch wishlist error', error)
      throw error
    }

    if (Array.isArray(data) && data.length > 1) {
      console.warn('Multiple wishlists found for user, using the most recent entry')
    }

    const firstWishlist = Array.isArray(data) ? data[0] : data

    // Wishlist exists - build share URL and store in state
    if (firstWishlist) {
      const shareUrl = buildShareUrl(firstWishlist.share_slug)
      set({ wishlist: firstWishlist, shareUrl })
      return firstWishlist
    }

    // No wishlist found - create a new one with unique slug
    const newSlug = generateShareSlug() // Generate unique 12-char identifier
    const { data: insertData, error: insertError } = await supabase
      .from('wishlists')
      .insert({ owner_id: user.id, share_slug: newSlug })
      .select('id, share_slug')
      .single()

    if (insertError) {
      console.error('Create wishlist error', insertError)
      throw insertError
    }

    // Build share URL and store in state
    const shareUrl = buildShareUrl(insertData.share_slug)
    set({ wishlist: insertData, shareUrl })
    return insertData
  },

  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const wishlist = await get().ensureWishlist()
      if (!wishlist) {
        set({ products: [], loading: false })
        return
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id, name, price, image, link, created_at')
        .eq('wishlist_id', wishlist.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch products error', error)
        throw error
      }

      set({ products: data ?? [], loading: false, error: null })
    } catch (error) {
      set({ loading: false, error: 'Failed to load wishlist' })
    }
  },

  addProduct: async (event) => {
    event.preventDefault()
    set({ loading: true })
    try {
      const wishlist = await get().ensureWishlist()
      if (!wishlist) throw new Error('No wishlist available')
      const { formData } = get()

      const { error } = await supabase.from('wishlist_items').insert({
        wishlist_id: wishlist.id,
        name: formData.name,
        price: formData.price,
        image: formData.image,
        link: formData.link || null,
      })

      if (error) {
        console.error('Add product error', error)
        throw error
      }

      await get().fetchProducts()
      get().resetForm()
      toast.success('Item added to your wishlist')
      document.getElementById('add_product_modal')?.close()
    } catch (error) {
      console.error('Error in addProduct', error)
      toast.error('Something went wrong')
    } finally {
      set({ loading: false })
    }
  },

  fetchProduct: async (id) => {
    set({ loading: true })
    try {
      const wishlist = await get().ensureWishlist()
      if (!wishlist) throw new Error('No wishlist available')

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id, name, price, image, link')
        .eq('wishlist_id', wishlist.id)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Fetch product error', error)
        throw error
      }

      set({
        currentProduct: data,
        formData: {
          name: data.name ?? '',
          price: data.price ?? '',
          image: data.image ?? '',
          link: data.link ?? '',
        },
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetchProduct', error)
      set({ loading: false, error: 'Unable to load item details', currentProduct: null })
    }
  },

  updateProduct: async (id) => {
    set({ loading: true })
    try {
      const wishlist = await get().ensureWishlist()
      if (!wishlist) throw new Error('No wishlist available')
      const { formData } = get()

      const { data, error } = await supabase
        .from('wishlist_items')
        .update({
          name: formData.name,
          price: formData.price,
          image: formData.image,
          link: formData.link || null,
        })
        .eq('wishlist_id', wishlist.id)
        .eq('id', id)
        .select('id, name, price, image, link')
        .single()

      if (error) {
        console.error('Update product error', error)
        throw error
      }

      set({
        currentProduct: data,
        formData: {
          name: data.name ?? '',
          price: data.price ?? '',
          image: data.image ?? '',
          link: data.link ?? '',
        },
        loading: false,
      })
      toast.success('Wishlist item updated')
      await get().fetchProducts()
    } catch (error) {
      console.error('Error updateProduct', error)
      set({ loading: false })
      toast.error('Something went wrong')
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true })
    try {
      const wishlist = await get().ensureWishlist()
      if (!wishlist) throw new Error('No wishlist available')

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlist.id)
        .eq('id', id)

      if (error) {
        console.error('Delete product error', error)
        throw error
      }

      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        loading: false,
      }))
      toast.success('Item removed')
    } catch (error) {
      console.error('Error deleteProduct', error)
      set({ loading: false })
      toast.error('Something went wrong')
    }
  },

  /**
   * Regenerates the share link with a new unique slug
   * Use case: User wants to invalidate old share link for privacy/security
   * 
   * Flow:
   * 1. Verify user is authenticated
   * 2. Ensure wishlist exists
   * 3. Generate new random slug
   * 4. Update database with new slug
   * 5. Update state with new URL
   * 
   * Effect: Old share link becomes invalid, new link is ready to share
   */
  regenerateShareLink: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      toast.error('Please sign in first')
      return
    }

    const { wishlist } = get()
    if (!wishlist) {
      // No wishlist yet - create one first, then regenerate
      await get().ensureWishlist()
      return get().regenerateShareLink()
    }

    // Generate new unique slug
    const newSlug = generateShareSlug()
    const { data, error } = await supabase
      .from('wishlists')
      .update({ share_slug: newSlug })
      .eq('id', wishlist.id)
      .select('id, share_slug')
      .single()

    if (error) {
      console.error('Regenerate share link error', error)
      toast.error('Could not regenerate link')
      return
    }

    // Build new share URL and update state
    const shareUrl = buildShareUrl(data.share_slug)
    set({ wishlist: data, shareUrl })
    toast.success('Share link updated')
  },

  /**
   * Copies the share link to the user's clipboard
   * Uses the Clipboard API for modern browsers
   * 
   * Requirements:
   * - Must be called from user interaction (button click)
   * - Requires HTTPS (except localhost)
   * - Browser must support navigator.clipboard
   */
  copyShareLink: async () => {
    const { shareUrl } = get()
    if (!shareUrl) {
      toast.error('Share link is not ready yet')
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      console.error('Clipboard error', error)
      toast.error('Unable to copy link')
    }
  },
}))
