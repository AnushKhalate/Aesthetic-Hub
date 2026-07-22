const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ownerModel = require("../model/owner_model");
const productModel = require("../model/product-model");
const userModel = require("../model/user-model");
const orderModel = require("../model/order-model");

const isLoggedIn = require("../middlewares/isLoggedIn");


// Basic admin products page
router.get("/", async function (req, res) {
    try {
        const products = await productModel.find();

        res.render("admin", {
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load admin page.");
    }
});


// Create product page
router.get("/createproducts", function (req, res) {
    res.render("createproducts", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});


// Create first owner
// Keep this route only during development
router.post("/create", async function (req, res) {
    try {
        const existingOwners = await ownerModel.find();

        if (existingOwners.length > 0) {
            return res
                .status(403)
                .send("You do not have permission to create another owner.");
        }

        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res
                .status(400)
                .send("Full name, email and password are required.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const owner = await ownerModel.create({
            fullName,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            {
                id: owner._id,
                email: owner.email,
                role: "owner"
            },
            process.env.JWT_KEY,
            {
                expiresIn: "7d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax"
        });

        res.redirect("/owners/admin");

    } catch (error) {
        console.error("Owner creation error:", error);
        res.status(500).send(error.message);
    }
});


// Admin dashboard
router.get("/admin", async function (req, res) {
    try {
        const [
            products,
            totalCustomers,
            totalOrders,
            revenueResult,
            recentOrders
        ] = await Promise.all([
            productModel
                .find()
                .sort({ createdAt: -1 }),

            userModel.countDocuments(),

            orderModel.countDocuments({
                paymentStatus: "paid"
            }),

            orderModel.aggregate([
                {
                    $match: {
                        paymentStatus: "paid"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]),

            orderModel
                .find({
                    paymentStatus: "paid"
                })
                .populate("user", "fullname fullName name email")
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const totalRevenue =
            revenueResult.length > 0
                ? revenueResult[0].total
                : 0;

        res.render("admin-dashboard", {
            products,
            totalProducts: products.length,
            totalCustomers,
            totalOrders,
            totalRevenue,
            recentOrders,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (error) {
        console.error("Admin dashboard error:", error);

        res.status(500).send(
            "Unable to load admin dashboard."
        );
    }
});


// Admin orders page
router.get("/orders", async function (req, res) {
    try {
        const orders = await orderModel
            .find()
            .populate("user", "fullname fullName name email")
            .sort({ createdAt: -1 });

        res.render("admin-orders", {
            orders,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (error) {
        console.error("Admin orders error:", error);
        res.status(500).send("Unable to load orders.");
    }
});


// Admin customers page
router.get("/customers", async function (req, res) {
    try {
        const customers = await userModel
            .find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.render("admin-customers", {
            customers,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (error) {
        console.error("Admin customers error:", error);
        res.status(500).send("Unable to load customers.");
    }
});


// View one order
router.get("/order/:orderId", async function (req, res) {
    try {
        const order = await orderModel
            .findById(req.params.orderId)
            .populate("user", "fullname fullName name email");

        if (!order) {
            req.flash("error", "Order not found.");
            return res.redirect("/owners/orders");
        }

        res.render("admin-order-details", {
            order,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (error) {
        console.error("Admin order details error:", error);

        req.flash("error", "Unable to load order.");
        res.redirect("/owners/orders");
    }
});


// Update order status
router.post(
    "/order/:orderId/status",
    async function (req, res) {
        try {
            const allowedStatuses = [
                "placed",
                "processing",
                "shipped",
                "delivered",
                "cancelled"
            ];

            const { orderStatus } = req.body;

            if (!allowedStatuses.includes(orderStatus)) {
                req.flash("error", "Invalid order status.");
                return res.redirect(
                    `/owners/order/${req.params.orderId}`
                );
            }

            await orderModel.findByIdAndUpdate(
                req.params.orderId,
                {
                    orderStatus
                },
                {
                    runValidators: true
                }
            );

            req.flash(
                "success",
                "Order status updated successfully."
            );

            res.redirect(
                `/owners/order/${req.params.orderId}`
            );

        } catch (error) {
            console.error("Order status update error:", error);

            req.flash("error", "Unable to update order status.");

            res.redirect(
                `/owners/order/${req.params.orderId}`
            );
        }
    }
);


// Logout owner
router.get("/logout", function (req, res) {
    res.clearCookie("token");
    res.redirect("/owners");
});


module.exports = router;