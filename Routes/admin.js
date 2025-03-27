const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const  isAdmin  = require('../middleware/is-admin');
const { body } = require('express-validator');

// //admin/add-product 
router.get("/add-product", isAuth,isAdmin, adminController.getAddProduct);
router.post(
    "/add-product"
    ,
    [
        body('title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price').isFloat(),
        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth,isAdmin,
    adminController.postAddProduct
);

// ///admin/products
router.get('/products',isAuth,isAdmin, adminController.getProducts);

// //admin/edit-product/2323
router.get("/edit-product/:productId",isAuth,isAdmin, adminController.getEditProduct)
router.post("/edit-product"
    ,
    [
        body('title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price').isFloat(),
        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth,isAdmin,
    adminController.postEditProduct);

// // //admin/delete-product
router.post("/delete-product",isAuth,isAdmin, adminController.postDeleteProduct)

module.exports = router;
