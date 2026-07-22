const express = require("express");
const router = express.Router();

const upload = require("../config/multe-config");
const Product = require("../model/product-model");
const {
    createProduct,
    getEditProduct,
    updateProduct,
    deleteProduct
} = require("../controller/productController");


router.post("/create", upload.single("image"), async (req, res) => {
    try {

        const {
            name,
            price,
            discount
        } = req.body;

        const product = await Product.create({
            image: req.file.buffer,
            name,
            price,
            discount
        });

        req.flash("success", "Product created successfully");

        return res.redirect("/owners/admin");

    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
});

// Open edit page
router.get(
    "/edit/:id",
    getEditProduct
);


// Update product
router.post(
    "/update/:id",
    upload.single("image"),
    updateProduct
);


// Delete product
router.post(
    "/delete/:id",
    deleteProduct
);

module.exports = router;