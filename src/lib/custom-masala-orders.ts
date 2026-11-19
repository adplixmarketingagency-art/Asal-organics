import "server-only";
import { createHash } from "node:crypto";
import { cloudflareDatabase, usesD1 } from "./cloudflare-db.ts";
import { withDatabase } from "./orders.ts";
import { AdminError } from "./admin-auth.ts";
import type { CustomMasalaRecipe, CustomMasalaRequest, SavedCustomMasalaRequest } from "./custom-masala-request.ts";
import type { CheckoutDetails } from "./checkout.ts";

/** Durable limits, separate from owner login; no raw IPs retained. */
export async function allowCustomMasalaRequest(ip: string, now = Math.floor(Date.now() / 1000)) {
  const bucket = Math.floor(now / 900);
  const expires = (bucket + 1) * 900;
  const keys = [`custom:ip:${createHash("sha256").update(ip).digest("hex")}:${bucket}`, `custom:global:${bucket}`];
  if (usesD1()) {
    const db = cloudflareDatabase();
    const results = await db.batch([
      db.prepare("DELETE FROM asal_custom_request_limits WHERE expires_at<=?").bind(now),
      db.prepare(`INSERT INTO asal_custom_request_limits(key,attempts,expires_at) VALUES(?,1,?)
        ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts`).bind(keys[0], expires),
    ]);
    if (Number(results[1].results[0].attempts) > 5) return false;
    const global = await db.prepare(`INSERT INTO asal_custom_request_limits(key,attempts,expires_at) VALUES(?,1,?)
      ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts`).bind(keys[1], expires).first<{ attempts: number }>();
    return Number(global?.attempts) <= 100;
  }
  return withDatabase(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("DELETE FROM asal_custom_request_limits WHERE expires_at<=$1", [now]);
      const count = async (key: string) => Number((await client.query(`INSERT INTO asal_custom_request_limits(key,attempts,expires_at)
        VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET attempts=asal_custom_request_limits.attempts+1 RETURNING attempts`, [key, expires])).rows[0].attempts);
      const ipCount = await count(keys[0]);
      const globalCount = ipCount <= 5 ? await count(keys[1]) : 101;
      await client.query("COMMIT");
      return ipCount <= 5 && globalCount <= 100;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}

export async function saveCustomMasalaRequest(prepared: CustomMasalaRequest): Promise<SavedCustomMasalaRequest> {
  const { requestId: id, recipe, customer } = prepared;
  const receipt = `custom_${id.replaceAll("-", "")}`;
  const items = [{ productId: "custom-masala", name: "Customised Masala", size: `${recipe.totalGrams} g`, quantity: 1, unitPricePaise: recipe.totalPaise }];
  const snapshot = JSON.stringify(recipe);
  let stored: { id: string; receipt: string; customRecipe: string | CustomMasalaRecipe; customer: string | CheckoutDetails; orderKind: string } | null;
  if (usesD1()) {
    const db = cloudflareDatabase();
    await db.prepare(`INSERT INTO asal_orders(id,receipt,status,amount_paise,currency,customer,items,order_kind,custom_recipe)
      VALUES(?,?,'pending',?,'INR',?,?,'custom',?) ON CONFLICT(id) DO NOTHING`)
      .bind(id, receipt, recipe.totalPaise, JSON.stringify(customer), JSON.stringify(items), snapshot).run();
    stored = await db.prepare("SELECT id,receipt,customer,order_kind AS orderKind,custom_recipe AS customRecipe FROM asal_orders WHERE id=?")
      .bind(id).first<typeof stored & {}>();
  } else {
    stored = await withDatabase(async (client) => {
      await client.query(`INSERT INTO asal_orders(id,receipt,status,amount_paise,currency,customer,items,order_kind,custom_recipe)
        VALUES($1,$2,'pending',$3,'INR',$4,$5,'custom',$6) ON CONFLICT(id) DO NOTHING`,
      [id, receipt, recipe.totalPaise, customer, JSON.stringify(items), snapshot]);
      return (await client.query(`SELECT id,receipt,customer,order_kind AS "orderKind",custom_recipe AS "customRecipe" FROM asal_orders WHERE id=$1`, [id])).rows[0] ?? null;
    });
  }
  const storedRecipe: CustomMasalaRecipe | undefined = typeof stored?.customRecipe === "string"
    ? JSON.parse(stored.customRecipe) as CustomMasalaRecipe : stored?.customRecipe;
  const storedCustomer: CheckoutDetails | undefined = typeof stored?.customer === "string"
    ? JSON.parse(stored.customer) as CheckoutDetails : stored?.customer;
  // Compare canonical values rather than JSON key order (JSONB may reorder keys).
  if (!stored || stored.orderKind !== "custom" || !storedRecipe || !storedCustomer ||
    Object.keys(customer).some((key) => storedCustomer[key as keyof CheckoutDetails] !== customer[key as keyof CheckoutDetails]) ||
    storedRecipe.otherIngredients !== recipe.otherIngredients ||
    storedRecipe.totalPaise !== recipe.totalPaise || storedRecipe.totalGrams !== recipe.totalGrams ||
    storedRecipe.ingredientsPaise !== recipe.ingredientsPaise || storedRecipe.grindingPaise !== recipe.grindingPaise ||
    JSON.stringify(storedRecipe.ingredients.map((line) => [line.id, line.name, line.grams, line.pricePer100g, line.pricePaise])) !==
      JSON.stringify(recipe.ingredients.map((line) => [line.id, line.name, line.grams, line.pricePer100g, line.pricePaise]))) {
    throw new AdminError("This request reference already belongs to a different recipe. Save a new request.", 409);
  }
  return { id: stored.id, receipt: stored.receipt, recipe, customer };
}
