import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Merchant {
  id: string;
  name: string;
  description: string;
  base_url: string;
  is_smb: number;
}

export function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/merchants')
      .then(res => res.json())
      .then(data => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch merchants:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-ink)] font-['Inter_Tight'] relative">
      
      {/* Background Bleeding Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <div className="bleed-line-v left-1/4" />
        <div className="bleed-line-v left-2/4" />
        <div className="bleed-line-v left-3/4" />
        <div className="bleed-line-h top-32" />
      </div>

      {/* Header */}
      <header className="border-b border-[#090909] px-6 py-4 flex items-center justify-between sticky top-0 bg-[var(--color-bg-base)] z-50">
        <div className="font-bold tracking-tighter text-2xl uppercase">
          <Link to="/">agora<span className="text-[#0044FF]">MCP</span></Link>
        </div>
        <nav className="font-mono text-xs uppercase flex gap-8">
          <Link to="/" className="hover:text-[#0044FF] transition-colors">Home</Link>
          <Link to="/onboarding" className="hover:text-[#E63946] transition-colors">Onboarding</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-24 px-8 relative z-10 min-h-screen">
        <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-none mb-4">
          Network<br/>Directory
        </h1>
        <p className="font-mono text-sm text-gray-600 mb-16 max-w-lg">
          Live registry of all merchants connected to the Agora protocol. Agents can query these endpoints via the unified MCP interface.
        </p>

        {loading ? (
          <div className="font-mono text-sm uppercase text-gray-500 animate-pulse">
            Fetching registry data...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {merchants.map((m, i) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white border border-[#090909] p-6 shadow-[8px_8px_0px_rgba(9,9,9,0.12)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_rgba(9,9,9,0.2)] transition-all crosshair-corner crosshair-corner-tl"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-2xl uppercase tracking-tighter">{m.name}</h3>
                  <span className={`text-[10px] font-mono px-2 py-1 uppercase border ${m.is_smb ? 'border-[#E63946] text-[#E63946]' : 'border-[#0044FF] text-[#0044FF]'}`}>
                    {m.is_smb ? 'SMB' : 'Enterprise'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 min-h-[40px] leading-relaxed">
                  {m.description}
                </p>
                
                <div className="font-mono text-xs text-gray-500 flex flex-col gap-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="text-[#090909]">{m.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target URL:</span>
                    <span className="text-[#090909] truncate max-w-[200px]">{m.base_url}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
