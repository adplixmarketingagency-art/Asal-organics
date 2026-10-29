export type Product = {
  id: string;
  name: string;
  subtitle: string;
  size: string;
  price: number;
  originalPrice: number;
  image: string;
  category: "cooking" | "care";
  note: string;
  description: string;
  source: string;
};

// Public reference catalogue, not Asal inventory. Prices checked 28 October 2026.
// Merchant-owned catalogue and photography are required before launch.
export const products: Product[] = [
  {
    id: "sesame",
    name: "Sesame Oil",
    subtitle: "A little tradition in every meal.",
    size: "1 Litre",
    price: 599,
    originalPrice: 679,
    image: "/images/products/sesame.jpg",
    category: "cooking",
    note: "Rich & nutty",
    description: "Bring a deep, nutty character to your kitchen. Sesame oil is a familiar favourite for South Indian cooking, flavourful tempering, and traditional pickles. Contains sesame.",
    source: "https://aishwaryamoils.com/products/sesame-oil-1-litre",
  },
  {
    id: "groundnut",
    name: "Groundnut Oil",
    subtitle: "Your everyday kitchen companion.",
    size: "1 Litre",
    price: 479,
    originalPrice: 599,
    image: "/images/products/groundnut.jpg",
    category: "cooking",
    note: "Everyday favourite",
    description: "A gently nutty oil that feels right at home in everyday cooking. Use it for sautéing, stir-frying, and making familiar family recipes your own. Contains peanuts.",
    source: "https://aishwaryamoils.com/products/groundnut-oil-1-litre",
  },
  {
    id: "coconut",
    name: "Coconut Oil",
    subtitle: "A taste of the tropics. Naturally.",
    size: "1 Litre",
    price: 559,
    originalPrice: 649,
    image: "/images/products/coconut.jpg",
    category: "cooking",
    note: "Naturally aromatic",
    description: "Enjoy the distinctive aroma of coconut in coastal curries, sautéed vegetables, and homemade favourites. Coconut oil can naturally turn solid in cooler temperatures.",
    source: "https://aishwaryamoils.com/products/coconut-oil-1-litre",
  },
  {
    id: "sunflower",
    name: "Sunflower Oil",
    subtitle: "Light on the palate. Big on possibility.",
    size: "1 Litre",
    price: 629,
    originalPrice: 699,
    image: "/images/products/sunflower.jpg",
    category: "cooking",
    note: "Light & versatile",
    description: "An easy-going addition to an everyday kitchen. Its mild flavour lets your ingredients take the lead, from sautéed vegetables to your favourite homemade dishes.",
    source: "https://aishwaryamoils.com/products/sunflower-oil-1-litre",
  },
  {
    id: "castor",
    name: "Castor Oil",
    subtitle: "A classic for your care ritual.",
    size: "250 ml",
    price: 179,
    originalPrice: 249,
    image: "/images/products/castor.jpg",
    category: "care",
    note: "For your care ritual",
    description: "A rich oil traditionally used in hair and body care. Not a cooking oil. Follow the supplier’s usage directions and patch-test before topical use. Do not ingest without medical guidance.",
    source: "https://aishwaryamoils.com/products/castor-oil-250ml",
  },
  {
    id: "almond",
    name: "Almond Oil",
    subtitle: "A gentle addition to slow mornings.",
    size: "100 ml",
    price: 499,
    originalPrice: 599,
    image: "/images/products/almond.jpg",
    category: "care",
    note: "A little everyday care",
    description: "Explore almond oil for your hair and body care routine. Contains almonds; avoid with a nut allergy and patch-test before topical use. Follow the supplier’s directions.",
    source: "https://aishwaryamoils.com/products/almond-oil-100ml",
  },
];

export type Category = "all" | "cooking" | "care" | "saved";
export type Sort = "featured" | "price-asc" | "price-desc" | "name";

export function selectProducts(
  items: Product[],
  { category = "all", query = "", maxPrice = 700, saved = [], sort = "featured" }: {
    category?: Category;
    query?: string;
    maxPrice?: number;
    saved?: string[];
    sort?: Sort;
  },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const selected = items.filter((product) =>
    (category === "all" || (category === "saved" ? saved.includes(product.id) : product.category === category)) &&
    product.price <= maxPrice &&
    `${product.name} ${product.subtitle} ${product.note}`.toLocaleLowerCase().includes(normalizedQuery),
  );
  if (sort === "price-asc") selected.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") selected.sort((a, b) => b.price - a.price);
  if (sort === "name") selected.sort((a, b) => a.name.localeCompare(b.name));
  return selected;
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
