import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, Check, AlertTriangle } from 'lucide-react';

export default function Mandate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [mandate, setMandate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/mandates/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setMandate(data);
        }
      })
      .catch(err => {
        console.error(err);
        setError("Failed to connect to Gateway.");
      });
  }, [token]);

  const approveMandate = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/mandates/${token}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setMandate({ ...mandate, approved: true });
        setTimeout(() => {
          window.location.href = data.link;
        }, 1500);
      } else {
        setError(data.error);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to approve mandate.");
    } finally {
      setLoading(false);
    }
  };

  const rejectMandate = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-4 font-[var(--font-display)]">
        <div className="brutalist-border bg-white p-8 max-w-md w-full shadow-[8px_8px_0px_#E63946]">
          <div className="flex items-center gap-4 mb-4 text-[#E63946]">
            <AlertTriangle size={32} />
            <h2 className="text-xl font-bold uppercase">Mandate Error</h2>
          </div>
          <p className="font-mono text-sm">{error}</p>
          <button onClick={() => navigate('/')} className="mt-6 brutalist-button w-full py-3">Return to Home</button>
        </div>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center font-[var(--font-display)]">
        <div className="font-mono uppercase font-bold animate-pulse">Loading Cryptographic Mandate...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-4 font-[var(--font-display)] text-[var(--color-ink)]">
      <div className="brutalist-border bg-white shadow-[8px_8px_0px_#090909] max-w-md w-full relative overflow-hidden">
        
        {/* Header bar */}
        <div className="brutalist-border-b bg-[#090909] p-4 flex items-center justify-center gap-3 text-white">
          <ShieldAlert className="text-[#E63946]" />
          <h2 className="text-xl font-bold uppercase tracking-tight">Cryptographic Mandate</h2>
        </div>

        <div className="p-8 flex flex-col items-center">
          
          {mandate.approved ? (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <Check className="w-16 h-16 text-[#0044FF]" />
              <p className="font-bold uppercase text-lg">Mandate Approved!</p>
              <p className="text-sm font-mono text-gray-500">Funds secured in escrow. You may close this tab.</p>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <p className="font-mono text-sm text-center leading-relaxed">
                An AI Agent has requested authorization to execute a financial settlement on your behalf.
              </p>
              
              <div className="brutalist-border p-4 bg-[#f8f9fa] space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">MERCHANT ID:</span>
                  <span className="font-mono bg-[#090909] text-white px-2 py-0.5">{mandate.merchant_id}</span>
                </div>
                
                <div className="brutalist-border-t pt-3 space-y-2">
                  <span className="font-bold text-xs uppercase text-gray-500 block">ITEMS</span>
                  {mandate.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-mono">
                      <span className="truncate pr-4">{item.sku}</span>
                      <span>x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="brutalist-border-t pt-3 flex justify-between items-center text-lg font-bold">
                  <span>TOTAL QUOTE:</span>
                  <span className="text-[#0044FF] font-mono">₹{(mandate.quoted_total / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-xs font-mono bg-[#e8e8e4] p-3 text-center border border-dashed border-[#090909] leading-relaxed">
                {mandate.is_smb === 1 
                  ? "Your payment is safely held in escrow by Agora. Funds are only released to the merchant AFTER they mark the order delivered AND you confirm receipt via email. If there's a dispute, your funds are safe."
                  : "This is an Enterprise merchant integration. Agora provides the checkout UI, but funds are settled directly via their payment gateway."
                }
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={rejectMandate}
                  className="flex-1 px-4 py-3 bg-[#e8e8e4] text-[#090909] border border-[#090909] font-bold uppercase hover:bg-gray-200 transition-colors"
                >
                  REJECT
                </button>
                <button 
                  onClick={approveMandate}
                  disabled={loading}
                  className="flex-1 px-4 py-3 brutalist-button flex justify-center items-center gap-2"
                >
                  {loading ? 'PROCESSING...' : 'APPROVE'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
