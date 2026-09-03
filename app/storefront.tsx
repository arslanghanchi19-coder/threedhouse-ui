"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Menu,
  Package,
  Search,
  ShoppingBag,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  material: string;
  color: string;
  description: string;
  imageKey?: string | null;
  imageKeys?: string[];
};
export type MakingVideo = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  videoKey: string;
};
type CartItem = Product & {
  quantity: number;
  selectedColor: string;
  cartKey: string;
};
export const defaults: Product[] = [
  {
    id: 1,
    name: "Ripple Drain Soap Dish",
    category: "Bathroom",
    price: 349,
    stock: 18,
    material: "PETG",
    color: "Stone",
    description:
      "Quick-dry layered soap rest with a clean architectural profile.",
  },
  {
    id: 2,
    name: "Modular Desk Dock",
    category: "Desk & Office",
    price: 649,
    stock: 12,
    material: "PLA+",
    color: "Graphite",
    description:
      "A compact home for your phone, watch and everyday essentials.",
  },
  {
    id: 3,
    name: "Contour Planter",
    category: "Planters & Décor",
    price: 799,
    stock: 9,
    material: "PLA+",
    color: "Sage",
    description:
      "A sculptural ribbed planter designed to soften modern spaces.",
  },
  {
    id: 4,
    name: "Snap-Fit Drawer Organiser",
    category: "Home Organization",
    price: 499,
    stock: 21,
    material: "PETG",
    color: "Sand",
    description: "Expandable compartments that bring order to busy drawers.",
  },
];
const cats = [
  "Bathroom",
  "Kitchen",
  "Home Organization",
  "Desk & Office",
  "Planters & Décor",
  "Personalized Gifts",
];
type CategoryPhoto = { name: string; imageKey: string | null };
const defaultCategoryPhotos: Record<string, string> = {
  Bathroom: "/category-bathroom.webp",
  Kitchen: "/category-kitchen.webp",
  "Home Organization": "/category-home-organization.webp",
  "Desk & Office": "/category-desk-office.webp",
  "Planters & Décor": "/category-planters-decor.webp",
  "Personalized Gifts": "/category-personalized-gifts.webp",
};
const categoryPhotoUrl = (value: string) =>
  value.startsWith("/")
    ? value
    : `/api/product-images?key=${encodeURIComponent(value)}`;
export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]),
    [catalogLoading, setCatalogLoading] = useState(true),
    [catalogError, setCatalogError] = useState(""),
    [categoryPhotos, setCategoryPhotos] = useState<Record<string, string>>(defaultCategoryPhotos),
    [makingVideos, setMakingVideos] = useState<MakingVideo[]>([]),
    [cart, setCart] = useState<CartItem[]>([]),
    [open, setOpen] = useState(false),
    [checkout, setCheckout] = useState(false),
    [orderId, setOrderId] = useState(""),
    [placing, setPlacing] = useState(false),
    [paymentMethod, setPaymentMethod] = useState("cod"),
    [checkoutError, setCheckoutError] = useState(""),
    [query, setQuery] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [sort, setSort] = useState("featured"),
    [mobileOpen, setMobileOpen] = useState(false),
    [quoteSent, setQuoteSent] = useState(""),
    [quoteError, setQuoteError] = useState(""),
    [policy, setPolicy] = useState<"shipping" | "returns" | "faq" | null>(null),
    [selectedCategory, setSelectedCategory] = useState("All Products"),
    [selectedColors, setSelectedColors] = useState<Record<number, string>>({}),
    [selectedImages, setSelectedImages] = useState<Record<number, number>>({}),
    [lightbox, setLightbox] = useState<{ product: Product; index: number } | null>(null),
    [zoom, setZoom] = useState(1),
    [touchStart, setTouchStart] = useState<number | null>(null);
  const orderRequestId = useRef<string | null>(null);
  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/categories").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/videos").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([productData, categoryData, videoData]) => {
        if (Array.isArray(productData?.products)) setProducts(productData.products);
        else setCatalogError("The collection is temporarily unavailable. Please try again later.");
        if (videoData?.videos?.length) setMakingVideos(videoData.videos);
        if (categoryData?.categories?.length) {
          setCategoryPhotos((current) => ({
            ...current,
            ...Object.fromEntries(
              categoryData.categories
                .filter((category: CategoryPhoto) => category.imageKey)
                .map((category: CategoryPhoto) => [category.name, category.imageKey]),
            ),
          }));
        }
      })
      .catch(() => setCatalogError("Unable to load the collection. Please try again later."))
      .finally(() => setCatalogLoading(false));
  }, []);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        setLightbox((current) => {
          if (!current) return null;
          const count = current.product.imageKeys?.length || (current.product.imageKey ? 1 : 0);
          return { ...current, index: (current.index + direction + count) % count };
        });
        setZoom(1);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);
  const shown = useMemo(
    () =>
      products.filter(
        (p) =>
          (selectedCategory === "All Products" ||
            p.category === selectedCategory) &&
          (p.name + p.category)
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [products, query, selectedCategory],
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal = cart.reduce((s, p) => s + p.price * p.quantity, 0),
    shipping = subtotal >= 500 ? 0 : 99,
    total = subtotal + shipping;
  const colorsFor = (product: Product) =>
    product.color
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  const imagesFor = (product: Product) =>
    product.imageKeys?.length
      ? product.imageKeys
      : product.imageKey
        ? [product.imageKey]
        : [];
  function moveGallery(product: Product, direction: number) {
    const gallery = imagesFor(product);
    if (gallery.length < 2) return;
    setSelectedImages((current) => ({
      ...current,
      [product.id]: ((current[product.id] || 0) + direction + gallery.length) % gallery.length,
    }));
  }
  function moveLightbox(direction: number) {
    setLightbox((current) => {
      if (!current) return null;
      const count = imagesFor(current.product).length;
      return { ...current, index: (current.index + direction + count) % count };
    });
    setZoom(1);
  }
  function openLightbox(product: Product, index: number) {
    setZoom(1);
    setLightbox({ product, index });
  }
  function chosenColor(product: Product) {
    return selectedColors[product.id] || colorsFor(product)[0] || "Standard";
  }
  function chooseCategory(category: string) {
    setSelectedCategory(category);
    requestAnimationFrame(() =>
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }),
    );
  }
  function addToCart(product: Product) {
    if (product.stock < 1) return;
    const selectedColor = chosenColor(product),
      cartKey = `${product.id}-${selectedColor}`;
    setCart((current) => {
      const existing = current.find((item) => item.cartKey === cartKey);
      return existing
        ? current.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { ...product, selectedColor, cartKey, quantity: 1 }];
    });
    setOpen(true);
  }
  function changeQuantity(cartKey: string, change: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }
  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPlacing(true);
    setCheckoutError("");
    try {
      orderRequestId.current ||= crypto.randomUUID();
      const f = new FormData(e.currentTarget),
        payload = Object.fromEntries(f.entries());
      const items = cart.map((p) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        color: p.selectedColor,
        imageKey: p.imageKey,
      }));
      if (payload.paymentMethod === "razorpay") {
        const setupResponse = await fetch("/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          }),
          setup = await setupResponse.json();
        if (!setupResponse.ok)
          throw new Error(setup.error || "Unable to start online payment");
        if (!(window as any).Razorpay)
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Unable to load Razorpay checkout"));
            document.head.appendChild(script);
          });
        await new Promise<void>((resolve, reject) => {
          const checkout = new (window as any).Razorpay({
            key: setup.key_id,
            amount: setup.amount,
            currency: setup.currency,
            name: "THREE D HOUSE",
            description: "Order payment",
            order_id: setup.order_id,
            prefill: {
              name: payload.customerName,
              email: payload.email,
              contact: payload.phone,
            },
            theme: { color: "#171915" },
            handler: async (result: any) => {
              try {
                const response = await fetch("/api/verify-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, ...result, items }),
                  }),
                  data = await response.json();
                if (!response.ok)
                  throw new Error(data.error || "Payment verification failed");
                setOrderId(data.order.id);
                setCart([]);
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment was cancelled.")),
            },
          });
          checkout.on("payment.failed", (response: any) =>
            reject(
              new Error(
                response?.error?.description ||
                  "Payment failed. Please try again.",
              ),
            ),
          );
          checkout.open();
        });
        return;
      }
      const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            requestId: orderRequestId.current,
            items,
          }),
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to place order");
      setOrderId(data.order.id);
      orderRequestId.current = null;
      setCart([]);
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Unable to place order",
      );
    } finally {
      setPlacing(false);
    }
  }
  return (
    <main className="site-shell" id="top">
      <a className="skip-link" href="#shop">Skip to products</a>
      <div className="announcement">
        Free shipping above ₹500 <span /> Made in India <span /> Precision 3D
        printed
      </div>
      <header className="nav">
        <a className="brand" href="#top">
          <img src="/three-d-house-logo.png" alt="THREE D HOUSE" />
          <div>
            <b>THREE D HOUSE</b>
            <small>DESIGNED IN LAYERS. MADE FOR LIFE.</small>
          </div>
        </a>
        <nav id="store-navigation" aria-label="Main navigation" className={mobileOpen ? "open" : ""}>
          <a href="#shop" onClick={() => setMobileOpen(false)}>Shop</a>
          <a href="#categories" onClick={() => setMobileOpen(false)}>Categories</a>
          <a href="#custom" onClick={() => setMobileOpen(false)}>Custom 3D Print</a>
          <a href="#story" onClick={() => setMobileOpen(false)}>Our Process</a>
        </nav>
        <div className="nav-actions">
          <button aria-label="Search products" aria-expanded={searchOpen} onClick={() => { setSearchOpen((v) => !v); setMobileOpen(false); }}>
            <Search />
          </button>
          <button
            onClick={() => setOpen(true)}
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag />
            <i>{cartCount}</i>
          </button>
          <button className="mobile-menu" aria-label="Menu" aria-expanded={mobileOpen} aria-controls="store-navigation" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {searchOpen && (
        <form className="searchbar" role="search" onSubmit={(e) => { e.preventDefault(); chooseCategory("All Products"); }}>
          <Search />
          <input
            autoFocus
            aria-label="Search products and categories"
            placeholder="Search products and categories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-submit">Search <ArrowRight /></button>
          <button type="button" aria-label="Close and clear search" onClick={() => { setQuery(""); setSearchOpen(false); }}>
            <X />
          </button>
        </form>
      )}
      <nav className="collection-nav" aria-label="Shop by collection">
        {cats.map((category) => <button key={category} onClick={() => chooseCategory(category)}>{category}</button>)}
      </nav>
      <section className="campaign" aria-label="Featured collections">
        <article className="campaign-panel">
          <img src={categoryPhotoUrl(categoryPhotos["Planters & Décor"])} alt="Sculptural planter in a softly lit living space" fetchPriority="high" />
          <div className="campaign-copy">
            <p>THE HOME COLLECTION</p>
            <h1>Everyday.<br />Extraordinary.</h1>
            <button onClick={() => chooseCategory("Planters & Décor")}>Explore home décor <ArrowRight /></button>
          </div>
        </article>
        <article className="campaign-panel">
          <img src={categoryPhotoUrl(categoryPhotos["Desk & Office"])} alt="Minimal graphite desk accessories and organisers" />
          <div className="campaign-copy">
            <p>THE WORKSPACE COLLECTION</p>
            <h2>Space to<br />think.</h2>
            <button onClick={() => chooseCategory("Desk & Office")}>Explore desk essentials <ArrowRight /></button>
          </div>
        </article>
      </section>
      <div className="brand-line">DESIGNED IN LAYERS. <span>MADE FOR LIFE.</span><a href="#shop">Discover the collection <ArrowRight /></a></div>
      <section id="categories" className="section categories">
        <div className="section-head">
          <div>
            <p className="eyebrow">EXPLORE THE COLLECTION</p>
            <h2>Shop by category</h2>
          </div>
          <button
            className="view-all"
            onClick={() => chooseCategory("All Products")}
          >
            Shop all <ArrowRight />
          </button>
        </div>
        <div className="category-grid">
          {cats.map((c, i) => (
            <button
              type="button"
              key={c}
              className={`cat c${i} ${categoryPhotos[c] ? "has-photo" : ""} ${selectedCategory === c ? "selected" : ""}`}
              onClick={() => chooseCategory(c)}
            >
              {categoryPhotos[c] ? (
                <img
                  className="category-photo"
                  src={categoryPhotoUrl(categoryPhotos[c])}
                  alt={`${c} collection`}
                  loading="lazy"
                />
              ) : (
                <Package className="category-placeholder" aria-hidden="true" />
              )}
              <div className="category-card-copy">
                <h3>{c}</h3>
                <p>
                  Explore collection <ArrowRight />
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section id="shop" className="section products">
        <div className="section-head">
          <div>
            <p className="eyebrow">CURATED FOR MODERN LIVING</p>
            <h2>{query.trim() ? "Search results" : selectedCategory}</h2>
          </div>
          <label className="category-filter">
            <span>Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option>All Products</option>
              {cats.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown />
          </label>
        </div>
        <div className="shop-toolbar">
          <p role="status">{shown.length} {shown.length === 1 ? "product" : "products"}{query.trim() && <> for “{query.trim()}”</>}</p>
          <label>Sort by <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></label>
        </div>
        {shown.length ? (
          <div className="product-grid">
            {[...shown].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : 0).map((p, i) => {
              const gallery = imagesFor(p),
                active = Math.min(
                  selectedImages[p.id] || 0,
                  Math.max(gallery.length - 1, 0),
                );
              return (
                <article className="product" key={p.id}>
                  <div className={`product-image p${i % 4}`}>
                    {gallery.length ? (
                      <button className="image-open" type="button" onClick={() => openLightbox(p, active)} aria-label={`Open and zoom ${p.name} image ${active + 1}`}>
                        <img src={`/api/product-images?key=${encodeURIComponent(gallery[active])}`} alt={`${p.name} view ${active + 1}`} loading="lazy" />
                        <span className="zoom-hint"><Maximize2 /> View & zoom</span>
                      </button>
                    ) : (
                      <div className="product-placeholder"><Package aria-hidden="true" /><span>Image coming soon</span></div>
                    )}
                    {gallery.length > 1 && <><button className="slide-arrow prev" type="button" onClick={() => moveGallery(p, -1)} aria-label="Previous image"><ChevronLeft /></button><button className="slide-arrow next" type="button" onClick={() => moveGallery(p, 1)} aria-label="Next image"><ChevronRight /></button><b className="image-count">{active + 1} / {gallery.length}</b></>}
                    <span>{p.material}</span>
                  </div>
                  {gallery.length > 1 && (
                    <div className="product-thumbnails">
                      {gallery.map((key, index) => (
                        <button
                          type="button"
                          key={key}
                          className={active === index ? "active" : ""}
                          onClick={() =>
                            setSelectedImages((current) => ({
                              ...current,
                              [p.id]: index,
                            }))
                          }
                          aria-label={`Show ${p.name} image ${index + 1}`}
                        >
                          <img
                            src={`/api/product-images?key=${encodeURIComponent(key)}`}
                            alt=""
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="product-colors">
                    <small>Choose colour</small>
                    <div>
                      {colorsFor(p).length ? (
                        colorsFor(p).map((color) => (
                          <button
                            type="button"
                            key={color}
                            className={chosenColor(p) === color ? "active" : ""}
                            onClick={() =>
                              setSelectedColors((current) => ({
                                ...current,
                                [p.id]: color,
                              }))
                            }
                            aria-pressed={chosenColor(p) === color}
                          >
                            {color}
                          </button>
                        ))
                      ) : (
                        <span>Standard</span>
                      )}
                    </div>
                  </div>
                  <div className="product-info">
                    <small>{p.category}</small>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <div>
                      <b>₹{p.price.toLocaleString("en-IN")}</b>
                      <button type="button" onClick={() => addToCart(p)} disabled={p.stock < 1}>
                        {p.stock < 1 ? "Sold out" : "Add"} {p.stock > 0 && <ShoppingBag />}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="no-products">
            <Package size={40} />
            <h3>{catalogLoading ? "Loading the collection…" : catalogError ? "Collection unavailable" : products.length ? "No products found" : "Collection coming soon"}</h3>
            <p>
              {catalogError || (catalogLoading ? "Please wait." : products.length ? "Try another category or clear your search to explore the collection." : "New products will appear here when they are available.")}
            </p>
            <button onClick={() => { setQuery(""); setSelectedCategory("All Products"); }}>
              View all products
            </button>
          </div>
        )}
      </section>
      {makingVideos.length > 0 && (
        <section id="making" className="section making-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">BEHIND THE PRINT</p>
              <h2>Made layer by layer.</h2>
            </div>
            <p className="making-intro">
              Watch each idea move from a digital model to a carefully finished THREE D HOUSE product.
            </p>
          </div>
          <div className="making-video-grid">
            {makingVideos.map((video) => (
              <article className="making-video-card" key={video.id}>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={`/api/video-files?key=${encodeURIComponent(video.videoKey)}`}
                  aria-label={video.title}
                />
                <div>
                  <span>3D PRINTING PROCESS</span>
                  <h3>{video.title}</h3>
                  {video.description && <p>{video.description}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <section id="custom" className="custom">
        <div>
          <p className="eyebrow">YOUR IDEA, MADE REAL</p>
          <h2>
            Need something
            <br />
            uniquely yours?
          </h2>
          <p>
            Tell us what you have in mind. We
            review every request for printability, material and production cost
            before sending you a quote.
          </p>
          {quoteSent ? <div className="quote-success"><b>Request received</b><span>Your reference is {quoteSent}. We’ll contact you within 1–2 business days.</span><button onClick={() => setQuoteSent("")}>Send another request</button></div> : <form className="quote-form" onSubmit={async (e) => {e.preventDefault();setQuoteError("");const element=e.currentTarget;const form=new FormData(element);try{const response=await fetch("/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form.entries()))});const data=await response.json();if(!response.ok){setQuoteError(data.error||"Unable to submit request");return}setQuoteSent(data.quote.id);element.reset()}catch{setQuoteError("Unable to send your request. Please try again.")}}}>
            <div><label>Your name<input name="customerName" required /></label><label>Mobile number<input name="phone" inputMode="numeric" pattern="[0-9]{10}" required /></label></div>
            <div><label>Email (optional)<input name="email" type="email" /></label><label>Quantity<input name="quantity" type="number" min="1" defaultValue="1" /></label></div>
            <label>What would you like us to make?<select name="projectType" required><option value="">Choose project type</option><option>Home accessory</option><option>Personalized gift</option><option>Replacement part</option><option>Prototype</option><option>Other</option></select></label>
            <label>Describe your idea<textarea name="description" minLength={10} required placeholder="Size, use, preferred material or colour, and any other details" /></label>
            {quoteError && <p className="form-error">{quoteError}</p>}
            <button className="btn gold">Request a custom print <ArrowRight /></button>
          </form>}
        </div>
        <ol>
          {[
            [
              "01",
              "Share your idea",
              "Tell us about the size, purpose and finish",
            ],
            ["02", "Review & quote", "We check feasibility, material and cost"],
            ["03", "Approve & print", "You approve before production begins"],
            [
              "04",
              "Quality check & delivery",
              "Carefully finished and shipped to you",
            ],
          ].map((x) => (
            <li key={x[0]}>
              <b>{x[0]}</b>
              <span>
                <strong>{x[1]}</strong>
                {x[2]}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section id="story" className="why">
        <p className="eyebrow">WHY THREE D HOUSE</p>
        <h2>Better ideas, built one precise layer at a time.</h2>
        <div>
          {[
            [
              "01",
              "Thoughtful design",
              "Useful objects shaped around real everyday needs.",
            ],
            [
              "02",
              "Quality materials",
              "PETG and PLA selected for the right function and finish.",
            ],
            [
              "03",
              "Made responsibly",
              "Made-to-order production creates less waste and excess stock.",
            ],
            [
              "04",
              "Made in India",
              "Designed, printed and checked locally before dispatch.",
            ],
          ].map((x) => (
            <article key={x[0]}>
              <b>{x[0]}</b>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <footer>
        <div className="foot-brand">
          <img src="/three-d-house-logo.png" alt="" />
          <h3>THREE D HOUSE</h3>
          <p>Designed in Layers. Made for Life.</p>
        </div>
        <div>
          <b>SHOP</b>
          <a href="#shop">All Products</a>
          <a href="#categories">Categories</a>
          <a href="#custom">Custom Printing</a>
          <a href="/account">My account</a><a href="/admin">Store administration</a>
        </div>
        <div>
          <b>HELP</b>
          <button onClick={() => setPolicy("shipping")}>Shipping</button>
          <button onClick={() => setPolicy("returns")}>Returns</button>
          <button onClick={() => setPolicy("faq")}>FAQs</button>
        </div>
        <div>
          <b>CONTACT</b>
          <a href="mailto:hello@threedhouse.in">hello@threedhouse.in</a>
          <span>Mumbai, India</span>
        </div>
        <p className="copyright">© 2026 THREE D HOUSE. All rights reserved.</p>
      </footer>
      {policy && <div className="info-modal"><button className="overlay" onClick={() => setPolicy(null)} aria-label="Close"/><article><button className="modal-close" onClick={() => setPolicy(null)}><X /></button>{policy === "shipping" ? <><p className="eyebrow">DELIVERY INFORMATION</p><h2>Shipping across India</h2><h3>Processing</h3><p>Most products are printed to order. Please allow 2–5 business days for production and quality checks before dispatch.</p><h3>Delivery</h3><p>Standard delivery normally takes 3–7 business days after dispatch. Shipping is ₹99, and free for orders of ₹500 or more.</p><h3>Tracking</h3><p>Tracking details are shared once your parcel is handed to the courier.</p></> : policy === "returns" ? <><p className="eyebrow">OUR PROMISE</p><h2>Returns & replacements</h2><p>Contact us within 7 days of delivery if your item arrives damaged, defective, or different from what you ordered. Please keep the packaging and share clear photos.</p><p>Because products are made to order, change-of-mind returns and personalized/custom products cannot normally be returned. Approved refunds are sent to the original payment method.</p></> : <><p className="eyebrow">COMMON QUESTIONS</p><h2>Frequently asked</h2><h3>Are the products durable?</h3><p>Yes. We select PLA, PLA+ or PETG based on the intended use and test every product before dispatch.</p><h3>Can I request another colour or size?</h3><p>Choose listed colours on the product card. For a special size or colour, submit a custom quote request.</p><h3>Do you offer Cash on Delivery?</h3><p>Yes, Cash on Delivery and secure Razorpay online payments are available at checkout.</p></>}</article></div>}
      {lightbox && (() => { const gallery = imagesFor(lightbox.product); return <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${lightbox.product.name} image gallery`} onTouchStart={(e) => setTouchStart(e.touches[0].clientX)} onTouchEnd={(e) => { if (touchStart === null) return; const distance = e.changedTouches[0].clientX - touchStart; if (Math.abs(distance) > 45) moveLightbox(distance > 0 ? -1 : 1); setTouchStart(null); }}><button className="lightbox-backdrop" onClick={() => setLightbox(null)} aria-label="Close gallery"/><header><div><b>{lightbox.product.name}</b><span>Image {lightbox.index + 1} of {gallery.length}</span></div><div><button onClick={() => setZoom((v) => Math.max(1, v - .5))} disabled={zoom === 1} aria-label="Zoom out"><ZoomOut /></button><strong>{Math.round(zoom * 100)}%</strong><button onClick={() => setZoom((v) => Math.min(3, v + .5))} disabled={zoom === 3} aria-label="Zoom in"><ZoomIn /></button><button onClick={() => setLightbox(null)} aria-label="Close"><X /></button></div></header><div className="lightbox-stage"><button className="lightbox-arrow prev" onClick={() => moveLightbox(-1)} aria-label="Previous image"><ChevronLeft /></button><div className={zoom > 1 ? "zoomed image-canvas" : "image-canvas"}><img src={`/api/product-images?key=${encodeURIComponent(gallery[lightbox.index])}`} alt={`${lightbox.product.name} enlarged view ${lightbox.index + 1}`} style={{ transform: `scale(${zoom})` }} /></div><button className="lightbox-arrow next" onClick={() => moveLightbox(1)} aria-label="Next image"><ChevronRight /></button></div><div className="lightbox-thumbs">{gallery.map((key, index) => <button key={key} className={index === lightbox.index ? "active" : ""} onClick={() => { setLightbox({ ...lightbox, index }); setZoom(1); }}><img src={`/api/product-images?key=${encodeURIComponent(key)}`} alt={`View ${index + 1}`} /></button>)}</div><small className="swipe-note">Swipe or use arrows to browse · Use zoom controls to inspect details</small></div> })()}
      {open && (
        <div className="drawer">
          <button
            className="overlay"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          />
          <aside className={checkout ? "checkout-panel" : ""}>
            <div>
              <h2>
                {checkout ? "Secure checkout" : `Your cart (${cartCount})`}
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  setCheckout(false);
                  setOrderId("");
                }}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            {orderId ? (
              <div className="order-success">
                <div>✓</div>
                <h3>Order confirmed</h3>
                <p>
                  Thank you. Your{" "}
                  {paymentMethod === "razorpay"
                    ? "online payment was successful and your"
                    : "Cash on Delivery"}{" "}
                  order has been received.
                </p>
                <b>Order ID: {orderId}</b>
                <button
                  className="btn dark"
                  onClick={() => {
                    setOpen(false);
                    setCheckout(false);
                    setOrderId("");
                  }}
                >
                  Continue shopping
                </button>
              </div>
            ) : checkout ? (
              <form className="checkout-form" onSubmit={placeOrder}>
                <div className="checkout-summary">
                  <span>Order subtotal</span>
                  <b>₹{subtotal.toLocaleString("en-IN")}</b>
                  <span>Shipping</span>
                  <b>{shipping ? `₹${shipping}` : "FREE"}</b>
                  <strong>Total</strong>
                  <strong>₹{total.toLocaleString("en-IN")}</strong>
                </div>
                <h3>Delivery details</h3><p>Please <a href="/account" target="_blank" rel="noopener noreferrer">sign in or create an account</a> before placing your order.</p>
                <label>
                  Full name
                  <input name="customerName" required />
                </label>
                <label>
                  Mobile number
                  <input
                    name="phone"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    required
                  />
                </label>
                <label>
                  Email (optional)
                  <input name="email" type="email" />
                </label>
                <label>
                  Complete address
                  <textarea name="address" required />
                </label>
                <div className="checkout-grid">
                  <label>
                    City
                    <input name="city" required />
                  </label>
                  <label>
                    State
                    <input name="state" required />
                  </label>
                </div>
                <label>
                  PIN code
                  <input
                    name="pincode"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    required
                  />
                </label>
                <h3>Payment method</h3><p>Online payments are disabled during migration.</p>
                <label className="payment-choice">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    defaultChecked
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span>
                    <b>Cash on Delivery</b>
                    <small>Pay when your order arrives</small>
                  </span>
                </label>
                <label className="payment-choice">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    disabled
                    onChange={() => setPaymentMethod("razorpay")}
                  />
                  <span>
                    <b>UPI / Cards / Net Banking</b>
                    <small>Secure payment through Razorpay</small>
                  </span>
                </label>
                {checkoutError && <p className="form-error">{checkoutError}</p>}
                <div className="checkout-actions">
                  <button type="button" onClick={() => setCheckout(false)}>
                    Back to cart
                  </button>
                  <button className="btn dark" disabled={placing}>
                    {placing
                      ? "Placing order…"
                      : `${paymentMethod === "razorpay" ? "Pay online" : "Place COD order"} · ₹${total.toLocaleString("en-IN")}`}
                  </button>
                </div>
              </form>
            ) : cart.length === 0 ? (
              <div className="empty">
                <ShoppingBag />
                <h3>Your cart is empty</h3>
                <p>Add a thoughtfully printed product to get started.</p>
              </div>
            ) : (
              <>
                {cart.map((p) => (
                  <div className="cart-row" key={p.cartKey}>
                    {p.imageKey ? (
                      <img
                        className="cart-image"
                        src={`/api/product-images?key=${encodeURIComponent(p.imageKey)}`}
                        alt=""
                      />
                    ) : (
                      <div className="mini-object" />
                    )}
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.selectedColor} · {p.material}
                      </small>
                      <span className="quantity">
                        <button
                          onClick={() => changeQuantity(p.cartKey, -1)}
                          aria-label={`Decrease ${p.name}`}
                        >
                          −
                        </button>
                        <b>{p.quantity}</b>
                        <button
                          onClick={() => changeQuantity(p.cartKey, 1)}
                          aria-label={`Increase ${p.name}`}
                        >
                          +
                        </button>
                      </span>
                    </span>
                    <strong>
                      ₹{(p.price * p.quantity).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
                <div className="total">
                  <span>Total</span>
                  <b>₹{total.toLocaleString("en-IN")}</b>
                </div>
                <small className="shipping-note">
                  {shipping
                    ? "₹99 shipping · Free above ₹500"
                    : "Free shipping applied"}
                </small>
                <button
                  className="btn dark checkout"
                  onClick={() => setCheckout(true)}
                >
                  Proceed to checkout
                </button>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
