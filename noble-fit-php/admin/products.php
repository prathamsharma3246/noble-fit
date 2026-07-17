<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();
$products = $db->query("SELECT * FROM products ORDER BY sort_order ASC, id DESC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Products | Noble Fit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php include __DIR__ . '/includes/topbar.php'; ?>
<div class="admin-wrap">
    <div class="admin-card">
        <div class="toolbar">
            <h2 style="margin:0;">Products</h2>
            <a href="product_form.php" class="btn btn-gold">+ Add New Product</a>
        </div>
        <table>
            <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>New?</th><th>Amazon Link</th><th>Actions</th></tr>
            <?php while ($p = $products->fetch_assoc()): ?>
            <tr>
                <td><img src="<?= htmlspecialchars($p['image_url']) ?>" alt=""></td>
                <td><?= htmlspecialchars($p['name']) ?></td>
                <td><?= htmlspecialchars($p['category']) ?></td>
                <td>₹<?= number_format($p['price']) ?> <?php if ($p['orig_price'] > $p['price']): ?><s style="color:#999">₹<?= number_format($p['orig_price']) ?></s><?php endif; ?></td>
                <td><span class="badge <?= $p['is_active'] ? 'badge-active' : 'badge-inactive' ?>"><?= $p['is_active'] ? 'Active' : 'Hidden' ?></span></td>
                <td><?= $p['is_new'] ? '✓' : '—' ?></td>
                <td>
                    <?php if (!empty($p['affiliate_link'])): ?>
                        <a href="<?= htmlspecialchars($p['affiliate_link']) ?>" target="_blank" class="badge badge-active" style="text-decoration:none;">✓ Linked</a>
                    <?php else: ?>
                        <span class="badge badge-inactive">Not set</span>
                    <?php endif; ?>
                </td>
                <td>
                    <a href="product_form.php?id=<?= $p['id'] ?>" class="btn btn-outline btn-sm">Edit</a>
                    <a href="delete_product.php?id=<?= $p['id'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('Delete this product?');">Delete</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </table>
    </div>
</div>
</body>
</html>
