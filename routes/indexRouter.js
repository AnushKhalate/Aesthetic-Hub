const express = require("express");
const router = express.Router();

const crypto = require('crypto');
const orderModel = require("../model/order-model");
const razorpayInstance = require("../config/razorpay");

const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../model/product-model");
const userModel = require("../model/user-model");


// Register page
router.get("/", function (req, res) {
    const error = req.flash("error");

    res.render("index", {
        error
    });
});

router.get("/cart", isLoggedIn, async (req, res) => {

    const user = await userModel
        .findOne({ email: req.user.email })
        .populate("cart");

    let total = 0;

    user.cart.forEach(product => {
        total += product.price;
    });

    res.render("cart", {
        cart: user.cart,
        total
    });

});

// Shop page
router.get("/shop", isLoggedIn, async function (req, res) {
    try {
        const products = await productModel.find();

        const success = req.flash("success");
        const error = req.flash("error");

        res.render("shop", {
            products,
            success,
            error
        });

    } catch (err) {
        console.error("Shop page error:", err);
        res.status(500).send("Something went wrong");
    }
});

// Add product to cart
router.post(
    "/addCart/:productid",
    isLoggedIn,
    async function (req, res) {
        try {
            const product = await productModel.findById(
                req.params.productid
            );

            if (!product) {
                req.flash("error", "Product not found");
                return res.redirect("/shop");
            }

            const user = await userModel.findOne({
                email: req.user.email
            });

            if (!user) {
                req.flash("error", "User account not found");
                return res.redirect("/login");
            }

            const alreadyInCart = user.cart.some(
                productId =>
                    productId.toString() === req.params.productid
            );

            if (alreadyInCart) {
                req.flash("error", "Product is already in your cart");
                return res.redirect("/shop");
            }

            user.cart.push(product._id);

            await user.save();

            req.flash("success", "Product added to cart");
            return res.redirect("/shop");

        } catch (err) {
            console.error("Add to cart error:", err);

            req.flash("error", "Unable to add product to cart");
            return res.redirect("/shop");
        }
    }
);

router.post("/removeCart/:productid", isLoggedIn, async (req, res) => {

    try {

        const user = await userModel.findOne({ email: req.user.email });

        user.cart.pull(req.params.productid);

        await user.save();

        req.flash("success", "Product removed from cart.");

        res.redirect("/cart");

    } catch (err) {

        console.log(err);

        req.flash("error", "Something went wrong.");

        res.redirect("/cart");

    }

});

router.get("/account", isLoggedIn, async function (req, res) {
    try {
        const user = await userModel
            .findOne({ email: req.user.email })
            .populate("cart");
            

        if (!user) {
            req.flash("error", "User account not found.");
            return res.redirect("/users/login");
        }

        res.render("account", {
            user,
            success: req.flash("success"),
            error: req.flash("error")
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Unable to load your account.");
        res.redirect("/shop");
    }
});



//payment routes
router.get("/checkout", isLoggedIn, async function (req, res) {
    try {
        const user = await userModel
            .findOne({ email: req.user.email })
            .populate("cart");

        if (!user) {
            req.flash("error", "User account not found.");
            return res.redirect("/users/login");
        }

        if (!user.cart || user.cart.length === 0) {
            req.flash("error", "Your cart is empty.");
            return res.redirect("/cart");
        }

        const total = user.cart.reduce(function (sum, product) {
            return sum + Number(product.price);
        }, 0);

        res.render("checkout", {
            user,
            cart: user.cart,
            total,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            success: req.flash("success"),
            error: req.flash("error")
        });
    } catch (error) {
        console.error("Checkout error:", error);

        req.flash("error", "Unable to open checkout.");
        res.redirect("/cart");
    }
});

router.post(
    "/payment/create-order",
    isLoggedIn,
    async function (req, res) {
        try {
            const user = await userModel
                .findOne({ email: req.user.email })
                .populate("cart");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            if (!user.cart || user.cart.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Your cart is empty."
                });
            }

            /*
             * Always calculate the amount from database products.
             * Never trust an amount sent by the browser.
             */
            const totalAmount = user.cart.reduce(function (sum, product) {
                return sum + Number(product.price);
            }, 0);

            if (totalAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order amount."
                });
            }

            const receipt = `scatch_${Date.now()}`;

            const razorpayOrder = await razorpayInstance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: "INR",
                receipt,
                notes: {
                    userId: user._id.toString(),
                    email: user.email
                }
            });

            const products = user.cart.map(function (product) {
                return {
                    product: product._id,
                    name: product.name,
                    price: Number(product.price)
                };
            });

            await orderModel.create({
                user: user._id,
                products,
                totalAmount,
                razorpayOrderId: razorpayOrder.id,
                paymentStatus: "pending"
            });

            res.status(201).json({
                success: true,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                customer: {
                    name: user.fullname || user.name || "Scatch Customer",
                    email: user.email
                }
            });
        } catch (error) {
            console.error("Create payment order error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to create payment order."
            });
        }
    }
);

router.post(
    "/payment/verify",
    isLoggedIn,
    async function (req, res) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Incomplete payment information."
                });
            }

            const user = await userModel.findOne({
                email: req.user.email
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            const savedOrder = await orderModel.findOne({
                razorpayOrderId: razorpay_order_id,
                user: user._id
            });

            if (!savedOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });
            }

            if (savedOrder.paymentStatus === "paid") {
                return res.json({
                    success: true,
                    message: "Payment was already verified."
                });
            }

            const body =
                savedOrder.razorpayOrderId +
                "|" +
                razorpay_payment_id;

            const expectedSignature = crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");

            const expectedBuffer = Buffer.from(
                expectedSignature,
                "utf8"
            );

            const receivedBuffer = Buffer.from(
                razorpay_signature,
                "utf8"
            );

            const isValid =
                expectedBuffer.length === receivedBuffer.length &&
                crypto.timingSafeEqual(
                    expectedBuffer,
                    receivedBuffer
                );

            if (!isValid) {
                savedOrder.paymentStatus = "failed";
                await savedOrder.save();

                return res.status(400).json({
                    success: false,
                    message: "Payment verification failed."
                });
            }

            savedOrder.razorpayPaymentId =
                razorpay_payment_id;

            savedOrder.razorpaySignature =
                razorpay_signature;

            savedOrder.paymentStatus = "paid";
            savedOrder.orderStatus = "placed";

            await savedOrder.save();

            user.cart = [];
            await user.save();

            res.json({
                success: true,
                message: "Payment verified successfully.",
                orderId: savedOrder._id
            });
        } catch (error) {
            console.error("Payment verification error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to verify payment."
            });
        }
    }
);

router.get(
    "/payment-success",
    isLoggedIn,
    async function (req, res) {
        try {
            const user = await userModel.findOne({
                email: req.user.email
            });

            const order = await orderModel
                .findOne({
                    _id: req.query.orderId,
                    user: user._id,
                    paymentStatus: "paid"
                })
                .populate("products.product");

            if (!order) {
                req.flash("error", "Paid order not found.");
                return res.redirect("/account");
            }

            res.render("payment-success", {
                order
            });
        } catch (error) {
            console.error("Payment success page error:", error);
            res.redirect("/account");
        }
    }
);


//order route
router.get("/my-orders", isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findOne({
            email: req.user.email
        });

        if (!user) {
            req.flash("error", "User account not found.");
            return res.redirect("/users/login");
        }

        const orders = await orderModel
            .find({
                user: user._id,
                paymentStatus: "paid"
            })
            .sort({ createdAt: -1 });

        res.render("my-orders", {
            orders,
            success: req.flash("success"),
            error: req.flash("error")
        });
    } catch (error) {
        console.error("My orders error:", error);

        req.flash("error", "Unable to load your orders.");
        res.redirect("/account");
    }
});

router.get("/order/:orderId", isLoggedIn, async function (req, res) {
    try {
        const user = await userModel.findOne({
            email: req.user.email
        });

        const order = await orderModel.findOne({
            _id: req.params.orderId,
            user: user._id
        });

        if (!order) {
            req.flash("error", "Order not found.");
            return res.redirect("/my-orders");
        }

        res.render("order-details", {
            order
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "Unable to load order details.");
        res.redirect("/my-orders");
    }
});

module.exports = router;