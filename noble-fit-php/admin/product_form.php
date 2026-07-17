<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();

$id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
$product = ['name'=>'', 'category'=>'tshirts', 'is_new'=>0, 'price'=>'', 'orig_price'=>'', 'image_url'=>'', 'affiliate_link'=>'', 'rating'=>4.5, 'rating_count'=>0, 'is_active'=>1];
if ($id) {
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $found = $stmt->get_result()->fetch_assoc();
    if ($found) $product = $found;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name       = trim($_POST['name'] ?? '');
    $category   = $_POST['category'] ?? 'tshirts';
    $is_new     = isset($_POST['is_new']) ? 1 : 0;
    $is_active  = isset($_POST['is_active']) ? 1 : 0;
    $price      = (float)($_POST['price'] ?? 0);
    $origPrice  = (float)($_POST['orig_price'] ?? 0);
    $rating     = (float)($_POST['rating'] ?? 4.5);
    $ratingCnt  = (int)($_POST['rating_count'] ?? 0);
    $imageUrl   = trim($_POST['image_url'] ?? '');
    $affiliateLink = trim($_POST['affiliate_link'] ?? '');

    // If a file was uploaded, it takes priority over the pasted URL
    if (!empty($_FILES['image_file']['name'])) {
        $allowed = ['jpg','jpeg','png','webp'];
        $ext = strtolower(pathinfo($_FILES['image_file']['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) {
            $error = 'Sirf JPG, PNG ya WEBP images allowed hain.';
        } else {
            $newName = 'prod_' . time() . '_' . rand(1000,9999) . '.' . $ext;
            $destDir = __DIR__ . '/../uploads/products/';
            if (move_uploaded_file($_FILES['image_file']['tmp_name'], $destDir . $newName)) {
                $imageUrl = 'uploads/products/' . $newName;
            } else {
                $error = 'Image upload fail ho gaya.';
            }
        }
    }

    if ($name === '')      $error = $error ?: 'Product name zaroori hai.';
    if ($price <= 0)        $error = $error ?: 'Valid price daaliye.';
    if ($imageUrl === '')   $error = $error ?: 'Image upload karein ya URL daalein.';
    // Amazon affiliate link is recommended but not force-required, so a product can still be
    // saved as a draft while you're still generating its Amazon link.
    if ($affiliateLink !== '' && !filter_var($affiliateLink, FILTER_VALIDATE_URL)) {
        $error = $error ?: 'Amazon affiliate link ek valid URL hona chahiye (https:// se shuru).';
    }

    if (!$error) {
        if ($origPrice <= 0) $origPrice = $price;
        if ($id) {
            $stmt = $db->prepare("UPDATE products SET name=?, category=?, is_new=?, price=?, orig_price=?, image_url=?, affiliate_link=?, rating=?, rating_count=?, is_active=? WHERE id=?");
            $stmt->bind_param('ssiddssdiii', $name, $category, $is_new, $price, $origPrice, $imageUrl, $affiliateLink, $rating, $ratingCnt, $is_active, $id);
        } else {
            $stmt = $db->prepare("INSERT INTO products (name, category, is_new, price, orig_price, image_url, affiliate_link, rating, rating_count, is_active) VALUES (?,?,?,?,?,?,?,?,?,?)");
            $stmt->bind_param('ssiddssdii', $name, $category, $is_new, $price, $origPrice, $imageUrl, $affiliateLink, $rating, $ratingCnt, $is_active);
        }
        $stmt->execute();
        header('Location: products.php');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title><?= $id ? 'Edit' : 'Add' ?> Product | Noble Fit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php include __DIR__ . '/includes/topbar.php'; ?>
<div class="admin-wrap">
    <div class="admin-card">
        <h2><?= $id ? 'Edit Product' : 'Add New Product' ?></h2>
        <?php if ($error): ?><div class="alert-error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
        <form method="POST" enctype="multipart/form-data">
            <input type="hidden" name="id" value="<?= $id ?>">
            <div class="form-group">
                <label>Product Name *</label>
                <input type="text" name="name" value="<?= htmlspecialchars($product['name']) ?>" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category *</label>
                    <select name="category">
                        <?php foreach (['tshirts'=>'T-Shirts','shirts'=>'Shirts','denims'=>'Denims','pants'=>'Pants'] as $val=>$lbl): ?>
                        <option value="<?= $val ?>" <?= $product['category']===$val?'selected':'' ?>><?= $lbl ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; margin-top:30px;">
                        <input type="checkbox" name="is_new" style="width:auto;" <?= $product['is_new']?'checked':'' ?>> Mark as "New Arrival"
                    </label>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Selling Price (₹) *</label>
                    <input type="number" step="0.01" name="price" value="<?= htmlspecialchars($product['price']) ?>" required>
                </div>
                <div class="form-group">
                    <label>Original Price (₹) — for the strikethrough / discount badge</label>
                    <input type="number" step="0.01" name="orig_price" value="<?= htmlspecialchars($product['orig_price']) ?>">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Rating (0–5)</label>
                    <input type="number" step="0.1" min="0" max="5" name="rating" value="<?= htmlspecialchars($product['rating']) ?>">
                </div>
                <div class="form-group">
                    <label>Rating Count (number of reviews)</label>
                    <input type="number" name="rating_count" value="<?= htmlspecialchars($product['rating_count']) ?>">
                </div>
            </div>
            <div class="form-group">
                <label>Upload Product Image (JPG/PNG/WEBP)</label>
                <input type="file" name="image_file" accept=".jpg,.jpeg,.png,.webp">
            </div>
            <div class="form-group">
                <label>...OR paste an image URL (e.g. a Cloudinary link) — leave blank if uploading a file above</label>
                <input type="text" name="image_url" value="<?= htmlspecialchars($product['image_url']) ?>" placeholder="https://res.cloudinary.com/...">
            </div>
            <?php if ($product['image_url']): ?>
            <div class="form-group">
                <label>Current Image</label>
                <img src="<?= htmlspecialchars($product['image_url']) ?>" style="width:100px; border-radius:6px;">
            </div>
            <?php endif; ?>
            <div class="form-group">
                <label>Amazon Affiliate Link <span style="color:#A9814B;">(powers the "Buy on Amazon" button)</span></label>
                <input type="url" name="affiliate_link" value="<?= htmlspecialchars($product['affiliate_link'] ?? '') ?>" placeholder="https://www.amazon.in/dp/XXXXXXXXXX?tag=your-affiliate-id">
                <small style="display:block; margin-top:4px; color:#8B8371;">Paste your Amazon Associates link for this exact product. Leave blank if not ready yet — the button will show "Coming Soon" on the storefront until you add it.</small>
            </div>
            <div class="form-group">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" name="is_active" style="width:auto;" <?= $product['is_active']?'checked':'' ?>> Visible on website
                </label>
            </div>
            <button type="submit" class="btn btn-gold"><?= $id ? 'Save Changes' : 'Add Product' ?></button>
            <a href="products.php" class="btn btn-outline">Cancel</a>
        </form>
    </div>
</div>
</body>
</html>
