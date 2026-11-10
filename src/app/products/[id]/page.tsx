import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { BrandWordmark } from "@/components/BrandWordmark";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductImage } from "@/components/ProductImage";
import { categoryLabel, formatPrice, productPackSizes, products, productVariantsFor } from "@/content/products";
import { productBreadcrumbs, productDescription, productPath } from "@/lib/product-pages";
import { publicPageMetadata, serializeJsonLd, siteName, woodOilsPath } from "@/lib/seo";
import "./product.css";

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

async function productForPage(params: Props["params"]) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  return product;
}

export async function generateMetadata({ params }: Props) {
  const product = await productForPage(params);
  return publicPageMetadata(`${product.name} | ${siteName}`, productDescription(product), productPath(product));
}

export default async function ProductPage({ params }: Props) {
  const product = await productForPage(params);
  const variants = productVariantsFor(product);
  const related = products.filter((item) => item.category === product.category && item.id !== product.id);

  return <div className="product-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productBreadcrumbs(product)) }} />
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="announcement-bar">Store preview · Online ordering is not yet available</div>
    <header className="commerce-header section-wrap">
      <Link href="/" className="brand" aria-label={`${siteName} home`}><BrandWordmark /></Link>
      <Link href="/#collection" className="text-link"><ArrowLeft size={16} />Browse catalogue</Link>
      <Link href="/cart" aria-label="Your bag"><ShoppingBag size={22} /></Link>
    </header>
    <main id="main" className="section-wrap">
      <nav className="product-page-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">{siteName}</Link></li>
          {product.category === "wood-oils" && <li><Link href={woodOilsPath}>Wood-pressed Oils</Link></li>}
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>
      <div className="product-page-grid">
        <section aria-labelledby="product-heading">
          <p className="eyebrow">{categoryLabel(product.category)}</p>
          <h1 id="product-heading">{product.name}</h1>
          <p className="product-page-tamil" lang="ta">{product.tamilName}</p>
          <ProductImage productId={product.id} className="product-page-artwork" priority />
          <table className="product-page-packs">
            <caption>Pack sizes and listed prices</caption>
            <thead><tr><th scope="col">Pack size</th><th scope="col">Price (INR)</th></tr></thead>
            <tbody>
              {variants.length ? variants.map((pack) => <tr key={pack.id}><th scope="row">{pack.size}</th><td>{formatPrice(pack.price)}</td></tr>)
                : productPackSizes(product).map((size) => <tr key={size}><th scope="row">{size}</th><td>Price pending</td></tr>)}
            </tbody>
          </table>
          <p className="product-page-note">{variants.length
            ? `Prices are calculated proportionally from the listed ${product.size} price of ${formatPrice(product.price)}, rounded up to the next whole rupee.`
            : "The base quantity for pricing needs confirmation. No pack price or purchase availability is claimed for this product."}</p>
        </section>
        <aside className="product-page-panel" aria-label="Prepare your bag">
          <h2>Prepare your bag</h2>
          <ProductPurchase key={product.id} product={product} />
          <div className="preview-notice"><p>Store preview. Real payments and delivery orders are not yet available. Delivery charges and tax settings are still to be confirmed.</p></div>
        </aside>
      </div>
      <section className="product-page-related" aria-labelledby="related-heading">
        <h2 id="related-heading">{related.length ? `More ${categoryLabel(product.category).toLowerCase()}` : "Explore the catalogue"}</h2>
        {related.length > 0 && <ul>{related.map((item) => <li key={item.id}><Link href={productPath(item)} prefetch={false}>{item.name}</Link></li>)}</ul>}
        <Link href="/#collection" className="text-link"><ArrowLeft size={16} />All products at {siteName}</Link>
      </section>
    </main>
    <footer className="commerce-footer section-wrap"><span>{siteName} · <span lang="ta">அசல் இயற்கை அங்காடி</span></span><Link href={woodOilsPath}>Browse wood-pressed oils</Link></footer>
  </div>;
}
