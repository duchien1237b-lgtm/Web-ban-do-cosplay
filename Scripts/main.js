/* =========================================================
   KAGAMI COSPLAY – main.js (dùng chung cho mọi trang)
   - Bộ icon SVG, tiện ích định dạng tiền, lưu trữ localStorage
   - Giỏ hàng, yêu thích, xem nhanh, tìm kiếm gợi ý
   - Chế độ tối, nhạc nền, chat hỗ trợ, nút lên đầu trang
   ========================================================= */
(function () {
  "use strict";
  const D = window.KAGAMI_DATA;
  /* Dữ liệu do trang Quản trị chỉnh sửa (lưu trong trình duyệt) ghi đè dữ liệu gốc */
  try {
    const op = JSON.parse(localStorage.getItem("kagami_admin_products") || "null"); if (Array.isArray(op)) D.products = op;
    const oc = JSON.parse(localStorage.getItem("kagami_admin_coupons") || "null"); if (oc && typeof oc === "object") D.coupons = oc;
  } catch (e) { /* bộ nhớ bị chặn */ }
  D.allProducts = D.products;
  if (!document.body.classList.contains("admin-page")) D.products = D.products.filter(p => !p.hidden);
  D.categories.forEach(c => c.count = D.products.filter(p => p.cat === c.slug).length);

  /* ---------------- Bộ icon (sprite) ---------------- */
  const ICONS = {
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.8H6.1"/>',
    bag: '<path d="M5 8h14l-1 12.2a1.6 1.6 0 0 1-1.6 1.3H7.6A1.6 1.6 0 0 1 6 20.2Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    heart: '<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h12"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    phone: '<path d="M5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 7.7 7.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.7a2 2 0 0 1 2-2.2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    pin: '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    truck: '<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.3v2.7h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6Z"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v3.5h3.5M4 13a8 8 0 0 0 14.6 4.5M20 20v-3.5h-3.5"/>',
    sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"/><path d="M19 15c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.8"/>',
    brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5Z"/><path d="M6 13c-2 0-3 1.5-3 3.5V20h3.5c2 0 3.5-1 3.5-3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9.5h8M8 12.5h5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5Z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    tag: '<path d="M3 12V4h8l9.5 9.5-8 8Z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4s-1 4 4 4c5 0 6.5-3.5 4-4s-4 4-4 4"/>',
    ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21Z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
    share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 3.5 5.8 3.5 9s-1 6.2-3.5 9c-2.5-2.8-3.5-5.8-3.5-9S9.5 5.8 12 3Z"/>',
    play: '<path d="M7 4.5v15l12.5-7.5Z"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
    wallet: '<path d="M4 7.5h15a1.5 1.5 0 0 1 1.5 1.5v9.5A1.5 1.5 0 0 1 19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11.5v3.5"/><circle cx="16.5" cy="14" r="1.3"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5M4.5 10v8M9 10v8M15 10v8M19.5 10v8M3 20.5h18"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    package: '<path d="M12 3 20.5 7.5v9L12 21l-8.5-4.5v-9Z"/><path d="M3.8 7.6 12 12l8.2-4.4M12 12v9M7.8 5.3l8.4 4.6"/>',
    logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    zap: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12Z"/>',
    crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5Z"/><path d="M5 21h14"/>',
    hanger: '<path d="M12 7.5a2.5 2.5 0 1 1 2.5-2.5c0 1.3-1 1.8-2.5 2.6v1L21 15a1.4 1.4 0 0 1-.8 2.5H3.8A1.4 1.4 0 0 1 3 15l9-6.4"/>',
    home: '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1Z"/>',
    send: '<path d="m21 3-9.5 18-2-8-8-2Z"/><path d="M21 3 9.5 13"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    flame: '<path d="M12 21.5c-4 0-7-2.8-7-6.8 0-4.2 3.4-6 4-10.2 2.6 1.6 4 4 4 6.5 1-1 1.5-2.2 1.5-3.5 2.8 1.8 4.5 4.5 4.5 7.5 0 3.7-3 6.5-7 6.5Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3Z"/>'
  };
  const sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("") + "</svg>";
  document.body.insertAdjacentHTML("afterbegin", sprite);
  const ico = (n, cls = "") => `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  /* ---------------- Tiện ích ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => (Math.round(n) || 0).toLocaleString("vi-VN") + "đ";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const store = {
    get(k, d) { try { const v = localStorage.getItem("kagami_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("kagami_" + k, JSON.stringify(v)); } catch (e) { /* bộ nhớ bị chặn */ } }
  };
  const byId = id => D.products.find(p => p.id === id) || (D.combos || []).find(c => c.id === id);
  /* Ảnh: ưu tiên file trong Images/photos (sau khi tải về), nếu chưa có thì lấy bản online */
  const im = key => /^(https?:|data:|Images\/)/.test(key || "") ? `src="${key}"` : `src="Images/photos/${key}.jpg" data-fb="${(D.photos || {})[key] || ""}"`;
  const setImg = (el, key) => { delete el.dataset.tried; el.classList.remove("img-broken"); if (/^(https?:|data:|Images\/)/.test(key || "")) { el.dataset.fb = ""; el.src = key; return; } el.dataset.fb = (D.photos || {})[key] || ""; el.src = `Images/photos/${key}.jpg`; };
  const catName = slug => (D.categories.find(c => c.slug === slug) || {}).name || "";
  const salePrice = (v, p) => v == null ? null : Math.round(v * (100 - (p.sale || 0)) / 100 / 1000) * 1000;
  const priceBuy = p => salePrice(p.buy, p);
  const priceRent = p => salePrice(p.rent, p);
  /* thuê từ 3 ngày giảm 10%, từ 5 ngày giảm 20% */
  const rentDiscount = days => days >= 5 ? 0.2 : days >= 3 ? 0.1 : 0;
  const rentTotal = (p, days) => Math.round(priceRent(p) * days * (1 - rentDiscount(days)));
  const stars = r => { let s = ""; for (let i = 1; i <= 5; i++) s += `<span class="${r >= i - 0.25 ? "" : "off"}">★</span>`; return `<span class="stars" aria-label="${r} sao">${s}</span>`; };
  const initials = name => name.trim().split(/\s+/).slice(-2).map(w => w[0]).join("").toUpperCase();
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const fmtDate = iso => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
  const qs = k => new URLSearchParams(location.search).get(k);

  /* ---------------- Âm thanh ---------------- */
  const sfx = {};
  function play(name, vol = 0.45) {
    try {
      if (!sfx[name]) sfx[name] = new Audio(`Sounds/${name}.mp3`);
      sfx[name].volume = vol; sfx[name].currentTime = 0; sfx[name].play().catch(() => {});
    } catch (e) { /* trình duyệt chặn âm thanh */ }
  }

  /* ---------------- Toast ---------------- */
  let toastWrap;
  function toast(msg, type = "ok", img) {
    if (!toastWrap) { toastWrap = document.createElement("div"); toastWrap.className = "toast-wrap"; document.body.appendChild(toastWrap); }
    const t = document.createElement("div");
    t.className = "toast " + type; t.setAttribute("role", "status");
    t.innerHTML = (img ? `<img ${im(img)} alt="">` : ico(type === "ok" ? "check" : "info")) + `<div>${msg}</div>`;
    toastWrap.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 2800);
  }

  /* ---------------- Giỏ hàng ---------------- */
  const Cart = {
    items() { return store.get("cart", []); },
    save(items) { store.set("cart", items); updateBadges(); renderMini(); document.dispatchEvent(new CustomEvent("cart:change")); },
    key(it) { return [it.id, it.mode, it.size, it.mode === "rent" ? it.start + ":" + it.days : ""].join("|"); },
    add(it) {
      const p = byId(it.id); if (!p) return;
      if (it.mode === "buy" && p.buy == null) it.mode = "rent";
      it.qty = Math.max(1, Math.min(10, +it.qty || 1));
      if (it.mode === "rent") { it.days = Math.max(1, Math.min(14, +it.days || 1)); it.start = it.start || addDays(today(), 1); }
      it.size = it.size || p.sizes[0];
      const items = this.items(); const k = this.key(it);
      const ex = items.find(x => this.key(x) === k);
      if (ex) ex.qty = Math.min(10, ex.qty + it.qty); else items.push(it);
      this.save(items);
      play("add-to-cart");
      toast(`Đã thêm <b>${esc(p.name)}</b> vào giỏ (${it.mode === "rent" ? "thuê " + it.days + " ngày" : "mua"})`, "ok", p.images[0]);
    },
    setQty(i, q) { const items = this.items(); if (!items[i]) return; items[i].qty = Math.max(1, Math.min(10, q)); this.save(items); },
    remove(i) { const items = this.items(); items.splice(i, 1); this.save(items); },
    clear() { this.save([]); },
    line(it) {
      const p = byId(it.id);
      if (it.mode === "buy") return { p, unit: priceBuy(p), total: priceBuy(p) * it.qty, deposit: 0 };
      const unit = rentTotal(p, it.days);
      return { p, unit, total: unit * it.qty, deposit: p.deposit * it.qty };
    },
    count() { return this.items().reduce((s, it) => s + it.qty, 0); },
    totals(couponCode, shipFee) {
      const items = this.items(); let sub = 0, dep = 0;
      items.forEach(it => { const l = this.line(it); sub += l.total; dep += l.deposit; });
      let disc = 0, ship = shipFee == null ? 30000 : shipFee, cp = couponCode && D.coupons[couponCode];
      if (sub >= 999000) ship = 0;
      if (cp && sub >= cp.min) {
        if (cp.type === "percent") disc = Math.round(sub * cp.value / 100);
        if (cp.type === "fixed") disc = cp.value;
        if (cp.type === "ship") ship = 0;
      } else cp = null;
      return { sub, dep, disc, ship, coupon: cp ? couponCode : null, total: Math.max(0, sub - disc) + ship + dep };
    }
  };

  /* ---------------- Yêu thích ---------------- */
  const Wish = {
    list() { return store.get("wish", []); },
    has(id) { return this.list().includes(id); },
    toggle(id) {
      let l = this.list(); const p = byId(id);
      if (l.includes(id)) { l = l.filter(x => x !== id); toast(`Đã bỏ <b>${esc(p.name)}</b> khỏi yêu thích`, "info"); }
      else { l.push(id); toast(`Đã lưu <b>${esc(p.name)}</b> vào yêu thích`, "ok", p.images[0]); play("click", .3); }
      store.set("wish", l); updateBadges();
      $$(`[data-fav="${id}"]`).forEach(b => b.classList.toggle("on", l.includes(id)));
      document.dispatchEvent(new CustomEvent("wish:change"));
    }
  };

  function updateBadges() {
    $$("[data-badge=cart]").forEach(b => { const n = Cart.count(); b.textContent = n || ""; b.dataset.n = n; });
    $$("[data-badge=wish]").forEach(b => { const n = Wish.list().length; b.textContent = n || ""; b.dataset.n = n; });
  }

  /* ---------------- Thẻ sản phẩm ---------------- */
  function card(p, opts = {}) {
    const tags = [];
    if (p.tags.includes("new")) tags.push('<span class="tag new">Mới</span>');
    if (p.tags.includes("hot")) tags.push('<span class="tag hot">Hot</span>');
    if (p.sale) tags.push(`<span class="tag sale">-${p.sale}%</span>`);
    if (p.buy == null) tags.push('<span class="tag rent-only">Chỉ thuê</span>');
    const flash = opts.flash ? `<div class="sold-bar"><i style="width:${Math.min(96, 30 + p.sold % 60)}%"></i></div><span class="sold-text">Đã thuê ${p.sold} lượt</span>` : "";
    return `<article class="p-card">
  <div class="p-media">
    <a href="product.html?id=${p.id}" aria-label="${esc(p.name)}">
      <img ${im(p.images[0])} alt="${esc(p.name)}" loading="lazy" width="600" height="750">
      <img class="alt" ${im(p.images[2])} alt="" loading="lazy" width="600" height="750">
    </a>
    <div class="p-badges">${tags.join("")}</div>
    <button class="p-fav ${Wish.has(p.id) ? "on" : ""}" data-fav="${p.id}" aria-label="Yêu thích">${ico("heart")}</button>
    <div class="p-actions">
      <button class="btn" data-qv="${p.id}">${ico("eye", "sm")} Xem nhanh</button>
      <button class="btn btn-primary" data-add="${p.id}">${ico("bag", "sm")} Thuê ngay</button>
    </div>
  </div>
  <div class="p-body">
    <span class="p-cat">${catName(p.cat)}</span>
    <h3 class="p-name"><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
    <div class="p-meta">${stars(p.rating)} <span>${p.rating} · ${p.reviews} đánh giá</span></div>
    <p class="p-desc">${esc(p.desc)}</p>
    <div class="p-price">
      <span class="price-rent">${money(priceRent(p))}<small>/ngày</small></span>
      ${p.sale ? `<span class="price-old">${money(p.rent)}</span>` : ""}
      ${p.buy != null ? `<span class="price-buy">Mua: <b>${money(priceBuy(p))}</b></span>` : ""}
    </div>${flash}
  </div>
</article>`;
  }

  /* ---------------- Xem nhanh ---------------- */
  function modal(html, cls = "") {
    let m = $("#modal");
    if (!m) {
      m = document.createElement("div"); m.id = "modal"; m.className = "modal";
      m.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal-box" role="dialog" aria-modal="true"><button class="icon-btn modal-close" data-close aria-label="Đóng">${ico("x")}</button><div class="modal-content"></div></div>`;
      document.body.appendChild(m);
      m.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
    }
    $(".modal-box", m).className = "modal-box " + cls;
    $(".modal-content", m).innerHTML = html;
    m.classList.add("open"); document.body.style.overflow = "hidden";
    return m;
  }
  function closeModal() { const m = $("#modal"); if (m) m.classList.remove("open"); document.body.style.overflow = ""; }

  function quickView(id) {
    const p = byId(id);
    const m = modal(`<div class="qv">
      <div class="qv-media"><img ${im(p.images[0])} alt="${esc(p.name)}"></div>
      <div class="qv-info">
        <span class="p-cat">${catName(p.cat)}</span>
        <h2 style="font-family:var(--display);font-size:30px;margin:0">${esc(p.name)}</h2>
        <div class="p-meta">${stars(p.rating)} ${p.rating} · Đã thuê ${p.sold} lượt</div>
        <p class="muted" style="margin:0">${esc(p.desc)}</p>
        <div class="p-price"><span class="price-rent" style="font-size:22px">${money(priceRent(p))}<small>/ngày</small></span>${p.buy != null ? `<span class="price-buy">Mua: <b>${money(priceBuy(p))}</b></span>` : ""}</div>
        <div><div class="pd-label">Kích thước</div><div class="size-pills" id="qvSize">${p.sizes.map((s, i) => `<button class="${i ? "" : "active"}" data-s="${s}">${s}</button>`).join("")}</div></div>
        <div class="seg" id="qvMode" style="grid-template-columns:1fr 1fr"><button class="active" data-m="rent">Thuê 1 ngày</button><button data-m="buy" ${p.buy == null ? "disabled" : ""}>Mua đứt</button></div>
        <div style="display:flex;gap:10px;margin-top:6px"><button class="btn btn-primary" style="flex:1" id="qvAdd">${ico("bag", "sm")} Thêm vào giỏ</button><button class="icon-btn p-fav ${Wish.has(p.id) ? "on" : ""}" style="position:static;width:46px;height:46px" data-fav="${p.id}" aria-label="Yêu thích">${ico("heart")}</button></div>
        <a href="product.html?id=${p.id}" class="read-more">Xem chi tiết & chọn ngày thuê ${ico("arrow", "sm")}</a>
      </div></div>`);
    let size = p.sizes[0], mode = "rent";
    $("#qvSize", m).onclick = e => { const b = e.target.closest("button"); if (!b) return; $$("#qvSize button", m).forEach(x => x.classList.remove("active")); b.classList.add("active"); size = b.dataset.s; };
    $("#qvMode", m).onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return; $$("#qvMode button", m).forEach(x => x.classList.remove("active")); b.classList.add("active"); mode = b.dataset.m; };
    $("#qvAdd", m).onclick = () => { Cart.add({ id, mode, size, qty: 1, days: 1 }); closeModal(); openMini(); };
  }

  /* ---------------- Giỏ mini (drawer) ---------------- */
  function renderMini() {
    const body = $("#miniBody"); if (!body) return;
    const items = Cart.items();
    if (!items.length) {
      body.innerHTML = `<div class="empty">${ico("bag")}<p>Giỏ hàng đang trống</p><a href="shop.html" class="btn btn-sm">Khám phá tủ đồ</a></div>`;
      $("#miniFoot").classList.add("hidden"); return;
    }
    $("#miniFoot").classList.remove("hidden");
    body.innerHTML = items.map((it, i) => {
      const l = Cart.line(it);
      return `<div class="mini-item"><img ${im(l.p.images[0])} alt="">
        <div><h4>${esc(l.p.name)}</h4><div class="muted">${it.mode === "rent" ? `Thuê ${it.days} ngày · ${fmtDate(it.start)}` : "Mua"} · Size ${it.size} · x${it.qty}</div><b>${money(l.total)}</b></div>
        <button class="remove-btn" data-mini-rm="${i}" aria-label="Xoá">${ico("trash", "sm")}</button></div>`;
    }).join("");
    const t = Cart.totals(store.get("coupon"));
    $("#miniSub").textContent = money(t.sub);
    $("#miniDep").textContent = money(t.dep);
  }
  function openMini() { renderMini(); $("#miniCart").classList.add("open"); }

  /* ---------------- Tìm kiếm gợi ý ---------------- */
  function initSearch(form) {
    const input = $("input", form), box = $(".suggest", form); let hl = -1;
    const render = () => {
      const q = norm(input.value.trim());
      if (q.length < 1) { box.classList.remove("open"); return; }
      const res = D.products.filter(p => norm(p.name + " " + catName(p.cat) + " " + p.desc).includes(q)).slice(0, 6);
      const mark = s => { const i = norm(s).indexOf(q); return i < 0 ? esc(s) : esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length)); };
      box.innerHTML = res.length
        ? res.map(p => `<a href="product.html?id=${p.id}"><img ${im(p.images[0])} alt=""><span>${mark(p.name)}<br><small class="muted">${catName(p.cat)}</small></span><b class="price-rent" style="font-size:13px">${money(priceRent(p))}</b></a>`).join("") + `<a class="s-all" href="shop.html?q=${encodeURIComponent(input.value.trim())}">Xem tất cả kết quả cho “${esc(input.value.trim())}”</a>`
        : `<div class="empty" style="padding:20px">Không tìm thấy trang phục phù hợp</div>`;
      box.classList.add("open"); hl = -1;
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", e => {
      const links = $$("a", box); if (!links.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); hl = (hl + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach((a, i) => a.classList.toggle("hl", i === hl));
      } else if (e.key === "Enter" && hl >= 0) { e.preventDefault(); links[hl].click(); }
      else if (e.key === "Escape") box.classList.remove("open");
    });
    form.addEventListener("submit", e => { e.preventDefault(); location.href = "shop.html?q=" + encodeURIComponent(input.value.trim()); });
    document.addEventListener("click", e => { if (!form.contains(e.target)) box.classList.remove("open"); });
  }

  /* ---------------- Chatbot hỗ trợ ---------------- */
  const BOT = [
    [/(gia|bao nhieu|phi)/, "Giá thuê từ 25.000đ đến 350.000đ/ngày tuỳ bộ. Thuê từ 3 ngày giảm 10%, từ 5 ngày giảm 20% nha!"],
    [/(coc|dat coc)/, "Mỗi bộ có mức cọc riêng hiển thị trên trang sản phẩm, hoàn 100% khi trả đồ đúng hạn."],
    [/(size|kich thuoc|mac vua)/, "Bạn xem bảng size ở mục “Hướng dẫn chọn size” trong trang sản phẩm. Gửi mình chiều cao/cân nặng, mình tư vấn ngay!"],
    [/(giao|ship|van chuyen)/, "Nội thành TP.HCM giao nhanh trong 2 giờ (30.000đ). Đơn từ 999.000đ được miễn phí vận chuyển."],
    [/(dia chi|o dau|cua hang)/, "Kagami ở 450–451 Lê Văn Việt, Thủ Đức, TP.HCM (địa chỉ demo). Mở cửa 9:00–21:00 mỗi ngày."],
    [/(ma giam|khuyen mai|voucher|coupon)/, "Mã đang chạy: KAGAMI10 (-10%), SINHVIEN (-15% đơn từ 300k), COSFEST50 (-50k đơn từ 500k), FREESHIP."],
    [/(chao|hello|hi)/, "Chào bạn 👋 Mình là Kami, trợ lý của Kagami Cosplay. Bạn cần tìm trang phục gì?"]
  ];
  function initChat() {
    const box = $("#chatbox"); if (!box) return;
    const body = $(".chat-body", box), input = $("input", box);
    const say = (t, who = "bot") => { body.insertAdjacentHTML("beforeend", `<div class="msg ${who}">${t}</div>`); body.scrollTop = body.scrollHeight; };
    const reply = q => {
      say(esc(q), "me");
      const n = norm(q); const hit = BOT.find(([re]) => re.test(n));
      const found = D.products.filter(p => n.split(/\s+/).some(w => w.length > 3 && norm(p.name).includes(w))).slice(0, 2);
      setTimeout(() => {
        if (hit) say(hit[1]);
        else if (found.length) say("Mình tìm được: " + found.map(p => `<a href="product.html?id=${p.id}" style="color:var(--brand);font-weight:600">${esc(p.name)}</a>`).join(", "));
        else say("Câu này mình chưa trả lời được 😅 Bạn để lại số điện thoại ở trang Liên hệ, nhân viên sẽ gọi lại trong 15 phút nhé!");
      }, 500);
    };
    $("#chatToggle").onclick = () => { box.classList.toggle("open"); if (box.classList.contains("open") && !body.children.length) say("Chào bạn 👋 Mình là Kami! Hỏi mình về giá thuê, đặt cọc, size hay mã giảm giá nhé."); input.focus(); };
    $(".chat-close", box).onclick = () => box.classList.remove("open");
    $(".chat-form", box).onsubmit = e => { e.preventDefault(); const v = input.value.trim(); if (v) { reply(v); input.value = ""; } };
    $(".chat-quick", box).onclick = e => { const b = e.target.closest("button"); if (b) reply(b.textContent); };
  }

  /* ---------------- Nhạc nền ---------------- */
  function initMusic() {
    const btn = $("#musicToggle"); if (!btn) return;
    const audio = new Audio("Sounds/bgm-koto.mp3"); audio.loop = true; audio.volume = 0.25;
    const set = on => { btn.classList.toggle("playing", on); btn.setAttribute("aria-pressed", on); btn.title = on ? "Tắt nhạc nền" : "Bật nhạc nền"; };
    btn.onclick = () => {
      if (audio.paused) { audio.play().then(() => { set(true); store.set("music", true); }).catch(() => toast("Trình duyệt chặn phát nhạc", "err")); }
      else { audio.pause(); set(false); store.set("music", false); }
    };
    // nếu người dùng đã bật trước đó: phát sau lần tương tác đầu tiên (chính sách autoplay)
    if (store.get("music", false)) {
      const go = () => { audio.play().then(() => set(true)).catch(() => {}); document.removeEventListener("pointerdown", go); };
      document.addEventListener("pointerdown", go);
    }
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const saved = store.get("theme", null);
    const apply = t => { document.documentElement.dataset.theme = t; $$("[data-theme-toggle] use").forEach(u => u.setAttribute("href", t === "dark" ? "#i-sun" : "#i-moon")); };
    apply(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    $$("[data-theme-toggle]").forEach(b => b.onclick = () => { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; apply(t); store.set("theme", t); });
  }

  /* ---------------- Khởi tạo chung ---------------- */
  function init() {
    initTheme();
    updateBadges();
    $$(".search-form").forEach(initSearch);
    initChat(); initMusic();

    // đánh dấu menu đang mở
    const page = location.pathname.split("/").pop() || "index.html";
    $$(".nav > li > a, .m-nav a").forEach(a => { if (a.getAttribute("href") === page) a.classList.add("active"); });

    // header đổ bóng khi cuộn + nút lên đầu
    const header = $(".header"), top = $("#toTop");
    const onScroll = () => { header && header.classList.toggle("scrolled", scrollY > 10); top && top.classList.toggle("show", scrollY > 600); };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    top && (top.onclick = () => scrollTo({ top: 0, behavior: "smooth" }));

    // drawer: giỏ mini & menu mobile
    $$("[data-open-cart]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); openMini(); }));
    $$("[data-open-menu]").forEach(b => b.addEventListener("click", () => $("#mobileMenu").classList.add("open")));
    $$(".drawer").forEach(d => d.addEventListener("click", e => { if (e.target.closest("[data-close-drawer]")) d.classList.remove("open"); }));
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); $$(".drawer.open").forEach(d => d.classList.remove("open")); } });
    renderMini();

    // tài khoản trên header
    const user = store.get("user", null);
    $$("[data-user-name]").forEach(el => el.textContent = user ? user.name.split(" ").pop() : "Đăng nhập");

    // uỷ quyền sự kiện cho thẻ sản phẩm
    document.addEventListener("click", e => {
      const add = e.target.closest("[data-add]"), fav = e.target.closest("[data-fav]"), qv = e.target.closest("[data-qv]"), rm = e.target.closest("[data-mini-rm]");
      if (add) { e.preventDefault(); const p = byId(add.dataset.add); Cart.add({ id: p.id, mode: add.dataset.mode || "rent", size: p.sizes[0], qty: 1, days: 1 }); }
      if (fav) { e.preventDefault(); Wish.toggle(fav.dataset.fav); }
      if (qv) { e.preventDefault(); quickView(qv.dataset.qv); }
      if (rm) { Cart.remove(+rm.dataset.miniRm); }
    });

    // đăng ký nhận tin
    $$(".newsletter form").forEach(f => f.addEventListener("submit", e => {
      e.preventDefault(); const v = $("input", f).value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return toast("Email chưa đúng định dạng", "err");
      const subs = store.get("subs", []); if (!subs.includes(v)) subs.push(v); store.set("subs", subs);
      f.reset(); toast("Đăng ký thành công! Mã <b>KAGAMI10</b> đã được gửi tới email của bạn 🎁");
    }));

    // hiệu ứng xuất hiện khi cuộn
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 }) : null;
    $$(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("in"));
    $$(".year").forEach(el => el.textContent = new Date().getFullYear());
  }

  window.K = { D, $, $$, ico, im, setImg, money, esc, norm, store, byId, catName, priceBuy, priceRent, rentTotal, rentDiscount, stars, initials, today, addDays, fmtDate, qs, play, toast, Cart, Wish, card, modal, closeModal, quickView, openMini, updateBadges };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
