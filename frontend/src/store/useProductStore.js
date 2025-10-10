import { create } from 'zustand'
import toast from 'react-hot-toast'

import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './useAuthStore'

const generateShareSlug = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 14)
}

const buildShareUrl = (slug) => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/share/${slug}`
}

export const useProductStore = create((set, get) => ({
  products: [],
  wishlist: null,
  loading: false,
  error: null,
  currentProduct: null,
  shareUrl: null,
  formData: {
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

  ensureWishlist: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      set({ wishlist: null, shareUrl: null, products: [], currentProduct: null })
      return null
    }

    const { wishlist } = get()
    if (wishlist) return wishlist

    const { data, error } = await supabase
      .from('wishlists')
      .select('id, share_slug')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Fetch wishlist error', error)
      throw error
    }

    if (data) {
      const shareUrl = buildShareUrl(data.share_slug)
      set({ wishlist: data, shareUrl })
      return data
    }

    const newSlug = generateShareSlug()
    const { data: insertData, error: insertError } = await supabase
      .from('wishlists')
      .insert({ owner_id: user.id, share_slug: newSlug })
      .select('id, share_slug')
      .single()

    if (insertError) {
      console.error('Create wishlist error', insertError)
      throw insertError
    }

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

  regenerateShareLink: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      toast.error('Please sign in first')
      return
    }

    const { wishlist } = get()
    if (!wishlist) {
      await get().ensureWishlist()
      return get().regenerateShareLink()
    }

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

    const shareUrl = buildShareUrl(data.share_slug)
    set({ wishlist: data, shareUrl })
    toast.success('Share link updated')
  },

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
