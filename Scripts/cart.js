/* Giỏ hàng (cart.html) & Thanh toán (checkout.html) */
(function () {
  const { D, $, $$, ico, card, esc, money, store, toast, Cart, fmtDate, addDays, today, play } = K;
  const SHIP = { fast: { name: "Giao nhanh 2 giờ", note: "Nội thành TP.HCM", fee: 30000 }, std: { name: "Giao tiêu chuẩn", note: "2–4 ngày, toàn quốc", fee: 20000 }, store: { name: "Nhận tại cửa hàng", note: "Thử đồ miễn phí tại tiệm", fee: 0 } };

  function couponUI(onChange) {
    const input = $("#couponInput"), msg = $("#couponMsg");
    const show = () => {
      const c = store.get("coupon"); const t = Cart.totals(c);
      if (c && t.coupon) { msg.innerHTML = `<span style="color:var(--ok)">✔ Đã áp dụng <b>${c}</b>: ${D.coupons[c].desc}</span> <button class="read-more" style="padding:0" id="rmCoupon">Gỡ</button>`; input.value = c; }
      else if (c) { msg.innerHTML = `<span style="color:var(--warn)">Mã <b>${c}</b> chưa đủ điều kiện (${D.coupons[c].desc})</span>`; }
      else msg.innerHTML = "";
      const rm = $("#rmCoupon"); if (rm) rm.onclick = () => { store.set("coupon", null); input.value = ""; show(); onChange(); };
    };
    const apply = code => {
      code = code.trim().toUpperCase();
      if (!D.coupons[code]) { msg.innerHTML = `<span style="color:var(--danger)">Mã giảm giá không tồn tại</span>`; return; }
      store.set("coupon", code); show(); onChange(); toast(`Áp dụng mã ${code} thành công`);
    };
    $("#couponBtn").onclick = () => apply(input.value);
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); apply(input.value); } });
    $(".coupon-hint").innerHTML = Object.keys(D.coupons).map(c => `<button type="button" data-c="${c}" title="${D.coupons[c].desc}">${c}</button>`).join("");
    $(".coupon-hint").onclick = e => { const b = e.target.closest("button"); if (b) apply(b.dataset.c); };
    show();
    return show;
  }

  function sumHTML(t, shipLabel) {
    return `<div class="sum-row"><span>Tạm tính (thuê + mua)</span><span>${money(t.sub)}</span></div>
      ${t.disc ? `<div class="sum-row discount"><span>Giảm giá (${t.coupon})</span><span>-${money(t.disc)}</span></div>` : ""}
      <div class="sum-row"><span>Phí vận chuyển ${shipLabel ? `<small class="muted">(${shipLabel})</small>` : ""}</span><span>${t.ship ? money(t.ship) : '<b style="color:var(--ok)">Miễn phí</b>'}</span></div>
      <div class="sum-row"><span>Tiền cọc <small class="muted">(hoàn lại)</small></span><span>${money(t.dep)}</span></div>
      <div class="sum-row total"><span>Tổng thanh toán</span><span>${money(t.total)}</span></div>`;
  }
  const freeShipHTML = sub => sub >= 999000
    ? `🎉 Đơn của bạn được <b>miễn phí vận chuyển</b>!<div class="sold-bar"><i style="width:100%"></i></div>`
    : `Mua thêm <b>${money(999000 - sub)}</b> để được miễn phí vận chuyển<div class="sold-bar"><i style="width:${sub / 9990}%"></i></div>`;

  /* ================= GIỎ HÀNG ================= */
  if ($("#cartPage")) {
    const render = () => {
      const items = Cart.items();
      $("#cartEmpty").classList.toggle("hidden", items.length > 0);
      $("#cartFull").classList.toggle("hidden", !items.length);
      $("#cartCount").textContent = Cart.count();
      if (!items.length) return;
      $("#cartBody").innerHTML = items.map((it, i) => {
        const l = Cart.line(it), p = l.p;
        return `<tr>
          <td><div class="cart-prod"><a href="${p.cat === "combo" ? "index.html#vai-dien" : "product.html?id=" + p.id}"><img ${K.im(p.images[0])} alt=""></a><div>
            <h4><a href="${p.cat === "combo" ? "index.html#vai-dien" : "product.html?id=" + p.id}">${esc(p.name)}</a></h4>
            <div class="opt"><span class="mode-tag ${it.mode}">${it.mode === "rent" ? "THUÊ" : "MUA"}</span><span>Size: ${it.size}</span>
            ${it.mode === "rent" ? `<span>Nhận: <input type="date" class="input" style="height:30px;width:150px;padding:0 8px;font-size:13px;display:inline-block" data-start="${i}" min="${today()}" value="${it.start}"></span>
              <span>Thuê: <select class="input" style="height:30px;width:auto;padding:0 8px;font-size:13px;display:inline-block" data-days="${i}">${Array.from({ length: 14 }, (_, d) => `<option ${d + 1 === it.days ? "selected" : ""} value="${d + 1}">${d + 1} ngày</option>`).join("")}</select> · trả ${fmtDate(addDays(it.start, it.days))}</span>
              <span>Cọc: ${money(p.deposit)}/bộ</span>` : ""}</div></div></div></td>
          <td>${money(l.unit)}${it.mode === "rent" ? `<br><small class="muted">${it.days} ngày</small>` : ""}</td>
          <td><div class="qty sm"><button data-dq="${i}" data-d="-1" aria-label="Giảm">−</button><input value="${it.qty}" data-qi="${i}" aria-label="Số lượng"><button data-dq="${i}" data-d="1" aria-label="Tăng">+</button></div></td>
          <td><b>${money(l.total)}</b></td>
          <td><button class="remove-btn" data-rm="${i}" aria-label="Xoá">${ico("trash", "sm")}</button></td></tr>`;
      }).join("");
      const t = Cart.totals(store.get("coupon"));
      $("#freeShip").innerHTML = freeShipHTML(t.sub);
      $("#sumBox").innerHTML = sumHTML(t, "ước tính giao nhanh");
      refreshCoupon && refreshCoupon();
    };
    let refreshCoupon = null;
    refreshCoupon = couponUI(render);
    $("#cartBody").addEventListener("click", e => {
      const q = e.target.closest("[data-dq]"), r = e.target.closest("[data-rm]");
      if (q) { const it = Cart.items()[+q.dataset.dq]; Cart.setQty(+q.dataset.dq, it.qty + +q.dataset.d); }
      if (r) { const it = Cart.items()[+r.dataset.rm]; Cart.remove(+r.dataset.rm); toast(`Đã xoá ${esc(K.byId(it.id).name)}`, "info"); }
    });
    $("#cartBody").addEventListener("change", e => {
      const items = Cart.items(), el = e.target;
      if (el.dataset.qi) { Cart.setQty(+el.dataset.qi, +el.value || 1); return; }
      if (el.dataset.days) { items[+el.dataset.days].days = +el.value; Cart.save(items); }
      if (el.dataset.start) { items[+el.dataset.start].start = el.value < today() ? today() : el.value; Cart.save(items); }
    });
    $("#clearCart").onclick = () => { if (confirm("Xoá toàn bộ giỏ hàng?")) Cart.clear(); };
    document.addEventListener("cart:change", render);
    render();
    $("#suggest").innerHTML = D.products.filter(p => p.cat === "phu-kien" || p.cat === "toc-gia").slice(0, 4).map(p => card(p)).join("");
  }

  /* ================= THANH TOÁN ================= */
  if ($("#checkoutPage")) {
    if (!Cart.items().length && !$("#successView")?.dataset.keep) {
      $("#coForm").classList.add("hidden"); $("#coEmpty").classList.remove("hidden");
    }
    const user = store.get("user", null);
    if (user) { $("#cName").value = user.name || ""; $("#cPhone").value = user.phone || ""; $("#cEmail").value = user.email || ""; $("#cAddr").value = user.address || ""; }
    $("#shipOpts").innerHTML = Object.entries(SHIP).map(([k, s], i) => `<label class="radio-card"><input type="radio" name="ship" value="${k}" ${i ? "" : "checked"}><span class="pay-ico">${ico(k === "store" ? "home" : "truck")}</span><span class="rc-text"><b>${s.name}</b><small>${s.note}</small></span><span class="rc-price">${s.fee ? money(s.fee) : "0đ"}</span></label>`).join("");
    // mã QR minh hoạ (không phải tài khoản thật)
    let qr = '<svg viewBox="0 0 29 29" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fff"/>';
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) { const f = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20); if (!f && rnd() > .55) qr += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }
    [[0, 0], [21, 0], [0, 21]].forEach(([x, y]) => qr += `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" fill="none" stroke="#000"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`);
    $("#qr").innerHTML = qr + "</svg>";

    const shipKey = () => $("[name=ship]:checked").value;
    const render = () => {
      const t = Cart.totals(store.get("coupon"), SHIP[shipKey()].fee);
      $("#coItems").innerHTML = Cart.items().map(it => { const l = Cart.line(it); return `<div class="co-item"><span class="thumb"><img ${K.im(l.p.images[0])} alt=""><span class="q">${it.qty}</span></span><div><b>${esc(l.p.name)}</b><div class="muted" style="font-size:12.5px">${it.mode === "rent" ? `Thuê ${it.days} ngày · ${fmtDate(it.start)} → ${fmtDate(addDays(it.start, it.days))}` : "Mua"} · Size ${it.size}</div></div><b>${money(l.total)}</b></div>`; }).join("");
      $("#coSum").innerHTML = sumHTML(t, SHIP[shipKey()].name);
      $("#placeTotal").textContent = money(t.total);
      refreshCoupon && refreshCoupon();
      return t;
    };
    let refreshCoupon = null; refreshCoupon = couponUI(render);
    $("#shipOpts").addEventListener("change", () => { $("#addrBlock").classList.toggle("hidden", shipKey() === "store"); render(); });
    $("#payOpts").addEventListener("change", () => $("#bankBox").classList.toggle("show", $("[name=pay]:checked").value === "bank"));
    render();

    // kiểm tra dữ liệu
    const rules = {
      cName: v => v.trim().length >= 2 || "Vui lòng nhập họ tên",
      cPhone: v => /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(v.replace(/\s|\./g, "")) || "Số điện thoại Việt Nam chưa hợp lệ (VD: 0912 345 678)",
      cEmail: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Email chưa đúng định dạng",
      cCity: v => shipKey() === "store" || !!v || "Chọn tỉnh/thành phố",
      cAddr: v => shipKey() === "store" || v.trim().length >= 6 || "Nhập địa chỉ cụ thể (số nhà, đường, phường)"
    };
    const check = id => {
      const el = $("#" + id), r = rules[id](el.value), f = el.closest(".field");
      f.classList.toggle("error", r !== true); if (r !== true) $(".err-msg", f).textContent = r; return r === true;
    };
    Object.keys(rules).forEach(id => $("#" + id).addEventListener("blur", () => check(id)));

    $("#coForm").addEventListener("submit", e => {
      e.preventDefault();
      const ok = Object.keys(rules).map(check).every(Boolean);
      if (!ok) { toast("Vui lòng kiểm tra lại thông tin được đánh dấu đỏ", "err"); $(".field.error .input").focus(); return; }
      if (!$("#agree").checked) { toast("Bạn cần đồng ý với chính sách thuê đồ", "err"); return; }
      const t = render();
      const code = "KG" + Date.now().toString(36).toUpperCase().slice(-6);
      const order = {
        code, date: new Date().toISOString(), status: 0, items: Cart.items(), totals: t,
        ship: shipKey(), pay: $("[name=pay]:checked").value, note: $("#cNote").value.trim(),
        customer: { name: $("#cName").value.trim(), phone: $("#cPhone").value.trim(), email: $("#cEmail").value.trim(), city: $("#cCity").value, address: $("#cAddr").value.trim() },
        owner: user ? user.email : null
      };
      const orders = store.get("orders", []); orders.unshift(order); store.set("orders", orders);
      store.set("coupon", null); Cart.clear();
      // giao diện thành công
      $("#coForm").classList.add("hidden"); $(".checkout-steps").innerHTML = '<div class="done"><i>✓</i><span>Giỏ hàng</span></div><div class="done"><i>✓</i><span>Thông tin</span></div><div class="cur"><i>3</i><span>Hoàn tất</span></div>';
      $("#successView").classList.remove("hidden");
      $("#orderCode").textContent = code; $("#orderTotal").textContent = money(t.total);
      $("#orderMail").textContent = order.customer.email || order.customer.phone;
      scrollTo({ top: 0, behavior: "smooth" }); play("success", .5); confetti();
    });
  }

  function confetti() {
    const box = document.createElement("div"); box.className = "confetti";
    const cols = ["#ff6f91", "#7b2ff7", "#ffd34d", "#6fd3c1", "#e8436b"];
    box.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${cols[Math.random() * 5 | 0]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .6}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join("");
    document.body.appendChild(box); setTimeout(() => box.remove(), 5500);
  }
})();
