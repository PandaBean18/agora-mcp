import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, RefreshCcw, LogOut, CheckCircle2 } from 'lucide-react';

export default function SmbDashboard() {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const int = setInterval(fetchOrders, 3000);
    return () => clearInterval(int);
  }, [merchantId]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/smb/${merchantId}/orders`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShip = async (orderId: string) => {
    if (!trackingNumber) return alert('Please enter a tracking number');
    try {
      await fetch(`http://localhost:3000/api/smb/${merchantId}/orders/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber })
      });
      setSelectedOrder(null);
      setTrackingNumber('');
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject and refund this order?')) return;
    try {
      await fetch(`http://localhost:3000/api/smb/${merchantId}/orders/${orderId}/refund`, {
        method: 'POST'
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Agora Merchant Dashboard</h1>
            <p className="text-xs text-neutral-500 font-mono">{merchantId}</p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
          <LogOut size={16} /> Exit Dashboard
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Orders</h2>
          <div className="text-sm text-neutral-500 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
            Auto-refreshing every 3s
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-400 shadow-sm">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No orders yet</h3>
            <p>When customers check out through Agora, their orders will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center transition-all hover:shadow-md">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-medium text-neutral-500">{order.id.substring(0, 8)}...</span>
                    {order.status === 'Processing' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">Processing</span>}
                    {order.status === 'Shipped' && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">Shipped</span>}
                    {order.status === 'Refunded' && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">Refunded</span>}
                  </div>
                  
                  <div className="text-sm font-medium mb-1">Items:</div>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    {order.items.map((item: any, i: number) => (
                      <li key={i}>• {item.qty}x {item.sku || item.id || item.uuid}</li>
                    ))}
                  </ul>
                  
                  <div className="text-xs text-neutral-400 mt-4">
                    Placed {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="w-full md:w-auto md:min-w-[300px]">
                  {order.status === 'Processing' && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                      {selectedOrder === order.id ? (
                        <div className="space-y-3 animate-in fade-in">
                          <input 
                            type="text" 
                            placeholder="Tracking Number" 
                            className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={trackingNumber}
                            onChange={e => setTrackingNumber(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleShip(order.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded flex items-center justify-center gap-2">
                              <CheckCircle2 size={16} /> Confirm
                            </button>
                            <button onClick={() => setSelectedOrder(null)} className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-sm font-medium py-2 rounded">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={() => setSelectedOrder(order.id)} className="flex-1 bg-neutral-900 hover:bg-black text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Truck size={16} /> Ship Order
                          </button>
                          <button onClick={() => handleRefund(order.id)} className="flex-1 bg-white border border-neutral-300 hover:bg-neutral-50 text-red-600 text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <RefreshCcw size={16} /> Refund
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {order.status === 'Shipped' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-sm font-medium text-green-800 mb-1">Shipped Successfully</div>
                      <div className="text-xs text-green-600 font-mono">{order.tracking_number}</div>
                    </div>
                  )}
                  
                  {order.status === 'Refunded' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <div className="text-sm font-medium text-red-800">Order Refunded</div>
                      <div className="text-xs text-red-600 mt-1">Payment returned to customer</div>
                    </div>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
