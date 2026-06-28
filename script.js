// --- DOM Elements ---
const themeBtn = document.getElementById('themeBtn');
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
const searchBtn = document.getElementById('searchBtn');
const searchOverlay = document.getElementById('searchOverlay');
const closeSearch = document.getElementById('closeSearch');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const backToTop = document.getElementById('backToTop');

// --- Google Sheet URL ---
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyWtv_B8KL9ao9B-JHNMsKhwQDUQCYT-vWocvYUfKpgZg0HUmIpd3Il09NZitmqDAfCTA/exec';

// --- State ---
let cartItems = [];
let wishlistCount = 0;

// --- Dark Mode Toggle ---
themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeBtn.classList.replace('fa-sun', 'fa-moon');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.classList.replace('fa-moon', 'fa-sun');
    }
});

// --- Mobile Menu ---
menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('fa-times');
});

// --- Search Overlay ---
searchBtn.addEventListener('click', () => searchOverlay.style.display = 'flex');
closeSearch.addEventListener('click', () => searchOverlay.style.display = 'none');

// --- Cart Sidebar ---
cartBtn.addEventListener('click', () => cartSidebar.classList.add('active'));
closeCart.addEventListener('click', () => cartSidebar.classList.remove('active'));

// ========== SIZE POPUP ==========
let selectedProduct = "";
let selectedPrice = 0;
let selectedOrigPrice = 0;
let selectedSize = "";
let selectedQty = 1;
let isBuyNow = false;

function addToCart(pName, pPrice, pOrigPrice) {
    isBuyNow = false;
    openSizePopup(pName, pPrice, pOrigPrice || pPrice);
}

function openBuyNow(pName, pPrice, pOrigPrice) {
    isBuyNow = true;
    openSizePopup(pName, pPrice, pOrigPrice || pPrice);
}

function openSizePopup(pName, pPrice, pOrigPrice) {
    selectedProduct = pName;
    selectedPrice = pPrice;
    selectedOrigPrice = pOrigPrice;
    selectedQty = 1;
    selectedSize = "";

    document.getElementById("popupProductName").innerText = pName;

    // Price display with strikethrough orig price
    const discount = pOrigPrice > pPrice ? Math.round((1 - pPrice / pOrigPrice) * 100) : 0;
    document.getElementById("popupProductPrice").innerHTML =
        `₹${pPrice.toLocaleString('en-IN')} <span class="popup-orig-price">₹${pOrigPrice.toLocaleString('en-IN')}</span>`;

    const badge = document.getElementById("popupDiscountBadge");
    if (discount > 0) {
        badge.textContent = discount + "% off";
        badge.classList.add("visible");
    } else {
        badge.classList.remove("visible");
    }

    document.getElementById("qtyValue").innerText = "1";
    document.getElementById("popupLineTotal").innerText = "₹" + pPrice.toLocaleString('en-IN');

    document.querySelectorAll(".size-buttons button").forEach(btn => {
        btn.classList.remove("active");
    });

    // Update button text based on action
    const confirmBtn = document.getElementById("confirmActionBtn");
    const buySecBtn = document.getElementById("buyNowSecondaryBtn");

    if (isBuyNow) {
        confirmBtn.innerHTML = '<i class="fas fa-bolt"></i> Buy Now';
        confirmBtn.className = 'buy-btn';
        confirmBtn.onclick = confirmBuyNow;
        buySecBtn.style.display = 'none';
    } else {
        confirmBtn.innerHTML = '<i class="fas fa-shopping-bag"></i> Add to Cart';
        confirmBtn.className = 'confirm-btn';
        confirmBtn.onclick = confirmAddToCart;
        buySecBtn.style.display = 'flex';
        buySecBtn.onclick = function() {
            isBuyNow = true;
            confirmBuyNow();
        };
    }

    document.getElementById("sizePopup").style.display = "flex";
}

function selectSize(button, size) {
    selectedSize = size;
    document.querySelectorAll(".size-buttons button").forEach(btn => {
        btn.classList.remove("active");
    });
    button.classList.add("active");
}

function increaseQty() {
    selectedQty++;
    document.getElementById("qtyValue").innerText = selectedQty;
    updatePopupTotal();
}

function decreaseQty() {
    if (selectedQty > 1) {
        selectedQty--;
        document.getElementById("qtyValue").innerText = selectedQty;
        updatePopupTotal();
    }
}

function updatePopupTotal() {
    document.getElementById("popupLineTotal").innerText = "₹" + (selectedPrice * selectedQty).toLocaleString('en-IN');
}

function closeSizePopup() {
    document.getElementById("sizePopup").style.display = "none";
    selectedQty = 1;
    selectedSize = "";
}

function confirmAddToCart() {
    if (selectedSize === "") {
        showSizeError();
        return;
    }

    // Check if same product+size already in cart
    const existingIndex = cartItems.findIndex(i => i.name === selectedProduct && i.size === selectedSize);
    if (existingIndex > -1) {
        cartItems[existingIndex].qty += selectedQty;
    } else {
        cartItems.push({
            name: selectedProduct,
            price: selectedPrice,
            size: selectedSize,
            qty: selectedQty,
            id: Date.now()
        });
    }

    updateCartUI();
    closeSizePopup();
    cartSidebar.classList.add('active');
    showToast(`${selectedProduct} added to bag!`);
}

function confirmBuyNow() {
    if (selectedSize === "") {
        showSizeError();
        return;
    }

    // Buy now: only this product
    const buyItems = [{
        name: selectedProduct,
        price: selectedPrice,
        size: selectedSize,
        qty: selectedQty,
        id: Date.now()
    }];

    closeSizePopup();
    openCheckoutWithItems(buyItems);
}

function showSizeError() {
    const sizeSection = document.querySelector('.size-error-msg');
    if (sizeSection) {
        sizeSection.style.display = 'block';
        setTimeout(() => sizeSection.style.display = 'none', 2500);
    } else {
        // Shake size buttons
        const sizeBtns = document.querySelector('.size-buttons');
        sizeBtns.style.animation = 'shake 0.4s ease';
        setTimeout(() => sizeBtns.style.animation = '', 400);
    }
}

// ========== CART UI ==========
function updateCartUI() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartCountEl = document.getElementById('cartCount');

    const totalQty = cartItems.reduce((sum, i) => sum + i.qty, 0);
    cartCountEl.innerText = totalQty;

    if (cartItems.length === 0) {
        cartItemsEl.innerHTML = '<p class="empty-msg">Your shopping bag is empty.</p>';
        document.querySelector('.total-price span').innerText = '₹0';
        return;
    }

    let html = '';
    cartItems.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        html += `
        <div class="cart-item-row" data-id="${item.id}">
            <div class="cart-item-info">
                <p class="cart-item-name">${item.name}</p>
                <div class="cart-item-meta">
                    <span class="cart-size-badge">Size: ${item.size}</span>
                    <span class="cart-price-tag">₹${item.price.toLocaleString('en-IN')}</span>
                </div>
                <div class="cart-qty-controls">
                    <button onclick="updateCartQty(${index}, -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="updateCartQty(${index}, 1)">+</button>
                </div>
            </div>
            <div class="cart-item-right">
                <p class="cart-item-total">₹${itemTotal.toLocaleString('en-IN')}</p>
                <i class="fas fa-trash-alt cart-remove-btn" onclick="removeItem(${index})"></i>
            </div>
        </div>`;
    });

    cartItemsEl.innerHTML = html;

    const grandTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    document.querySelector('.total-price span').innerText = '₹' + grandTotal.toLocaleString('en-IN');
}

function updateCartQty(index, delta) {
    cartItems[index].qty += delta;
    if (cartItems[index].qty < 1) cartItems[index].qty = 1;
    updateCartUI();
}

function removeItem(index) {
    cartItems.splice(index, 1);
    updateCartUI();
}

// ========== CHECKOUT ==========
function openCheckout() {
    if (cartItems.length === 0) {
        showToast('Pehle kuch products add karein!', true);
        return;
    }
    openCheckoutWithItems(cartItems);
}

function openCheckoutWithItems(items) {
    const grandTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    let summaryHTML = `
    <div class="order-summary-header">
        <i class="fas fa-receipt"></i>
        <h4>Order Summary</h4>
        <span class="item-count">${items.length} item${items.length > 1 ? 's' : ''}</span>
    </div>
    <div class="order-items-list">`;

    items.forEach(item => {
        const itemTotal = item.price * item.qty;
        summaryHTML += `
        <div class="order-item-row">
            <div class="order-item-details">
                <p class="order-item-name">${item.name}</p>
                <div class="order-item-tags">
                    <span class="order-size-tag"><i class="fas fa-ruler"></i> Size: ${item.size}</span>
                    <span class="order-qty-tag"><i class="fas fa-layer-group"></i> Qty: ${item.qty}</span>
                    <span class="order-unit-price">₹${item.price.toLocaleString('en-IN')} each</span>
                </div>
            </div>
            <div class="order-item-amount">₹${itemTotal.toLocaleString('en-IN')}</div>
        </div>`;
    });

    summaryHTML += `</div>
    <div class="order-price-breakdown">
        <div class="price-row">
            <span>Subtotal</span>
            <span>₹${grandTotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="price-row delivery-row">
            <span><i class="fas fa-truck"></i> Delivery</span>
            <span class="free-delivery">FREE</span>
        </div>
        <div class="price-row grand-total-row">
            <span>Total Amount</span>
            <span>₹${grandTotal.toLocaleString('en-IN')}</span>
        </div>
    </div>`;

    document.getElementById('checkoutSummary').innerHTML = summaryHTML;
    document.getElementById('checkoutOverlay').setAttribute('data-items', JSON.stringify(items));
    document.getElementById('checkoutOverlay').setAttribute('data-total', grandTotal);

    cartSidebar.classList.remove('active');
    document.getElementById('checkoutOverlay').classList.add('active');
}

document.getElementById('closeCheckout').addEventListener('click', () => {
    document.getElementById('checkoutOverlay').classList.remove('active');
});

// --- Place Order ---
async function placeOrder() {
    const name = document.getElementById('co-name').value.trim();
    const mobile = document.getElementById('co-mobile').value.trim();
    const address = document.getElementById('co-address').value.trim();
    const pincode = document.getElementById('co-pincode').value.trim();

    if (!name) { showFormError('co-name', 'Naam darj karein'); return; }
    if (!mobile || mobile.length !== 10 || isNaN(mobile)) { showFormError('co-mobile', '10 digit mobile number darj karein'); return; }
    if (!address) { showFormError('co-address', 'Address darj karein'); return; }
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) { showFormError('co-pincode', '6 digit pin code darj karein'); return; }

    const overlay = document.getElementById('checkoutOverlay');
    const items = JSON.parse(overlay.getAttribute('data-items') || '[]');
    const totalAmount = '₹' + overlay.getAttribute('data-total');

    const orderDetails = items.map(i =>
        `${i.name} | Size: ${i.size} | Qty: ${i.qty} | ₹${i.price * i.qty}`
    ).join(' || ');

    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, address, pincode, orderDetails, totalAmount })
        });

        document.getElementById('checkoutOverlay').classList.remove('active');
        document.getElementById('successOverlay').classList.add('active');
        resetCart();
        resetForm();

    } catch (err) {
        alert('Network error. Kripya dobara try karein.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
    }
}

function showFormError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    el.focus();
    el.style.borderColor = 'red';
    el.placeholder = msg;
    setTimeout(() => {
        el.style.borderColor = '';
        el.placeholder = el.getAttribute('data-placeholder') || '';
    }, 2500);
}

// --- Reset ---
function resetCart() {
    cartItems = [];
    updateCartUI();
}

function resetForm() {
    ['co-name', 'co-mobile', 'co-address', 'co-pincode'].forEach(id => {
        document.getElementById(id).value = '';
    });
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
}

function closeSuccess() {
    document.getElementById('successOverlay').classList.remove('active');
}

// ========== WISHLIST ==========
function toggleWishlist(element) {
    if (element.classList.contains('far')) {
        element.classList.replace('far', 'fas');
        wishlistCount++;
    } else {
        element.classList.replace('fas', 'far');
        wishlistCount--;
    }
    document.getElementById('wishlistCount').innerText = wishlistCount;
}

// ========== TOAST NOTIFICATION ==========
function showToast(msg, isError = false) {
    let toast = document.getElementById('nf-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nf-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'nf-toast' + (isError ? ' error' : '');
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== BACK TO TOP ==========
window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 300 ? 'flex' : 'none';
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
