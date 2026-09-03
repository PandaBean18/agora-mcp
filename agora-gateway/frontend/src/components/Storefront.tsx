import { Package, Tag, Store } from 'lucide-react';

export function Storefront({ products }: { products: any[] }) {
  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(paise / 100);
  };

  if (!products || products.length === 0) {
    return <div className="text-slate-500">No products found across the network.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map((p) => (
        <div key={p.agora_sku} className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 transition-colors flex flex-col">
          {p.image_url && (
            <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-slate-800">
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
          )}
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-slate-200 text-lg">{p.name}</h3>
            <span className="bg-emerald-500/10 text-emerald-400 font-mono text-sm px-2.5 py-1 rounded-md border border-emerald-500/20 whitespace-nowrap ml-2">
              {formatPrice(p.price_paise)}
            </span>
          </div>
          {p.description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{p.description}</p>}
          
          <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
              <Store className="w-3.5 h-3.5" />
              {p.merchant_name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
              <Tag className="w-3.5 h-3.5" />
              {p.sku}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium ml-auto px-2 py-1 rounded bg-slate-900/80">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span className={p.stock === 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {p.stock} in stock
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
