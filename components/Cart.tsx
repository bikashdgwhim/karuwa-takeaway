import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onPlaceOrder: (customerDetails: { name: string; phone: string; email: string; address: string }) => void;
}

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateQuantity,
  onPlaceOrder
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [details, setDetails] = useState({
    name: '',
    phone: '',
    email: '',
    houseNumber: '',
    street: '',
    postcode: '',
    promoCode: ''
  });
  const [orderType, setOrderType] = useState<'delivery' | 'collection'>('delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoId, setPromoId] = useState<number | null>(null);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = total - promoDiscount;

  const validatePromoCode = async () => {
    if (!details.promoCode.trim()) return;

    setPromoError('');
    try {
      const response = await fetch('http://localhost:3001/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: details.promoCode, orderTotal: total })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setPromoDiscount(data.discount);
        setPromoId(data.promoId);
        setPromoApplied(true);
      } else {
        setPromoError(data.message || 'Invalid promo code');
        setPromoDiscount(0);
        setPromoId(null);
        setPromoApplied(false);
      }
    } catch (error) {
      setPromoError('Failed to validate promo code');
      setPromoDiscount(0);
      setPromoId(null);
      setPromoApplied(false);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(async () => {
      // Combine address fields for delivery
      const addressDetails = orderType === 'delivery'
        ? { ...details, address: `${details.houseNumber}, ${details.street}, ${details.postcode}` }
        : details;

      // Increment promo code usage if applied
      if (promoId) {
        console.log('Incrementing promo usage for ID:', promoId);
        try {
          const response = await fetch('http://localhost:3001/api/use-promo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promoId })
          });
          const result = await response.json();
          console.log('Promo usage updated:', result);
        } catch (error) {
          console.error('Failed to update promo usage:', error);
        }
      } else {
        console.log('No promo code applied, skipping usage increment');
      }

      onPlaceOrder(addressDetails);
      setIsSubmitting(false);
      setStep('cart');
      setDetails({ name: '', phone: '', houseNumber: '', street: '', postcode: '', promoCode: '' });
      setOrderType('delivery');
      setPromoDiscount(0);
      setPromoError('');
      setPromoApplied(false);
      setPromoId(null);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-karuwa-brandGreen text-white">
          <h2 className="text-xl font-serif">
            {step === 'cart' ? 'Your Basket' : 'Checkout'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
              <p>Your basket is empty.</p>
              <button onClick={onClose} className="text-karuwa-brandGreen hover:underline font-bold">Start Ordering</button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-karuwa-brandGreen/30 transition-all">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&q=80&w=200'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h4>
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0 transition-colors"
                        title="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-3 line-clamp-1">{item.description}</p>

                    {/* Quantity Controls & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-white rounded-full border border-gray-300 shadow-sm">
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>

                        <span className="text-sm font-bold text-gray-800 min-w-[24px] text-center">{item.quantity}</span>

                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-karuwa-brandGreen hover:bg-green-50 rounded-full transition-all"
                          title="Increase quantity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                      </div>

                      <span className="text-base font-bold text-karuwa-brandGreen">£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
              {/* Order Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Order Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`p-4 rounded-lg border-2 transition-all ${orderType === 'delivery'
                      ? 'border-karuwa-brandGreen bg-karuwa-brandGreen/5 text-karuwa-brandGreen'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path></svg>
                      <span className="font-bold text-sm">Delivery</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('collection')}
                    className={`p-4 rounded-lg border-2 transition-all ${orderType === 'collection'
                      ? 'border-karuwa-brandGreen bg-karuwa-brandGreen/5 text-karuwa-brandGreen'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                      <span className="font-bold text-sm">Collection</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              {orderType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">House Name/Number</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all"
                      value={details.houseNumber}
                      onChange={(e) => setDetails({ ...details, houseNumber: e.target.value })}
                      placeholder="e.g. 123 or Flat 4B"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Street Name</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all"
                      value={details.street}
                      onChange={(e) => setDetails({ ...details, street: e.target.value })}
                      placeholder="e.g. High Street"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Postcode</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all"
                      value={details.postcode}
                      onChange={(e) => setDetails({ ...details, postcode: e.target.value.toUpperCase() })}
                      placeholder="e.g. SW1A 1AA"
                    />
                  </div>
                </>
              )}

              {/* Promo Code */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Promo Code (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 focus:border-karuwa-brandGreen focus:ring-1 focus:ring-karuwa-brandGreen outline-none transition-all uppercase"
                    value={details.promoCode}
                    onChange={(e) => {
                      setDetails({ ...details, promoCode: e.target.value.toUpperCase() });
                      setPromoApplied(false);
                      setPromoDiscount(0);
                      setPromoId(null);
                      setPromoError('');
                    }}
                    placeholder="Enter code"
                    disabled={promoApplied}
                  />
                  <button
                    type="button"
                    onClick={validatePromoCode}
                    disabled={!details.promoCode || promoApplied}
                    className="px-4 py-3 bg-karuwa-brandGreen text-white font-bold rounded hover:bg-karuwa-brandGreen/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {promoApplied ? '✓ Applied' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                {promoApplied && <p className="text-green-600 text-xs mt-1 font-bold">✓ Promo code applied! Saving £{promoDiscount.toFixed(2)}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Summary</h3>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{item.quantity}x {item.name}</span>
                    <span>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-bold">
                      <span>Promo Discount</span>
                      <span>-£{promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-karuwa-brandGreen pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>£{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {step === 'cart' ? (
              <>
                <div className="flex justify-between mb-4 text-xl font-serif text-gray-800">
                  <span>Total</span>
                  <span className="text-karuwa-brandGreen font-bold">£{finalTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-karuwa-brandGreen text-white font-bold py-4 uppercase tracking-wider hover:bg-karuwa-brandOrange transition-colors shadow-lg shadow-green-900/10 rounded-sm"
                >
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="flex-1 bg-white border border-gray-300 text-gray-600 font-bold py-4 uppercase tracking-wider hover:bg-gray-50 transition-colors rounded-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="flex-[2] bg-karuwa-brandOrange text-white font-bold py-4 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-orange-900/10 rounded-sm"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;