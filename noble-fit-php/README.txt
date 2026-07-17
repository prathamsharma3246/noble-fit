NOBLE FIT — PHP + MySQL BACKEND SETUP (XAMPP)
================================================

WHAT CHANGED
------------
- Google Sheets backend completely removed (no more SHEET_URL, sendToSheet(), Code.gs).
- Products are no longer hardcoded in index.html — they now live in a MySQL "products"
  table and load dynamically via api/get_products.php.
- Orders, Contact form, and Newsletter signups now save to MySQL instead of a Sheet.
- A coupon code system has been added (percent or flat discount, min order amount,
  usage limit, expiry date) — fully manageable from the admin panel.
- A simple admin panel (/admin) lets you add/edit/delete products (with image upload),
  create/manage coupons, and view orders.


STEP 1 — Copy the project into XAMPP
-------------------------------------
1. Copy this whole "noble-fit-php" folder into your XAMPP htdocs folder, e.g.:
   C:\xampp\htdocs\noble-fit-php\   (Windows)
   /Applications/XAMPP/htdocs/noble-fit-php/   (Mac)

2. Open the XAMPP Control Panel and START both "Apache" and "MySQL".


STEP 2 — Create the database
------------------------------
1. Open http://localhost/phpmyadmin in your browser.
2. Click "Import" (top tab).
3. Choose File -> select "database/schema.sql" from this project.
4. Click "Go".

This single import creates:
  - The `noble_fit` database with all 7 tables (products, orders, order_items,
    coupons, contacts, newsletter, admin_users)
  - Your existing 12 products, pre-loaded so the site isn't empty
  - One sample coupon: code NOBLE10 = 10% off (min order ₹500, capped at ₹300)
  - One admin login: username `admin` / password `admin123`


STEP 3 — Open the site
------------------------
Storefront:   http://localhost/noble-fit-php/
Admin panel:  http://localhost/noble-fit-php/admin/
              (login: admin / admin123 — change this password's hash in the
               admin_users table once you're comfortable, or ask me to add a
               "change password" screen later)

Test the full flow:
  1. Browse products (they're now loading live from MySQL).
  2. Add something to cart, go to checkout.
  3. Try coupon code NOBLE10.
  4. Place a test order — check it appears in phpMyAdmin under `orders` /
     `order_items`, and in the admin panel under "Orders".
  5. Submit the Contact form and Newsletter box — check the `contacts` and
     `newsletter` tables.
  6. In the admin panel, add a new product (upload an image or paste a
     Cloudinary URL) and confirm it appears live on the storefront.


IF SOMETHING DOESN'T WORK
---------------------------
- "Database connection failed" on the storefront -> open api/config.php and
  confirm DB_USER/DB_PASS match your MySQL setup (XAMPP default is root / blank
  password — only change this if you set a MySQL password yourself).
- Products don't show up -> make sure you actually imported database/schema.sql
  and that MySQL is running in the XAMPP panel.
- Uploaded product images don't show -> confirm the uploads/products/ folder
  exists and is writable (it should be, by default, under htdocs).


FOLDER STRUCTURE
------------------
noble-fit-php/
  index.html, thank-you.html, style.css, script.js   -> the storefront
  api/            -> PHP endpoints the storefront JS calls
  admin/          -> the admin panel (products, coupons, orders)
  uploads/products/ -> where admin-uploaded product images are stored
  database/schema.sql -> import this once into phpMyAdmin
  database/migration_add_affiliate_link.sql -> run this instead if you already
                                                have a working database and just
                                                need the new affiliate_link column


AMAZON AFFILIATE MODE (current setup)
----------------------------------------
Noble Fit currently runs as an Amazon Affiliate storefront, not a self-fulfilled
store:
  - Every product card shows one button: "Buy on Amazon", which opens that
    product's Amazon affiliate link in a new tab.
  - To set a product's Amazon link: Admin Panel > Products > Edit > paste the
    link into "Amazon Affiliate Link", then Save. If it's left blank, the
    button shows "Coming Soon" instead of a broken link.
  - If you already had a database before this update, run
    database/migration_add_affiliate_link.sql once in phpMyAdmin's SQL tab
    (this just adds the new column — it will NOT touch your existing products,
    orders or admin login).

BRINGING BACK YOUR OWN SHOPPING CART LATER
---------------------------------------------
Nothing was deleted to make this switch. The full cart, checkout, coupon and
order-placement code is still in script.js/index.html/api/place_order.php —
it's simply turned off. To switch back to selling directly again later:
  1. Open script.js and change `const CART_ENABLED = false;` to `true`
     near the top of the file.
  2. Remove the `.cart-icon { display:none; }` rule near the bottom of
     style.css (search for "Header cart entry point").
That's it — no rebuild needed.
