import { useEffect } from 'react'
import { PlusCircleIcon, RefreshCwIcon, PackageIcon, Share2Icon, LinkIcon } from 'lucide-react'

import AddProductModal from '../components/AddProdcutModal'
import ProductCard from '../components/ProductCard'
import { useProductStore } from '../store/useProductStore'
import { useAuthStore } from '../store/useAuthStore'

function HomePage() {
  const products = useProductStore((state) => state.products)
  const loading = useProductStore((state) => state.loading)
  const error = useProductStore((state) => state.error)
  const fetchProducts = useProductStore((state) => state.fetchProducts)
  const shareUrl = useProductStore((state) => state.shareUrl)
  const copyShareLink = useProductStore((state) => state.copyShareLink)
  const regenerateShareLink = useProductStore((state) => state.regenerateShareLink)
  const { user, signInWithGoogle } = useAuthStore()

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [fetchProducts, user])

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-base-content/10 bg-base-100 px-4 py-2 text-sm uppercase tracking-wide text-base-content/70">
          <LinkIcon className="size-4" /> Personal wishlist
        </span>
        <h1 className="text-4xl font-semibold sm:text-5xl">Sign in to build your wishlist</h1>
        <p className="text-base-content/60">
          Save everything you&apos;re eyeing, add product links for quick purchasing, and share your curated list with friends.
        </p>
        <button className="btn btn-primary gap-2" onClick={signInWithGoogle}>
          Continue with Google
        </button>
      </main>
    )
  }

  return (
    <main className="space-y-10 px-4 py-10 lg:py-14">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-hidden rounded-3xl border border-base-content/5 bg-gradient-to-r from-primary/10 via-base-100 to-base-100 p-8 shadow-xl lg:flex-row lg:items-center lg:justify-between lg:p-12">
        <div className="space-y-3">
          <span className="badge badge-primary badge-outline">Your curated picks</span>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Collect, compare, and click "buy" when ready.
          </h1>
          <p className="max-w-xl text-base-content/70">
            Collect the things you want, compare prices at a glance, and click "buy" when you&apos;re ready—all from a single, polished hub.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
              onClick={() => document.getElementById('add_product_modal').showModal()}
            >
              <PlusCircleIcon className="size-5" /> Add item
            </button>
            <button
              className="btn btn-outline gap-2"
              onClick={fetchProducts}
              disabled={loading}
            >
              <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="btn btn-ghost gap-2" onClick={shareUrl ? copyShareLink : regenerateShareLink}>
              <Share2Icon className="size-4" />
              {shareUrl ? 'Copy share link' : 'Create share link'}
            </button>
          </div>
          {shareUrl && (
            <p className="text-xs text-base-content/60">
              Share link:
              <button
                className="ml-1 underline hover:text-primary"
                type="button"
                onClick={copyShareLink}
              >
                {shareUrl}
              </button>
            </p>
          )}
        </div>
        <div className="grid h-full w-full max-w-lg grid-cols-3 gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 text-center shadow-md">
          <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 px-2 py-3 text-primary">
            <span className="text-3xl font-semibold">{products.length}</span>
            <span className="text-xs uppercase tracking-wide">Saved items</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-base-content/5 px-2 py-3">
            <span className="text-2xl font-semibold">{Math.min(products.length, 3)}</span>
            <span className="text-xs uppercase tracking-wide">Top picks</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-base-content/5 px-2 py-3">
            <PackageIcon className="size-6" />
            <span className="text-xs uppercase tracking-wide">Wishlist</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        {error && <div className="alert alert-error mb-8">{error}</div>}

        {products.length === 0 && !loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-6 text-center">
            <div className="rounded-full bg-base-100 p-6 shadow-lg">
              <PackageIcon className="size-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">Your wishlist is empty</h3>
              <p className="text-base-content/70">
                Start by adding an item you&apos;ve been eyeing lately—links and prices are optional but helpful.
              </p>
            </div>
            <button
              className="btn btn-primary gap-2"
              onClick={() => document.getElementById('add_product_modal').showModal()}
            >
              <PlusCircleIcon className="size-5" /> Add your first item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="loading loading-spinner loading-lg" />
          </div>
        )}
      </section>

      <AddProductModal />
    </main>
  )
}

export default HomePage
