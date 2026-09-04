import { useState } from 'react';
import { Search, ShieldAlert, MapPin, Undo2, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'search', label: '[01] AGENT SEARCH', icon: Search },
  { id: 'mandate', label: '[02] MANDATE APPROVAL', icon: ShieldAlert },
  { id: 'track', label: '[03] TRACKING', icon: MapPin },
  { id: 'refund', label: '[04] REFUNDS', icon: Undo2 },
  { id: 'audit', label: '[05] AUDIT TRAIL', icon: Terminal }
];

export function InteractiveLedger() {
  const [activeStep, setActiveStep] = useState('search');

  const paneVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  return (
    <div className="brutalist-border-black grid grid-cols-1 md:grid-cols-12 bg-[#F4F4F0] h-[500px] overflow-hidden relative crosshair-corner">
      
      {/* Global Ledger Micro-typography */}
      <div className="absolute top-4 right-4 z-50 pointer-events-none hidden md:block">
        <div className="font-mono text-[9px] text-gray-500 font-bold bg-white px-2 py-0.5 brutalist-border">[END_WORKFLOW_BLOCK]</div>
      </div>
      
      {/* Left Column: Navigation */}
      <div className="md:col-span-4 brutalist-border-r flex flex-col bg-[#F4F4F0] relative z-10">
        
        {/* Header */}
        <div className="p-4 brutalist-border-b bg-[#090909] text-white flex justify-between items-center">
          <h2 className="font-bold text-sm uppercase tracking-tight">The Workflow</h2>
          <span className="font-mono text-[9px] text-green-400 font-bold">[SYS_ACTIVE]</span>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 relative">
          <div className="absolute bottom-4 left-4 font-mono text-[9px] text-gray-400 pointer-events-none">[REQ_TIME: 42ms]</div>
          
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`relative p-4 flex items-center gap-3 text-left transition-colors font-mono text-xs uppercase font-bold
                  ${isActive ? 'text-white' : 'text-gray-500 hover:text-[#090909] hover:bg-white'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-[#E63946] brutalist-border-black shadow-[4px_4px_0px_#090909] z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <step.icon size={16} />
                  <span>{step.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Display Pane */}
      <div className="md:col-span-8 bg-white flex flex-col relative overflow-hidden z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            variants={paneVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full flex flex-col"
          >
            {activeStep === 'search' && <SearchPane />}
            {activeStep === 'mandate' && <MandatePane />}
            {activeStep === 'track' && <TrackPane />}
            {activeStep === 'refund' && <RefundPane />}
            {activeStep === 'audit' && <AuditPane />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Pane Components ---

function SearchPane() {
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative crosshair-corner-tl">
      <div className="p-4 brutalist-border-b bg-[#090909] text-[#F4F4F0] font-bold text-xs uppercase flex justify-between">
        <span>Semantic Agent Search</span>
        <span className="font-mono text-[#E63946]">POST /mcp/search</span>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-100 overflow-hidden relative">
        <div className="absolute bottom-4 right-4 font-mono text-[9px] text-gray-400">[NODE: search_01]</div>
        <img src="/screenshots/02.png" alt="Search Results" className="max-h-full max-w-full object-contain brutalist-border-black shadow-[8px_8px_0px_#090909]" />
      </div>
    </div>
  );
}

function MandatePane() {
  return (
    <div className="flex flex-col h-full bg-[#F4F4F0] relative crosshair-corner-tl">
      <div className="p-4 brutalist-border-b bg-[#090909] text-[#F4F4F0] font-bold text-xs uppercase flex justify-between">
        <span>Cryptographic Mandate Approval</span>
        <span className="font-mono text-[#E63946]">HUMAN-IN-THE-LOOP</span>
      </div>
      <div className="flex-1 grid grid-cols-2 p-6 gap-6 bg-gray-200 overflow-hidden relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-gray-500 bg-white px-2 brutalist-border">[VERIFYING_SIGNATURE]</div>
        <div className="h-full flex items-center justify-center">
          <img src="/screenshots/05.png" alt="Claude Mandate Link" className="max-h-full max-w-full object-contain brutalist-border-black shadow-[4px_4px_0px_#090909]" />
        </div>
        <div className="h-full flex items-center justify-center">
          <img src="/screenshots/09.png" alt="Agora Mandate UI" className="max-h-full max-w-full object-contain brutalist-border-black shadow-[4px_4px_0px_#E63946]" />
        </div>
      </div>
    </div>
  );
}

function TrackPane() {
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative crosshair-corner-tl">
      <div className="p-4 brutalist-border-b bg-[#090909] text-[#F4F4F0] font-bold text-xs uppercase flex justify-between">
        <span>Order Tracking</span>
        <span className="font-mono text-[#0044FF]">GET /mcp/track</span>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-100 overflow-hidden relative">
        <div className="absolute top-4 left-4 font-mono text-[9px] text-gray-400">[WEBHOOK_LOG_204]</div>
        <img src="/screenshots/11.png" alt="Tracking Output" className="max-h-full max-w-full object-contain brutalist-border-black shadow-[8px_8px_0px_#0044FF]" />
      </div>
    </div>
  );
}

function RefundPane() {
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative crosshair-corner-tl">
      <div className="p-4 brutalist-border-b bg-[#090909] text-[#F4F4F0] font-bold text-xs uppercase flex justify-between">
        <span>Zero-Friction Refunds</span>
        <span className="font-mono text-[#E63946]">POST /mcp/refund</span>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-100 overflow-hidden relative">
        <div className="absolute bottom-4 left-4 font-mono text-[9px] text-gray-400">[RZP_REFUND_INIT]</div>
        <img src="/screenshots/10.png" alt="Refund" className="max-h-full max-w-full object-contain brutalist-border-black shadow-[8px_8px_0px_#090909]" />
      </div>
    </div>
  );
}

function AuditPane() {
  return (
    <div className="flex flex-col h-full bg-[#090909] text-[#F4F4F0] relative crosshair-corner-tl">
      <div className="p-4 brutalist-border-b border-[#333] font-bold text-xs uppercase flex justify-between bg-[#111]">
        <span>Immutable Audit Ledger</span>
        <span className="font-mono text-green-400">SECURE</span>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#1a1a1a] overflow-hidden relative">
        <div className="absolute top-4 right-4 font-mono text-[9px] text-[#E63946]">[WORM_STORAGE]</div>
        <img src="/screenshots/08.png" alt="Audit Ledger" className="max-h-full max-w-full object-contain brutalist-border-black border-gray-600 shadow-[8px_8px_0px_#E63946]" />
      </div>
    </div>
  );
}
