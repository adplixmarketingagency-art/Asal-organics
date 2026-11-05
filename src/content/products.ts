export const productCategories = [
  { id: "oils", label: "Cold-pressed Oils", tamilLabel: "செக்கு எண்ணெய்", description: "Groundnut, sesame and coconut. Everyday oils for your kitchen." },
  { id: "wood-oils", label: "Wood-pressed Oils", tamilLabel: "மரச்செக்கு எண்ணெய்", description: "Groundnut, sesame and coconut oils, prepared using a wooden press." },
  { id: "ghee", label: "Ghee", tamilLabel: "நெய்", description: "Bilona ghee, with a place of its own in your pantry." },
  { id: "masala", label: "Masala & Spices", tamilLabel: "மசாலா வகைகள்", description: "The familiar flavours at the heart of a home-cooked meal." },
  { id: "milk", label: "Milk Products", tamilLabel: "பால் பொருட்கள்", description: "Butter, palkova and halwa for the table." },
  { id: "paneer", label: "Paneer", tamilLabel: "பனீர்", description: "A familiar favourite for everyday cooking." },
  { id: "rice", label: "Traditional Rice", tamilLabel: "பாரம்பரிய அரிசி வகைகள்", description: "Discover Karuppu Kavuni, Mapillai Samba and Seera Samba." },
  { id: "grain", label: "Ragi & Bajra", tamilLabel: "கேழ்வரகு & கம்பு", description: "Familiar grain flours for your pantry." },
] as const;

export type ProductCategory = typeof productCategories[number]["id"];
export type PackSize = "100 g" | "200 g" | "250 g" | "500 g" | "1 kg" | "200 ml" | "500 ml" | "1 Litre" | "2 Litres" | "5 Litres";
// Owner's November 5 pack-size note.
export const categoryPackSizes: Record<ProductCategory, readonly PackSize[]> = {
  oils: ["500 ml", "1 Litre", "2 Litres", "5 Litres"],
  "wood-oils": ["500 ml", "1 Litre", "2 Litres", "5 Litres"],
  ghee: ["200 ml", "500 ml", "1 Litre"],
  masala: ["100 g", "250 g", "500 g", "1 kg"],
  milk: ["200 g", "500 g", "1 kg"],
  paneer: ["200 g", "500 g", "1 kg"],
  rice: ["500 g", "1 kg"],
  grain: ["500 g", "1 kg"],
};

export type Product = {
  id: string;
  name: string;
  tamilName: string;
  size: "1 Litre" | "1 kg" | null;
  price: number;
  category: ProductCategory;
};

// Transcribed from the owner's two handwritten lists, November 2026.
// Selling prices only: exclude production costs and crossed-out entries.
// The later size list does not tie the old grain prices to a specific pack.
// Keep those grain prices unassigned until the base quantity is confirmed.
// On November 5, the owner also requested all three oils as wood-pressed
// products. Keep distinct IDs and use the same listed prices and pack sizes.
export const products: Product[] = [
  { id: "groundnut", name: "Groundnut Oil", tamilName: "கடலை எண்ணெய்", size: "1 Litre", price: 420, category: "oils" },
  { id: "sesame", name: "Sesame Oil", tamilName: "நல்லெண்ணெய்", size: "1 Litre", price: 560, category: "oils" },
  { id: "coconut", name: "Coconut Oil", tamilName: "தேங்காய் எண்ணெய்", size: "1 Litre", price: 420, category: "oils" },
  { id: "wood-groundnut", name: "Wood-pressed Groundnut Oil", tamilName: "மரச்செக்கு கடலை எண்ணெய்", size: "1 Litre", price: 420, category: "wood-oils" },
  { id: "wood-sesame", name: "Wood-pressed Sesame Oil", tamilName: "மரச்செக்கு நல்லெண்ணெய்", size: "1 Litre", price: 560, category: "wood-oils" },
  { id: "wood-coconut", name: "Wood-pressed Coconut Oil", tamilName: "மரச்செக்கு தேங்காய் எண்ணெய்", size: "1 Litre", price: 420, category: "wood-oils" },
  { id: "turmeric", name: "Turmeric", tamilName: "மஞ்சள் தூள்", size: "1 kg", price: 560, category: "masala" },
  { id: "curry-masala", name: "South Indian All Purpose Curry Masala", tamilName: "தென்னிந்திய பல்வகை குழம்பு மசாலா", size: "1 kg", price: 478, category: "masala" },
  { id: "chilli-powder", name: "Chilli Powder", tamilName: "மிளகாய்த் தூள்", size: "1 kg", price: 560, category: "masala" },
  { id: "coriander-powder", name: "Coriander Powder", tamilName: "மல்லித் தூள்", size: "1 kg", price: 410, category: "masala" },
  { id: "ragi", name: "Ragi", tamilName: "கேழ்வரகு மாவு", size: null, price: 95, category: "grain" },
  { id: "bajra", name: "Bajra", tamilName: "கம்பு மாவு", size: null, price: 73, category: "grain" },
  { id: "bilona-ghee", name: "Bilona Ghee", tamilName: "பிலோனா நெய்", size: "1 Litre", price: 1930, category: "ghee" },
  { id: "bilona-butter", name: "Bilona Butter", tamilName: "பிலோனா வெண்ணெய்", size: "1 kg", price: 1820, category: "milk" },
  { id: "palkova", name: "Palkova", tamilName: "பால்கோவா", size: "1 kg", price: 650, category: "milk" },
  { id: "karuppu-kavuni-halwa", name: "Karuppu Kavuni Halwa", tamilName: "கருப்பு கவுனி அல்வா", size: "1 kg", price: 520, category: "milk" },
  { id: "paneer", name: "Paneer", tamilName: "பனீர்", size: "1 kg", price: 910, category: "paneer" },
  { id: "karuppu-kavuni", name: "Karuppu Kavuni", tamilName: "கருப்பு கவுனி அரிசி", size: "1 kg", price: 195, category: "rice" },
  { id: "mapillai-samba", name: "Mapillai Samba", tamilName: "மாப்பிள்ளை சம்பா அரிசி", size: "1 kg", price: 130, category: "rice" },
  { id: "seera-samba", name: "Seera Samba (Vasanai)", tamilName: "சீரகச் சம்பா அரிசி (வாசனை)", size: "1 kg", price: 156, category: "rice" },
];

export const categoryLabel = (category: ProductCategory) =>
  productCategories.find((item) => item.id === category)!.label;
export const categoryTamilLabel = (category: ProductCategory) =>
  productCategories.find((item) => item.id === category)!.tamilLabel;
export const productPackSizes = (product: Product) => categoryPackSizes[product.category];
export const quantityLabel = (product: Product) => product.size ?? "Pack price to be confirmed";
export const canAddToBag = (product: Product) => product.size !== null;

const packMeasurements: Record<PackSize, { unit: "g" | "ml"; amount: number; key: string }> = {
  "100 g": { unit: "g", amount: 100, key: "100g" },
  "200 g": { unit: "g", amount: 200, key: "200g" },
  "250 g": { unit: "g", amount: 250, key: "250g" },
  "500 g": { unit: "g", amount: 500, key: "500g" },
  "1 kg": { unit: "g", amount: 1000, key: "1kg" },
  "200 ml": { unit: "ml", amount: 200, key: "200ml" },
  "500 ml": { unit: "ml", amount: 500, key: "500ml" },
  "1 Litre": { unit: "ml", amount: 1000, key: "1l" },
  "2 Litres": { unit: "ml", amount: 2000, key: "2l" },
  "5 Litres": { unit: "ml", amount: 5000, key: "5l" },
};
export type ProductVariant = { id: string; productId: string; size: PackSize; price: number };

// Owner approved proportional pack prices, rounded UP to a whole rupee.
// Derive from the original base price once, not from another rounded pack.
export function productVariantsFor(product: Product): ProductVariant[] {
  if (!product.size || !Number.isSafeInteger(product.price) || product.price <= 0) return [];
  const base = packMeasurements[product.size];
  return productPackSizes(product).flatMap((size) => {
    const pack = packMeasurements[size];
    if (pack.unit !== base.unit) return [];
    return [{
      id: `${product.id}:${pack.key}`, productId: product.id, size,
      price: Math.ceil(product.price * pack.amount / base.amount),
    }];
  });
}

export const productVariants = products.flatMap(productVariantsFor);

/** Legacy bags without a variant keep their originally listed base pack. */
export function getProductVariant(productId: string, variantId?: unknown) {
  if (variantId === undefined) {
    const product = products.find((item) => item.id === productId);
    return productVariants.find((variant) => variant.productId === productId && variant.size === product?.size);
  }
  return productVariants.find((variant) => variant.productId === productId && variant.id === variantId);
}

export const catalogueMaxPrice = Math.max(...products.map((product) => product.price));
export const catalogueMinPrice = Math.min(...products.map((product) => product.price));

export type Category = "all" | ProductCategory | "saved";
export type Sort = "featured" | "price-asc" | "price-desc" | "name";

export function selectProducts(
  items: Product[],
  { category = "all", query = "", maxPrice = Infinity, saved = [], sort = "featured" }: {
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
    `${product.name} ${product.tamilName} ${categoryLabel(product.category)} ${categoryTamilLabel(product.category)}`.toLocaleLowerCase().includes(normalizedQuery),
  );
  if (sort === "price-asc") selected.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") selected.sort((a, b) => b.price - a.price);
  if (sort === "name") selected.sort((a, b) => a.name.localeCompare(b.name));
  return selected;
}

// Group the already-filtered/sorted results; never reintroduce excluded products.
export function groupProducts(items: Product[]) {
  return productCategories
    .map((category) => ({ ...category, products: items.filter((product) => product.category === category.id) }))
    .filter((category) => category.products.length > 0);
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
