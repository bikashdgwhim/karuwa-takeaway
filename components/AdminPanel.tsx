import React, { useState, useEffect } from 'react';
import { Category, MenuItem, Order, OrderStatus, SiteSettings, PromoCode } from '../types';
import Toast, { ConfirmDialog } from './Toast';
import { useToast } from '../hooks/useToast';

interface AdminPanelProps {
  orders: Order[];
  categories: Category[];
  menuItems: MenuItem[];
  onUpdateOrderStatus: (order: Order) => void;
  onUpdateMenu: (categories: Category[], items: MenuItem[]) => void;
  settings: SiteSettings | null;
  onUpdateSettings: (settings: SiteSettings) => void;
  onLogout: () => void;
  onHome: () => void;
  onRefreshOrders: () => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  categories,
  menuItems,
  onUpdateOrderStatus,
  onUpdateMenu,
  settings,
  onUpdateSettings,
  onLogout,
  onHome,
  onRefreshOrders
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'content' | 'promos' | 'email' | 'users'>('orders');

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-20">
      <div className="bg-karuwa-black border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif text-karuwa-gold">Admin Dashboard</h1>
          <button onClick={onHome} className="p-2 hover:text-karuwa-gold transition-colors text-white" title="Return to Home">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </button>
          <div className="flex bg-white/5 rounded p-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-karuwa-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Live Orders
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'menu' ? 'bg-karuwa-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Menu Manager
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-karuwa-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Content Manager
            </button>
            <button
              onClick={() => setActiveTab('promos')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'promos' ? 'bg-karuwa-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Promo Codes
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'email' ? 'bg-karuwa-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Email Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-karuwa-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Users
            </button>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-white text-sm">Sign Out</button>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'orders' ? (
          <OrdersManager orders={orders} onUpdateStatus={onUpdateOrderStatus} onRefreshOrders={onRefreshOrders} />
        ) : activeTab === 'menu' ? (
          <MenuManager categories={categories} menuItems={menuItems} onSave={onUpdateMenu} />
        ) : activeTab === 'content' ? (
          <ContentManager settings={settings} onSave={onUpdateSettings} />
        ) : activeTab === 'promos' ? (
          <PromoCodeManager />
        ) : activeTab === 'email' ? (
          <EmailManager />
        ) : (
          <UserManager />
        )}
      </div>
    </div>
  );
};

// --- Sub-components for Admin ---

const OrdersManager: React.FC<{
  orders: Order[],
  onUpdateStatus: (o: Order) => void,
  onRefreshOrders: () => Promise<void>
}> = ({ orders, onUpdateStatus, onRefreshOrders }) => {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'selected' | 'all'>('single');
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'preparing': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'ready': return 'bg-karuwa-green/20 text-karuwa-green border-karuwa-green/50';
      case 'delivered': return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
      case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/50';
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await onRefreshOrders(); // Refresh orders data
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'DELETE'
      });
      if (response.ok) {
        await onRefreshOrders(); // Refresh orders data
      }
    } catch (error) {
      console.error('Failed to delete all orders:', error);
      alert('Failed to delete all orders');
    }
  };

  const confirmDelete = () => {
    if (deleteType === 'single' && orderToDelete) {
      handleDeleteOrder(orderToDelete);
    } else if (deleteType === 'all') {
      handleDeleteAll();
    }
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-8">
      {/* Header with Delete All Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Orders Management</h2>
        {orders.length > 0 && (
          <button
            onClick={() => {
              setDeleteType('all');
              setShowDeleteConfirm(true);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete All Orders
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600">
                {deleteType === 'all'
                  ? `Are you sure you want to delete ALL ${orders.length} orders? This action cannot be undone.`
                  : 'Are you sure you want to delete this order? This action cannot be undone.'}
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4 text-white">Active Orders ({activeOrders.length})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={onUpdateStatus}
              onDelete={(id) => {
                setOrderToDelete(id);
                setDeleteType('single');
                setShowDeleteConfirm(true);
              }}
              getStatusColor={getStatusColor}
            />
          ))}
          {activeOrders.length === 0 && <p className="text-gray-500 italic">No active orders.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-400 mt-8 pt-8 border-t border-white/10">Past Orders</h2>
        <div className="opacity-75 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pastOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={onUpdateStatus}
              onDelete={(id) => {
                setOrderToDelete(id);
                setDeleteType('single');
                setShowDeleteConfirm(true);
              }}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const OrderCard: React.FC<{
  order: Order,
  onUpdateStatus: (o: Order) => void,
  onDelete: (id: number) => void,
  getStatusColor: (s: OrderStatus) => string
}> = ({ order, onUpdateStatus, onDelete, getStatusColor }) => {
  return (
    <div className="bg-karuwa-dark border border-white/10 rounded-lg p-6 shadow-lg relative">
      {/* Delete Button */}
      <button
        onClick={() => onDelete(order.id)}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
        title="Delete order"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>

      <div className="flex justify-between items-start mb-4 pr-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-lg text-white">#{order.id.slice(-4)}</span>
            <span className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleTimeString()}</span>
          </div>
          <h3 className="font-serif text-xl text-karuwa-gold">{order.customerName}</h3>
          <p className="text-gray-400 text-sm">{order.customerPhone}</p>
        </div>
        <div className={`px-3 py-1 rounded border text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="bg-black/20 rounded p-4 mb-4 text-sm space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-gray-300"><span className="text-white font-bold">{item.quantity}x</span> {item.name}</span>
            <span className="text-gray-500">£{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold text-white">
          <span>Total</span>
          <span>£{order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs uppercase text-gray-500 font-bold mb-1">Delivery Address</h4>
        <p className="text-gray-300 text-sm">{order.customerAddress}</p>
      </div>

      <div className="flex gap-2">
        {order.status === 'pending' && (
          <>
            <button onClick={() => onUpdateStatus({ ...order, status: 'preparing' })} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-bold">Accept & Cook</button>
            <button onClick={() => onUpdateStatus({ ...order, status: 'cancelled' })} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded text-sm font-bold">Reject</button>
          </>
        )}
        {order.status === 'preparing' && (
          <button onClick={() => onUpdateStatus({ ...order, status: 'ready' })} className="flex-1 bg-karuwa-green hover:bg-karuwa-greenHover text-white py-2 rounded text-sm font-bold">Mark Ready</button>
        )}
        {order.status === 'ready' && (
          <button onClick={() => onUpdateStatus({ ...order, status: 'delivered' })} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded text-sm font-bold">Complete Order</button>
        )}
        {(order.status === 'delivered' || order.status === 'cancelled') && (
          <span className="text-xs text-gray-500 w-full text-center py-2">Order Archived</span>
        )}
      </div>
    </div>
  );
};

const MenuManager: React.FC<{ categories: Category[], menuItems: MenuItem[], onSave: (c: Category[], m: MenuItem[]) => void }> = ({ categories, menuItems, onSave }) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [localItems, setLocalItems] = useState<MenuItem[]>(menuItems);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // State for category renaming
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Sync state with props when data loads from storage
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    setLocalItems(menuItems);
  }, [menuItems]);

  // Simple handlers for CRUD
  const handleSaveItem = (item: MenuItem) => {
    if (editingItem) {
      setLocalItems(localItems.map(i => i.id === item.id ? item : i));
    } else {
      setLocalItems([...localItems, { ...item, id: Date.now().toString() }]);
    }
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLocalItems(localItems.filter(i => i.id !== id));
    }
  };

  // Persist to main storage
  const handlePersist = () => {
    onSave(localCategories, localItems);
    alert('Menu updated successfully!');
  };

  const handleAddCategory = () => {
    const name = prompt("Enter new category name:"); // Keeping prompt for new category for now as it's less frequent, or could fix too.
    if (name) {
      setLocalCategories([...localCategories, { id: Date.now().toString(), name, order: localCategories.length + 1 }]);
    }
  };

  const startEditingCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
  };

  const saveCategoryName = (id: string) => {
    if (editCategoryName.trim()) {
      setLocalCategories(localCategories.map(c => c.id === id ? { ...c, name: editCategoryName } : c));
    }
    setEditingCategoryId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Menu Management</h2>
        <div className="flex gap-2">
          <button onClick={handleAddCategory} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm">Add Category</button>
          <button onClick={() => { setIsAdding(true); setEditingItem(null); }} className="bg-karuwa-gold hover:bg-white hover:text-black text-black px-4 py-2 rounded text-sm font-bold transition-colors">Add Item</button>
          <button onClick={handlePersist} className="bg-karuwa-green hover:bg-karuwa-greenHover text-white px-6 py-2 rounded text-sm font-bold">Save Changes</button>
        </div>
      </div>

      {(editingItem || isAdding) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-karuwa-dark p-6 rounded-lg max-w-lg w-full border border-white/20">
            <h3 className="text-lg font-serif text-karuwa-gold mb-4">{editingItem ? 'Edit Item' : 'New Item'}</h3>
            <ItemForm
              initialData={editingItem || { id: '', categoryId: localCategories[0]?.id || '', name: '', description: '', price: 0 }}
              categories={localCategories}
              onSave={handleSaveItem}
              onCancel={() => { setEditingItem(null); setIsAdding(false); }}
            />
          </div>
        </div>
      )}

      <div className="space-y-8">
        {localCategories.map(cat => (
          <div key={cat.id} className="bg-white/5 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              {editingCategoryId === cat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="bg-black/40 border border-white/30 rounded px-2 py-1 text-white text-lg font-bold"
                    autoFocus
                  />
                  <button onClick={() => saveCategoryName(cat.id)} className="text-green-400 hover:text-green-300 text-sm">Save</button>
                  <button onClick={() => setEditingCategoryId(null)} className="text-gray-400 hover:text-gray-300 text-sm">Cancel</button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-karuwa-gold">{cat.name}</h3>
                  <button onClick={() => startEditingCategory(cat)} className="text-xs text-gray-500 hover:text-white">Rename</button>
                </>
              )}
            </div>

            <div className="space-y-2">
              {localItems.filter(i => i.categoryId === cat.id).map(item => (
                <div key={item.id} className="flex justify-between items-center bg-black/20 p-3 rounded group hover:bg-black/40 transition-colors">
                  <div className="flex-1">
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {item.allergens.map(alg => (
                          <AllergenIconAdmin key={alg} allergen={alg} />
                        ))}
                      </div>
                    )}
                    {item.spiceLevel && item.spiceLevel > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-400">Spice:</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: item.spiceLevel }).map((_, i) => (
                            <span key={i} className="text-sm">🌶️</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-karuwa-gold">£{item.price.toFixed(2)}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingItem(item)} className="text-blue-400 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {localItems.filter(i => i.categoryId === cat.id).length === 0 && <p className="text-xs text-gray-600">No items in this category.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ItemForm: React.FC<{ initialData: Partial<MenuItem>, categories: Category[], onSave: (item: any) => void, onCancel: () => void }> = ({ initialData, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(initialData);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploading(true);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: data,
      });
      if (response.ok) {
        const result = await response.json();
        // The backend returns a relative path like '/uploads/filename'.
        // If your images are served from the same domain/port as frontend (proxy) or different:
        // We'll prepend the backend URL if we are strictly separating, but for standard usage
        // storing the relative path is good if we construct the full URL later or proxy.
        // Assuming we need full URL or relative if via proxy. Let's store full URL for safety or just path.
        // Let's store the full "http://localhost:3001" prepended url for now or keep relative if <img src> can handle it.
        // The backend `server.js` serves /uploads, so `http://localhost:3001/uploads/...` is the valid URL.
        const fullUrl = `http://localhost:3001${result.url}`;
        setFormData((prev: any) => ({ ...prev, image: fullUrl }));
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, price: Number(formData.price) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Name</label>
        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price</label>
          <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Image URL</label>
        <div className="flex gap-2">
          <input placeholder="https://..." value={formData.image || ''} onChange={e => setFormData({ ...formData, image: e.target.value })} className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white" />
          <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm flex items-center justify-center">
            <span>{uploading ? '...' : 'Upload'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-2">Allergens</label>
        <div className="grid grid-cols-2 gap-2 bg-black/20 p-3 rounded border border-white/10">
          {['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Mustard', 'Celery', 'Sulphites', 'Lupin'].map(allergen => (
            <label key={allergen} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={formData.allergens?.includes(allergen) || false}
                onChange={e => {
                  const current = formData.allergens || [];
                  if (e.target.checked) {
                    setFormData({ ...formData, allergens: [...current, allergen] });
                  } else {
                    setFormData({ ...formData, allergens: current.filter(a => a !== allergen) });
                  }
                }}
                className="w-4 h-4 rounded border-gray-600 bg-black/40 text-karuwa-green focus:ring-karuwa-green focus:ring-offset-0"
              />
              <span className="flex items-center gap-1">
                <AllergenIconAdmin allergen={allergen} />
                {allergen}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Spice Level</label>
          <select value={formData.spiceLevel || 0} onChange={e => setFormData({ ...formData, spiceLevel: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white">
            <option value={0}>None</option>
            <option value={1}>Mild</option>
            <option value={2}>Medium</option>
            <option value={3}>Hot</option>
            <option value={4}>Very Hot</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 pt-2">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={formData.isVegetarian} onChange={e => setFormData({ ...formData, isVegetarian: e.target.checked })} />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={formData.isVegan} onChange={e => setFormData({ ...formData, isVegan: e.target.checked })} />
          Vegan
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={formData.isPopular} onChange={e => setFormData({ ...formData, isPopular: e.target.checked })} />
          Popular
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded text-gray-400 hover:text-white">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded bg-karuwa-green hover:bg-karuwa-greenHover text-white font-bold">Save Item</button>
      </div>
    </form>
  )
}

// Allergen Icon Component for Admin Panel with Tooltip
const AllergenIconAdmin: React.FC<{ allergen: string }> = ({ allergen }) => {
  const allergenLower = allergen.toLowerCase().trim();

  const getAllergenInfo = () => {
    if (allergenLower.includes('gluten') || allergenLower.includes('wheat')) {
      return { icon: '🌾', name: 'Gluten/Wheat', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (allergenLower.includes('dairy') || allergenLower.includes('milk') || allergenLower.includes('lactose')) {
      return { icon: '🥛', name: 'Dairy', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
    if (allergenLower.includes('nut') || allergenLower.includes('peanut') || allergenLower.includes('almond')) {
      return { icon: '🥜', name: 'Nuts', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    }
    if (allergenLower.includes('egg')) {
      return { icon: '🥚', name: 'Eggs', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    }
    if (allergenLower.includes('soy') || allergenLower.includes('soya')) {
      return { icon: '🫘', name: 'Soy', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
    }
    if (allergenLower.includes('fish')) {
      return { icon: '🐟', name: 'Fish', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    }
    if (allergenLower.includes('shellfish') || allergenLower.includes('seafood') || allergenLower.includes('crustacean')) {
      return { icon: '🦐', name: 'Shellfish', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
    }
    if (allergenLower.includes('sesame')) {
      return { icon: '🌰', name: 'Sesame', color: 'bg-stone-500/20 text-stone-300 border-stone-500/30' };
    }
    if (allergenLower.includes('mustard')) {
      return { icon: '🟡', name: 'Mustard', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    }
    if (allergenLower.includes('celery')) {
      return { icon: '🥬', name: 'Celery', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' };
    }
    if (allergenLower.includes('sulphite') || allergenLower.includes('sulfite')) {
      return { icon: '⚗️', name: 'Sulphites', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
    // Default
    return { icon: '⚠️', name: allergen, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
  };

  const info = getAllergenInfo();

  return (
    <div className="group relative inline-block">
      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium cursor-help ${info.color}`}>
        <span className="text-sm">{info.icon}</span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-gray-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
        {info.name}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
      </div>
    </div>
  );
};

const ContentManager: React.FC<{ settings: SiteSettings | null, onSave: (s: SiteSettings) => void }> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<SiteSettings>(settings || {
    headerTitle: '',
    headerLogo: '',
    heroImage: '',
    heroHeadline: '',
    heroSubheadline: '',
    chefPhoto: '',
    chefName: '',
    chefPosition: '',
    openingHours: '',
    footerAddress: '',
    footerPhone: '',
    footerEmail: '',
    copyrightText: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof SiteSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploading(true);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: data,
      });
      if (response.ok) {
        const result = await response.json();
        const fullUrl = `http://localhost:3001${result.url}`;
        setFormData(prev => ({ ...prev, [field]: fullUrl }));
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Settings saved!');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/5 p-8 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-6">Site Content Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Header Section */}
        <div className="space-y-4 border-b border-white/10 pb-6">
          <h3 className="text-lg text-karuwa-gold font-serif">Header</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Site Title</label>
            <input
              value={formData.headerTitle}
              onChange={e => setFormData({ ...formData, headerTitle: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo URL</label>
            <div className="flex gap-2">
              <input
                value={formData.headerLogo || ''}
                onChange={e => setFormData({ ...formData, headerLogo: e.target.value })}
                className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="https://..."
              />
              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm flex items-center justify-center">
                <span>{uploading ? '...' : 'Upload'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'headerLogo')} disabled={uploading} />
              </label>
            </div>
            {formData.headerLogo && <img src={formData.headerLogo} alt="Logo Preview" className="h-10 mt-2 object-contain" />}
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 border-b border-white/10 pb-6">
          <h3 className="text-lg text-karuwa-gold font-serif">Hero Banner</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Headline</label>
            <input
              value={formData.heroHeadline}
              onChange={e => setFormData({ ...formData, heroHeadline: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subheadline</label>
            <input
              value={formData.heroSubheadline}
              onChange={e => setFormData({ ...formData, heroSubheadline: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Banner Image URL</label>
            <div className="flex gap-2">
              <input
                value={formData.heroImage || ''}
                onChange={e => setFormData({ ...formData, heroImage: e.target.value })}
                className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="https://..."
              />
              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm flex items-center justify-center">
                <span>{uploading ? '...' : 'Upload'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImage')} disabled={uploading} />
              </label>
            </div>
            {formData.heroImage && <img src={formData.heroImage} alt="Banner Preview" className="h-32 w-full object-cover mt-2 rounded" />}
          </div>
        </div>

        {/* Chef Profile Section */}
        <div className="space-y-4 border-b border-white/10 pb-6">
          <h3 className="text-lg text-karuwa-gold font-serif">Chef Profile (Our Story Section)</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Chef Photo</label>
            <div className="flex gap-2">
              <input
                value={formData.chefPhoto || ''}
                onChange={e => setFormData({ ...formData, chefPhoto: e.target.value })}
                className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="https://..."
              />
              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm flex items-center justify-center">
                <span>{uploading ? '...' : 'Upload'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'chefPhoto')} disabled={uploading} />
              </label>
            </div>
            {formData.chefPhoto && <img src={formData.chefPhoto} alt="Chef Preview" className="h-32 w-32 object-cover mt-2 rounded-full border-2 border-white/20" />}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Chef Name</label>
            <input
              value={formData.chefName || ''}
              onChange={e => setFormData({ ...formData, chefName: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              placeholder="e.g. Chef Rajesh Kumar"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Chef Position/Title</label>
            <input
              value={formData.chefPosition || ''}
              onChange={e => setFormData({ ...formData, chefPosition: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              placeholder="e.g. Head Chef"
            />
          </div>
        </div>

        {/* Footer Section */}
        <div className="space-y-4">
          <h3 className="text-lg text-karuwa-gold font-serif">Footer</h3>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Address</label>
            <input
              value={formData.footerAddress}
              onChange={e => setFormData({ ...formData, footerAddress: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Phone</label>
            <input
              value={formData.footerPhone}
              onChange={e => setFormData({ ...formData, footerPhone: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              value={formData.footerEmail}
              onChange={e => setFormData({ ...formData, footerEmail: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Opening Hours</label>
            <input
              value={formData.openingHours || ''}
              onChange={e => setFormData({ ...formData, openingHours: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              placeholder="e.g. Mon-Sun: 17:00 - 23:00"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Copyright Text</label>
            <input
              value={formData.copyrightText || ''}
              onChange={e => setFormData({ ...formData, copyrightText: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              placeholder="e.g. Karuwa Takeaway. All Rights Reserved."
            />
            <p className="text-xs text-gray-500 mt-1">Note: Year will be added automatically</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-karuwa-green hover:bg-karuwa-greenHover text-white px-8 py-3 rounded font-bold">Save Settings</button>
        </div>
      </form>
    </div>
  );
};

const PromoCodeManager: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { toasts, removeToast, success, error } = useToast();
  const [formData, setFormData] = useState<Partial<PromoCode>>({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order: 0,
    max_uses: null,
    active: true
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/promo-codes');
      const data = await response.json();
      setPromoCodes(data);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPromo
        ? `http://localhost:3001/api/promo-codes/${editingPromo.id}`
        : 'http://localhost:3001/api/promo-codes';

      // Ensure all fields are properly formatted
      const dataToSend = {
        code: formData.code?.toUpperCase() || '',
        discount_type: formData.discount_type || 'percentage',
        discount_value: Number(formData.discount_value) || 0,
        min_order: Number(formData.min_order) || 0,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        active: formData.active !== false
      };

      const response = await fetch(url, {
        method: editingPromo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        await fetchPromoCodes();
        setIsAdding(false);
        setEditingPromo(null);
        setFormData({ code: '', discount_type: 'percentage', discount_value: 0, min_order: 0, max_uses: null, active: true });
        success(editingPromo ? 'Promo code updated successfully!' : 'Promo code created successfully!');
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Failed to save promo code');
      }
    } catch (err) {
      console.error('Error saving promo code:', err);
      error('Error saving promo code');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/promo-codes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPromoCodes();
        alert('Promo code deleted!');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Error deleting promo code');
    }
  };

  const startEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order: promo.min_order,
      max_uses: promo.max_uses,
      active: Boolean(promo.active)
    });
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingPromo(null);
    setFormData({ code: '', discount_type: 'percentage', discount_value: 0, min_order: 0, max_uses: null, active: true });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Promo Code Management</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-karuwa-green hover:bg-karuwa-greenHover text-white px-4 py-2 rounded font-bold"
          >
            + Add New Code
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white/5 p-6 rounded-lg mb-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">{editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white uppercase"
                placeholder="e.g. SAVE10"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Discount Type</label>
              <select
                value={formData.discount_type}
                onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(£)'}
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.discount_value}
                onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Minimum Order (£)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_order}
                onChange={e => setFormData({ ...formData, min_order: parseFloat(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Uses (optional)</label>
              <input
                type="number"
                min="1"
                value={formData.max_uses || ''}
                onChange={e => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="Unlimited"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>

            <div className="col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-karuwa-green hover:bg-karuwa-greenHover text-white rounded font-bold"
              >
                {editingPromo ? 'Update' : 'Create'} Promo Code
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/5 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/40">
            <tr>
              <th className="text-left p-4 text-xs text-gray-400 uppercase">Code</th>
              <th className="text-left p-4 text-xs text-gray-400 uppercase">Type</th>
              <th className="text-left p-4 text-xs text-gray-400 uppercase">Value</th>
              <th className="text-left p-4 text-xs text-gray-400 uppercase">Min Order</th>
              <th className="text-left p-4 text-xs text-gray-400 uppercase">Uses</th>
              <th className="text-left p-4 text-xs text-gray-400 uppercase">Status</th>
              <th className="text-right p-4 text-xs text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map(promo => (
              <tr key={promo.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-4 font-mono text-karuwa-gold font-bold">{promo.code}</td>
                <td className="p-4 text-sm text-gray-300 capitalize">{promo.discount_type}</td>
                <td className="p-4 text-sm text-white">
                  {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `£${promo.discount_value.toFixed(2)}`}
                </td>
                <td className="p-4 text-sm text-gray-300">£{promo.min_order.toFixed(2)}</td>
                <td className="p-4 text-sm text-gray-300">
                  {promo.uses}/{promo.max_uses || '∞'}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded ${promo.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {promo.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => startEdit(promo)}
                    className="text-blue-400 hover:text-blue-300 mr-3 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id!)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {promoCodes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No promo codes yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
};

// User Management Component
const UserManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const availablePermissions = [
    { id: 'all', label: 'All Permissions (Admin)' },
    { id: 'orders', label: 'Manage Orders' },
    { id: 'menu', label: 'Manage Menu' },
    { id: 'content', label: 'Manage Content' },
    { id: 'promos', label: 'Manage Promo Codes' },
    { id: 'email', label: 'Manage Email Settings' },
    { id: 'users', label: 'Manage Users' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSave = async (user: any) => {
    setLoading(true);
    try {
      const url = user.id
        ? `http://localhost:3001/api/users/${user.id}`
        : 'http://localhost:3001/api/users';

      const response = await fetch(url, {
        method: user.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        alert(user.id ? 'User updated successfully!' : 'User created successfully!');
        fetchUsers();
        setEditingUser(null);
        setIsAdding(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const UserForm = ({ user, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState(user || {
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'staff',
      permissions: [],
      isActive: true
    });

    const handlePermissionToggle = (permId: string) => {
      if (permId === 'all') {
        setFormData({ ...formData, permissions: formData.permissions.includes('all') ? [] : ['all'] });
      } else {
        const perms = formData.permissions.filter((p: string) => p !== 'all');
        if (perms.includes(permId)) {
          setFormData({ ...formData, permissions: perms.filter((p: string) => p !== permId) });
        } else {
          setFormData({ ...formData, permissions: [...perms, permId] });
        }
      }
    };

    return (
      <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">{user?.id ? 'Edit User' : 'Add New User'}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password {user?.id && '(leave blank to keep current)'}</label>
            <input
              type="password"
              value={formData.password || ''}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
              placeholder={user?.id ? 'Leave blank to keep current' : 'Enter password'}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Active</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Permissions</label>
          <div className="grid grid-cols-2 gap-2">
            {availablePermissions.map(perm => (
              <label key={perm.id} className="flex items-center gap-2 cursor-pointer bg-black/20 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(perm.id) || formData.permissions.includes('all')}
                  onChange={() => handlePermissionToggle(perm.id)}
                  disabled={formData.permissions.includes('all') && perm.id !== 'all'}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={loading || !formData.username || !formData.email || !formData.fullName || (!formData.password && !user?.id)}
            className="px-4 py-2 bg-karuwa-green hover:bg-karuwa-greenHover text-white rounded font-bold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        {!isAdding && !editingUser && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-karuwa-green hover:bg-karuwa-greenHover text-white rounded font-bold"
          >
            + Add User
          </button>
        )}
      </div>

      {isAdding || editingUser ? (
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false);
            setEditingUser(null);
          }}
        />
      ) : (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-4 text-sm font-bold text-gray-300">Username</th>
                <th className="text-left p-4 text-sm font-bold text-gray-300">Full Name</th>
                <th className="text-left p-4 text-sm font-bold text-gray-300">Email</th>
                <th className="text-left p-4 text-sm font-bold text-gray-300">Role</th>
                <th className="text-left p-4 text-sm font-bold text-gray-300">Status</th>
                <th className="text-left p-4 text-sm font-bold text-gray-300">Last Login</th>
                <th className="text-right p-4 text-sm font-bold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4 text-white font-medium">{user.username}</td>
                  <td className="p-4 text-gray-300">{user.fullName}</td>
                  <td className="p-4 text-gray-300">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                      disabled={user.username === 'admin'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No users found. Create your first user!
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const EmailManager: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'settings' | 'templates'>('settings');
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [editMode, setEditMode] = useState<'code' | 'split'>('split');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmailSettings();
    fetchTemplates();
  }, []);

  // Auto-preview when editing template
  useEffect(() => {
    if (editingTemplate && editMode === 'split') {
      const debounce = setTimeout(() => {
        updatePreview(editingTemplate);
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [editingTemplate?.html_content, editingTemplate?.subject, editMode]);

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/email-settings');
      const data = await response.json();
      setEmailSettings(data);
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/email-templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const saveEmailSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      if (response.ok) {
        alert('Email settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfig = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      });
      const result = await response.json();
      if (result.success) {
        alert('Test email sent successfully! Check your inbox.');
      } else {
        alert(`Test failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (template: any) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (response.ok) {
        alert('Template saved successfully!');
        fetchTemplates();
        setEditingTemplate(null);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async (template: any) => {
    try {
      const sampleData = {
        restaurantName: 'Karuwa Takeaway',
        customerName: 'John Doe',
        orderNumber: '1234',
        orderTime: new Date().toLocaleString(),
        orderItems: '<div class="item"><span><strong>2x</strong> Chicken Tikka Masala</span><span>£18.00</span></div>',
        orderTotal: '25.50',
        deliveryAddress: '123 High Street, London',
        customerPhone: '07700 900000',
        orderStatus: 'PREPARING',
        statusMessage: 'Your order is being prepared!',
        currentYear: new Date().getFullYear().toString()
      };

      const response = await fetch(`http://localhost:3001/api/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });
      const preview = await response.json();

      setPreviewHtml(preview.html);
      setPreviewSubject(preview.subject);
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  const startEdit = (template: any) => {
    setEditingTemplate(template);
    setEditMode('split');
    updatePreview(template);
  };

  if (!emailSettings) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Email Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('settings')}
            className={`px-4 py-2 rounded font-bold ${activeSection === 'settings' ? 'bg-karuwa-green text-white' : 'bg-white/10 text-gray-400'}`}
          >
            SMTP Settings
          </button>
          <button
            onClick={() => setActiveSection('templates')}
            className={`px-4 py-2 rounded font-bold ${activeSection === 'templates' ? 'bg-karuwa-green text-white' : 'bg-white/10 text-gray-400'}`}
          >
            Email Templates
          </button>
        </div>
      </div>

      {activeSection === 'settings' ? (
        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">SMTP Configuration</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-400 mb-1">SMTP Host</label>
              <input
                type="text"
                value={emailSettings.smtp_host || ''}
                onChange={e => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="smtp-relay.brevo.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">SMTP Port</label>
              <input
                type="number"
                value={emailSettings.smtp_port || ''}
                onChange={e => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">SMTP User (Email)</label>
              <input
                type="email"
                value={emailSettings.smtp_user || ''}
                onChange={e => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="your-email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">SMTP Password</label>
              <input
                type="password"
                value={emailSettings.smtp_password || ''}
                onChange={e => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="Your SMTP key"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Restaurant Email</label>
              <input
                type="email"
                value={emailSettings.restaurant_email || ''}
                onChange={e => setEmailSettings({ ...emailSettings, restaurant_email: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="restaurant@karuwa.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Staff Emails (comma-separated)</label>
              <input
                type="text"
                value={emailSettings.staff_emails?.join(', ') || ''}
                onChange={e => setEmailSettings({ ...emailSettings, staff_emails: e.target.value.split(',').map((s: string) => s.trim()) })}
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="staff1@example.com, staff2@example.com"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(emailSettings.send_customer_emails)}
                onChange={e => setEmailSettings({ ...emailSettings, send_customer_emails: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Send Customer Emails</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(emailSettings.send_staff_emails)}
                onChange={e => setEmailSettings({ ...emailSettings, send_staff_emails: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Send Staff Emails</span>
            </label>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-bold text-white mb-3">Test Email Configuration</h4>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white"
                placeholder="Enter email to send test"
              />
              <button
                onClick={testEmailConfig}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={saveEmailSettings}
              disabled={loading}
              className="px-6 py-2 bg-karuwa-green hover:bg-karuwa-greenHover text-white rounded font-bold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {editingTemplate ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white">Edit: {editingTemplate.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode('code')}
                    className={`px-3 py-1 rounded text-sm ${editMode === 'code' ? 'bg-karuwa-green text-white' : 'bg-white/10 text-gray-400'}`}
                  >
                    Code Only
                  </button>
                  <button
                    onClick={() => setEditMode('split')}
                    className={`px-3 py-1 rounded text-sm ${editMode === 'split' ? 'bg-karuwa-green text-white' : 'bg-white/10 text-gray-400'}`}
                  >
                    Split View
                  </button>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              <div className={`grid ${editMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono text-sm"
                      placeholder="Use {{variableName}} for dynamic content"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">HTML Content</label>
                    <textarea
                      value={editingTemplate.html_content}
                      onChange={e => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded p-3 text-white font-mono text-xs leading-relaxed"
                      rows={editMode === 'split' ? 25 : 30}
                      placeholder="HTML email template with {{variables}}"
                      style={{ tabSize: 2 }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={editingTemplate.description}
                      onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Available Variables (click to copy)</label>
                    <div className="bg-black/40 border border-white/10 rounded p-3">
                      <div className="flex flex-wrap gap-2">
                        {editingTemplate.variables?.map((v: string) => (
                          <span
                            key={v}
                            className="px-2 py-1 bg-karuwa-green/20 text-karuwa-green rounded text-xs font-mono cursor-pointer hover:bg-karuwa-green/30"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${v}}}`);
                              alert(`Copied {{${v}}} to clipboard!`);
                            }}
                            title="Click to copy"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                    <button
                      onClick={() => updatePreview(editingTemplate)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold"
                    >
                      Refresh Preview
                    </button>
                    <button
                      onClick={() => saveTemplate(editingTemplate)}
                      disabled={loading}
                      className="px-4 py-2 bg-karuwa-green hover:bg-karuwa-greenHover text-white rounded font-bold disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Template'}
                    </button>
                  </div>
                </div>

                {editMode === 'split' && (
                  <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Live Preview</h4>
                    <div className="bg-gray-100 p-4 rounded">
                      <div className="bg-white rounded shadow-lg max-w-full overflow-auto">
                        <div className="border-b-2 border-karuwa-green p-3 bg-gray-50">
                          <p className="text-xs text-gray-600 font-semibold">Subject:</p>
                          <p className="text-sm font-bold text-gray-900">{previewSubject}</p>
                        </div>
                        <div
                          className="p-4"
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                          style={{ maxHeight: '800px', overflow: 'auto' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {templates.map(template => (
                <div key={template.id} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                      <p className="text-xs text-gray-500 font-mono">Subject: {template.subject}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.variables?.slice(0, 5).map((v: string) => (
                          <span key={v} className="px-2 py-0.5 bg-karuwa-green/10 text-karuwa-green rounded text-xs font-mono">
                            {`{{${v}}}`}
                          </span>
                        ))}
                        {template.variables?.length > 5 && (
                          <span className="text-xs text-gray-500">+{template.variables.length - 5} more</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(template)}
                      className="px-3 py-1 bg-karuwa-green hover:bg-karuwa-greenHover text-white rounded text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
