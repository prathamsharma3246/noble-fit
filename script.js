// ============================================================
// NOBLE FIT — PROFESSIONAL ECOMMERCE SCRIPT
// ============================================================

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyWtv_B8KL9ao9B-JHNMsKhwQDUQCYT-vWocvYUfKpgZg0HUmIpd3Il09NZitmqDAfCTA/exec';

// --- State ---
let cartItems   = [];
let wishlistCnt = 0;
let popup       = { name:'', price:0, origPrice:0, img:'', size:'', qty:1, isBuyNow:false };

// ============================================================
// INIT — wire up all static listeners after DOM ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

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

    // Cart sidebar
    document.getElementById('cartBtn').addEventListener('click',  () => document.getElementById('cartSidebar').classList.add('active'));
    document.getElementById('closeCart').addEventListener('click', () => document.getElementById('cartSidebar').classList.remove('active'));

    // Checkout close
    document.getElementById('closeCheckout').addEventListener('click', closeCheckout);

    // Close popup on overlay click
    document.getElementById('sizePopup').addEventListener('click', function(e) {
        if (e.target === this) closeSizePopup();
    });

    // Back to top
    window.addEventListener('scroll', () => {
        document.getElementById('backToTop').style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    document.getElementById('backToTop').addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
});

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

    // Thumb image
    const thumb = document.getElementById('popupThumb');
    if (img) { thumb.style.backgroundImage = `url('${img}')`; thumb.innerHTML = ''; }
    else      { thumb.style.backgroundImage = 'none'; thumb.innerHTML = '<i class="fas fa-tshirt"></i>'; }

    // Reset size + qty
    document.querySelectorAll('.sz-btn').forEach(b => b.classList.remove('active'));
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
// SIZE SELECTION
// ============================================================
function selectSize(btn, size) {
    popup.size = size;
    document.querySelectorAll('.sz-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('popupSizeErr').style.display = 'none';
}

// ============================================================
// QUANTITY
// ============================================================
function changeQty(delta) {
    popup.qty = Math.max(1, Math.min(10, popup.qty + delta));
    document.getElementById('popupQtyNum').textContent = popup.qty;
    document.getElementById('popupTotal').textContent  = '₹' + (popup.price * popup.qty).toLocaleString('en-IN');
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

function openCheckoutWithItems(items) {
    const grand    = items.reduce((s,i) => s + i.price*i.qty, 0);
    const totalQty = items.reduce((s,i) => s + i.qty, 0);

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
                <div class="co-row"><span><i class="fas fa-truck"></i> Delivery</span><span class="co-free">FREE</span></div>
                <div class="co-row co-grand"><span>Total Amount</span><span>₹${grand.toLocaleString('en-IN')}</span></div>
            </div>
        </div>`;

    document.getElementById('checkoutOverlay').dataset.items = JSON.stringify(items);
    document.getElementById('checkoutOverlay').dataset.total = grand;
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('checkoutOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
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

    if (!name)                              { fieldErr('co-name');    return; }
    if (!mobile||mobile.length!==10||isNaN(mobile)) { fieldErr('co-mobile');  return; }
    if (!address)                           { fieldErr('co-address'); return; }
    if (!pincode||pincode.length!==6||isNaN(pincode)) { fieldErr('co-pincode'); return; }

    const overlay     = document.getElementById('checkoutOverlay');
    const items       = JSON.parse(overlay.dataset.items || '[]');
    const totalAmount = '₹' + (overlay.dataset.total || 0);
    const orderDetail = items.map(i => `${i.name}|Size:${i.size}|Qty:${i.qty}|₹${i.price*i.qty}`).join(' || ');

    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        await fetch(SHEET_URL, {
            method:'POST', mode:'no-cors',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name, mobile, address, pincode, orderDetail, totalAmount })
        });
        closeCheckout();
        document.getElementById('successOverlay').classList.add('active');
        cartItems = [];
        renderCart();
        ['co-name','co-mobile','co-address','co-pincode'].forEach(id => document.getElementById(id).value = '');
    } catch {
        showToast('Network error. Dobara try karein.', true);
    } finally {
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

function closeSuccess() {
    document.getElementById('successOverlay').classList.remove('active');
    document.body.style.overflow = '';
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
