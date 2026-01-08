import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem, Order, Category, SiteSettings } from './types';
import { fetchMenu, fetchOrders, createOrder, updateOrder, updateMenu, fetchSettings, updateSettings } from './services/storage';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';

type View = 'home' | 'menu' | 'admin-login' | 'admin-dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [data, setData] = useState<{ categories: Category[], menuItems: MenuItem[] }>({ categories: [], menuItems: [] });
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Admin Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const menuData = await fetchMenu();
      setData(menuData);
      const ordersData = await fetchOrders();
      setOrders(ordersData);
      const settingsData = await fetchSettings();
      setSettings(settingsData);
    };
    loadData();

    // Restore user session if exists
    const savedUser = localStorage.getItem('karuwa_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }

    const interval = setInterval(async () => {
      const ordersData = await fetchOrders();
      setOrders(ordersData);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const placeOrder = async (details: { name: string; phone: string; email: string; address: string }) => {
    const newOrder: Order = {
      id: Date.now().toString(),
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: details.address,
      items: cart,
      total: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      // Pass email to backend for email notifications
      await createOrder({ ...newOrder, customerEmail: details.email } as any);
      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      setIsCartOpen(false);
      alert('Order placed successfully! Check your email for confirmation.');
    } catch (e) {
      alert('Failed to place order. Please try again.');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Store user session
          localStorage.setItem('karuwa_admin_session', 'true');
          localStorage.setItem('karuwa_user', JSON.stringify(data.user));
          setCurrentUser(data.user);
          setView('admin-dashboard');
          setLoginError(false);
          setUsername('');
          setPassword('');
        } else {
          setLoginError(true);
        }
      } else {
        setLoginError(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(true);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-karuwa-brandGreen selection:text-white">

      {/* Navbar - Dark Green as per screenshot */}
      {view !== 'admin-dashboard' && (
        <nav className="fixed top-0 w-full z-40 bg-karuwa-brandGreen shadow-md transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            {/* Logo Section */}
            <div onClick={() => setView('home')} className="cursor-pointer flex items-center gap-3">
              {settings?.headerLogo ? (
                <img src={settings.headerLogo} alt="Logo" className="w-10 h-10 object-contain rounded-sm" />
              ) : (
                <div className="w-10 h-10 bg-karuwa-gold flex items-center justify-center rounded-sm">
                  <span className="font-serif text-2xl font-bold text-black">{settings?.headerTitle ? settings.headerTitle[0] : 'K'}</span>
                </div>
              )}
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                {settings?.headerTitle || 'Karuwa'}
              </h1>
            </div>

            {/* Center Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {['Home', 'Story', 'Menu'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'Home') setView('home');
                    else if (item === 'Story') { setView('home'); setTimeout(() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' }), 100); }
                    else if (item === 'Menu') setView('menu');
                  }}
                  className={`text-sm font-medium uppercase tracking-widest hover:text-karuwa-gold transition-colors ${(view === 'home' && item === 'Home') || (view === 'menu' && item === 'Menu') ? 'text-karuwa-gold' : 'text-gray-200'
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Right Basket */}
            <div className="flex items-center">
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 text-white hover:text-karuwa-gold transition-colors"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-karuwa-brandOrange text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium uppercase tracking-wider">Basket</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Content Area */}
      <main className={`${view !== 'admin-dashboard' ? 'pt-20' : ''}`}>

        {view === 'home' && (
          <>
            <Hero
              onOrderClick={() => setView('menu')}
              title={settings?.heroHeadline}
              subtitle={settings?.heroSubheadline}
              image={settings?.heroImage}
            />

            {/* Features Bar - Green Background */}
            <div className="bg-karuwa-brandGreen py-16 px-4">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                {/* Feature 1 */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-karuwa-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path></svg>
                  </div>
                  <h3 className="text-xl font-serif text-white mb-2">Fast Delivery</h3>
                  <p className="text-gray-400 text-sm">Hot & fresh to your doorstep within 45 mins.</p>
                </div>
                {/* Feature 2 */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-karuwa-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
                  </div>
                  <h3 className="text-xl font-serif text-white mb-2">Authentic Recipes</h3>
                  <p className="text-gray-400 text-sm">Chefs with 20+ years of experience.</p>
                </div>
                {/* Feature 3 */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-karuwa-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                  </div>
                  <h3 className="text-xl font-serif text-white mb-2">Fresh Ingredients</h3>
                  <p className="text-gray-400 text-sm">Locally sourced produce & imported spices.</p>
                </div>
              </div>
            </div>

            {/* Story Section - White Background */}
            <div id="story" className="py-24 bg-white px-4 text-center">
              <h4 className="text-karuwa-brandOrange font-serif italic text-lg mb-2">Experience the Flavour</h4>
              <h2 className="text-4xl md:text-5xl font-serif text-karuwa-brandGreen mb-8">Our Story</h2>
              <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed font-light mb-12">
                Karuwa is a traditional Nepalese water vessel, symbolizing our commitment to pouring authentic hospitality and
                flavour into every dish. Our chefs bring over 20 years of experience, blending spices from the foothills of the
                Himalayas with the finest local ingredients to create a dining experience that feels like home.
              </p>

              {/* Chef Profile */}
              {(settings?.chefPhoto || settings?.chefName) && (
                <div className="max-w-md mx-auto mt-12">
                  <div className="bg-gradient-to-br from-karuwa-brandGreen/5 to-karuwa-gold/5 rounded-2xl p-8 border border-karuwa-brandGreen/10">
                    {settings?.chefPhoto && (
                      <div className="mb-6">
                        <img
                          src={settings.chefPhoto}
                          alt={settings.chefName || 'Our Chef'}
                          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                        />
                      </div>
                    )}
                    {settings?.chefName && (
                      <h3 className="text-2xl font-serif text-karuwa-brandGreen font-bold mb-1">
                        {settings.chefName}
                      </h3>
                    )}
                    {settings?.chefPosition && (
                      <p className="text-karuwa-brandOrange font-medium text-sm uppercase tracking-wider">
                        {settings.chefPosition}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Preview on Home */}
            <div className="bg-gray-50 border-t border-gray-100">
              <Menu
                categories={data.categories}
                menuItems={data.menuItems}
                onAddToCart={addToCart}
              />
            </div>
          </>
        )}

        {view === 'menu' && (
          <Menu
            categories={data.categories}
            menuItems={data.menuItems}
            onAddToCart={addToCart}
          />
        )}

        {view === 'admin-login' && (
          <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-100">
            <div className="bg-white p-8 rounded shadow-lg max-w-sm w-full border border-gray-200">
              <h2 className="text-2xl font-serif text-karuwa-brandGreen mb-6 text-center">Staff Access</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded text-gray-800 focus:border-karuwa-brandGreen outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded text-gray-800 focus:border-karuwa-brandGreen outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {loginError && <p className="text-red-500 text-sm text-center">Invalid username or password.</p>}
                <button type="submit" className="w-full bg-karuwa-brandGreen text-white font-bold py-3 uppercase tracking-wider hover:bg-karuwa-brandOrange transition-colors">
                  Login
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'admin-dashboard' && (
          <AdminPanel
            orders={orders}
            categories={data.categories}
            menuItems={data.menuItems}
            settings={settings}
            onUpdateOrderStatus={async (o) => {
              try {
                await updateOrder(o);
                setOrders(prev => prev.map(x => x.id === o.id ? o : x));
              } catch (e) {
                console.error("Failed to update status");
              }
            }}
            onUpdateSettings={async (s) => {
              try {
                await updateSettings(s);
                setSettings(s);
              } catch (e) {
                alert("Failed to save settings");
              }
            }}
            onUpdateMenu={async (c, m) => {
              try {
                await updateMenu(c, m);
                setData({ categories: c, menuItems: m });
              } catch (e) {
                alert("Failed to save menu");
              }
            }}
            onLogout={() => {
              localStorage.removeItem('karuwa_admin_session');
              localStorage.removeItem('karuwa_user');
              setCurrentUser(null);
              setView('home');
            }}
            onHome={() => setView('home')}
            onRefreshOrders={async () => {
              const ordersData = await fetchOrders();
              setOrders(ordersData);
            }}
          />
        )}
      </main>

      {/* Footer - Deep Green */}
      {view !== 'admin-dashboard' && (
        <footer className="bg-karuwa-brandGreen py-16 px-4 text-center border-t border-white/10">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="text-karuwa-gold font-bold uppercase tracking-widest text-xs mb-6">Contact</h4>
              <p className="text-gray-300 text-sm mb-1">{settings?.footerAddress || '123 High Street, London'}</p>
              <p className="text-gray-300 text-sm">{settings?.footerPhone || '020 7999 9999'}</p>
              <p className="text-gray-300 text-sm mt-1">{settings?.footerEmail || ''}</p>
            </div>
            <div>
              <h4 className="text-karuwa-gold font-bold uppercase tracking-widest text-xs mb-6">Hours</h4>
              <p className="text-gray-300 text-sm">{settings?.openingHours || 'Mon-Sun: 17:00 - 23:00'}</p>
            </div>
            <div>
              <h4 className="text-karuwa-gold font-bold uppercase tracking-widest text-xs mb-6">Legal</h4>
              <button onClick={() => setView('admin-login')} className="text-gray-400 hover:text-white text-sm transition-colors">Staff</button>
            </div>
          </div>
          <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
            <span className="w-12 h-px bg-gray-500"></span>
            <span className="font-serif text-gray-400 text-lg">{settings?.headerTitle || 'Karuwa'}</span>
            <span className="w-12 h-px bg-gray-500"></span>
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-widest">&copy; {new Date().getFullYear()} {settings?.copyrightText || 'Karuwa Takeaway. All Rights Reserved.'}</p>
        </footer>
      )}

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onPlaceOrder={placeOrder}
      />
    </div>
  );
};

export default App;