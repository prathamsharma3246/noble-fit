// ============================================================
// NOBLE FIT — PROFESSIONAL ECOMMERCE SCRIPT
// ============================================================

// ============================================================
// PHP + MySQL BACKEND (replaces the old Google Sheets integration)
// api/ folder must sit next to this file on your XAMPP server
// ============================================================
const API_BASE = 'api/';

// ============================================================
// STORE MODE SWITCH
// ============================================================
// Noble Fit currently runs as an Amazon Affiliate storefront (no self-fulfilled
// inventory yet). Every "Add to Cart" / "Buy Now" / "Checkout" / "Place Order"
// function below is kept fully intact — nothing has been deleted — it is simply
// not wired up while CART_ENABLED is false. Flip this single flag back to `true`
// whenever Noble Fit is ready to sell directly again, and the entire cart +
// checkout + coupon + order flow (all still present further down this file)
// will re-activate without rebuilding anything.
const CART_ENABLED = false;

// --- State ---
let cartItems   = [];
let wishlistCnt = 0;
let popup       = { name:'', price:0, origPrice:0, img:'', size:'', qty:1, isBuyNow:false };
let appliedCoupon = null; // { code, discount } once validated by the server

// ============================================================
// CATEGORY FILTERING (Shop / New Arrivals / T-Shirts / Shirts / Denims)
// ============================================================
const CATEGORY_META = {
    all:     { eyebrow:'Handpicked For You', heading:'Featured Products',  subtext:'Experience true craftsmanship and premium fabrics' },
    new:     { eyebrow:'Just Landed',        heading:'New Arrivals',       subtext:'The latest additions to the Noble Fit collection' },
    tshirts: { eyebrow:'Casual Wear',        heading:'T-Shirts Collection',subtext:'Premium polo tees crafted for everyday comfort' },
    shirts:  { eyebrow:'Formal & Casual',    heading:'Shirts Collection',  subtext:'Refined shirts tailored for every occasion' },
    denims:  { eyebrow:'Bottoms',            heading:'Denims Collection',  subtext:'Durable, stylish denims built to last' }
};
const VALID_FILTERS = Object.keys(CATEGORY_META);

function filterProducts(filter) {
    if (!VALID_FILTERS.includes(filter)) filter = 'all';

    const cards = document.querySelectorAll('#productGrid .product-card');
    let visibleCount = 0;
    cards.forEach(card => {
        const cat    = card.getAttribute('data-category');
        const isNew  = card.getAttribute('data-new') === 'true';
        const show   = filter === 'all' ? true : filter === 'new' ? isNew : cat === filter;
        card.classList.toggle('hidden', !show);
        if (show) visibleCount++;
    });

    const noProductsEl = document.getElementById('noProducts');
    if (noProductsEl) noProductsEl.style.display = visibleCount === 0 ? 'block' : 'none';

    // Update section title/copy
    const meta = CATEGORY_META[filter];
    const eyebrowEl = document.getElementById('shopEyebrow');
    const headingEl = document.getElementById('shopHeading');
    const subtextEl = document.getElementById('shopSubtext');
    if (eyebrowEl) eyebrowEl.textContent = meta.eyebrow;
    if (headingEl) headingEl.textContent = meta.heading;
    if (subtextEl) subtextEl.textContent = meta.subtext;

    // Sync active state on nav links + chips
    document.querySelectorAll('.nav-links a[data-filter]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-filter') === filter);
    });
    document.querySelectorAll('.chip[data-filter]').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-filter') === filter);
    });

    document.title = filter === 'all'
        ? "Noble Fit | Premium Men's Clothing Store"
        : `${meta.heading} | Noble Fit`;
}

function applyFilterFromHash(scrollToShop) {
    const hash = window.location.hash.replace('#', '');
    if (VALID_FILTERS.includes(hash) || hash === 'shop') {
        const filter = hash === 'shop' ? 'all' : hash;
        filterProducts(filter);
        if (scrollToShop) {
            const shopSection = document.getElementById('shop');
            if (shopSection) shopSection.scrollIntoView({ behavior:'smooth' });
        }
    }
}

// ============================================================
// PRODUCTS — fetched from api/get_products.php and rendered into #productGrid
// ============================================================
function starsHtml(rating) {
    const full  = Math.floor(rating);
    const half  = (rating - full) >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '<i class="fas fa-star"></i>'.repeat(full)
         + (half ? '<i class="fas fa-star-half-alt"></i>' : '')
         + '<i class="far fa-star"></i>'.repeat(empty);
}

function productCardHtml(p) {
    const nameAttr = p.name.replace(/'/g, "\\'");
    const hasLink  = !!(p.affiliate_link && p.affiliate_link.trim());
    const linkAttr = hasLink ? p.affiliate_link.replace(/'/g, "\\'") : '';

    // ------------------------------------------------------------------
    // AMAZON AFFILIATE MODE: the single purchase action on every card is
    // "Buy on Amazon", which redirects to this product's affiliate_link
    // (set per-product in the admin panel) in a new tab. If a product does
    // not have a link saved yet, the button shows a disabled "Coming Soon"
    // state instead of a dead/blank redirect.
    // The old Add to Cart / Buy Now buttons are NOT deleted from the
    // codebase — see openPopup(), confirmAddToCart(), confirmBuyNow() etc.
    // further down in this file — they're just not rendered while the
    // store runs in affiliate mode (CART_ENABLED = false).
    // ------------------------------------------------------------------
    return `
        <div class="product-card" data-category="${p.category}" ${p.is_new ? 'data-new="true"' : ''}>
            ${p.discount_pct > 0 ? `<div class="badge-discount">-${p.discount_pct}%</div>` : ''}
            <div class="img-container">
                <img src="${p.image_url}" alt="${p.name}" loading="lazy" width="600" height="600">
                <i class="far fa-heart wishlist-icon-btn" onclick="toggleWishlist(this)"></i>
            </div>
            <div class="product-info">
                <div class="product-rating">${starsHtml(p.rating)}<span>(${p.rating_count})</span></div>
                <h3>${p.name}</h3>
                <div class="price"><span class="curr-price">₹${p.price.toLocaleString('en-IN')}</span>${p.orig_price > p.price ? `<span class="orig-price">₹${p.orig_price.toLocaleString('en-IN')}</span>` : ''}</div>
                <div class="prod-btns prod-btns-amazon">
                    ${hasLink
                        ? `<button class="btn btn-amazon" onclick="buyOnAmazon('${linkAttr}','${nameAttr}')"><i class="fab fa-amazon"></i> Buy on Amazon</button>`
                        : `<button class="btn btn-amazon btn-amazon-disabled" disabled title="Amazon link coming soon"><i class="fab fa-amazon"></i> Coming Soon</button>`}
                    <p class="amazon-disclaimer">You will be redirected to Amazon to complete your purchase.</p>
                </div>
            </div>
        </div>`;
}

// ============================================================
// AMAZON AFFILIATE REDIRECT
// ============================================================
function buyOnAmazon(link, name) {
    if (!link) { showToast('Amazon link coming soon for this product.', true); return; }
    // Opens Amazon in a brand-new tab; the storefront tab stays exactly where it was.
    window.open(link, '_blank', 'noopener,noreferrer');
}

async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    try {
        const res  = await fetch(API_BASE + 'get_products.php');
        const data = await res.json();
        if (data.result === 'success' && data.products.length) {
            grid.innerHTML = data.products.map(productCardHtml).join('');
        } else {
            grid.innerHTML = '<p class="products-loading">No products available right now.</p>';
        }
    } catch {
        grid.innerHTML = '<p class="products-loading">Could not load products. Check your server connection.</p>';
    }
    // Re-apply whatever filter matches the current URL hash now that cards exist
    applyFilterFromHash(false);
    // Product cards are injected after the initial page-load reveal pass ran,
    // so re-run it here to animate them in too.
    initScrollReveal();
}

// ============================================================
// INIT — wire up all static listeners after DOM ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // Load products from the database first — filterProducts()/applyFilterFromHash()
    // need the cards to exist in the DOM before they can show/hide anything.
    fetchProducts();

    // Theme
    document.getElementById('themeBtn').addEventListener('click', () => {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
        document.getElementById('themeBtn').className = dark ? 'fas fa-moon' : 'fas fa-sun';
    });

    // Mobile menu
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });

    // Search
    document.getElementById('searchBtn').addEventListener('click',  () => document.getElementById('searchOverlay').style.display = 'flex');
    document.getElementById('closeSearch').addEventListener('click', () => document.getElementById('searchOverlay').style.display = 'none');

    // ------------------------------------------------------------------
    // CART / CHECKOUT / SIZE-POPUP LISTENERS — DISABLED (not deleted).
    // Noble Fit currently runs in Amazon Affiliate mode (CART_ENABLED = false
    // at the top of this file), so the cart sidebar, checkout modal and size
    // popup are never opened by any button on the storefront. All of the
    // listener wiring and the functions it calls (renderCart, openCheckout,
    // placeOrder, applyCoupon, confirmAddToCart, confirmBuyNow, etc.) are
    // still fully present below — flip CART_ENABLED back to true to restore
    // this entire block's behaviour instantly.
    // ------------------------------------------------------------------
    if (CART_ENABLED) {
        // Cart sidebar
        document.getElementById('cartBtn').addEventListener('click',  () => document.getElementById('cartSidebar').classList.add('active'));
        document.getElementById('closeCart').addEventListener('click', () => document.getElementById('cartSidebar').classList.remove('active'));

        // Checkout close
        document.getElementById('closeCheckout').addEventListener('click', closeCheckout);

        // Close popup on overlay click
        document.getElementById('sizePopup').addEventListener('click', function(e) {
            if (e.target === this) closeSizePopup();
        });
    }

    // Back to top
    window.addEventListener('scroll', () => {
        document.getElementById('backToTop').style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    document.getElementById('backToTop').addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

    // ============================================================
    // PREMIUM UPDATES: DYNAMIC POPUP LISTENERS
    // Disabled (not deleted) while CART_ENABLED is false — see note above.
    // ============================================================
    if (CART_ENABLED) {
        // 1. Dynamic Size Selection
        const sizeButtons = document.querySelectorAll('.popup-size-grid .sz-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Agar button disabled state me ho to click rok do
                if (button.classList.contains('disabled')) return;

                // Purane active class ko remove karo aur naye wale par add karo
                sizeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // State variable update karo
                popup.size = button.getAttribute('data-size');
                document.getElementById('popupSizeErr').style.display = 'none';
            });
        });

        // 2. Quantity Decrement (-) Button Listener
        document.getElementById('popupDecreaseQty').addEventListener('click', () => {
            if (popup.qty > 1) {
                popup.qty--;
                updatePopupQtyAndTotal();
            }
        });

        // 3. Quantity Increment (+) Button Listener
        document.getElementById('popupIncreaseQty').addEventListener('click', () => {
            if (popup.qty < 10) { // Max limit 10 items
                popup.qty++;
                updatePopupQtyAndTotal();
            }
        });

        // 4. Confirm Buttons Connectors
        document.getElementById('popupCartBtn').addEventListener('click', confirmAddToCart);
        document.getElementById('popupBuyBtn').addEventListener('click', confirmBuyNow);
    }

    // 5. Contact form -> PHP/MySQL (unrelated to cart — always active)
    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);

    // 6. Newsletter form -> PHP/MySQL (unrelated to cart — always active)
    document.getElementById('newsletterForm').addEventListener('submit', handleNewsletterSubmit);

    // 7. Category filtering — nav links
    document.querySelectorAll('.nav-links a[data-filter]').forEach(a => {
        a.addEventListener('click', () => {
            // Close mobile menu after tapping a link
            document.getElementById('navLinks').classList.remove('active');
            const filter = a.getAttribute('data-filter');
            if (VALID_FILTERS.includes(filter)) {
                // Let the hash update naturally, then apply + smooth scroll to shop
                setTimeout(() => applyFilterFromHash(true), 0);
            }
        });
    });

    // 8. Category filtering — chip buttons inside the shop section
    document.querySelectorAll('.chip[data-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
            const filter = chip.getAttribute('data-filter');
            history.replaceState(null, '', filter === 'all' ? '#shop' : '#' + filter);
            filterProducts(filter);
        });
    });

    // 9. React to back/forward navigation or direct links with a category hash
    window.addEventListener('hashchange', () => applyFilterFromHash(true));

    // 10. Apply filter on first load if the URL already has a category hash
    applyFilterFromHash(false);

    // 11. Premium scroll-reveal animations for homepage sections
    initScrollReveal();
});

// ============================================================
// SCROLL-REVEAL ANIMATIONS (homepage polish)
// ============================================================
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.section-title, .category-card, .feature-item, .review-card, .about-content, .product-card'
    );
    targets.forEach(el => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
        // Fallback for very old browsers: just show everything immediately.
        targets.forEach(el => el.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
}

// Helper function to keep text and calculations synced smoothly
function updatePopupQtyAndTotal() {
    document.getElementById('popupQtyNum').textContent = popup.qty;
    const finalPrice = popup.price * popup.qty;
    document.getElementById('popupTotal').textContent = '₹' + finalPrice.toLocaleString('en-IN');
}

// ============================================================
// SIZE POPUP — open
// ============================================================
function openPopup(name, price, origPrice, img, isBuyNow) {
    popup = { name, price, origPrice: origPrice || price, img, size:'', qty:1, isBuyNow };

    // Product info
    document.getElementById('popupProductName').textContent = name;
    document.getElementById('popupCurrPrice').textContent   = '₹' + price.toLocaleString('en-IN');
    document.getElementById('popupOrigPrice').textContent   = '₹' + (origPrice || price).toLocaleString('en-IN');
    document.getElementById('popupOrigPrice').style.display = origPrice > price ? 'inline' : 'none';

    const disc = origPrice > price ? Math.round((1 - price / origPrice) * 100) : 0;
    const discEl = document.getElementById('popupDisc');
    discEl.textContent = disc > 0 ? `-${disc}%` : '';
    discEl.style.display = disc > 0 ? 'inline-block' : 'none';

    // Premium Thumb image rendering via image node src
    const thumb = document.getElementById('popupThumb');
    if (img) { 
        thumb.src = img; 
        thumb.style.display = 'block';
    } else { 
        thumb.style.display = 'none'; 
    }

    // Reset size grid & active classes safely
    document.querySelectorAll('.popup-size-grid .sz-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('popupSizeErr').style.display = 'none';
    document.getElementById('popupQtyNum').textContent = '1';
    document.getElementById('popupTotal').textContent  = '₹' + price.toLocaleString('en-IN');

    // Show popup
    document.getElementById('sizePopup').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// --- legacy wrappers so old onclick calls still work ---
function addToCart(n,p,o,i)  { openPopup(n,p,o,i||'',false); }
function openBuyNow(n,p,o,i) { openPopup(n,p,o,i||'',true);  }

function closeSizePopup() {
    document.getElementById('sizePopup').style.display = 'none';
    document.body.style.overflow = '';
}

// ============================================================
// CONFIRM ACTIONS
// ============================================================
function confirmAddToCart() {
    if (!popup.size) { showSizeErr(); return; }

    const existing = cartItems.find(i => i.name === popup.name && i.size === popup.size);
    if (existing) {
        existing.qty += popup.qty;
    } else {
        cartItems.push({ id: Date.now(), name: popup.name, price: popup.price, size: popup.size, qty: popup.qty, img: popup.img });
    }

    renderCart();
    closeSizePopup();
    document.getElementById('cartSidebar').classList.add('active');
    showToast(popup.name + ' added to bag!');
}

function confirmBuyNow() {
    if (!popup.size) { showSizeErr(); return; }
    const items = [{ id: Date.now(), name: popup.name, price: popup.price, size: popup.size, qty: popup.qty, img: popup.img }];
    closeSizePopup();
    openCheckoutWithItems(items);
}

function showSizeErr() {
    document.getElementById('popupSizeErr').style.display = 'flex';
    const grid = document.getElementById('popupSizeGrid');
    grid.classList.add('shake');
    setTimeout(() => grid.classList.remove('shake'), 400);
}

// ============================================================
// CART RENDER
// ============================================================
function renderCart() {
    const el        = document.getElementById('cartItems');
    const totalQty  = cartItems.reduce((s,i) => s + i.qty, 0);
    document.getElementById('cartCount').textContent = totalQty || 0;

    if (!cartItems.length) {
        el.innerHTML = `
            <div class="cart-empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>Your bag is empty</p>
                <span>Add products to get started</span>
            </div>`;
        document.getElementById('cartGrandTotal').textContent = '₹0';
        return;
    }

    el.innerHTML = cartItems.map((item, idx) => `
        <div class="cart-item">
            <div class="cart-thumb" style="background-image:url('${item.img}')">
                ${!item.img ? '<i class="fas fa-tshirt"></i>' : ''}
            </div>
            <div class="cart-body">
                <p class="cart-name">${item.name}</p>
                <div class="cart-tags">
                    <span class="cart-size-tag">Size: ${item.size}</span>
                    <span class="cart-unit">₹${item.price.toLocaleString('en-IN')}</span>
                </div>
                <div class="cart-bottom">
                    <div class="cart-qty">
                        <button onclick="cartQty(${idx},-1)">−</button>
                        <span>${item.qty}</span>
                        <button onclick="cartQty(${idx},1)">+</button>
                    </div>
                    <span class="cart-line-total">₹${(item.price*item.qty).toLocaleString('en-IN')}</span>
                </div>
            </div>
            <button class="cart-del" onclick="cartDel(${idx})"><i class="fas fa-times"></i></button>
        </div>`).join('');

    const grand = cartItems.reduce((s,i) => s + i.price*i.qty, 0);
    document.getElementById('cartGrandTotal').textContent = '₹' + grand.toLocaleString('en-IN');
}

function cartQty(idx, d) {
    cartItems[idx].qty = Math.max(1, cartItems[idx].qty + d);
    renderCart();
}
function cartDel(idx) {
    cartItems.splice(idx, 1);
    renderCart();
}

// ============================================================
// CHECKOUT
// ============================================================
function openCheckout() {
    if (!cartItems.length) { showToast('Pehle kuch products add karein!', true); return; }
    openCheckoutWithItems(cartItems);
}

// (Baki bacha checkout aur validation function code unchanged waise hi handle hoga)
function openCheckoutWithItems(items) {
    appliedCoupon = null; // reset any previously applied coupon each time checkout opens
    document.getElementById('co-coupon-code').value = '';
    document.getElementById('couponMsg').textContent = '';
    document.getElementById('couponMsg').className = 'coupon-msg';

    document.getElementById('checkoutOverlay').dataset.items = JSON.stringify(items);
    renderCheckoutSummary();

    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('checkoutOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderCheckoutSummary() {
    const overlay = document.getElementById('checkoutOverlay');
    const items   = JSON.parse(overlay.dataset.items || '[]');
    const grand   = items.reduce((s,i) => s + i.price*i.qty, 0);
    const totalQty = items.reduce((s,i) => s + i.qty, 0);
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalTotal = Math.max(0, grand - discount);

    document.getElementById('checkoutSummary').innerHTML = `
        <div class="co-summary">
            <div class="co-summary-head">
                <span><i class="fas fa-receipt"></i> Order Summary</span>
                <span class="co-badge">${totalQty} item${totalQty>1?'s':''}</span>
            </div>
            <div class="co-items">
                ${items.map(item => `
                <div class="co-item">
                    <div class="co-thumb" style="background-image:url('${item.img}')">
                        ${!item.img ? '<i class="fas fa-tshirt"></i>' : ''}
                    </div>
                    <div class="co-info">
                        <p class="co-name">${item.name}</p>
                        <div class="co-tags">
                            <span class="co-tag"><i class="fas fa-ruler-horizontal"></i> ${item.size}</span>
                            <span class="co-tag"><i class="fas fa-layer-group"></i> Qty ${item.qty}</span>
                        </div>
                        <p class="co-unit">₹${item.price.toLocaleString('en-IN')} × ${item.qty}</p>
                    </div>
                    <span class="co-amt">₹${(item.price*item.qty).toLocaleString('en-IN')}</span>
                </div>`).join('')}
            </div>
            <div class="co-breakdown">
                <div class="co-row"><span>Subtotal</span><span>₹${grand.toLocaleString('en-IN')}</span></div>
                ${discount > 0 ? `<div class="co-row co-discount"><span>Coupon (${appliedCoupon.code})</span><span>−₹${discount.toLocaleString('en-IN')}</span></div>` : ''}
                <div class="co-row"><span><i class="fas fa-truck"></i> Delivery</span><span class="co-free">FREE</span></div>
                <div class="co-row co-grand"><span>Total Amount</span><span>₹${finalTotal.toLocaleString('en-IN')}</span></div>
            </div>
        </div>`;

    overlay.dataset.total = finalTotal;
}

async function applyCoupon() {
    const code = document.getElementById('co-coupon-code').value.trim();
    const msgEl = document.getElementById('couponMsg');
    if (!code) { msgEl.textContent = 'Pehle coupon code daaliye.'; msgEl.className = 'coupon-msg err'; return; }

    const items = JSON.parse(document.getElementById('checkoutOverlay').dataset.items || '[]');
    const subtotal = items.reduce((s,i) => s + i.price*i.qty, 0);

    const btn = document.getElementById('applyCouponBtn');
    btn.disabled = true;
    try {
        const res  = await fetch(API_BASE + 'validate_coupon.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, subtotal })
        });
        const data = await res.json();
        if (data.result === 'success') {
            appliedCoupon = { code: data.code, discount: data.discount };
            msgEl.textContent = data.message;
            msgEl.className = 'coupon-msg ok';
            renderCheckoutSummary();
        } else {
            appliedCoupon = null;
            msgEl.textContent = data.message || 'Invalid coupon.';
            msgEl.className = 'coupon-msg err';
            renderCheckoutSummary();
        }
    } catch {
        msgEl.textContent = 'Network error, dobara try karein.';
        msgEl.className = 'coupon-msg err';
    } finally {
        btn.disabled = false;
    }
}

function closeCheckout() {
    document.getElementById('checkoutOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

async function placeOrder() {
    const name    = document.getElementById('co-name').value.trim();
    const mobile  = document.getElementById('co-mobile').value.trim();
    const address = document.getElementById('co-address').value.trim();
    const pincode = document.getElementById('co-pincode').value.trim();

    if (!name)                               { fieldErr('co-name');    return; }
    if (!mobile||mobile.length!==10||isNaN(mobile)) { fieldErr('co-mobile');  return; }
    if (!address)                            { fieldErr('co-address'); return; }
    if (!pincode||pincode.length!==6||isNaN(pincode)) { fieldErr('co-pincode'); return; }

    const overlay = document.getElementById('checkoutOverlay');
    const items   = JSON.parse(overlay.dataset.items || '[]');

    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        const res = await fetch(API_BASE + 'place_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, mobile, address, pincode, items,
                coupon_code: appliedCoupon ? appliedCoupon.code : ''
            })
        });
        const data = await res.json();

        if (data.result !== 'success') {
            showToast(data.message || 'Order place nahi ho paaya.', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
            return;
        }

        // Hand the order summary to the dedicated Thank You page via sessionStorage
        sessionStorage.setItem('nfLastOrder', JSON.stringify({
            orderId: data.order_id, name, mobile, address, pincode,
            items: data.items, totalAmount: '₹' + data.total.toLocaleString('en-IN'),
            placedAt: new Date().toLocaleString('en-IN')
        }));

        cartItems = [];
        appliedCoupon = null;
        renderCart();
        ['co-name','co-mobile','co-address','co-pincode'].forEach(id => document.getElementById(id).value = '');

        window.location.href = 'thank-you.html';
    } catch {
        showToast('Network error. Dobara try karein.', true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
    }
}

function fieldErr(id) {
    const el = document.getElementById(id);
    el.classList.add('field-err');
    el.focus();
    setTimeout(() => el.classList.remove('field-err'), 2500);
}

// ============================================================
// CONTACT FORM -> api/contact.php -> MySQL
// ============================================================
async function handleContactSubmit(e) {
    e.preventDefault();

    const name    = document.getElementById('ct-name').value.trim();
    const email   = document.getElementById('ct-email').value.trim();
    const phone   = document.getElementById('ct-phone').value.trim();
    const message = document.getElementById('ct-message').value.trim();

    if (!name)    { fieldErr('ct-name');    return; }
    if (!email)   { fieldErr('ct-email');   return; }
    if (!message) { fieldErr('ct-message'); return; }

    const btn = document.getElementById('contactBtn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const res  = await fetch(API_BASE + 'contact.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, message })
        });
        const data = await res.json();
        if (data.result === 'success') {
            showToast('Message sent! We will get back to you soon.');
            document.getElementById('contactForm').reset();
        } else {
            showToast(data.message || 'Something went wrong.', true);
        }
    } catch {
        showToast('Network error. Please try again.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ============================================================
// NEWSLETTER FORM -> api/newsletter.php -> MySQL
// ============================================================
async function handleNewsletterSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('nl-email').value.trim();
    if (!email) { fieldErr('nl-email'); return; }

    const btn = document.getElementById('newsletterBtn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const res  = await fetch(API_BASE + 'newsletter.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.result === 'success') {
            showToast('Subscribed! Thanks for joining Noble Fit.');
            document.getElementById('newsletterForm').reset();
        } else {
            showToast(data.message || 'Something went wrong.', true);
        }
    } catch {
        showToast('Network error. Please try again.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

// ============================================================
// WISHLIST
// ============================================================
function toggleWishlist(el) {
    if (el.classList.contains('far')) { el.classList.replace('far','fas'); wishlistCnt++; }
    else                              { el.classList.replace('fas','far'); wishlistCnt--; }
    document.getElementById('wishlistCount').textContent = wishlistCnt;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, isErr = false) {
    const t = document.getElementById('nfToast');
    t.textContent = msg;
    t.className   = 'nf-toast show' + (isErr ? ' err' : '');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3000);
}
