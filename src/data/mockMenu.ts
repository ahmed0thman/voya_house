export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
};

export type MenuCategory = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type BrandMenu = {
  brandId: 'coffee' | 'papa' | 'mama';
  title: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
  categories: MenuCategory[];
};

const generateImages = (id: string) => [
  `https://picsum.photos/seed/${id}-1/400/400`,
  `https://picsum.photos/seed/${id}-2/400/400`,
  `https://picsum.photos/seed/${id}-3/400/400`,
  `https://picsum.photos/seed/${id}-4/400/400`
];

export const menuData: Record<'coffee' | 'papa' | 'mama', BrandMenu> = {
  coffee: {
    brandId: 'coffee',
    title: 'Voya Coffee',
    colors: {
      bg: 'bg-[#F1E6C3]',
      text: 'text-[#3E3424]',
      accent: 'bg-[#D8C7A0]',
    },
    categories: [
      {
        id: 'signature-roasts',
        title: 'Signature Roasts',
        items: [
          { id: 'c1', name: 'Voya Espresso', description: 'A perfectly balanced double shot of our house blend.', price: 18, images: generateImages('c1') },
          { id: 'c2', name: 'Cortado', description: 'Smooth espresso cut with a small amount of warm milk.', price: 22, images: generateImages('c2') },
          { id: 'c3', name: 'Flat White', description: 'Equal parts espresso and steamed milk for a rich texture.', price: 24, images: generateImages('c3') },
          { id: 'c4', name: 'Pour Over', description: 'Slow-dripped single origin coffee, brewed to perfection.', price: 28, images: generateImages('c4') },
        ]
      },
      {
        id: 'cold-brews',
        title: 'Cold Brews',
        items: [
          { id: 'c5', name: 'Classic Cold Brew', description: 'Steeped for 24 hours for a smooth, bold finish.', price: 26, images: generateImages('c5') },
          { id: 'c6', name: 'Nitro Vanilla', description: 'Nitrogen-infused cold brew with a touch of Madagascar vanilla.', price: 32, images: generateImages('c6') },
          { id: 'c7', name: 'Iced Latte', description: 'Chilled espresso and milk over craft ice.', price: 28, images: generateImages('c7') },
        ]
      },
      {
        id: 'artisan-pastries',
        title: 'Artisan Pastries',
        items: [
          { id: 'c8', name: 'Butter Croissant', description: 'Flaky, buttery, and baked fresh every morning.', price: 16, images: generateImages('c8') },
          { id: 'c9', name: 'Almond Danish', description: 'Twice-baked croissant filled with almond frangipane.', price: 22, images: generateImages('c9') },
          { id: 'c10', name: 'Pain au Chocolat', description: 'Crispy pastry with rich dark chocolate centers.', price: 20, images: generateImages('c10') },
        ]
      }
    ]
  },
  papa: {
    brandId: 'papa',
    title: 'Papa Voya',
    colors: {
      bg: 'bg-[#B7D39A]',
      text: 'text-[#2D421A]',
      accent: 'bg-[#98B878]',
    },
    categories: [
      {
        id: 'wellness-bowls',
        title: 'Wellness Bowls',
        items: [
          { id: 'p1', name: 'Green Goddess Bowl', description: 'Kale, quinoa, avocado, edamame, and green tahini dressing.', price: 45, images: generateImages('p1') },
          { id: 'p2', name: 'Protein Power', description: 'Grilled chicken, sweet potato, black beans, and roasted almonds.', price: 55, images: generateImages('p2') },
          { id: 'p3', name: 'Acai Glow', description: 'Organic acai, house-made granola, fresh berries, and chia.', price: 42, images: generateImages('p3') },
        ]
      },
      {
        id: 'healthy-wraps',
        title: 'Healthy Wraps',
        items: [
          { id: 'p4', name: 'Mediterranean Wrap', description: 'Hummus, falafel, cucumber, tomatoes, and mixed greens.', price: 38, images: generateImages('p4') },
          { id: 'p5', name: 'Spicy Chicken Wrap', description: 'Lean chicken breast, spicy yogurt sauce, and crisp lettuce.', price: 42, images: generateImages('p5') },
        ]
      },
      {
        id: 'fresh-juices',
        title: 'Fresh Juices',
        items: [
          { id: 'p6', name: 'Detox Green', description: 'Spinach, celery, apple, lemon, and ginger.', price: 28, images: generateImages('p6') },
          { id: 'p7', name: 'Citrus Immunity', description: 'Orange, grapefruit, turmeric, and a dash of cayenne.', price: 30, images: generateImages('p7') },
        ]
      }
    ]
  },
  mama: {
    brandId: 'mama',
    title: 'Mama Voya',
    colors: {
      bg: 'bg-[#D8A98F]',
      text: 'text-[#4A2E1B]',
      accent: 'bg-[#C18C70]',
    },
    categories: [
      {
        id: 'woodfired-pizzas',
        title: 'Woodfired Pizzas',
        items: [
          { id: 'm1', name: 'Margherita Rustica', description: 'San Marzano tomatoes, fresh mozzarella, and basil.', price: 65, images: generateImages('m1') },
          { id: 'm2', name: 'Truffle Mushroom', description: 'Wild mushrooms, truffle oil, ricotta, and thyme.', price: 85, images: generateImages('m2') },
          { id: 'm3', name: 'Spicy Diavola', description: 'Spicy salami, chili flakes, mozzarella, and honey drizzle.', price: 75, images: generateImages('m3') },
        ]
      },
      {
        id: 'handmade-pastas',
        title: 'Handmade Pastas',
        items: [
          { id: 'm4', name: 'Truffle Pappardelle', description: 'Fresh pappardelle in a creamy black truffle sauce.', price: 82, images: generateImages('m4') },
          { id: 'm5', name: 'Classic Rigatoni Ragu', description: 'Slow-cooked beef ragu with parmigiano reggiano.', price: 78, images: generateImages('m5') },
          { id: 'm6', name: 'Linguine Vongole', description: 'Clams, white wine, garlic, and fresh parsley.', price: 90, images: generateImages('m6') },
        ]
      },
      {
        id: 'comfort-desserts',
        title: 'Comfort Desserts',
        items: [
          { id: 'm7', name: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers.', price: 45, images: generateImages('m7') },
          { id: 'm8', name: 'Panna Cotta', description: 'Vanilla bean panna cotta with a mixed berry compote.', price: 38, images: generateImages('m8') },
        ]
      }
    ]
  }
};
