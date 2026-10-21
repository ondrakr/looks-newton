// LOOKS — data kolekce.
// Ceny jsou ZATÍM ILUSTRAČNÍ — uprav BASE_PRICE / delta / SHIPPING podle skutečného ceníku.
window.LOOKS = {
  BASE_PRICE: 1890, // Kč
  SIZES: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  FILTERS: [
    { id: 'all', label: 'Vše' },
    { id: 'oversized', label: 'Oversized' },
    { id: 'wash', label: 'Vintage wash' },
    { id: 'boxy', label: 'Boxy & cropped' },
    { id: 'zip', label: 'Zip' },
    { id: 'heavy', label: 'Heavyweight' }
  ],
  SHIPPING: [
    { id: 'zasilkovna', label: 'Zásilkovna', sub: 'Výdejní místo, 1–2 pracovní dny', price: 79 },
    { id: 'ppl', label: 'PPL kurýr', sub: 'Doručení domů, 1–2 pracovní dny', price: 129 },
    { id: 'pickup', label: 'Osobní odběr', sub: 'LOOKS Studio, Praha', price: 0 }
  ],
  PAYMENT: [
    { id: 'card', label: 'Platební karta', sub: 'Visa, Mastercard' },
    { id: 'wallet', label: 'Apple Pay / Google Pay', sub: 'Rychlá platba telefonem' },
    { id: 'transfer', label: 'Bankovní převod', sub: 'Odešleme po připsání platby' }
  ],
  PRODUCTS: [
    { id: 1,  no: '01', slug: 'black-essential',   name: 'Black Essential',    fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Černá',          hex: '#111111', tags: ['oversized'],          delta: 0,   badge: '' },
    { id: 2,  no: '02', slug: 'washed-charcoal',   name: 'Washed Charcoal',    fit: 'Oversized fit',  gsm: '450 GSM', material: 'Vintage wash',   color: 'Uhlová',         hex: '#3a3a3a', tags: ['oversized', 'wash'],  delta: 100, badge: 'Vintage wash' },
    { id: 3,  no: '03', slug: 'chocolate-brown',   name: 'Chocolate Brown',    fit: 'Boxy fit',       gsm: '450 GSM', material: 'Premium cotton', color: 'Čokoládová',     hex: '#4a2e22', tags: ['boxy'],               delta: 0,   badge: '' },
    { id: 4,  no: '04', slug: 'cream-minimal',     name: 'Cream Minimal',      fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Krémová',        hex: '#e8e1d3', tags: ['oversized'],          delta: 0,   badge: '' },
    { id: 5,  no: '05', slug: 'ash-grey',          name: 'Ash Grey',           fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Šedý melír',     hex: '#b9b9b9', tags: ['oversized'],          delta: 0,   badge: '' },
    { id: 6,  no: '06', slug: 'navy-premium',      name: 'Navy Premium',       fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Navy',           hex: '#1c2438', tags: ['oversized'],          delta: 0,   badge: '' },
    { id: 7,  no: '07', slug: 'forest-green',      name: 'Forest Green',       fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Lesní zelená',   hex: '#1f3a2c', tags: ['oversized'],          delta: 0,   badge: '' },
    { id: 8,  no: '08', slug: 'vintage-black',     name: 'Vintage Black',      fit: 'Oversized fit',  gsm: '450 GSM', material: 'Vintage wash',   color: 'Sepraná černá',  hex: '#2a2a2a', tags: ['oversized', 'wash'],  delta: 100, badge: 'Vintage wash' },
    { id: 9,  no: '09', slug: 'zip-hoodie',        name: 'Zip Hoodie',         fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Černá',          hex: '#111111', tags: ['oversized', 'zip'],   delta: 200, badge: 'Zip' },
    { id: 10, no: '10', slug: 'heavyweight',       name: 'Heavyweight Hoodie', fit: 'Structured fit', gsm: '500 GSM', material: 'Heavy cotton',   color: 'Černá',          hex: '#111111', tags: ['heavy'],              delta: 300, badge: '500 GSM' },
    { id: 11, no: '11', slug: 'cropped-boxy',      name: 'Cropped Boxy Hoodie',fit: 'Cropped fit',    gsm: '450 GSM', material: 'Premium cotton', color: 'Taupe',          hex: '#6b625a', tags: ['boxy'],               delta: 0,   badge: '' },
    { id: 12, no: '12', slug: 'signature',         name: 'Signature Hoodie',   fit: 'Oversized fit',  gsm: '450 GSM', material: 'Premium cotton', color: 'Ecru',           hex: '#ece5d6', tags: ['oversized'],          delta: 200, badge: 'Signature' }
  ].map(function (p) {
    p.life = 'img/life-' + p.no + '.jpg';
    p.flat = 'img/flat-' + p.no + '.jpg';
    return p;
  })
};
