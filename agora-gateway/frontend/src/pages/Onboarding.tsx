import { Server, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Onboarding() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">Join the Agora Network</h1>
          <p className="text-xl text-neutral-400">Choose how you want to integrate your store.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          
          <Link to="/onboarding/enterprise" className="block group">
            <div className="h-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-emerald-500/50 hover:bg-neutral-800/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Server size={120} />
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Server size={32} />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Enterprise Developer</h2>
              <p className="text-neutral-400 leading-relaxed">
                Connect your existing backend. Map your custom REST or GraphQL endpoints directly to the Agora AI routing engine. Best for stores with existing developer teams.
              </p>
            </div>
          </Link>

          <Link to="/onboarding/smb" className="block group">
            <div className="h-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-blue-500/50 hover:bg-neutral-800/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Store size={120} />
              </div>
              <div className="bg-blue-500/10 text-blue-400 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Store size={32} />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Small Business Owner</h2>
              <p className="text-neutral-400 leading-relaxed">
                No developer? No problem. Give us your product catalog and we will handle the checkout flow natively. Manage your orders from our beautiful dashboard.
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
