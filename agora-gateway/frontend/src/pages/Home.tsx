import { useEffect, useState } from 'react';
import { ShoppingCart, Cpu, Activity, Store, ShieldAlert, Check, X, Loader2 } from 'lucide-react';
import { Storefront } from '../components/Storefront';
import { LedgerFeed } from '../components/LedgerFeed';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [mandate, setMandate] = useState<any>(null);
  const [mandateLoading, setMandateLoading] = useState(false);
  const [mandateToken, setMandateToken] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prodRes, ledgerRes] = await Promise.all([
        fetch('http://localhost:3000/api/storefront'),
        fetch('http://localhost:3000/api/ledger')
      ]);
      setProducts(await prodRes.json());
      setLedger(await ledgerRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    
    // Check if we are on a mandate approval URL
    const path = window.location.pathname;
    if (path.startsWith('/mandate/')) {
      const token = path.split('/')[2];
      setMandateToken(token);
      fetch(`http://localhost:3000/api/mandates/${token}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setMandate(data);
        });
    }

    return () => clearInterval(interval);
  }, []);

  const approveMandate = async () => {
    if (!mandateToken) return;
    setMandateLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/mandates/${mandateToken}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setMandate({ ...mandate, approved: true });
        setTimeout(() => {
          window.location.href = '/'; // Go back to dashboard
        }, 2000);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMandateLoading(false);
    }
  };

  const rejectMandate = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* Cryptographic Mandate Modal */}
      {mandateToken && mandate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20">
                <ShieldAlert className="w-10 h-10 text-amber-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-100">Cryptographic Mandate</h2>
              
              {mandate.approved ? (
                <div className="flex flex-col items-center space-y-2 text-emerald-400 py-4">
                  <Check className="w-12 h-12" />
                  <p className="font-medium">Mandate Approved!</p>
                  <p className="text-sm text-slate-400">You may close this tab and return to the AI.</p>
                </div>
              ) : (
                <>
                  <p className="text-slate-400">
                    An AI Agent has requested authorization to execute a financial settlement.
                  </p>
                  
                  <div className="bg-slate-950 rounded-xl p-4 w-full border border-slate-800 text-left space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Merchant</span>
                      <span className="font-mono text-sm text-slate-300">{mandate.merchant_id}</span>
                    </div>
                    <div className="border-t border-slate-800 my-2"></div>
                    
                    {mandate.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="font-mono text-sm text-slate-300">{item.sku}</span>
                        <span className="font-mono text-sm text-slate-500">x{item.quantity}</span>
                      </div>
                    ))}
                    
                    <div className="border-t border-slate-800 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Total Quote</span>
                      <span className="text-emerald-400 font-bold font-mono">₹{(mandate.quoted_total / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full pt-4">
                    <button 
                      onClick={rejectMandate}
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button 
                      onClick={approveMandate}
                      disabled={mandateLoading}
                      className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    >
                      {mandateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} 
                      Approve
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Agora Gateway
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <Activity className="w-3.5 h-3.5" />
              Federated Network Live
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                  Live Federated Storefront
                </h2>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1 uppercase">
                  <Store className="w-3 h-3" />
                  {new Set(products.map((p: any) => p.merchant_id)).size} MERCHANTS CONNECTED
                </span>
              </div>
              <Storefront products={products} />
            </section>
          </div>

          <div className="lg:col-span-5 h-[calc(100vh-8rem)] sticky top-24">
            <LedgerFeed entries={ledger} />
          </div>

        </div>
      </main>
    </div>
  );
}
