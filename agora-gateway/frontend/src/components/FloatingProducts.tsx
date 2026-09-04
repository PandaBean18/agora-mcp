import { useEffect, useState, useRef } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';

interface Product {
  sku: string;
  name: string;
  description: string;
  price_paise: number;
  stock: number;
  image_url?: string;
  merchant_id: string;
}

export function FloatingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [xPos, setXPos] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3000/api/storefront')
      .then(res => res.json())
      .then(data => {
        // Duplicate the products so we can loop them seamlessly
        setProducts([...data, ...data]);
      })
      .catch(err => console.error('Failed to fetch products for marquee:', err));
  }, []);

  useAnimationFrame((t, delta) => {
    // Move left continuously
    let moveBy = delta * 0.05; // Speed
    let newX = xPos - moveBy;
    
    // Reset position when half the content has scrolled
    // (Assuming each card is ~350px wide + gap)
    // We'll just use a rough estimate or we can let framer motion handle it declaratively
    setXPos(newX);
  });

  if (products.length === 0) return null;

  return (
    <div className="w-full py-24 relative overflow-hidden bg-[var(--color-bg-base)] z-20">
      
      {/* Background Grid Lines */}
      <div className="bleed-line-h top-1/2 opacity-10 z-0" />
      
      <div className="max-w-5xl mx-auto px-8 mb-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">The Inventory</h2>
        <h3 className="text-3xl font-bold uppercase tracking-tighter leading-none">Global Access</h3>
      </div>

      {/* Marquee Container with Masking for Fade Effect */}
      <div 
        className="w-full relative z-10"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: '-webkit-linear-gradient(left, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <motion.div 
          className="flex gap-6 w-max pl-[15vw]"
          animate={{ x: [0, -3000] }} // Hardcoded width estimate for infinite loop
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop"
          }}
        >
          {products.map((p, i) => (
            <div 
              key={`${p.sku}-${i}`}
              className="w-[300px] shrink-0 bg-white border border-[#090909] flex flex-col p-4 shadow-[4px_4px_0px_rgba(9,9,9,0.06)] crosshair-corner crosshair-corner-tl"
            >
              <div className="w-full h-[180px] bg-gray-100 border border-[#090909]/20 mb-4 overflow-hidden relative group">
                 {p.image_url ? (
                   <img 
                     src={p.image_url} 
                     alt={p.name} 
                     className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                     onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                       (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center font-mono text-[10px] text-gray-400">NO_IMG</div>';
                     }}
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-gray-400">NO_IMG</div>
                 )}
              </div>
              <h4 className="font-bold uppercase tracking-tight text-sm truncate">{p.name}</h4>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <span className="font-mono text-xs text-[#E63946]">{(p.price_paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                <span className="font-mono text-[9px] uppercase text-gray-400 border border-gray-200 px-1 rounded-sm truncate max-w-[100px]">{p.merchant_id}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
