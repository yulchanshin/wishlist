import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, SaveIcon, Trash2Icon, ExternalLinkIcon, LinkIcon } from 'lucide-react'

import { useProductStore } from '../store/useProductStore'
import { useAuthStore } from '../store/useAuthStore'

function ProductPage() {
  const {
    currentProduct,
    formData,
    setFormData,
    loading,
    error,
    fetchProduct,
    updateProduct,
    deleteProduct,
  } = useProductStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    if (user) {
      fetchProduct(id)
    }
  }, [fetchProduct, id, user])

  const handleDelete = async () => {
    if (window.confirm('Remove this item from your wishlist?')) {
      await deleteProduct(id)
      navigate('/')
    }
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-3xl font-semibold">Sign in required</h1>
        <p className="text-base-content/60">You need to sign in to access and edit your wishlist items.</p>
        <Link to="/" className="btn btn-primary">Go to home</Link>
      </main>
    )
  }

  if (loading && !currentProduct) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <button onClick={() => navigate('/')} className="btn btn-ghost gap-2">
        <ArrowLeftIcon className="size-4" />
        Back to wishlist
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-base-content/5 bg-base-100 shadow-xl">
          <img
            src={currentProduct?.image}
            alt={currentProduct?.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="card border border-base-content/5 bg-base-100 shadow-xl">
          <div className="card-body space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Edit wishlist item</h2>
              <p className="text-sm text-base-content/60">Update the information to keep this entry fresh.</p>
              {currentProduct?.link && (
                <a
                  href={currentProduct.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Open current link
                  <ExternalLinkIcon className="size-4" />
                </a>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                updateProduct(id)
              }}
              className="space-y-5"
            >
              <label className="form-control">
                <span className="label-text text-base font-medium">Item name</span>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Noise cancelling headphones"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="form-control">
                  <span className="label-text text-base font-medium">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered"
                    placeholder="199.99"
                    value={formData.price}
                    onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text text-base font-medium">Product link</span>
                  <div className="input input-bordered flex items-center gap-2">
                    <LinkIcon className="size-5 text-base-content/60" />
                    <input
                      type="url"
                      className="grow bg-transparent outline-none"
                      placeholder="https://store.example.com/product"
                      value={formData.link}
                      onChange={(event) => setFormData({ ...formData, link: event.target.value })}
                    />
                  </div>
                </label>
              </div>

              <label className="form-control">
                <span className="label-text text-base font-medium">Image URL</span>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://cdn.example.com/product.jpg"
                  value={formData.image}
                  onChange={(event) => setFormData({ ...formData, image: event.target.value })}
                />
              </label>

              <div className="flex flex-wrap gap-3 pt-4">
                <button type="button" className="btn btn-error" onClick={handleDelete}>
                  <Trash2Icon className="size-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-[160px] flex-1"
                  disabled={loading || !formData.name || !formData.price || !formData.image}
                >
                  {loading ? (
                    <span className="loading loading-spinner" />
                  ) : (
                    <>
                      <SaveIcon className="size-4" /> Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
