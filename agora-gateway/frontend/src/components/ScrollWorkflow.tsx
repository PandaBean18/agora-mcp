import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function ScrollWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 600vh height to give enough scroll time for 6 slides
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map scroll to horizontal translation for 6 screens
  // 6 screens = 600vw. We need to move by -500vw (or -83.3333%) to reach the start of the last screen.
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-83.3333%"]);

  return (
    <div ref={containerRef} className="h-[600vh] relative">
      
      {/* Sticky container holds the visible window */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center bg-[#F4F4F0] brutalist-border-t brutalist-border-b border-[#090909]">
        
        {/* Bleeding Grid Lines (Global structure) */}
        <div className="bleed-line-h top-1/4" />
        <div className="bleed-line-h top-3/4" />
        
        {/* Title overlay (Stays fixed behind content) */}
        <div className="absolute top-8 left-8 z-0">
          <h2 className="font-bold text-[10vw] leading-none tracking-tighter uppercase pointer-events-none text-[#090909] opacity-[0.03]">
            The Lifecycle
          </h2>
        </div>

        {/* The scrolling track: 600vw wide for 6 distinct sections */}
        <motion.div style={{ x }} className="flex w-[600vw] h-full items-center relative will-change-transform z-10">
          
          {/* STEP 1: The Request */}
          <div className="w-[100vw] flex items-center justify-between px-16 md:px-32 relative h-full shrink-0 gap-16">
            <div className="w-1/3">
              <div className="font-mono text-sm font-bold uppercase tracking-widest text-[#E63946] mb-2">Step 01</div>
              <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">The Request</h3>
              <p className="font-mono text-sm mt-6 text-gray-600 leading-relaxed">The AI Agent parses the user's natural language intent.</p>
            </div>
            
            <div className="w-2/3 flex justify-end">
              <div className="bg-white border border-[#090909] p-8 w-full max-w-[700px] shadow-[12px_12px_0px_#090909] crosshair-corner crosshair-corner-tl">
                <div className="font-mono text-xs font-bold uppercase mb-4 border-b border-gray-200 pb-2">User Prompt</div>
                <div className="text-lg font-mono leading-relaxed">
                  "Find me a premium pair of ANC headphones under 40k."
                  <br/><br/>
                  <span className="text-[#0044FF] text-sm">&gt; Executing agora/search_network...</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Network Search & Upsell */}
          <div className="w-[100vw] flex items-center justify-between px-16 md:px-32 relative h-full shrink-0 gap-16 border-l border-[#090909]/10">
            <div className="w-1/3">
              <div className="font-mono text-sm font-bold uppercase tracking-widest text-[#E63946] mb-2">Step 02</div>
              <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">Search & Upsell</h3>
              <p className="font-mono text-sm mt-6 text-gray-600 leading-relaxed">Agora queries the entire merchant network and injects upsell logic directly into the AI's context.</p>
            </div>
            
            <div className="w-2/3 flex justify-end">
              <img src="/screenshots/02.png" alt="Network Search Results" className="w-full max-w-[700px] max-h-[60vh] h-auto object-contain border border-[#090909] shadow-[12px_12px_0px_#090909]" />
            </div>
          </div>

          {/* STEP 3: Cart Lock & Checkout */}
          <div className="w-[100vw] flex items-center justify-between px-16 md:px-32 relative h-full shrink-0 gap-16 border-l border-[#090909]/10">
            <div className="w-1/3">
              <div className="font-mono text-sm font-bold uppercase tracking-widest text-[#E63946] mb-2">Step 03</div>
              <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">Cart & Escrow</h3>
              <p className="font-mono text-sm mt-6 text-gray-600 leading-relaxed">The agent locks the cart. Agora generates a secure Razorpay checkout session instantly.</p>
            </div>
            
            <div className="w-2/3 flex justify-end">
              <img src="/screenshots/07.png" alt="Razorpay Checkout" className="w-full max-w-[700px] max-h-[60vh] h-auto object-contain border border-[#090909] shadow-[12px_12px_0px_#0044FF]" />
            </div>
          </div>

          {/* STEP 4: Human-in-the-Loop Approval */}
          <div className="w-[100vw] flex items-center justify-between px-16 md:px-32 relative h-full shrink-0 gap-16 border-l border-[#090909]/10">
            <div className="w-1/3">
              <div className="font-mono text-sm font-bold uppercase tracking-widest text-[#E63946] mb-2">Step 04</div>
              <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">Human Mandate</h3>
              <p className="font-mono text-sm mt-6 text-gray-600 leading-relaxed">Agents cannot spend money autonomously. The user must explicitly approve the transaction via a secure mandate link.</p>
            </div>
            
            <div className="w-2/3 flex justify-end">
              <img src="/screenshots/09.png" alt="Human Mandate Approval" className="w-full max-w-[700px] max-h-[60vh] h-auto object-contain border border-[#090909] shadow-[12px_12px_0px_#E63946]" />
            </div>
          </div>

          {/* STEP 5: Order Tracking */}
          <div className="w-[100vw] flex items-center justify-between px-16 md:px-32 relative h-full shrink-0 gap-16 border-l border-[#090909]/10">
            <div className="w-1/3">
              <div className="font-mono text-sm font-bold uppercase tracking-widest text-[#E63946] mb-2">Step 05</div>
              <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">Order Tracking</h3>
              <p className="font-mono text-sm mt-6 text-gray-600 leading-relaxed">Both the user and the agent can poll the Agora tracking API to monitor fulfillment state.</p>
            </div>
            
            <div className="w-2/3 flex justify-end">
              <img src="/screenshots/11.png" alt="Order Tracking API" className="w-full max-w-[700px] max-h-[60vh] h-auto object-contain border border-[#090909] shadow-[12px_12px_0px_#090909]" />
            </div>
          </div>

          {/* STEP 6: Audit Trails & Refunds */}
          <div className="w-[100vw] flex items-center justify-between px-16 md:px-32 relative h-full shrink-0 gap-16 border-l border-[#090909]/10 bg-[#090909]">
            <div className="w-1/3">
              <div className="font-mono text-sm font-bold uppercase tracking-widest text-green-400 mb-2">Step 06</div>
              <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none text-white">Immutable Ledger</h3>
              <p className="font-mono text-sm mt-6 text-gray-400 leading-relaxed">Every single state change, agent intent, and refund request is permanently logged for cryptographic auditing.</p>
            </div>
            
            <div className="w-2/3 flex justify-end">
              <img src="/screenshots/08.png" alt="Audit Trail" className="w-full max-w-[700px] max-h-[60vh] h-auto object-contain border border-[#333] shadow-[12px_12px_0px_#E63946]" />
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
