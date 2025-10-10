import { PlusCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useProductStore } from '../store/useProductStore';
import ProductCard from '../components/ProductCard';
import {React, useEffect} from 'react'

function HomePage() {
  const {products, loading, error, fetchProducts} = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts])
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <button className="btn btn-primary">
          <PlusCircleIcon className="size-5 mr-2"/>
          Add New Product
        </button>
        <button className='btmn btn-ghost' onClick={fetchProducts}>
          <RefreshCwIcon className="size-5" />
        </button>
      </div>

      {error && <div className="alert alert-error mb-8">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg" />
      </div>)
      :(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product}/>
          ))}
        </div>

      )}
    </main>
  )
}

export default HomePage
