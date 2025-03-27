const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 3;

const Product = require('../models/product');
const Order= require('../models/order');


//==================home page products ===============
//updated
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    }).then(
    products => {
    res.render('shop/index', {
      prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
    }).catch(err => { 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
//================== All products ===============
//updated
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    }).then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      hasProducts: products.length > 0,
      activeShop: true,
      productCSS: true
    })
  }).catch(err => {
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  });
};


//================== get product for product detail page ===============
//updated
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  
  Product.findById(prodId).then(product => {
//console.log(product)
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products',
      isAuthenticated: req.session.isLoggedIn
    });
  }).catch(err => {
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  });
};

//==================get Cart ===============
exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then(User => {
      //console.log(products)
      const products = User.cart.items;
      console.log(products)
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};



//================== post Cart ===============
//updated
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product =>
  {
      return req.user.addToCart(product);
    }
  ).then(result => {
    console.log(result);
    res.redirect('/cart');
  }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//================== delete Cart ===============
//updated
exports.postCartDelete = (req, res, next) => {
  const prodId = req.body.productId;
  
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}
//==================shop controller ===============
exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    //.execPopulate()
    .then(user => {
      const products = user.cart.items;
      console.log(products)
      let total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


//==================shop controller ===============

exports.postOrder = (req, res, next) => {
const token = req.body.stripeToken; // Using Express
let totalSum = 0;

  req.user
    .populate('cart.items.productId')
    .then(user => {
      user.cart.items.forEach(item => {
        totalSum += item.quantity * item.productId.price;
      });
      
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      const charge = stripe.paymentIntents.create({
        amount: totalSum * 100,
        currency: 'usd',
        description: 'Demo Order',
        payment_method: token,
        metadata: { order_id: result._id.toString() }
      }, {
  idempotencyKey: crypto.randomUUID()
});
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//updated
exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.text('-----------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        console.log("name:"+prod.product.title + "price" +prod.product.price )
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x ' +
              '$' +
              prod.product.price
          );
      });
      pdfDoc.text('---');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

      pdfDoc.end();
      
      
    })
    .catch(err => next(err));
};

exports.getAbout = (req, res, next) => {
    res.render('shop/about', {
        pageTitle: 'About Us',
        path: '/about',
    });
};
exports.getBlog = (req, res, next) => {
    res.render('shop/Blog', {
        pageTitle: 'Our Blog',
        path: '/blog',
    });
};