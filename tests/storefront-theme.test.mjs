import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("app/storefront.tsx", root), "utf8");
const css = await readFile(new URL("app/storefront.css", root), "utf8");

test("editorial storefront uses bundled collection imagery, not reference-site assets", async () => {
  for (const asset of ["category-planters-decor.webp", "category-desk-office.webp"]) {
    assert.ok(source.includes(asset));
    await access(new URL(`public/${asset}`, root));
  }
  assert.doesNotMatch(source, /thehouseofrare\.com|className="vase"|className="printed-object"/);
  assert.match(source, /Image coming soon/);
});

test("theme is scoped and includes mobile and reduced-motion layouts", () => {
  assert.match(css, /\.site-shell\s*\{/);
  assert.match(css, /--store-paper: #fff/);
  assert.match(css, /max-width: 760px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.site-shell \.product-grid \{ grid-template-columns: repeat\(2/);
});

test("catalog discovery preserves independent search visibility and clear-results action", () => {
  assert.match(source, /\[searchOpen, setSearchOpen\]/);
  assert.match(source, /\{searchOpen &&/);
  assert.match(source, /role="search"/);
  assert.match(source, /setQuery\(""\); setSelectedCategory\("All Products"\)/);
  assert.match(source, /sort === "price-low" \? a.price - b.price/);
  assert.match(source, /sort === "price-high" \? b.price - a.price/);
});

test("store keeps quote, checkout, image gallery and administration entry points", () => {
  for (const text of ["/api/quotes", "onSubmit={placeOrder}", "openLightbox(p, active)", 'href="/admin"']) {
    assert.ok(source.includes(text), `Missing ${text}`);
  }
  assert.match(source, /const element=e.currentTarget/);
  assert.match(source, /Unable to send your request\. Please try again\./);
});
