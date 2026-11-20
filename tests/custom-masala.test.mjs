import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { masalaIngredients, calculateCustomMasala, customMasalaWhatsAppUrl } from "../src/lib/custom-masala.ts";
import { savedCustomMasalaWhatsAppUrl } from "../src/lib/custom-masala.ts";

test("custom masala uses the owner's exact ingredient order and prices per 100 g", () => {
  assert.deepEqual(masalaIngredients.map(({ name, pricePer100g }) => [name, pricePer100g]), [
    ["Coriander seeds", 22], ["Dry chilli — long", 35], ["Dry chilli — round", 50],
    ["Dry chilli — Kashmiri", 55], ["Turmeric", 30], ["Toor dal", 17],
    ["Channa dal", 15], ["Cumin seeds", 70], ["Fennel seeds", 48], ["Fenugreek", 30],
    ["Dry ginger", 80], ["Mustard", 20], ["Curry leaves", 10], ["Asafetida", 120], ["Raw rice", 10],
    ["Pepper", 120],
  ]);
  for (const ingredient of masalaIngredients) {
    const quote = calculateCustomMasala({ [ingredient.id]: "100" });
    assert.equal(quote.ingredientsPaise, ingredient.pricePer100g * 100);
    assert.equal(quote.grindingPaise, 300);
    assert.equal(quote.totalGrams, 100);
  }
});

test("optional fields calculate ingredients and proportional ₹30 per kg grinding without extra tax", () => {
  const quote = calculateCustomMasala({ coriander: "100", "chilli-long": "200", turmeric: "" });
  assert.deepEqual(quote.errors, {});
  assert.equal(quote.totalGrams, 300);
  assert.equal(quote.ingredientsPaise, 9200);
  assert.equal(quote.grindingPaise, 900);
  assert.equal(quote.totalPaise, 10100);
  const pepper = calculateCustomMasala({ pepper: "50" });
  assert.equal(pepper.totalGrams, 50);
  assert.equal(pepper.ingredientsPaise, 6000);
  assert.equal(pepper.grindingPaise, 150);
  assert.equal(pepper.totalPaise, 6150);
  const halfKg = calculateCustomMasala({ coriander: "500" });
  assert.equal(halfKg.grindingPaise, 1500);
  const empty = calculateCustomMasala({});
  assert.equal(empty.totalGrams, 0);
  assert.equal(empty.totalPaise, 0);
  assert.equal(empty.lines.length, 0);
});

test("decimal grams are rounded to paise without NaN, negatives or invalid totals", () => {
  const quote = calculateCustomMasala({ coriander: "12.5" });
  assert.equal(quote.totalGrams, 12.5);
  assert.equal(quote.ingredientsPaise, 275);
  assert.equal(quote.grindingPaise, 38);
  assert.equal(quote.totalPaise, 313);
  for (const value of ["-1", "1e3", "Infinity", "NaN", "1.25", "10001", "abc"]) {
    const invalid = calculateCustomMasala({ coriander: value });
    assert.ok(invalid.errors.coriander);
    assert.equal(invalid.totalPaise, null);
    assert.equal(customMasalaWhatsAppUrl(invalid), null);
  }
});

test("WhatsApp draft targets the approved number and lists entered ingredients in catalogue order", () => {
  const quote = calculateCustomMasala({ "chilli-round": "200", coriander: "100", rice: "0" });
  const url = new URL(customMasalaWhatsAppUrl(quote));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/917305597782");
  const text = url.searchParams.get("text");
  assert.ok(text.indexOf("Coriander seeds") < text.indexOf("Dry chilli — round"));
  assert.match(text, /Coriander seeds: 100 g/);
  assert.match(text, /Dry chilli — round: 200 g/);
  assert.doesNotMatch(text, /Raw rice/);
  assert.match(text, /Total quantity: 300 g/);
  assert.match(text, /Grinding \(₹30\/kg\): ₹9/);
  assert.match(text, /Calculated total: ₹131/);
  assert.match(text, /Other items: I will mention them in this chat/);
  assert.match(text, /delivery.*not included/i);
  assert.ok(customMasalaWhatsAppUrl(calculateCustomMasala({})));
});

test("custom card precedes standard masalas and never becomes a normal checkout product", () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const catalogue = source("src/components/Catalogue.tsx");
  assert.match(catalogue, /group\.id === "masala" && <CustomMasalaCard \/>/);
  assert.ok(catalogue.indexOf("<CustomMasalaCard />") < catalogue.indexOf("group.products.map"));
  const card = source("src/components/CustomMasalaCard.tsx");
  assert.match(card, /Customised Masala/);
  assert.match(card, /className="product-card custom-masala-card"/);
  assert.match(card, /src="\/images\/products\/custom-masala-800\.webp"/);
  assert.match(card, /open && <Modal/);
  assert.match(card, /<CustomMasalaMenu/);
  assert.doesNotMatch(card, /<input/);
  const menu = source("src/components/CustomMasalaMenu.tsx");
  assert.match(source("src/components/CustomMasalaCheckout.tsx"), /Other items \/ WhatsApp/);
  assert.match(menu, /Other ingredients/);
  assert.match(menu, /Continue to checkout/);
  assert.match(menu, /masalaIngredients\.map/);
  assert.match(menu, /\/checkout\?custom=masala/);
  assert.match(card, /customMasalaDraft/);
  assert.doesNotMatch(card + menu, /CustomMasalaContact|customerErrors|onCustomerChange|\/api\/custom-masala/);
  const checkout = source("src/components/CustomMasalaCheckout.tsx");
  assert.match(checkout, /checkoutDetails/);
  assert.match(checkout, /requestIdentity/);
  assert.match(checkout, /savedRequest/);
  assert.match(checkout, /\/api\/custom-masala/);
  assert.doesNotMatch(card + menu, /required[={ ]|window\.open|addItem|localStorage/);
  assert.match(checkout, /rel="noopener noreferrer"/);
  const css = source("src/components/custom-masala.css");
  assert.match(css, /\.custom-masala-card \{[^}]*border-color: #[a-f0-9]+/);
  assert.doesNotMatch(css, /\.custom-masala-card \{[^}]*grid-column/);
});

test("saved WhatsApp draft includes the admin request reference and other ingredients note", () => {
  const quote = calculateCustomMasala({ coriander: "100" });
  const url = new URL(customMasalaWhatsAppUrl(quote, { receipt: "custom_123", otherIngredients: "Pepper 50 g & cloves 10 g" }));
  const draft = url.searchParams.get("text");
  assert.match(draft, /Request: custom_123/);
  assert.match(draft, /Other items: Pepper 50 g & cloves 10 g/);
});

test("saved WhatsApp draft and menu use server snapshot rates, not stale browser calculations", () => {
  const recipe = {
    version: 1, ingredients: [{ id: "coriander", name: "Coriander seeds", grams: 100, pricePer100g: 23, pricePaise: 2300 }],
    totalGrams: 100, ingredientsPaise: 2300, grindingPaise: 300, totalPaise: 2600, otherIngredients: "Pepper",
  };
  const draft = new URL(savedCustomMasalaWhatsAppUrl({ id: "saved", receipt: "custom_saved", recipe })).searchParams.get("text");
  assert.match(draft, /₹23\/100 g/);
  assert.match(draft, /Calculated total: ₹26/);
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(source("src/components/CustomMasalaCheckout.tsx"), /savedCustomMasalaWhatsAppUrl\(currentSaved/);
  assert.doesNotMatch(source("src/components/CustomMasalaCard.tsx"), /result\.recipe\?\.totalPaise !== quote\.totalPaise/);
});

test("custom checkout reuses normal checkout address fields and keeps drafts out of URLs and storage", () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  for (const file of ["src/components/CheckoutPage.tsx", "src/components/CustomMasalaCheckout.tsx"]) {
    assert.match(source(file), /<CheckoutContactFields/);
  }
  const provider = source("src/components/CartProvider.tsx");
  assert.match(provider, /customMasalaDraft/);
  assert.doesNotMatch(provider, /localStorage\.setItem\([^)]*customMasala|sessionStorage/);
  assert.match(source("src/app/checkout/page.tsx"), /customMasala/);
  const checkout = source("src/components/CustomMasalaCheckout.tsx");
  assert.doesNotMatch(checkout, /addItem|removePurchasedItems|Razorpay|localStorage|useState<CheckoutDetails>/);
});

test("reset clears the shared recipe in one update without restoring stale quantities", () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(source("src/components/CustomMasalaCard.tsx"), /onReset=\{\(\) => setCustomMasalaDraft\(\{ quantities: \{\}, otherIngredients: "" \}\)\}/);
  assert.match(source("src/components/CustomMasalaMenu.tsx"), /onClick=\{onReset\}/);
});

test("custom request identity and saved result survive checkout remounts in provider memory", () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const provider = source("src/components/CartProvider.tsx");
  const checkout = source("src/components/CustomMasalaCheckout.tsx");
  assert.match(provider, /customMasalaRequestIdentity = useRef/);
  assert.match(provider, /customMasalaSavedRequest, setCustomMasalaSavedRequest/);
  assert.match(checkout, /customMasalaRequestIdentity: requestIdentity/);
  assert.match(checkout, /customMasalaSavedRequest: savedRequest/);
  assert.doesNotMatch(checkout, /requestIdentity = useRef|savedRequest, setSavedRequest\] = useState/);
  assert.match(checkout, /quote\.lines\.map/);
});
