import React from 'react'
import { useProductStore } from '../store/useProductStore'
import { Package2Icon, DollarSignIcon, ImageIcon, PlusCircleIcon, LinkIcon } from 'lucide-react'

function AddProdcutModal() {
  const { addProduct, formData, setFormData, loading } = useProductStore()

  return (
    <dialog id="add_product_modal" className="modal">
      <div className="modal-box max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-transparent to-transparent px-8 py-6 border-b border-base-content/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Add wishlist item</h3>
            <p className="text-sm text-base-content/60">Keep track of the things you love with rich detail.</p>
          </div>
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost">✕</button>
          </form>
        </div>

        <form onSubmit={addProduct} className="px-8 py-6 space-y-5">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Item name</span>
            </label>
            <div className="input input-bordered flex items-center gap-3">
              <Package2Icon className="size-5 text-base-content/60" />
              <input
                type="text"
                placeholder="Nintendo Switch OLED"
                className="grow bg-transparent outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label-text text-base font-medium">Price</span>
              <div className="input input-bordered flex items-center gap-3">
                <DollarSignIcon className="size-5 text-base-content/60" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="299.99"
                  className="grow bg-transparent outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </label>

            <label className="form-control">
              <span className="label-text text-base font-medium">Product link (optional)</span>
              <div className="input input-bordered flex items-center gap-3">
                <LinkIcon className="size-5 text-base-content/60" />
                <input
                  type="url"
                  placeholder="https://store.example.com/product"
                  className="grow bg-transparent outline-none"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Image URL</span>
            </label>
            <div className="input input-bordered flex items-center gap-3">
              <ImageIcon className="size-5 text-base-content/60" />
              <input
                type="url"
                placeholder="https://images.example.com/item.jpg"
                className="grow bg-transparent outline-none"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            <p className="mt-2 text-xs text-base-content/60">Square or 4:5 images look best on cards.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-base-content/10">
            <form method="dialog">
              <button className="btn btn-ghost">Cancel</button>
            </form>
            <button
              type="submit"
              className="btn btn-primary shadow-lg shadow-primary/20"
              disabled={!formData.name || !formData.price || !formData.image || loading}
            >
              {loading ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  <PlusCircleIcon className="size-5" />
                  Add to wishlist
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}

export default AddProdcutModal
