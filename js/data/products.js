/**
 * products.js — Single source of truth for the product catalog.
 *
 * Every page and module imports this array instead of hard-coding its own
 * copy. Editing a product here updates it everywhere.
 */

export const products = [
  {
    id: 1,
    name: "Sate Taipan Original",
    price: 15000,
    category: "Food",
    popular: true,
    image: "images/sate-taichan-ori.jpg",
    description:
      "Simple grilled chicken skewers without peanut sauce. Savory with a spicy kick—clean, bold flavors that hit just right. Perfect for spicy food lovers who like it fuss-free.",
  },
  {
    id: 2,
    name: "Sate Taipan Mozarella",
    price: 17000,
    category: "Food",
    popular: true,
    image: "images/sate-taichan-moza.jpg",
    description:
      "Spicy taichan topped with gooey mozzarella cheese. A creamy, fiery combo that melts beautifully—looks good, tastes even better.",
  },
  {
    id: 3,
    name: "Sate Taipan Telur",
    price: 17000,
    category: "Food",
    image: "images/sate-taichan-telur.jpg",
    description:
      "Delicious chicken satay topped with a perfectly cooked sunny side up egg. A protein-rich option for satay lovers.",
  },
  {
    id: 4,
    name: "Teh Jasmine",
    price: 10000,
    category: "Drink",
    popular: true,
    image: "images/Teh-Jasmine.jpeg",
    description:
      "Light and floral with a soft jasmine aroma. A calming cup that fits any mood—ideal for slow mornings or cozy study nights.",
  },
  {
    id: 5,
    name: "Teh Chamomile",
    price: 10000,
    category: "Drink",
    image: "images/Teh-Chamomile.jpg",
    description:
      "Delicate, caffeine-free floral tea. Helps soothe the mind and support better sleep—gentle, warm, and a little hug in a cup.",
  },
  {
    id: 6,
    name: "Teh Lavender",
    price: 10000,
    category: "Drink",
    image: "images/Teh-Lavender.jpg",
    description:
      "Soft lavender aroma in every sip. Calms the mind and body—perfect for night routines, journaling moments, or winding down after a long day.",
  },
  {
    id: 7,
    name: "Teh Bunga Telang",
    price: 10000,
    category: "Drink",
    image: "images/Teh-Bunga-Telang.jpeg",
    description:
      "Naturally vibrant blue tea with earthy tones and antioxidant benefits. Refreshing and aesthetic—your new go-to herbal drink for wellness and soft vibes.",
  },
];

// Keep a global reference for the few legacy call sites that still read
// `window.products` (stock display bootstrapping).
if (typeof window !== "undefined") {
  window.products = products;
}
