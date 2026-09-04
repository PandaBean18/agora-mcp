import { Link } from 'react-router-dom';
import { ScrollWorkflow } from '../components/ScrollWorkflow';
import { WhatIsIt } from '../components/WhatIsIt';
import { ValuePropTabs } from '../components/ValuePropTabs';
import { FloatingProducts } from '../components/FloatingProducts';
import { motion, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';

// Live Wiring Diagram Component for Hero Section
function WiringDiagram() {
  return (
    <div className="w-full max-w-5xl mx-auto py-16 relative mt-16 font-mono text-[10px] md:text-sm">
      
      <div className="bleed-line-h top-1/2 opacity-50 z-0" />
      <div className="bleed-line-v left-1/2 opacity-50 z-0" />

      {/* Connecting SVG Lines (Background) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
        <motion.line 
          x1="0%" y1="50%" x2="100%" y2="50%" 
          stroke="rgba(9,9,9,0.15)" strokeWidth="1" 
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: "easeInOut" }}
        />
        <motion.line 
          x1="0%" y1="50%" x2="50%" y2="50%" 
          stroke="#090909" 
          strokeWidth="2" 
          strokeDasharray="4 8"
          className="animate-dash-march"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
        />
        <motion.line 
          x1="50%" y1="50%" x2="100%" y2="50%" 
          stroke="#E63946" 
          strokeWidth="2" 
          strokeDasharray="4 8"
          className="animate-dash-march"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeInOut" }}
        />
      </svg>

      {/* Content Container */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 w-full">
        
        {/* Left Nodes: Merchant Ecosystem */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-48 border border-dashed border-gray-400 bg-white z-10 flex flex-col p-4 crosshair-corner"
        >
          <div className="font-bold text-sm uppercase mb-1">Merchant Storefronts</div>
          <div className="text-[10px] text-gray-500 leading-tight">Zero-integration distribution.<br/>Connect once, sell everywhere.</div>
        </motion.div>

        {/* Center Node: Agora Gateway */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-[340px] border border-[#090909] bg-[#F4F4F0] z-20 shadow-[12px_12px_0px_rgba(9,9,9,0.12)] p-8 crosshair-corner crosshair-corner-tl"
        >
          <div className="font-bold uppercase tracking-widest text-xl mb-1 text-center">Agora Gateway</div>
          <div className="text-center mb-6">
            <div className="text-[9px] text-gray-500 bg-white border border-gray-200 px-2 py-1 inline-block">ENGINE ACTIVE</div>
          </div>
          <ul className="text-xs space-y-3 text-gray-700 font-medium">
            <li className="flex items-center gap-2"><span className="text-[#0044FF]">&gt;</span> Universal Search API</li>
            <li className="flex items-center gap-2"><span className="text-[#0044FF]">&gt;</span> Cart Locking & Escrow</li>
            <li className="flex items-center gap-2"><span className="text-[#0044FF]">&gt;</span> Upsell Engine</li>
            <li className="flex items-center gap-2"><span className="text-[#0044FF]">&gt;</span> Unified Tracking API</li>
            <li className="flex items-center gap-2"><span className="text-[#0044FF]">&gt;</span> Immutable Audit Trails</li>
          </ul>
        </motion.div>

        {/* Right Node: AI Agent Ecosystem */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-48 border border-[#090909] bg-white z-10 flex flex-col p-4 crosshair-corner crosshair-corner-tl"
        >
          <div className="font-bold text-[#E63946] text-sm uppercase mb-1">AI Agents</div>
          <div className="text-[10px] text-gray-500 leading-tight">Query thousands of merchants through a single MCP endpoint.</div>
        </motion.div>
        
      </div>
    </div>
  );
}


export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: "100%" },
    show: { y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] font-['Inter_Tight'] text-[var(--color-ink)] relative">
      
      {/* Container to enforce center */}
      <div className="flex flex-col relative z-10 w-full">
        
        {/* HEADER BAR (Full Width) */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-[#090909] bg-transparent">
          <div className="font-black text-2xl tracking-tighter">
            agoraMCP
          </div>
          <div className="flex gap-6 font-mono text-[11px] font-bold tracking-widest uppercase items-center">
            <a href="https://github.com/rndbn/agora-mcp" target="_blank" rel="noreferrer" className="hover:text-gray-500 transition-colors">
              DOCS
            </a>
            <Link to="/onboarding" className="text-[#E63946] hover:text-red-700 transition-colors">
              /ONBOARDING
            </Link>
          </div>
        </div>

        {/* TOP SECTION: Massive Hero & SVG Wiring */}
        <div className="px-8 pt-16 pb-32 relative">
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="text-[8vw] font-black leading-[0.85] tracking-tighter w-full"
          >
            <div className="overflow-hidden"><motion.div variants={itemVariants}>THE INFRASTRUCTURE</motion.div></div>
            <div className="overflow-hidden"><motion.div variants={itemVariants}>FOR AI-DRIVEN COMMERCE.</motion.div></div>
          </motion.div>

          <WiringDiagram />
        </div>

        <WhatIsIt />
        <ValuePropTabs />

        {/* MIDDLE SECTION: Horizontal Scrolling Workflow */}
        <ScrollWorkflow />

        {/* BOTTOM SECTION: Floating Inventory Marquee */}
        <FloatingProducts />

        {/* BOTTOM SECTION: Integration Paths (Split, Borderless) */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white mt-32 border-t border-[#090909]">
          
          {/* Enterprise Path */}
          <div className="p-16 md:p-32 flex flex-col items-start gap-8 border-b md:border-b-0 md:border-r border-[#090909]">
            <div className="font-mono text-[11px] tracking-widest text-gray-500 uppercase font-bold">For Enterprise</div>
            <h2 className="text-5xl font-black tracking-tighter leading-none">HEADLESS API<br/>ACCESS.</h2>
            <p className="font-mono text-sm leading-relaxed text-gray-700 max-w-sm mt-8">
              Direct headless API access. Bring your own storefront and inventory system. We provide the MCP endpoint and webhooks.
            </p>
            <Link to="/onboarding/enterprise" className="mt-8 font-mono text-sm font-bold uppercase border-b-2 border-[#090909] pb-1 hover:text-[#0044FF] hover:border-[#0044FF] transition-colors">
              VIEW DOCUMENTATION
            </Link>
          </div>

          {/* SMB Path */}
          <div className="p-16 md:p-32 flex flex-col items-start gap-8">
            <div className="font-mono text-[11px] tracking-widest text-gray-500 uppercase font-bold">For SMBs</div>
            <h2 className="text-5xl font-black tracking-tighter leading-none">ZERO CODE<br/>ONBOARDING.</h2>
            <p className="font-mono text-sm leading-relaxed text-gray-700 max-w-sm mt-8">
              Zero-code onboarding. We host your checkout and handle the Razorpay escrow in our dedicated dashboard. We handle the heavy lifting.
            </p>
            <Link to="/onboarding/smb" className="mt-8 font-mono text-sm font-bold uppercase border-b-2 border-[#090909] pb-1 hover:text-[#E63946] hover:border-[#E63946] transition-colors">
              OPEN DASHBOARD
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
