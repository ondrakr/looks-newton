# Looks Studio — eshop (prototyp)

Klikací prototyp eshopu Looks Studio: Alpaca Collection (24 kousků: mikiny, kalhoty, tepláky, trička), detail produktu, košík a pokladna.
Čistý HTML/CSS/JS, bez buildu a bez závislostí. Objednávky se nikam neodesílají.

## Spuštění lokálně
```
python3 -m http.server 8000
```
a otevři http://localhost:8000 (nebo jen dvojklik na `index.html`).

## Úpravy
- Produkty, ceny, doprava, platby: `js/products.js` (ceny jsou ilustrační, mikina v cílovém rozpětí 3–4 tis. Kč)
- Barvy a fonty: proměnné na začátku `css/style.css`
- Fotky: `img/p/NN-0..3.jpg` (zepředu, zezadu, detail, na modelu) — AI vizualizace návrhů, nahraď fotkami vzorků se stejnými názvy
