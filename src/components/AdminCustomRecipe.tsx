import type { CustomMasalaRecipe } from "@/lib/custom-masala-request";

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
}).format(value / 100);

const rate = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export function AdminCustomRecipe({ recipe }: { recipe: CustomMasalaRecipe }) {
  return <section className="admin-custom-recipe">
    <h3>Requested recipe</h3>
    <div className="admin-recipe-lines">
      {recipe.ingredients.map((ingredient) => <div className="admin-recipe-line" key={ingredient.id}>
        <div>
          <strong>{ingredient.name}</strong>
          <p>{ingredient.grams} g · {rate(ingredient.pricePer100g)} / 100 g</p>
        </div>
        <span>{money(ingredient.pricePaise)}</span>
      </div>)}
    </div>
    <dl className="admin-recipe-summary">
      <div><dt>Total listed quantity</dt><dd>{recipe.totalGrams} g</dd></div>
      <div><dt>Ingredients cost</dt><dd>{money(recipe.ingredientsPaise)}</dd></div>
      <div><dt>Grinding (₹30/kg)</dt><dd>{money(recipe.grindingPaise)}</dd></div>
      <div className="total"><dt>Calculated subtotal</dt><dd>{money(recipe.totalPaise)}</dd></div>
    </dl>
    <div className="admin-recipe-note">
      <strong>Other ingredients</strong>
      <p>{recipe.otherIngredients || "None requested."}</p>
    </div>
    <p className="admin-recipe-pending">Delivery and other ingredient costs are pending. This subtotal is not a payment or final quote.</p>
  </section>;
}
