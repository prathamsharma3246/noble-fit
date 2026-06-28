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
let cartCount = 0;
let wishlistCount = 0;
let cartItems = [];

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

// ---------- Size Popup ----------
let selectedProduct = "";
let selectedPrice = 0;
let selectedSize = "";

function addToCart(pName, pPrice) {

    selectedProduct = pName;
    selectedPrice = pPrice;

    document.getElementById("sizePopup").style.display = "flex";

}
function selectSize(size){

    selectedSize = size;

    alert("Selected Size : " + size);

}
function confirmAddToCart(){

    if(selectedSize==""){

        alert("Please Select Size");

        return;

    }

    cartCount++;

    document.getElementById("cartCount").innerText=cartCount;

    cartItems.push({

        name:selectedProduct,

        price:selectedPrice,

        size:selectedSize

    });

    alert(selectedProduct+" Added Successfully");

    document.getElementById("sizePopup").style.display="none";

}

// --- Remove from Cart ---
function removeItem(element, price, index) {
    element.parentElement.remove();
    cartCount--;
    document.getElementById('cartCount').innerText = cartCount;
    cartItems.splice(index, 1);
    updateTotal(-price);

    const cartItemsEl = document.getElementById('cartItems');
    if (cartItemsEl.children.length === 0) {
        cartItemsEl.innerHTML = '<p class="empty-msg">Your shopping bag is empty.</p>';
    }
}

// --- Update Total ---
function updateTotal(price) {
    const totalSpan = document.querySelector('.total-price span');
    let currentTotal = parseInt(totalSpan.innerText.replace('₹', '')) || 0;
    totalSpan.innerText = '₹' + (currentTotal + price);
}

// --- Buy Now (direct checkout) ---
function buyNow(pName, pPrice) {
    cartItems = [{ name: pName, price: pPrice }];
    cartCount = 1;
    document.getElementById('cartCount').innerText = 1;
    document.querySelector('.total-price span').innerText = '₹' + pPrice;
    openCheckout();
}

// --- Open Checkout Modal ---
function openCheckout() {
    if (cartItems.length === 0) {
        alert('Aapka cart khali hai! Pehle kuch products add karein.');
        return;
    }

    const totalSpan = document.querySelector('.total-price span');
    const total = totalSpan.innerText;

    let summaryHTML = '<h4>Order Summary</h4>';
    cartItems.forEach(item => {
        summaryHTML += `<div class="summary-item"><span>${item.name}</span><span>₹${item.price}</span></div>`;
    });
    summaryHTML += `<div class="summary-total"><span>Total Amount</span><span>${total}</span></div>`;
    document.getElementById('checkoutSummary').innerHTML = summaryHTML;

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

    if (!name) { alert('Kripya apna naam darj karein.'); return; }
    if (!mobile || mobile.length !== 10 || isNaN(mobile)) { alert('Kripya 10 digit ka valid mobile number darj karein.'); return; }
    if (!address) { alert('Kripya apna address darj karein.'); return; }
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) { alert('Kripya 6 digit ka valid pin code darj karein.'); return; }

    const orderDetails = cartItems.map(i => i.name + ' (₹' + i.price + ')').join(', ');
    const totalAmount = document.querySelector('.total-price span').innerText;

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

    } catch (err) {
        alert('Network error. Kripya dobara try karein.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
    }
}

// --- Reset Cart ---
function resetCart() {
    cartItems = [];
    cartCount = 0;
    document.getElementById('cartCount').innerText = 0;
    document.getElementById('cartItems').innerHTML = '<p class="empty-msg">Your shopping bag is empty.</p>';
    document.querySelector('.total-price span').innerText = '₹0';
    document.getElementById('co-name').value = '';
    document.getElementById('co-mobile').value = '';
    document.getElementById('co-address').value = '';
    document.getElementById('co-pincode').value = '';
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
}

// --- Close Success Modal ---
function closeSuccess() {
    document.getElementById('successOverlay').classList.remove('active');
}

// --- Wishlist ---
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

// --- Back to Top ---
window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 300 ? 'flex' : 'none';
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
