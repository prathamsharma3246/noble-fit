<?php
$current = basename($_SERVER['PHP_SELF']);
?>
<div class="admin-topbar">
    <div class="brand">Noble <span>Fit</span> — Admin</div>
    <nav>
        <a href="index.php"    class="<?= $current==='index.php'?'active':'' ?>">Dashboard</a>
        <a href="products.php" class="<?= $current==='products.php'||$current==='product_form.php'?'active':'' ?>">Products</a>
        <a href="coupons.php"  class="<?= $current==='coupons.php'||$current==='coupon_form.php'?'active':'' ?>">Coupons</a>
        <a href="orders.php"   class="<?= $current==='orders.php'?'active':'' ?>">Orders</a>
        <a href="logout.php">Logout</a>
    </nav>
</div>
