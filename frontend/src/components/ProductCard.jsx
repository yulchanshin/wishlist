import React from 'react'
import { Link } from 'react-router-dom'
import { EditIcon, Trash2Icon, ExternalLinkIcon } from 'lucide-react'
import { useProductStore } from '../store/useProductStore'

function ProductCard({ product }) {
  const { deleteProduct } = useProductStore()
  const priceValue = Number.parseFloat(product.price ?? '')
  const priceLabel = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '—'

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-base-content/5 bg-base-100 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-60 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-base-100/90 px-3 py-1 text-sm font-semibold shadow">
          <span>${priceLabel}</span>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <header className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
          {product.link && (
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-focus"
            >
              View product
              <ExternalLinkIcon className="size-4" />
            </a>
          )}
        </header>

        <footer className="flex items-center justify-between gap-2">
          <Link
            to={`/products/${product.id}`}
            className="btn btn-sm btn-outline flex-1"
          >
            <EditIcon className="size-4" /> Edit
          </Link>
          <button
            className="btn btn-sm btn-error btn-outline"
            onClick={() => deleteProduct(product.id)}
          >
            <Trash2Icon className="size-4" />
          </button>
        </footer>
      </div>
    </article>
  )
}

export default ProductCard
