import { StoreData } from './types';

export const INITIAL_DATA: StoreData = {
  categories: [
    { id: 'c1', name: 'Starters', order: 1 },
    { id: 'c2', name: 'Nepalese Specialties', order: 2 },
    { id: 'c3', name: 'Tandoori Dishes', order: 3 },
    { id: 'c4', name: 'Curry Classics', order: 4 },
    { id: 'c5', name: 'Sides & Rice', order: 5 },
  ],
  menuItems: [
    {
      id: 'm1',
      categoryId: 'c1',
      name: 'Vegetable Momo',
      description: 'Steamed dumplings filled with seasoned vegetables, served with tomato chutney.',
      price: 6.95,
      isVegetarian: true,
      isPopular: true
    },
    {
      id: 'm2',
      categoryId: 'c1',
      name: 'Chicken Choila',
      description: 'Grilled chicken marinated with ginger, garlic, and traditional Nepalese spices.',
      price: 7.50,
      isSpicy: true
    },
    {
      id: 'm3',
      categoryId: 'c2',
      name: 'Gurkha Curry',
      description: 'A famous Nepalese dish cooked with yoghurt, fresh coriander and green chillies.',
      price: 12.95,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 'm4',
      categoryId: 'c2',
      name: 'Himalayan Goat Curry',
      description: 'Slow cooked goat meat on the bone with rich Nepalese herbs.',
      price: 14.50,
      isSpicy: true
    },
    {
      id: 'm5',
      categoryId: 'c3',
      name: 'Chicken Tikka',
      description: 'Boneless chicken breast marinated in yoghurt and spices, cooked in clay oven.',
      price: 10.95
    },
    {
      id: 'm6',
      categoryId: 'c4',
      name: 'Butter Chicken',
      description: 'Mild and creamy curry cooked with butter, almonds and coconut.',
      price: 11.95
    },
    {
      id: 'm7',
      categoryId: 'c4',
      name: 'Lamb Rogan Josh',
      description: 'Tender lamb cooked with kashmiri spices in a rich tomato sauce.',
      price: 12.50,
      isSpicy: true
    },
    {
      id: 'm8',
      categoryId: 'c5',
      name: 'Garlic Naan',
      description: 'Freshly baked bread topped with garlic and coriander.',
      price: 3.50,
      isVegetarian: true
    },
    {
      id: 'm9',
      categoryId: 'c5',
      name: 'Pilau Rice',
      description: 'Basmati rice cooked with saffron and whole spices.',
      price: 3.25,
      isVegetarian: true
    }
  ],
  orders: []
};