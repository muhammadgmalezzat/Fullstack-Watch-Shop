const express = require('express');
const router = express.Router();
const shopController=require('../controllers/shop')
const isAuth = require('../middleware/is-auth');

router.get("/", shopController.getIndex)

router.get('/orders', isAuth, shopController.getOrders)

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.post('/create-order', isAuth, shopController.postOrder)
//router.post('/create-checkout-session',isAuth, shopController.postCheck)
// //cart
router.get('/cart',isAuth, shopController.getCart)
router.post('/cart',isAuth, shopController.postCart)
router.get('/product-detail', shopController.getProduct)
// //checkout
router.get('/checkout', isAuth, shopController.getCheckout);

// //products
router.get('/products', shopController.getProducts)
router.get('/products/:productId', shopController.getProduct)
router.get('/about', shopController.getAbout)
router.get('/blog', shopController.getBlog)
router.post('/cart-delete-item',isAuth,shopController.postCartDelete)
module.exports = router;