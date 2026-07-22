const Product = require("../model/product-model");

module.exports.getEditProduct = async (req, res) => {


    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/owners");
        }

        return res.render("editproduct", {
            product,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (err) {
        console.error("Get edit product error:", err);

        req.flash("error", "Unable to load product");
        return res.redirect("/owners");
    }
};


// Update product
module.exports.updateProduct = async (req, res) => {
    try {
        const { name, price, discount } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/owners");
        }

        product.name = name.trim();
        product.price = Number(price);
        product.discount = Number(discount);

        // Replace image only when a new image is selected
        if (req.file) {
            product.image = req.file.buffer;
        }

        await product.save();

        req.flash("success", "Product updated successfully");
        return res.redirect("/owners/admin");

    } catch (err) {
        console.error("Update product error:", err);

        req.flash("error", "Unable to update product");
        return res.redirect(`/products/edit/${req.params.id}`);
    }
};


// Delete product
module.exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            req.flash("error", "Product not found");
            return res.redirect("/owners/admin");
        }

        req.flash("success", "Product deleted successfully");
        return res.redirect("/owners/admin");

    } catch (err) {
        console.error("Delete product error:", err);

        req.flash("error", "Unable to delete product");
        return res.redirect("/owners/admin");
    }
};