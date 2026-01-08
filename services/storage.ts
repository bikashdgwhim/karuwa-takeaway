import { StoreData, Order, Category, MenuItem, SiteSettings } from '../types';
import { INITIAL_DATA } from '../constants';

const API_URL = 'http://localhost:3001/api';

// Fallback to initial data if API fails (optional, or we can just throw)
// For now, we will try to fetch and return.

export const fetchMenu = async () => {
  try {
    const res = await fetch(`${API_URL}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    const data = await res.json();
    return { categories: data.categories || [], menuItems: data.menuItems || [] };
  } catch (error) {
    console.error("Error fetching menu:", error);
    return { categories: INITIAL_DATA.categories, menuItems: INITIAL_DATA.menuItems };
  }
};

export const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_URL}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const createOrder = async (order: Order) => {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return await res.json();
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const updateOrder = async (updatedOrder: Order) => {
  try {
    // We only need to update the status usually, but we send the whole object or just status
    const res = await fetch(`${API_URL}/orders/${updatedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: updatedOrder.status })
    });
    if (!res.ok) throw new Error('Failed to update order');
    return await res.json();
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const updateMenu = async (categories: Category[], menuItems: MenuItem[]) => {
  try {
    const res = await fetch(`${API_URL}/menu`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories, menuItems })
    });
    if (!res.ok) throw new Error('Failed to update menu');
    return await res.json();
  } catch (error) {
    console.error("Error updating menu:", error);
    throw error;
  }
};

export const fetchSettings = async () => {
  try {
    const res = await fetch(`${API_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
};

export const updateSettings = async (settings: SiteSettings) => {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};