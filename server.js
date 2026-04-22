const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/music-box', (req, res) => {
  res.sendFile(path.join(__dirname, 'music-box.html'));
});

// Stripe checkout session creation
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/landing.html`,
      metadata: {
        product: 'harmonics-full-access'
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Success page
app.get('/success.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - Harmonics</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #674EA7, #FB7857);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }
        .success-content {
          max-width: 500px;
          padding: 40px 20px;
        }
        .success-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }
        h1 {
          margin: 0 0 10px;
          font-size: 32px;
        }
        p {
          margin: 0 0 20px;
          opacity: 0.9;
          font-size: 18px;
          line-height: 1.5;
        }
        .cta-buttons {
          margin-top: 30px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          margin: 10px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .btn-primary {
          background: white;
          color: #674EA7;
        }
        .btn-primary:hover {
          background: rgba(255, 255, 255, 0.9);
        }
      </style>
    </head>
    <body>
      <div class="success-content">
        <div class="success-icon">? Payment Successful!</div>
        <h1>Thank you for your purchase!</h1>
        <p>You now have full access to Harmonics Music Box. You can start creating amazing musical sequences right away.</p>
        <p>Your access has been unlocked and you can use all features including save/load, sharing, and future updates.</p>
        <div class="cta-buttons">
          <a href="music-box.html" class="btn btn-primary">Open Music Box</a>
          <a href="landing.html" class="btn">Back to Home</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Harmonics server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the landing page`);
  console.log(`Music box available at http://localhost:${PORT}/music-box`);
});

module.exports = app;
