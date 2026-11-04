export const productCategories = [
  { id: "oils", label: "Cold-pressed Oils" },
  { id: "masala", label: "Flour (Masala)" },
  { id: "grain", label: "Flour (Grain)" },
  { id: "milk", label: "Milk Products" },
  { id: "rice", label: "Rice Varieties (Traditional)" },
] as const;

export type ProductCategory = typeof productCategories[number]["id"];
export type Product = {
  id: string;
  name: string;
  tamilName?: string;
  size: "1 Litre" | "1 kg" | null;
  price: number;
  category: ProductCategory;
};

// Transcribed from the owner's two handwritten lists, November 2026.
// Selling prices only: exclude production costs and crossed-out entries.
// Grain quantities were not supplied; do not assume a pack size.
export const products: Product[] = [
  { id: "groundnut", name: "Groundnut Oil", size: "1 Litre", price: 420, category: "oils" },
  { id: "sesame", name: "Sesame Oil", size: "1 Litre", price: 560, category: "oils" },
  { id: "coconut", name: "Coconut Oil", size: "1 Litre", price: 420, category: "oils" },
  { id: "turmeric", name: "Turmeric", size: "1 kg", price: 560, category: "masala" },
  { id: "curry-masala", name: "South Indian All Purpose Curry Masala", size: "1 kg", price: 478, category: "masala" },
  { id: "chilli-powder", name: "Chilli Powder", size: "1 kg", price: 560, category: "masala" },
  { id: "coriander-powder", name: "Coriander Powder", size: "1 kg", price: 410, category: "masala" },
  { id: "ragi", name: "Ragi", size: null, price: 95, category: "grain" },
  { id: "bajra", name: "Bajra", size: null, price: 73, category: "grain" },
  { id: "bilona-ghee", name: "Bilona Ghee", size: "1 Litre", price: 1930, category: "milk" },
  { id: "bilona-butter", name: "Bilona Butter", size: "1 kg", price: 1820, category: "milk" },
  { id: "palkova", name: "Palkova", tamilName: "பால்கோவா", size: "1 kg", price: 650, category: "milk" },
  { id: "karuppu-kavuni-halwa", name: "Karuppu Kavuni Halwa", tamilName: "கருப்பு கவுனி அல்வா", size: "1 kg", price: 520, category: "milk" },
  { id: "paneer", name: "Paneer", size: "1 kg", price: 910, category: "milk" },
  { id: "karuppu-kavuni", name: "Karuppu Kavuni", size: "1 kg", price: 195, category: "rice" },
  { id: "mapillai-samba", name: "Mapillai Samba", size: "1 kg", price: 130, category: "rice" },
  { id: "seera-samba", name: "Seera Samba (Vasanai)", size: "1 kg", price: 156, category: "rice" },
];

export const categoryLabel = (category: ProductCategory) =>
  productCategories.find((item) => item.id === category)!.label;
export const quantityLabel = (product: Product) => product.size ?? "Quantity not specified";
export const canAddToBag = (product: Product) => product.size !== null;
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
    `${product.name} ${product.tamilName ?? ""} ${categoryLabel(product.category)}`.toLocaleLowerCase().includes(normalizedQuery),
  );
  if (sort === "price-asc") selected.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") selected.sort((a, b) => b.price - a.price);
  if (sort === "name") selected.sort((a, b) => a.name.localeCompare(b.name));
  return selected;
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
