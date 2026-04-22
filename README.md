# Harmonics - Digital Music Box Experience

A creative web application where users create music using number sequences. Each number represents a musical note, and when played in sequence, it forms a melody like a traditional music box.

## ? Features

### Landing Page Experience
- **Cinematic Hero Section** with animated particles and gradients
- **Video Introduction** explaining the concept and purpose
- **Interactive Demo** with 12-note music box for instant tryout
- **Pricing Section** with Stripe integration for payments
- **Responsive Design** optimized for all devices

### Full Music Box Experience
- **48 Musical Notes** for extended creative possibilities
- **Advanced Controls** including speed, volume, and looping
- **Save & Load** sequences locally
- **Share Functionality** with URL-based sequence sharing
- **Visual Feedback** with real-time note highlighting
- **Keyboard Shortcuts** for power users

## ? Quick Start

### Option 1: Static File Server (Simple)
```bash
# Using Python
python -m http.server 3000

# Using Node.js serve
npx serve .

# Then visit http://localhost:3000
```

### Option 2: Full Server with Stripe Integration
```bash
# Install dependencies
npm install

# Set environment variables
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_PUBLISHABLE_KEY=pk_test_...

# Start the server
npm start

# Visit http://localhost:3000
```

## ? File Structure

```
Harmonics/
?? landing.html          # Main landing page
?? music-box.html        # Full music box experience
?? index.html            # Redirect to landing page
?? landing.css           # Landing page styles
?? music-box.css         # Music box enhanced styles
?? style.css             # Original styles (shared)
?? landing.js            # Landing page functionality
?? music-box.js          # Enhanced music box features
?? script.js             # Original music box logic
?? server.js             # Express server with Stripe
?? package.json          # Node.js dependencies
?? README.md             # This file
?? assets/               # Images and media
?? sounds/               # Audio files (.wav)
```

## ? Payment Integration

### Stripe Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Set environment variables:
   ```bash
   export STRIPE_SECRET_KEY=sk_test_your_secret_key
   export STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```

### Price Configuration
Update the Stripe price ID in `landing.js`:
```javascript
// In buyFullAccessBtn event listener
priceId: 'price_1Oxxxx...' // Replace with actual Stripe price ID
```

Update the Stripe publishable key in `landing.html`:
```html
<script src="https://js.stripe.com/v3/"></script>
<script>
  const stripe = Stripe('pk_test_xxxx'); // Replace with actual key
</script>
```

## ? Audio Files

Place your audio files in the `sounds/` directory with the naming convention:
- `Harmonicsfinal 1.wav` through `Harmonicsfinal 48.wav`

The system will automatically detect and load available audio files.

## ? Features Breakdown

### Landing Page
- **Hero Section**: Cinematic introduction with animated background
- **Video Section**: Placeholder for promotional video
- **Demo Section**: 12-note interactive music box
- **Pricing**: Free demo vs. Full access comparison
- **Future Features**: AI generator and more instruments

### Music Box
- **48 Notes**: Extended range for complex melodies
- **Controls**: Speed (0.25x - 2x), Volume (0% - 100%), Loop
- **Save/Load**: Local storage for sequences
- **Share**: URL-based sequence sharing
- **Keyboard Shortcuts**: 
  - `1-9`: Add notes
  - `Space`: Play/Stop
  - `Esc`: Stop
  - `C`: Clear
  - `R`: Random
  - `S`: Save
  - `L`: Load

## ? Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## ? Mobile Optimization

The application is fully responsive and optimized for:
- iOS Safari
- Chrome Mobile
- Samsung Internet
- Other modern mobile browsers

## ? Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Or simple static server
npm run serve
```

### Building for Production
```bash
# Minify CSS/JS (optional)
npm run build

# Deploy static files to your hosting service
```

## ? Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)
1. Upload all files except `server.js`, `package.json`
2. Configure your domain
3. Update Stripe webhook URLs if needed

### Full Server (Heroku, DigitalOcean, AWS)
1. Deploy with `server.js`
2. Set environment variables
3. Configure Stripe webhooks
4. Set up SSL certificate

## ? Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ? License

MIT License - feel free to use this project for personal or commercial purposes.

## ? Support

For support or questions:
- Instagram: [@harmonics.sg](https://www.instagram.com/harmonics.sg/)
- Create an issue on GitHub

## ? Future Roadmap

- [ ] AI Music Generator (text to sequence)
- [ ] Multiple Instrument Packs
- [ ] Community Features
- [ ] Mobile App
- [ ] Real-time Collaboration
- [ ] MIDI Export
- [ ] Advanced Sequencer

---

**Made with ? by the Harmonics Team**
