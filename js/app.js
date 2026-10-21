(function () {
  'use strict';

  var D = window.LOOKS;
  var app = document.getElementById('app');
  var state = {
    filter: 'all',
    cart: load('looks-cart', []),
    ship: 'zasilkovna',
    pay: 'card',
    lastOrder: null
  };

  // ---------- helpers ----------
  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v || fallback; } catch (e) { return fallback; }
  }
  function save() {
    try { localStorage.setItem('looks-cart', JSON.stringify(state.cart)); } catch (e) { /* ignore */ }
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kč'; }
  function price(p) { return D.PRICE[p.category]; }
  function kusu(n) { return n + ' ' + (n === 1 ? 'kus' : n < 5 ? 'kusy' : 'kusů'); }
  function byId(id) { return D.PRODUCTS.find(function (p) { return p.id === id; }); }
  function bySlug(s) { return D.PRODUCTS.find(function (p) { return p.slug === s; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function count() { return state.cart.reduce(function (a, c) { return a + c.qty; }, 0); }
  function subtotal() { return state.cart.reduce(function (a, c) { return a + price(byId(c.id)) * c.qty; }, 0); }

  var icons = {
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    check: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  // ---------- cart ----------
  function addToCart(id, size) {
    var key = id + '-' + size;
    var item = state.cart.find(function (c) { return c.key === key; });
    if (item) item.qty += 1; else state.cart.push({ key: key, id: id, size: size, qty: 1 });
    save(); renderCart();
    toast('Přidáno do košíku: <strong>' + esc(byId(id).name) + '</strong> · ' + size, true);
  }
  function setQty(key, d) {
    state.cart = state.cart.map(function (c) { if (c.key === key) c.qty += d; return c; }).filter(function (c) { return c.qty > 0; });
    save(); renderCart();
    if (route().name === 'checkout') render();
  }

  var toastTimer;
  function toast(html, withLink) {
    var t = document.querySelector('[data-toast]');
    t.innerHTML = '<span>' + html + '</span>' + (withLink ? '<button type="button" data-open-cart>Zobrazit</button>' : '');
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); setTimeout(function () { t.hidden = true; }, 250); }, 2600);
  }

  function openCart() {
    var d = document.querySelector('[data-drawer]');
    d.hidden = false;
    requestAnimationFrame(function () { d.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    var d = document.querySelector('[data-drawer]');
    d.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { d.hidden = true; }, 250);
  }

  function renderCart() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n; el.classList.toggle('is-empty', n === 0); });
    document.querySelector('[data-cart-count-text]').textContent = n ? '(' + n + ')' : '';
    var body = document.querySelector('[data-cart-body]');
    var foot = document.querySelector('[data-cart-foot]');
    if (!n) {
      body.innerHTML = '<div class="cart-empty"><p>Košík je zatím prázdný.</p><a class="btn btn--light" href="#/" data-close-cart data-scroll="shop">Prohlédnout kolekci</a></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = state.cart.map(lineItem).join('');
    foot.innerHTML =
      '<div class="sum-row"><span>Mezisoučet</span><strong>' + money(subtotal()) + '</strong></div>' +
      '<p class="muted small">Doprava se spočítá v pokladně.</p>' +
      '<a class="btn btn--light btn--block" href="#/pokladna" data-close-cart>Pokračovat k pokladně ' + icons.arrow + '</a>';
  }

  function lineItem(c) {
    var p = byId(c.id);
    return '<div class="line">' +
      '<a href="#/produkt/' + p.slug + '" data-close-cart class="line__img"><img src="' + p.front + '" alt="' + esc(p.name) + '"></a>' +
      '<div class="line__info">' +
        '<div class="line__top"><a href="#/produkt/' + p.slug + '" data-close-cart class="line__name">' + esc(p.name) + '</a><strong>' + money(price(p) * c.qty) + '</strong></div>' +
        '<p class="muted small">' + esc(p.color) + ' · Velikost ' + c.size + '</p>' +
        '<div class="line__bottom">' +
          '<div class="stepper">' +
            '<button type="button" data-qty="' + c.key + '" data-d="-1" aria-label="Ubrat kus">' + icons.minus + '</button>' +
            '<span aria-live="polite">' + c.qty + '</span>' +
            '<button type="button" data-qty="' + c.key + '" data-d="1" aria-label="Přidat kus">' + icons.plus + '</button>' +
          '</div>' +
          '<button type="button" class="link-btn" data-qty="' + c.key + '" data-d="-' + c.qty + '">Odebrat</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---------- brand prvky z krabice ----------
  function seal() {
    return '<div class="seal" aria-hidden="true"><div class="seal__inner"><span class="script">LS</span><span class="caps">Prague</span></div></div>';
  }
  function pattern(rows, cols) {
    var out = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      out += (r + c) % 2 === 0 || cols === 2 ? '<span class="script">Looks Studio</span>' : '<span class="caps">For the look</span>';
    }
    return '<div class="pattern" aria-hidden="true">' + out + '</div>';
  }

  // ---------- views ----------
  function card(p) {
    return '<article class="card">' +
      '<div class="card__media">' +
        '<a href="#/produkt/' + p.slug + '" aria-label="Zobrazit ' + esc(p.name) + '">' +
          '<img class="card__life" src="' + p.life + '" alt="' + esc(p.name) + ' na modelu" loading="lazy">' +
          '<img class="card__flat" src="' + p.front + '" alt="" loading="lazy">' +
        '</a>' +
        '<button type="button" class="quick" data-quick="' + p.id + '" aria-label="Přidat ' + esc(p.name) + ' ve velikosti M do košíku">' + icons.plus + '</button>' +
      '</div>' +
      '<div class="card__info">' +
        '<div><span class="card__no">' + p.no + '</span><a class="card__name" href="#/produkt/' + p.slug + '">' + esc(p.name) + '</a>' +
        '<p class="muted small">' + esc(p.fit) + ' · ' + esc(p.color) + '</p></div>' +
        '<strong class="card__price">' + money(price(p)) + '</strong>' +
      '</div>' +
    '</article>';
  }

  function viewHome() {
    var list = D.PRODUCTS.filter(function (p) { return state.filter === 'all' || p.tags.indexOf(state.filter) >= 0; });
    var heroPics = [byId(1), byId(6), byId(16)];
    return '' +
    '<section class="hero">' +
      '<div class="hero__stage">' +
        pattern(4, 3) +
        '<div class="wrap hero__inner">' +
          '<div class="frame">' +
            '<h1 class="script hero__logo">Looks Studio</h1>' +
            '<span class="rule" aria-hidden="true"></span>' +
            '<p class="caps">For the look</p>' +
            seal() +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="wrap hero__foot">' +
        '<p class="hero__lead">Alpaca Collection. Mikiny, kalhoty, tepláky a trička z alpaky. Navrženo v Praze.</p>' +
        '<a class="btn btn--light" href="#/" data-scroll="shop">Kolekce</a>' +
      '</div>' +
      '<div class="hero__pics">' +
        heroPics.map(function (p) {
          return '<a href="#/produkt/' + p.slug + '" class="hero__pic"><img src="' + p.life + '" alt="' + esc(p.name) + '"><span>' + esc(p.name) + '</span></a>';
        }).join('') +
      '</div>' +
    '</section>' +
    '<section class="wrap section" id="shop">' +
      '<div class="section__head"><h2 class="h2">Kolekce</h2><span class="count">' + kusu(list.length) + '</span></div>' +
      '<div class="chips" role="group" aria-label="Filtr kolekce">' +
        D.FILTERS.map(function (f) {
          return '<button type="button" class="chip' + (state.filter === f.id ? ' is-on' : '') + '" aria-pressed="' + (state.filter === f.id) + '" data-filter="' + f.id + '">' + f.label + '</button>';
        }).join('') +
      '</div>' +
      '<div class="grid">' + list.map(card).join('') + '</div>' +
    '</section>' +
    '<section class="dark" id="lookbook">' +
      '<div class="wrap section">' +
        '<div class="section__head"><h2 class="h2">Různé styly.<br>Stejný mindset.</h2><span class="count">Lookbook, Praha</span></div>' +
        '<div class="look">' +
          [21, 14, 11].map(function (id) {
            var p = byId(id);
            return '<figure><a href="#/produkt/' + p.slug + '"><img src="' + p.life + '" alt="' + esc(p.name) + '" loading="lazy"></a>' +
              '<figcaption><a href="#/produkt/' + p.slug + '">' + esc(p.name) + '</a><span>' + money(price(p)) + '</span></figcaption></figure>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</section>' +
    '<section class="wrap section about" id="about">' +
      '<div class="about__brand">' + pattern(4, 2) + seal() + '</div>' +
      '<div class="about__text">' +
      '<p>Vlastní oblečení z Prahy. Jedno vlákno, alpaka: hutné úplety na mikiny, jemný jersey na trička a kepr na kalhoty s džínovým střihem. Na každém kousku malá výšivka <em>looks</em>.</p>' +
      '<form class="news" data-news>' +
        '<label class="eyebrow" for="news-email">Buď první u dalšího dropu</label>' +
        '<div class="news__row"><input id="news-email" type="email" required placeholder="tvuj@email.cz" autocomplete="email"><button class="btn btn--light" type="submit">Odebírat</button></div>' +
      '</form></div>' +
    '</section>';
  }

  function viewProduct(slug, err) {
    var p = bySlug(slug);
    if (!p) return viewNotFound();
    var sel = viewProduct.size || null;
    // podobné = sdílí střih/úpravu, doplněno ostatními
    var others = D.PRODUCTS.filter(function (x) { return x.id !== p.id; });
    var score = function (x) { return (x.category === p.category ? 2 : 0) + (x.color === p.color ? 1 : 0); };
    var related = others.slice().sort(function (a, b) { return score(b) - score(a) || a.id - b.id; }).slice(0, 4);
    var minShip = Math.min.apply(null, D.SHIPPING.filter(function (s) { return s.price > 0; }).map(function (s) { return s.price; }));
    return '' +
    '<section class="wrap pdp">' +
      '<nav class="crumbs" aria-label="Drobečková navigace"><a href="#/" data-scroll="shop">Kolekce</a><span>/</span><span>' + esc(p.categoryLabel) + '</span><span>/</span><span>' + esc(p.name) + '</span></nav>' +
      '<div class="pdp__grid">' +
        '<div class="gallery">' +
          '<img src="' + p.life + '" alt="' + esc(p.name) + ' na modelu, Praha">' +
          '<img src="' + p.front + '" alt="' + esc(p.name) + ' zepředu">' +
          '<img src="' + p.back + '" alt="' + esc(p.name) + ' zezadu">' +
          '<img src="' + p.detail + '" alt="Detail výšivky a úpletu">' +
        '</div>' +
        '<div class="pdp__info">' +
          '<p class="eyebrow">' + esc(p.categoryLabel) + ' · ' + p.no + ' / ' + D.PRODUCTS.length + '</p>' +
          '<h1 class="pdp__title">' + esc(p.name) + '</h1>' +
          '<p class="pdp__price">' + money(price(p)) + '</p>' +
          '<p class="pdp__desc">' + esc(p.desc) + '</p>' +
          '<p class="pdp__color"><span class="dot" style="background:' + p.hex + '"></span>Barva: <strong>' + esc(p.color) + '</strong></p>' +
          '<fieldset class="sizes"><legend class="eyebrow">Velikost</legend><div class="sizes__row">' +
            D.SIZES.map(function (s) {
              return '<button type="button" class="size' + (sel === s ? ' is-on' : '') + '" aria-pressed="' + (sel === s) + '" data-size="' + s + '">' + s + '</button>';
            }).join('') +
          '</div>' + (err ? '<p class="error" role="alert">Vyber prosím velikost.</p>' : '') + '</fieldset>' +
          '<button type="button" class="btn btn--light btn--block btn--lg" data-add="' + p.id + '">Přidat do košíku</button>' +
          '<p class="pdp__note">Doprava od ' + money(minShip) + ', osobní odběr v Praze zdarma. <a href="#/info/vraceni">Vrácení do 14 dnů</a> · <a href="#/info/velikosti">Tabulka velikostí</a></p>' +
          '<dl class="specs">' +
            '<div><dt>Střih</dt><dd>' + esc(p.fit) + '</dd></div>' +
            '<div><dt>Materiál</dt><dd>Alpaka</dd></div>' +
            '<div><dt>' + (p.category === 'kalhoty' ? 'Tkanina' : 'Úplet') + '</dt><dd>' + esc(p.texture) + '</dd></div>' +
            '<div><dt>Logo</dt><dd>' + esc(p.logo) + '</dd></div>' +
            '<div><dt>Původ</dt><dd>Navrženo v Praze</dd></div>' +
          '</dl>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<section class="wrap section">' +
      '<div class="section__head"><h2 class="h2 h2--sm">Mohlo by se ti líbit</h2></div>' +
      '<div class="grid">' + related.map(card).join('') + '</div>' +
    '</section>';
  }

  function viewCheckout() {
    var ship = D.SHIPPING.find(function (s) { return s.id === state.ship; });
    var sub = subtotal(), total = sub + (count() ? ship.price : 0);
    if (!count()) {
      return '<section class="wrap center-box"><h1 class="h2">Košík je prázdný</h1><p class="muted">Vyber si něco z kolekce a vrať se sem.</p><a class="btn btn--light" href="#/" data-scroll="shop">Zpět do obchodu</a></section>';
    }
    function opt(group, o, on) {
      return '<label class="opt' + (on ? ' is-on' : '') + '">' +
        '<input type="radio" name="' + group + '" value="' + o.id + '"' + (on ? ' checked' : '') + ' data-' + group + '="' + o.id + '">' +
        '<span class="opt__text"><strong>' + o.label + '</strong><span class="muted small">' + o.sub + '</span></span>' +
        (o.price !== undefined ? '<strong>' + (o.price ? money(o.price) : 'Zdarma') + '</strong>' : '') +
      '</label>';
    }
    return '' +
    '<section class="wrap checkout">' +
      '<a href="#/" class="back">' + icons.back + ' Zpět do obchodu</a>' +
      '<h1 class="pdp__title">Pokladna</h1>' +
      '<div class="checkout__grid">' +
        '<form class="co-form" data-checkout novalidate>' +
          '<fieldset><legend><span>1</span> Kontakt</legend>' +
            '<div class="fields">' +
              field('E-mail', 'email', 'email', 'email', true) +
              field('Telefon', 'tel', 'tel', 'tel', false) +
            '</div></fieldset>' +
          '<fieldset><legend><span>2</span> Doručení</legend>' +
            '<div class="fields">' +
              field('Jméno a příjmení', 'name', 'text', 'name', true, true) +
              field('Ulice a číslo popisné', 'street', 'text', 'street-address', true, true) +
              field('Město', 'city', 'text', 'address-level2', true) +
              field('PSČ', 'zip', 'text', 'postal-code', true) +
            '</div>' +
            '<div class="opts">' + D.SHIPPING.map(function (o) { return opt('ship', o, o.id === state.ship); }).join('') + '</div>' +
          '</fieldset>' +
          '<fieldset><legend><span>3</span> Platba</legend>' +
            '<div class="opts">' + D.PAYMENT.map(function (o) { return opt('pay', o, o.id === state.pay); }).join('') + '</div>' +
            (state.pay === 'card' ?
              '<div class="fields">' +
                field('Číslo karty', 'cc', 'text', 'cc-number', false, true) +
                field('Platnost (MM/RR)', 'exp', 'text', 'cc-exp', false) +
                field('CVC', 'cvc', 'text', 'cc-csc', false) +
              '</div>' : '') +
          '</fieldset>' +
          '<label class="check"><input type="checkbox"> Chci dostávat novinky a dropy e-mailem</label>' +
        '</form>' +
        '<aside class="summary" aria-label="Shrnutí objednávky">' +
          '<h2>Shrnutí</h2>' +
          state.cart.map(function (c) {
            var p = byId(c.id);
            return '<div class="sline"><img src="' + p.front + '" alt=""><div><strong>' + esc(p.name) + '</strong><p class="muted small">' + c.size + ' · ' + c.qty + ' ks</p></div><span>' + money(price(p) * c.qty) + '</span></div>';
          }).join('') +
          '<div class="sum-row"><span>Mezisoučet</span><span>' + money(sub) + '</span></div>' +
          '<div class="sum-row"><span>Doprava · ' + ship.label + '</span><span>' + (ship.price ? money(ship.price) : 'Zdarma') + '</span></div>' +
          '<div class="sum-row sum-row--total"><span>Celkem</span><strong>' + money(total) + '</strong></div>' +
          '<button type="submit" form="co-form-id" class="btn btn--light btn--block btn--lg" data-pay>Zaplatit ' + money(total) + '</button>' +
          '<p class="muted small center">Prototyp — žádná platba neproběhne.</p>' +
        '</aside>' +
      '</div>' +
    '</section>';
  }

  function field(label, id, type, ac, req, wide) {
    return '<label class="field' + (wide ? ' field--wide' : '') + '"><span>' + label + (req ? ' *' : '') + '</span>' +
      '<input id="f-' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (req ? ' required' : '') + '></label>';
  }

  function viewDone() {
    var o = state.lastOrder;
    if (!o) return viewNotFound();
    return '<section class="wrap center-box">' +
      seal() +
      '<p class="eyebrow">Objednávka ' + o.no + '</p>' +
      '<h1 class="pdp__title">Díky, máš to.</h1>' +
      '<p class="caps">For the look</p>' +
      '<p class="muted">Objednávku jsme přijali. Potvrzení ti přijde na e-mail' + (o.email ? ' <strong>' + esc(o.email) + '</strong>' : '') + '.</p>' +
      '<p>Celkem: <strong>' + money(o.total) + '</strong></p>' +
      '<a class="btn btn--light" href="#/">Zpět do obchodu</a>' +
    '</section>';
  }

  function viewInfo() {
    return '<section class="wrap info">' +
      '<a href="#/" class="back">' + icons.back + ' Zpět do obchodu</a>' +
      '<h1 class="pdp__title">Nákup</h1>' +
      '<nav class="info__nav" aria-label="Sekce"><a href="#/info/doprava">Doprava a platba</a><a href="#/info/vraceni">Vrácení</a><a href="#/info/velikosti">Velikosti</a></nav>' +
      '<div class="info__block" id="doprava"><h2>Doprava a platba</h2>' +
        '<table class="table"><tbody>' +
          D.SHIPPING.map(function (s) { return '<tr><th scope="row">' + s.label + '</th><td>' + s.sub + '</td><td>' + (s.price ? money(s.price) : 'Zdarma') + '</td></tr>'; }).join('') +
        '</tbody></table>' +
        '<p class="muted">Platit můžeš kartou, přes Apple Pay a Google Pay nebo bankovním převodem.</p>' +
      '</div>' +
      '<div class="info__block" id="vraceni"><h2>Vrácení</h2>' +
        '<p>Zboží koupené online můžeš vrátit do 14 dnů od převzetí bez udání důvodu. Mikina musí být nenošená, s visačkou a v původní krabici.</p>' +
        '<p class="muted">Adresa pro vrácení: [doplnit]</p>' +
      '</div>' +
      '<div class="info__block" id="velikosti"><h2>Velikosti</h2>' +
        '<p class="muted">Většina kousků má volný střih (oversized, boxy, wide). Ber svou běžnou velikost, pro přiléhavější siluetu o číslo menší.</p>' +
        '<div class="table-wrap"><table class="table table--sizes"><thead><tr><th scope="col">Velikost</th><th scope="col">Šířka hrudníku</th><th scope="col">Délka</th><th scope="col">Rukáv</th></tr></thead><tbody>' +
          D.SIZES.map(function (s) { return '<tr><th scope="row">' + s + '</th><td>[cm]</td><td>[cm]</td><td>[cm]</td></tr>'; }).join('') +
        '</tbody></table></div>' +
      '</div>' +
    '</section>';
  }

  function viewNotFound() {
    return '<section class="wrap center-box"><h1 class="h2">Tady nic není</h1><a class="btn btn--light" href="#/">Domů</a></section>';
  }

  // ---------- router ----------
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'produkt') return { name: 'product', slug: parts[1] };
    if (parts[0] === 'pokladna') return { name: 'checkout' };
    if (parts[0] === 'hotovo') return { name: 'done' };
    if (parts[0] === 'info') return { name: 'info', sub: parts[1] };
    return { name: 'home' };
  }

  var pendingScroll = null;
  function render(opts) {
    var r = route();
    var html = r.name === 'product' ? viewProduct(r.slug, opts && opts.err)
      : r.name === 'checkout' ? viewCheckout()
      : r.name === 'done' ? viewDone()
      : r.name === 'info' ? viewInfo()
      : viewHome();
    app.innerHTML = html;
    var co = app.querySelector('[data-checkout]');
    if (co) co.id = 'co-form-id';
  }

  function onRoute() {
    viewProduct.size = null;
    render();
    var r = route();
    if (r.name === 'info' && r.sub) pendingScroll = r.sub;
    if (pendingScroll) {
      var el = document.getElementById(pendingScroll);
      pendingScroll = null;
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo(0, 0);
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a');
    if (!t) return;

    if (t.hasAttribute('data-close-cart')) closeCart();
    if (t.hasAttribute('data-open-cart')) { openCart(); return; }

    var scroll = t.getAttribute('data-scroll');
    if (scroll) {
      e.preventDefault();
      if (route().name === 'home') {
        var el = document.getElementById(scroll);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        pendingScroll = scroll;
        location.hash = '#/';
      }
      return;
    }

    if (t.dataset.filter) { state.filter = t.dataset.filter; render(); return; }
    if (t.dataset.quick) { addToCart(Number(t.dataset.quick), 'M'); return; }
    if (t.dataset.size) {
      viewProduct.size = t.dataset.size;
      app.querySelectorAll('.size').forEach(function (b) { var on = b.dataset.size === viewProduct.size; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      var err = app.querySelector('.error'); if (err) err.remove();
      return;
    }
    if (t.dataset.add) {
      if (!viewProduct.size) {
        var y = window.scrollY; render({ err: true }); window.scrollTo(0, y);
        return;
      }
      addToCart(Number(t.dataset.add), viewProduct.size);
      return;
    }
    if (t.dataset.img) {
      app.querySelector('[data-main]').src = t.dataset.img;
      app.querySelectorAll('.thumb').forEach(function (b) { b.classList.toggle('is-on', b === t); });
      return;
    }
    if (t.dataset.qty) { setQty(t.dataset.qty, Number(t.dataset.d)); return; }
    if (t.hasAttribute('data-pay')) {
      e.preventDefault();
      var form = document.getElementById('co-form-id');
      if (form && !form.reportValidity()) return;
      var email = form ? form.querySelector('[name=email]').value : '';
      var ship = D.SHIPPING.find(function (s) { return s.id === state.ship; });
      state.lastOrder = { no: '#LKS-' + (1000 + Math.floor(Math.random() * 9000)), total: subtotal() + ship.price, email: email };
      state.cart = []; save(); renderCart();
      location.hash = '#/hotovo';
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.ship) { state.ship = t.dataset.ship; keepForm(render); }
    if (t.dataset.pay) { state.pay = t.dataset.pay; keepForm(render); }
  });

  // re-render checkout without losing typed values
  function keepForm(fn) {
    var vals = {};
    app.querySelectorAll('.co-form input[name]').forEach(function (i) { if (i.type !== 'radio') vals[i.name] = i.value; });
    var y = window.scrollY;
    fn();
    Object.keys(vals).forEach(function (k) { var i = app.querySelector('.co-form input[name="' + k + '"]'); if (i) i.value = vals[k]; });
    window.scrollTo(0, y);
  }

  document.addEventListener('submit', function (e) {
    if (e.target.matches('[data-news]')) {
      e.preventDefault();
      e.target.innerHTML = '<p class="news__ok">Jsi na listu. Ozveme se před dalším dropem.</p>';
    }
    if (e.target.matches('[data-checkout]')) e.preventDefault();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !document.querySelector('[data-drawer]').hidden) closeCart();
  });

  window.addEventListener('hashchange', onRoute);
  renderCart();
  onRoute();
})();
