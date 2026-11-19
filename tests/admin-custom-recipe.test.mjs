import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import React from "react";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function renderElement(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return escapeHtml(node);
  if (Array.isArray(node)) return node.map(renderElement).join("");
  if (typeof node.type === "function") return renderElement(node.type(node.props));
  assert.equal(typeof node.type, "string");
  const attributes = Object.entries(node.props)
    .filter(([name, value]) => name !== "children" && name !== "key" && value !== false && value !== null && value !== undefined)
    .map(([name, value]) => `${name === "className" ? "class" : name}="${escapeHtml(value)}"`)
    .join(" ");
  return `<${node.type}${attributes ? ` ${attributes}` : ""}>${renderElement(node.props.children)}</${node.type}>`;
}

function loadTsxComponent(path, exportName) {
  let input;
  try {
    input = source(path);
  } catch {
    assert.fail(`${path} is missing`);
  }
  const { outputText, diagnostics } = ts.transpileModule(input, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
    fileName: path,
  });
  assert.deepEqual(diagnostics, []);
  const module = { exports: {} };
  Function("module", "exports", "require", outputText)(module, module.exports, require);
  assert.equal(typeof module.exports[exportName], "function");
  return module.exports[exportName];
}

const recipe = {
  version: 1,
  ingredients: [
    { id: "coriander", name: "Coriander Seeds", grams: 250, pricePer100g: 20, pricePaise: 5000 },
    { id: "pepper", name: "Black Pepper", grams: 100, pricePer100g: 110, pricePaise: 11000 },
  ],
  totalGrams: 350,
  ingredientsPaise: 16000,
  grindingPaise: 1050,
  totalPaise: 17050,
  otherIngredients: "Roast lightly; add a small piece of cinnamon.",
};

test("custom recipe renders every selected ingredient and the unquoted-cost boundary", () => {
  const AdminCustomRecipe = loadTsxComponent("src/components/AdminCustomRecipe.tsx", "AdminCustomRecipe");
  const html = renderElement(React.createElement(AdminCustomRecipe, { recipe }));

  assert.match(html, /Coriander Seeds/);
  assert.match(html, /250 g/);
  assert.match(html, /₹20\.00 \/ 100 g/);
  assert.match(html, /₹50\.00/);
  assert.match(html, /Black Pepper/);
  assert.match(html, /100 g/);
  assert.match(html, /₹110\.00 \/ 100 g/);
  assert.match(html, /₹110\.00/);
  assert.ok(html.indexOf("Coriander Seeds") < html.indexOf("Black Pepper"), "ingredient order must be preserved");
  assert.match(html, /Total listed quantity/);
  assert.match(html, /350 g/);
  assert.match(html, /Ingredients cost/);
  assert.match(html, /₹160\.00/);
  assert.match(html, /Grinding \(₹30\/kg\)/);
  assert.match(html, /₹10\.50/);
  assert.match(html, /Calculated subtotal/);
  assert.match(html, /₹170\.50/);
  assert.match(html, /Other ingredients/);
  assert.match(html, /Roast lightly; add a small piece of cinnamon\./);
  assert.match(html, /Delivery and other ingredient costs are pending/);
  assert.doesNotMatch(html, /paid|payment captured|order total/i);
});

test("admin orders integrates custom requests without changing standard total labels", () => {
  const admin = source("src/components/AdminOrders.tsx");

  assert.match(admin, /value="custom">Custom requests/);
  assert.match(admin, /order\.orderKind === "custom"/);
  assert.match(admin, /detail\.orderKind === "custom"/);
  assert.match(admin, /Unpaid request/);
  assert.match(admin, /Quote requested — not paid/);
  assert.match(admin, /<AdminCustomRecipe recipe=\{detail\.customRecipe\}/);
  assert.match(admin, /detail\.orderKind === "standard" && detail\.status === "paid" && nextStatus/);
  assert.match(admin, /<span>Items subtotal<\/span>/);
  assert.match(admin, /<span>Delivery \(GST inclusive\)<\/span>/);
  assert.match(admin, /<strong>Order total<\/strong>/);
});
