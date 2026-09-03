import { useState } from 'react';
import { Server, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EnterpriseOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id: `store_${Math.random().toString(36).substring(7)}`,
    name: '',
    description: '',
    categories: '',
    base_url: '',
    searchUrl: '',
    searchMethod: 'GET',
    searchBody: '',
    detailsUrl: '',
    detailsMethod: 'GET',
    detailsBody: '',
    orderWebhook: '',
    refundWebhook: '',
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
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    
    // Construct the endpoints JSON
    const endpoints_json: any = {};
    if (formData.searchMethod === 'GET') {
      endpoints_json.search = formData.searchUrl;
    } else {
      endpoints_json.search_post = { url: formData.searchUrl, body: JSON.parse(formData.searchBody || '{}') };
    }
    
    if (formData.detailsMethod === 'GET') {
      endpoints_json.details = formData.detailsUrl;
    } else {
      endpoints_json.details_post = { url: formData.detailsUrl, body: JSON.parse(formData.detailsBody || '{}') };
    }
    
    endpoints_json.order_webhook = formData.orderWebhook;
    endpoints_json.refund_webhook = formData.refundWebhook;

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
          is_smb: false,
          endpoints_json,
          fields_mapping_json
        })
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full mt-12 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg">
            <Server size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Enterprise API Onboarding</h1>
            <p className="text-neutral-400 text-sm">Map your custom endpoints to Agora</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={step >= 1 ? 'text-emerald-400' : 'text-neutral-600'}>1. Basics</span>
          <span className="text-neutral-600">→</span>
          <span className={step >= 2 ? 'text-emerald-400' : 'text-neutral-600'}>2. Endpoints</span>
          <span className="text-neutral-600">→</span>
          <span className={step >= 3 ? 'text-emerald-400' : 'text-neutral-600'}>3. Mapping</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold border-b border-neutral-800 pb-2">Store Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Store Name</label>
                <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500" placeholder="e.g. Acme Corp" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Store Description (Used by AI for routing)</label>
                <textarea required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500" placeholder="We sell high quality..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Categories (Space separated)</label>
                <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500" placeholder="electronics computers laptops" value={formData.categories} onChange={e => setFormData({...formData, categories: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Base URL</label>
                <input required type="url" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500" placeholder="https://api.acme.com" value={formData.base_url} onChange={e => setFormData({...formData, base_url: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-xl font-semibold border-b border-neutral-800 pb-2 mb-6">Catalog & Search Endpoints</h2>
              <p className="text-sm text-neutral-400 mb-4">If using GraphQL or POST, specify the exact JSON body. Use {"{{query}}"} or {"{{sku}}"} to indicate where the AI should inject its parameters.</p>
              
              <div className="space-y-4 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50 mb-6">
                <h3 className="font-medium text-emerald-400">Search Endpoint</h3>
                <div className="flex gap-4">
                  <select className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2" value={formData.searchMethod} onChange={e => setFormData({...formData, searchMethod: e.target.value})}>
                    <option>GET</option>
                    <option>POST</option>
                  </select>
                  <input required type="text" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2" placeholder="/api/v1/search?q={{query}}" value={formData.searchUrl} onChange={e => setFormData({...formData, searchUrl: e.target.value})} />
                </div>
                {formData.searchMethod === 'POST' && (
                  <textarea className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 font-mono text-sm" placeholder={'{\n  "query": "query { products(search: \\"{{query}}\\") { id name } }"\n}'} rows={4} value={formData.searchBody} onChange={e => setFormData({...formData, searchBody: e.target.value})} />
                )}
              </div>

              <div className="space-y-4 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">
                <h3 className="font-medium text-emerald-400">Product Details Endpoint</h3>
                <div className="flex gap-4">
                  <select className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2" value={formData.detailsMethod} onChange={e => setFormData({...formData, detailsMethod: e.target.value})}>
                    <option>GET</option>
                    <option>POST</option>
                  </select>
                  <input required type="text" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2" placeholder="/api/v1/products/{{sku}}" value={formData.detailsUrl} onChange={e => setFormData({...formData, detailsUrl: e.target.value})} />
                </div>
                {formData.detailsMethod === 'POST' && (
                  <textarea className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 font-mono text-sm" placeholder={'{\n  "query": "query { product(id: \\"{{sku}}\\") { id name } }"\n}'} rows={4} value={formData.detailsBody} onChange={e => setFormData({...formData, detailsBody: e.target.value})} />
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold border-b border-neutral-800 pb-2 mb-6">Webhooks</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Order Creation Webhook</label>
                  <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2" placeholder="/webhooks/agora/orders" value={formData.orderWebhook} onChange={e => setFormData({...formData, orderWebhook: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Refund Webhook</label>
                  <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2" placeholder="/webhooks/agora/refunds" value={formData.refundWebhook} onChange={e => setFormData({...formData, refundWebhook: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
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
                  <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 font-mono text-sm" placeholder={f.placeholder} value={formData[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-lg font-medium text-neutral-400 hover:text-white transition-colors">
              Back
            </button>
          ) : <div></div>}
          
          <button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all">
            {isSubmitting ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Continue'}
            {step < 3 ? <ArrowRight size={18} /> : <CheckCircle2 size={18} />}
          </button>
        </div>

      </form>
    </div>
  );
}
