import { useState } from 'react';
import { Store, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SmbOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: `smb_${Math.random().toString(36).substring(7)}`,
    name: '',
    description: '',
    categories: '',
    base_url: '',
    catalogUrl: '/api/v1/items',
    skuField: 'id',
    nameField: 'title',
    priceField: 'price',
    stockField: 'stock',
    imageField: 'image',
    descField: 'description'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct simplified endpoints JSON for SMB
    const endpoints_json = {
      search: formData.catalogUrl,
      details: formData.catalogUrl // For SMB demo we can just use catalog for details too
    };

    const fields_mapping_json = {
      sku: formData.skuField,
      name: formData.nameField,
      price: formData.priceField,
      stock: formData.stockField,
      image: formData.imageField,
      description: formData.descField
    };

    try {
      await fetch('http://localhost:3000/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          categories: formData.categories,
          base_url: formData.base_url,
          is_smb: true,
          endpoints_json,
          fields_mapping_json
        })
      });
      // Redirect to their shiny new dashboard!
      navigate(`/dashboard/${formData.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full mt-12 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 text-blue-400 p-3 rounded-lg">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Small Business Onboarding</h1>
            <p className="text-neutral-400 text-sm">Join Agora in 60 seconds</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-8">
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b border-neutral-800 pb-2">Store Information</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Store Name</label>
              <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="e.g. Grandma's Bakery" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-400 mb-2">What do you sell?</label>
              <textarea required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="We sell homemade cookies..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Categories (Space separated)</label>
              <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="food bakery cookies sweets" value={formData.categories} onChange={e => setFormData({...formData, categories: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-neutral-800">
          <h2 className="text-xl font-semibold border-b border-neutral-800 pb-2">Catalog Sync</h2>
          <p className="text-sm text-neutral-400">Since you don't have an engineering team to handle checkouts, Agora will handle them for you. We just need to know where to pull your products from.</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Website Base URL</label>
              <input required type="url" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="https://api.mysite.com" value={formData.base_url} onChange={e => setFormData({...formData, base_url: e.target.value})} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Products API Path</label>
              <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="/api/products" value={formData.catalogUrl} onChange={e => setFormData({...formData, catalogUrl: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-neutral-800">
          <h2 className="text-xl font-semibold border-b border-neutral-800 pb-2">Response Field Mapping</h2>
          <p className="text-sm text-neutral-400">Tell us what keys in your JSON response correspond to our required schema.</p>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'SKU/ID Field', key: 'skuField' as const, placeholder: 'id' },
              { label: 'Name Field', key: 'nameField' as const, placeholder: 'title' },
              { label: 'Price Field (in lowest denomination)', key: 'priceField' as const, placeholder: 'price_cents' },
              { label: 'Stock Quantity Field', key: 'stockField' as const, placeholder: 'qtyAvailable' },
              { label: 'Image URL Field', key: 'imageField' as const, placeholder: 'imageUrl' },
              { label: 'Description Field', key: 'descField' as const, placeholder: 'description' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-neutral-400 mb-2">{f.label}</label>
                <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-blue-500" placeholder={f.placeholder} value={formData[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-end">
          <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all">
            {isSubmitting ? 'Creating Dashboard...' : 'Create Dashboard'}
            <CheckCircle2 size={18} />
          </button>
        </div>

      </form>
    </div>
  );
}
