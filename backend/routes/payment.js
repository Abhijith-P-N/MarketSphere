const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
const router = express.Router();

// @route POST /api/payment/intent
// @desc Create a Stripe PaymentIntent
// @access Private
router.post('/intent', auth, async (req, res) => {
  try {
    // Amount should be in the smallest currency unit (e.g., cents)
    const { amount, currency = 'usd' } = req.body; 

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency,
      metadata: { integration_check: 'accept_a_payment' },
      payment_method_types: ['card'],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalPrice: amount,
    });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ message: 'Payment intent creation failed.' });
  }
});

module.exports = router;