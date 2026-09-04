import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ValuePropTabs() {
  const [activeTab, setActiveTab] = useState<'merchants' | 'agents'>('merchants');

  return (
    <div className="w-full max-w-5xl mx-auto py-24 px-8 border-t border-[#090909]/10 relative z-20 bg-[var(--color-bg-base)]">
      
      {/* Bleeding Grid Lines */}
      <div className="bleed-line-v left-8 opacity-20 z-0" />
      <div className="bleed-line-v right-8 opacity-20 z-0" />

      <div className="flex flex-col md:flex-row gap-16 relative z-10">
        
        {/* Left: Tab Controls */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">The Architecture</h2>
          <h3 className="text-3xl font-bold uppercase tracking-tighter mb-4 leading-none">Who is this for?</h3>
          
          <button 
            onClick={() => setActiveTab('merchants')}
            className={`text-left p-4 border font-mono text-sm uppercase tracking-widest transition-all duration-300 ${activeTab === 'merchants' ? 'bg-[#090909] text-white border-[#090909] shadow-[8px_8px_0px_rgba(9,9,9,0.12)] -translate-y-1' : 'bg-transparent text-gray-500 border-gray-300 hover:border-[#090909] hover:-translate-y-0.5'}`}
          >
            For Merchants
          </button>
          
          <button 
            onClick={() => setActiveTab('agents')}
            className={`text-left p-4 border font-mono text-sm uppercase tracking-widest transition-all duration-300 ${activeTab === 'agents' ? 'bg-[#E63946] text-white border-[#E63946] shadow-[8px_8px_0px_rgba(230,57,70,0.12)] -translate-y-1' : 'bg-transparent text-gray-500 border-gray-300 hover:border-[#E63946] hover:-translate-y-0.5'}`}
          >
            For AI Agents
          </button>
        </div>

        {/* Right: Content */}
        <div className="w-full md:w-2/3 relative min-h-[350px]">
          <AnimatePresence mode="wait">
            {activeTab === 'merchants' && (
              <motion.div 
                key="merchants"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 bg-white border border-[#090909] p-8 crosshair-corner crosshair-corner-tl"
              >
                <h3 className="text-4xl font-bold uppercase tracking-tighter mb-6 leading-none">Connect once.<br/>Sell everywhere.</h3>
                <p className="text-base text-gray-600 leading-relaxed mb-8">
                  Stop building custom integrations for every new AI agent that hits the market. Agora provides a single, unified gateway. Connect your existing inventory and checkout systems to Agora, and instantly get distribution across thousands of autonomous agents.
                </p>
                <ul className="space-y-5 font-mono text-xs text-[#090909]">
                  <li className="flex items-start gap-4">
                    <span className="text-[#0044FF] font-bold mt-0.5">01</span> 
                    <span className="leading-snug">Low-code onboarding for SMBs (Small and Midsize Businesses).</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-[#0044FF] font-bold mt-0.5">02</span> 
                    <span className="leading-snug">Built-in Razorpay escrow for SMBs guarantees secure payment before fulfillment.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-[#0044FF] font-bold mt-0.5">03</span> 
                    <span className="leading-snug">Automated upsell engine maximizes your AOV without extra code.</span>
                  </li>
                </ul>
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div 
                key="agents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 bg-white border border-[#E63946] p-8 crosshair-corner crosshair-corner-tl shadow-[12px_12px_0px_rgba(230,57,70,0.12)]"
              >
                <h3 className="text-4xl font-bold uppercase tracking-tighter mb-6 text-[#E63946] leading-none">One MCP Endpoint.<br/>Infinite Inventory.</h3>
                <p className="text-base text-gray-600 leading-relaxed mb-8">
                  Agents shouldn't have to navigate fragmented APIs to fulfill user intents. The Agora MCP (Model Context Protocol) server gives your agent read/write access to thousands of verified merchants through a single, standardized interface.
                </p>
                <ul className="space-y-5 font-mono text-xs text-[#090909]">
                  <li className="flex items-start gap-4">
                    <span className="text-[#E63946] font-bold mt-0.5">01</span> 
                    <span className="leading-snug">Universal natural-language search across the entire network.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-[#E63946] font-bold mt-0.5">02</span> 
                    <span className="leading-snug">Cryptographic audit trails for every state change.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-[#E63946] font-bold mt-0.5">03</span> 
                    <span className="leading-snug">Human-in-the-loop mandate generation offloads payment liability.</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
