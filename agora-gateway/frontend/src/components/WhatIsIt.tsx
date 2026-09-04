export function WhatIsIt() {
  return (
    <div className="w-full max-w-5xl mx-auto py-24 px-8 relative z-20 bg-[var(--color-bg-base)]">
      
      {/* Bleeding Grid Lines */}
      <div className="bleed-line-v left-8 opacity-20 z-0" />
      <div className="bleed-line-v right-8 opacity-20 z-0" />

      <div className="relative z-10 flex flex-col md:flex-row gap-16 items-start">
        <div className="w-full md:w-1/3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">The Infrastructure</h2>
          <h3 className="text-3xl font-bold uppercase tracking-tighter leading-none">What is Agora?</h3>
        </div>
        
        <div className="w-full md:w-2/3">
          <p className="text-2xl md:text-3xl font-bold uppercase tracking-tighter leading-tight mb-8">
            Agora is the underlying transaction protocol for AI-driven commerce.
          </p>
          <div className="text-lg text-gray-700 leading-relaxed font-mono">
            <p className="mb-6">
              Large Language Models are incredibly smart, but they lack the rigid infrastructure required to safely execute real-world financial transactions. They cannot reliably manage cart state, they cannot hold escrow, and they cannot be trusted with raw payment credentials.
            </p>
            <p>
              Agora acts as the secure, rigid middleware. We give AI Agents a standardized MCP endpoint to search products, while we handle the complex orchestration of cart locking, human-in-the-loop payment mandates, and immutable audit trails in the background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
