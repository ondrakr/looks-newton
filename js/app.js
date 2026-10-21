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
  function price(p) { return D.BASE_PRICE + p.delta; }
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
      body.innerHTML = '<div class="cart-empty"><p>Košík je zatím prázdný.</p><a class="btn btn--dark" href="#/" data-close-cart data-scroll="shop">Prohlédnout kolekci</a></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = state.cart.map(lineItem).join('');
    foot.innerHTML =
      '<div class="sum-row"><span>Mezisoučet</span><strong>' + money(subtotal()) + '</strong></div>' +
      '<p class="muted small">Doprava se spočítá v pokladně.</p>' +
      '<a class="btn btn--dark btn--block" href="#/pokladna" data-close-cart>Pokračovat k pokladně ' + icons.arrow + '</a>';
  }

  function lineItem(c) {
    var p = byId(c.id);
    return '<div class="line">' +
      '<a href="#/produkt/' + p.slug + '" data-close-cart class="line__img"><img src="' + p.flat + '" alt="' + esc(p.name) + '"></a>' +
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

  // ---------- views ----------
  function card(p) {
    return '<article class="card">' +
      '<div class="card__media">' +
        '<a href="#/produkt/' + p.slug + '" aria-label="Zobrazit ' + esc(p.name) + '">' +
          '<img class="card__life" src="' + p.life + '" alt="' + esc(p.name) + ' — na modelu" loading="lazy">' +
          '<img class="card__flat" src="' + p.flat + '" alt="" loading="lazy">' +
        '</a>' +
        (p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '') +
        '<button type="button" class="quick" data-quick="' + p.id + '" aria-label="Přidat ' + esc(p.name) + ' ve velikosti M do košíku">' + icons.plus + '</button>' +
      '</div>' +
      '<div class="card__info">' +
        '<div><span class="card__no">' + p.no + '</span><a class="card__name" href="#/produkt/' + p.slug + '">' + esc(p.name) + '</a>' +
        '<p class="muted small">' + esc(p.fit) + ' · ' + p.gsm + '</p></div>' +
        '<strong class="card__price">' + money(price(p)) + '</strong>' +
      '</div>' +
    '</article>';
  }

  function viewHome() {
    var list = D.PRODUCTS.filter(function (p) { return state.filter === 'all' || p.tags.indexOf(state.filter) >= 0; });
    var ticker = 'Oversized fit · 450 GSM · Vintage wash · Premium cotton · Navrženo v Praze · ';
    return '' +
    '<section class="hero">' +
      '<div class="wrap hero__inner">' +
        '<div class="hero__text">' +
          '<p class="eyebrow">Drop 01 · 12 mikin · Praha</p>' +
          '<h1 class="hero__title">Looks<em>For the looks</em></h1>' +
          '<p class="hero__lead">Prémiové mikiny 450–500 GSM. Oversized, boxy i vintage wash. Různé styly, stejný mindset.</p>' +
          '<div class="hero__cta"><a class="btn btn--accent" href="#/" data-scroll="shop">Nakupovat kolekci ' + icons.arrow + '</a>' +
          '<a class="btn btn--ghost" href="#/" data-scroll="lookbook">Lookbook</a></div>' +
        '</div>' +
        '<div class="hero__pics">' +
          '<img src="img/life-01.jpg" alt="Model v mikině Black Essential v pražských ulicích">' +
          '<img src="img/life-04.jpg" alt="Modelka v mikině Cream Minimal">' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<div class="ticker" aria-hidden="true"><div class="ticker__track">' + ticker.repeat(6) + '</div></div>' +
    '<section class="wrap section" id="shop">' +
      '<div class="section__head"><h2 class="h2">Kolekce</h2><span class="muted">' + list.length + ' ' + (list.length === 1 ? 'mikina' : list.length < 5 ? 'mikiny' : 'mikin') + '</span></div>' +
      '<div class="chips" role="group" aria-label="Filtr kolekce">' +
        D.FILTERS.map(function (f) {
          return '<button type="button" class="chip' + (state.filter === f.id ? ' is-on' : '') + '" aria-pressed="' + (state.filter === f.id) + '" data-filter="' + f.id + '">' + f.label + '</button>';
        }).join('') +
      '</div>' +
      '<div class="grid">' + list.map(card).join('') + '</div>' +
    '</section>' +
    '<section class="dark" id="lookbook">' +
      '<div class="wrap section">' +
        '<div class="section__head"><h2 class="h2">Různé styly.<br>Stejný mindset.</h2><p class="muted-dark">Lookbook · Praha</p></div>' +
        '<div class="look">' +
          '<img src="img/life-06.jpg" alt="Navy Premium na Starém Městě" loading="lazy">' +
          '<img src="img/life-11.jpg" alt="Cropped Boxy Hoodie" loading="lazy">' +
          '<img src="img/life-09.jpg" alt="Zip Hoodie" loading="lazy">' +
        '</div>' +
        '<figure class="strip"><img src="img/kolekce.jpg" alt="Celá kolekce LOOKS — 12 mikin vedle sebe" loading="lazy"><figcaption class="muted-dark">Celá kolekce — 12 mikin</figcaption></figure>' +
      '</div>' +
    '</section>' +
    '<section class="wrap section about" id="about">' +
      '<div><p class="eyebrow eyebrow--dark">O nás</p><h2 class="h2">LOOKS Studio</h2></div>' +
      '<div class="about__text"><p>Vlastní oblečení z Prahy. Těžká bavlna, čistý střih a jemná výšivka <em class="serif">looks</em> na hrudi — mikiny, které vypadají dobře každý den.</p>' +
      '<form class="news" data-news>' +
        '<label for="news-email">Buď první u dalšího dropu</label>' +
        '<div class="news__row"><input id="news-email" type="email" required placeholder="tvuj@email.cz" autocomplete="email"><button class="btn btn--dark" type="submit">Odebírat</button></div>' +
      '</form></div>' +
    '</section>';
  }

  function viewProduct(slug, err) {
    var p = bySlug(slug);
    if (!p) return viewNotFound();
    var sel = viewProduct.size || null;
    var related = [1, 2, 3, 4].map(function (k) { return byId(((p.id - 1 + k) % 12) + 1); });
    return '' +
    '<section class="wrap pdp">' +
      '<nav class="crumbs" aria-label="Drobečková navigace"><a href="#/" data-scroll="shop">Kolekce</a><span>/</span><span>' + esc(p.name) + '</span></nav>' +
      '<div class="pdp__grid">' +
        '<div class="gallery">' +
          '<div class="gallery__main"><img data-main src="' + p.life + '" alt="' + esc(p.name) + '"></div>' +
          '<div class="gallery__thumbs">' +
            '<button type="button" class="thumb is-on" data-img="' + p.life + '" aria-label="Fotka na modelu"><img src="' + p.life + '" alt=""></button>' +
            '<button type="button" class="thumb" data-img="' + p.flat + '" aria-label="Produktová fotka"><img src="' + p.flat + '" alt=""></button>' +
          '</div>' +
        '</div>' +
        '<div class="pdp__info">' +
          '<p class="eyebrow eyebrow--dark">' + p.no + ' / 12</p>' +
          '<h1 class="pdp__title">' + esc(p.name) + '</h1>' +
          '<p class="pdp__price">' + money(price(p)) + '</p>' +
          '<div class="tags"><span>' + esc(p.fit) + '</span><span>' + p.gsm + '</span><span>' + esc(p.material) + '</span></div>' +
          '<p class="pdp__color"><span class="dot" style="background:' + p.hex + '"></span>Barva: <strong>' + esc(p.color) + '</strong></p>' +
          '<fieldset class="sizes"><legend>Velikost</legend><div class="sizes__row">' +
            D.SIZES.map(function (s) {
              return '<button type="button" class="size' + (sel === s ? ' is-on' : '') + '" aria-pressed="' + (sel === s) + '" data-size="' + s + '">' + s + '</button>';
            }).join('') +
          '</div>' + (err ? '<p class="error" role="alert">Vyber prosím velikost.</p>' : '') + '</fieldset>' +
          '<button type="button" class="btn btn--dark btn--block btn--lg" data-add="' + p.id + '">Přidat do košíku · ' + money(price(p)) + '</button>' +
          '<dl class="specs">' +
            '<div><dt>Střih</dt><dd>' + esc(p.fit) + '</dd></div>' +
            '<div><dt>Gramáž</dt><dd>' + p.gsm + '</dd></div>' +
            '<div><dt>Materiál</dt><dd>' + esc(p.material) + '</dd></div>' +
            '<div><dt>Detail</dt><dd>Výšivka <em class="serif">looks</em> na hrudi</dd></div>' +
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
      return '<section class="wrap center-box"><h1 class="h2">Košík je prázdný</h1><p class="muted">Vyber si něco z kolekce a vrať se sem.</p><a class="btn btn--dark" href="#/" data-scroll="shop">Zpět do obchodu</a></section>';
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
            return '<div class="sline"><img src="' + p.flat + '" alt=""><div><strong>' + esc(p.name) + '</strong><p class="muted small">' + c.size + ' · ' + c.qty + ' ks</p></div><span>' + money(price(p) * c.qty) + '</span></div>';
          }).join('') +
          '<div class="sum-row"><span>Mezisoučet</span><span>' + money(sub) + '</span></div>' +
          '<div class="sum-row"><span>Doprava · ' + ship.label + '</span><span>' + (ship.price ? money(ship.price) : 'Zdarma') + '</span></div>' +
          '<div class="sum-row sum-row--total"><span>Celkem</span><strong>' + money(total) + '</strong></div>' +
          '<button type="submit" form="co-form-id" class="btn btn--accent btn--block btn--lg" data-pay>Zaplatit ' + money(total) + '</button>' +
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
      '<div class="done-icon">' + icons.check + '</div>' +
      '<p class="eyebrow eyebrow--dark">Objednávka ' + o.no + '</p>' +
      '<h1 class="pdp__title">Díky, máš to.</h1>' +
      '<p class="muted">Objednávku jsme přijali. Potvrzení ti přijde na e-mail' + (o.email ? ' <strong>' + esc(o.email) + '</strong>' : '') + '.</p>' +
      '<p>Celkem: <strong>' + money(o.total) + '</strong></p>' +
      '<a class="btn btn--dark" href="#/">Zpět do obchodu</a>' +
    '</section>';
  }

  function viewNotFound() {
    return '<section class="wrap center-box"><h1 class="h2">Tady nic není</h1><a class="btn btn--dark" href="#/">Domů</a></section>';
  }

  // ---------- router ----------
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'produkt') return { name: 'product', slug: parts[1] };
    if (parts[0] === 'pokladna') return { name: 'checkout' };
    if (parts[0] === 'hotovo') return { name: 'done' };
    return { name: 'home' };
  }

  var pendingScroll = null;
  function render(opts) {
    var r = route();
    var html = r.name === 'product' ? viewProduct(r.slug, opts && opts.err)
      : r.name === 'checkout' ? viewCheckout()
      : r.name === 'done' ? viewDone()
      : viewHome();
    app.innerHTML = html;
    var co = app.querySelector('[data-checkout]');
    if (co) co.id = 'co-form-id';
  }

  function onRoute() {
    viewProduct.size = null;
    render();
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
  render();
})();
