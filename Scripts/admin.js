/* =========================================================
   KAGAMI COSPLAY – admin.js (Trang quản trị)
   Tài khoản demo: admin@kagami.vn / admin123
   Dữ liệu lưu trong localStorage của trình duyệt (không có máy chủ)
   ========================================================= */
(function () {
  "use strict";
  const { D, $, $$, ico, im, esc, money, store, toast, fmtDate, initials, catName, modal, closeModal } = K;
  const ADMIN = { email: "admin@kagami.vn", pass: "admin123" };
  const STATUS = ["Chờ xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn tất", "Đã huỷ"];
  const PAY = { cod: "COD", bank: "Chuyển khoản", wallet: "Ví điện tử" };
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };

  // ---------- dữ liệu ----------
  const orders = () => store.get("orders", []);
  const saveOrders = o => store.set("orders", o);
  const statusOf = o => o.status === 4 ? 4 : o.adminStatus != null ? o.adminStatus : Math.min(3, Math.floor((Date.now() - new Date(o.date)) / 180000));
  const revenueOf = o => o.totals.total - o.totals.dep; // không tính tiền cọc
  const products = () => D.allProducts;
  const saveProducts = () => { D.products = D.allProducts; store.set("admin_products", D.allProducts); };
  const saveCoupons = () => store.set("admin_coupons", D.coupons);
  const fmtDT = iso => { const d = new Date(iso); return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); };
  const slug = s => K.norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const badge = s => `<span class="status s${s}">${STATUS[s]}</span>`;

  // ---------- đăng nhập ----------
  const loginBox = $("#adminLogin"), app = $("#adminApp");
  function showLogin() {
    loginBox.hidden = false; app.hidden = true;
    $("#aEmail").value = ADMIN.email;
    $("#adminLoginForm").onsubmit = e => {
      e.preventDefault();
      const ok = $("#aEmail").value.trim().toLowerCase() === ADMIN.email && $("#aPass").value === ADMIN.pass;
      $("#aErr").hidden = ok;
      if (ok) { ss.set("kagami_admin", "1"); start(); }
    };
  }

  // ---------- khung ứng dụng ----------
  const VIEWS = {
    dashboard: ["Tổng quan", "home"], orders: ["Đơn hàng", "package"], products: ["Sản phẩm", "hanger"],
    customers: ["Khách hàng", "user"], inbox: ["Liên hệ & lịch hẹn", "mail"], coupons: ["Mã giảm giá", "tag"]
  };
  function start() {
    loginBox.hidden = true; app.hidden = false;
    $("#aNav").innerHTML = Object.entries(VIEWS).map(([k, [l, i]]) => `<a href="#${k}" data-v="${k}">${ico(i)} <span>${l}</span><b class="cnt" id="cnt-${k}"></b></a>`).join("");
    $("#aLogout").onclick = () => { ss.set("kagami_admin", null); location.href = "index.html"; };
    $("#aMenu").onclick = () => app.classList.toggle("nav-open");
    addEventListener("hashchange", route);
    route();
  }
  function counts() {
    const pending = orders().filter(o => statusOf(o) === 0).length;
    const msgs = store.get("messages", []).length + store.get("bookings", []).length;
    $("#cnt-orders").textContent = pending || ""; $("#cnt-inbox").textContent = msgs || "";
  }
  function route() {
    const v = (location.hash || "#dashboard").slice(1).split("-")[0];
    const view = VIEWS[v] ? v : "dashboard";
    $$("#aNav a").forEach(a => a.classList.toggle("active", a.dataset.v === view));
    $("#aTitle").textContent = VIEWS[view][0];
    app.classList.remove("nav-open");
    $("#aMain").innerHTML = R[view]();
    (B[view] || (() => {}))();
    counts();
    $("#aMain").scrollTop = 0; scrollTo(0, 0);
  }
  const R = {}, B = {};

  /* =============== TỔNG QUAN =============== */
  R.dashboard = () => {
    const os = orders(), ok = os.filter(o => statusOf(o) !== 4);
    const rev = ok.reduce((s, o) => s + revenueOf(o), 0);
    const today = new Date().toDateString();
    const revToday = ok.filter(o => new Date(o.date).toDateString() === today).reduce((s, o) => s + revenueOf(o), 0);
    // doanh thu 14 ngày
    const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d; });
    const series = days.map(d => ok.filter(o => new Date(o.date).toDateString() === d.toDateString()).reduce((s, o) => s + revenueOf(o), 0));
    // sản phẩm thuê nhiều
    const tally = {};
    ok.forEach(o => o.items.forEach(it => { tally[it.id] = (tally[it.id] || 0) + it.qty; }));
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const byStatus = [0, 1, 2, 3, 4].map(s => os.filter(o => statusOf(o) === s).length);
    return `
    <div class="a-toolbar"><p class="muted" style="margin:0">Số liệu tính từ các đơn đặt trên website (đã trừ tiền cọc).</p>
      <div class="a-actions"><button class="btn btn-sm" id="seed">${ico("sparkle", "sm")} Tạo dữ liệu mẫu</button><button class="btn btn-sm btn-ghost" id="unseed">Xoá dữ liệu mẫu</button></div></div>
    <div class="kpis">
      <div class="kpi"><span>${ico("wallet")}</span><div><small>Doanh thu</small><b>${money(rev)}</b><em>Hôm nay: ${money(revToday)}</em></div></div>
      <div class="kpi"><span>${ico("package")}</span><div><small>Đơn hàng</small><b>${os.length}</b><em>${byStatus[0]} đơn chờ xác nhận</em></div></div>
      <div class="kpi"><span>${ico("user")}</span><div><small>Khách hàng</small><b>${store.get("users", []).length}</b><em>${store.get("subs", []).length} email nhận tin</em></div></div>
      <div class="kpi"><span>${ico("hanger")}</span><div><small>Sản phẩm đang bán</small><b>${products().filter(p => !p.hidden).length}</b><em>${products().filter(p => p.hidden).length} đang ẩn</em></div></div>
    </div>
    <div class="a-grid">
      <section class="a-card"><div class="a-card-head"><h3>Doanh thu 14 ngày qua</h3><span class="muted">${money(series.reduce((a, b) => a + b, 0))}</span></div>${chart(days, series)}</section>
      <section class="a-card"><div class="a-card-head"><h3>Trạng thái đơn</h3></div>
        <div class="st-list">${STATUS.map((l, i) => `<div><span class="status s${i}">${l}</span><div class="st-bar"><i style="width:${os.length ? byStatus[i] / os.length * 100 : 0}%"></i></div><b>${byStatus[i]}</b></div>`).join("")}</div></section>
    </div>
    <div class="a-grid">
      <section class="a-card"><div class="a-card-head"><h3>Đơn mới nhất</h3><a href="#orders" class="read-more">Tất cả ${ico("arrow", "sm")}</a></div>${ordersTable(os.slice(0, 6), true)}</section>
      <section class="a-card"><div class="a-card-head"><h3>Được thuê nhiều nhất</h3></div>
        ${top.length ? `<ol class="top-list">${top.map(([id, n]) => { const p = K.byId(id); return p ? `<li><img ${im(p.images[0])} alt=""><span><b>${esc(p.name)}</b><small>${catName(p.cat) || "Combo"}</small></span><em>${n} lượt</em></li>` : ""; }).join("")}</ol>` : `<p class="muted">Chưa có đơn hàng. Bấm “Tạo dữ liệu mẫu” để xem thử.</p>`}</section>
    </div>`;
  };
  function chart(days, vals) {
    const W = 640, H = 230, pl = 54, pb = 28, pt = 12, max = Math.max(...vals, 100000);
    const step = Math.pow(10, Math.floor(Math.log10(max))) * (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 2 : 1);
    const top = Math.ceil(max / step) * step, bw = (W - pl - 10) / vals.length;
    let g = "";
    for (let v = 0; v <= top; v += step) { const y = H - pb - (v / top) * (H - pb - pt); g += `<line x1="${pl}" x2="${W - 6}" y1="${y}" y2="${y}" class="grid"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end">${v >= 1e6 ? (v / 1e6) + "tr" : v / 1000 + "k"}</text>`; }
    const bars = vals.map((v, i) => { const h = (v / top) * (H - pb - pt), x = pl + i * bw + bw * .18, y = H - pb - h; return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * .64).toFixed(1)}" height="${Math.max(h, v ? 2 : 0).toFixed(1)}" rx="4"><title>${days[i].toLocaleDateString("vi-VN")}: ${money(v)}</title></rect>${i % 2 === 0 ? `<text x="${(x + bw * .32).toFixed(1)}" y="${H - 8}" text-anchor="middle">${days[i].getDate()}/${days[i].getMonth() + 1}</text>` : ""}`; }).join("");
    return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Biểu đồ doanh thu">${g}${bars}</svg></div>`;
  }
  function ordersTable(list, compact) {
    if (!list.length) return `<div class="empty">${ico("package")}<p>Chưa có đơn hàng nào.</p></div>`;
    return `<div class="table-wrap"><table class="a-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th>${compact ? "" : "<th>Ngày đặt</th><th>SP</th><th>Thanh toán</th>"}<th>Tổng</th><th>Trạng thái</th>${compact ? "" : "<th></th>"}</tr></thead><tbody>
    ${list.map(o => { const s = statusOf(o); return `<tr>
      <td><button class="link" data-view="${o.code}">#${o.code}</button>${o.demo ? ' <small class="demo">mẫu</small>' : ""}</td>
      <td><b>${esc(o.customer.name)}</b><br><small class="muted">${esc(o.customer.phone)}</small></td>
      ${compact ? "" : `<td>${fmtDT(o.date)}</td><td>${o.items.reduce((a, i) => a + i.qty, 0)}</td><td>${PAY[o.pay] || o.pay}</td>`}
      <td><b>${money(o.totals.total)}</b></td>
      <td>${compact ? badge(s) : `<select class="st-select s${s}" data-st="${o.code}">${STATUS.map((l, i) => `<option value="${i}" ${i === s ? "selected" : ""}>${l}</option>`).join("")}</select>`}</td>
      ${compact ? "" : `<td class="row-act"><button class="icon-btn" data-view="${o.code}" title="Xem chi tiết">${ico("eye", "sm")}</button><button class="icon-btn" data-del-order="${o.code}" title="Xoá đơn">${ico("trash", "sm")}</button></td>`}
    </tr>`; }).join("")}</tbody></table></div>`;
  }
  B.dashboard = () => {
    $("#seed").onclick = seed;
    $("#unseed").onclick = () => { saveOrders(orders().filter(o => !o.demo)); store.set("messages", store.get("messages", []).filter(m => !m.demo)); store.set("bookings", store.get("bookings", []).filter(m => !m.demo)); toast("Đã xoá dữ liệu mẫu", "info"); route(); };
    bindOrderActions();
  };
  function seed() {
    const names = ["Nguyễn Minh Thư", "Trần Gia Huy", "Lê Khánh Vy", "Phạm Quốc Bảo", "Võ Ngọc Hân", "Đặng Hoàng Long", "Bùi Thảo My", "Huỳnh Đức Anh", "Phan Lan Chi", "Đỗ Tuấn Kiệt"];
    const ps = products().filter(p => !p.hidden), list = orders();
    for (let i = 0; i < 28; i++) {
      const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 14)); d.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
      const items = [...Array(1 + Math.floor(Math.random() * 2))].map(() => { const p = ps[Math.floor(Math.random() * ps.length)]; const buy = p.buy != null && Math.random() < .25; return { id: p.id, mode: buy ? "buy" : "rent", size: p.sizes[0], qty: 1 + (Math.random() < .2), days: 1 + Math.floor(Math.random() * 4), start: K.addDays(d.toISOString().slice(0, 10), 1) }; });
      let sub = 0, dep = 0;
      items.forEach(it => { const p = K.byId(it.id); if (it.mode === "buy") sub += K.priceBuy(p) * it.qty; else { sub += K.rentTotal(p, it.days) * it.qty; dep += p.deposit * it.qty; } });
      const ship = sub >= 999000 ? 0 : 30000, n = names[i % names.length];
      const age = (Date.now() - d) / 864e5, st = age > 3 ? (Math.random() < .1 ? 4 : 3) : Math.floor(Math.random() * 3);
      list.push({ code: "KG" + (Date.now() + i * 7919).toString(36).toUpperCase().slice(-6), date: d.toISOString(), status: st === 4 ? 4 : 0, adminStatus: st, demo: true,
        items, totals: { sub, dep, disc: 0, ship, coupon: null, total: sub + ship + dep }, ship: "fast", pay: ["cod", "bank", "wallet"][i % 3], note: "",
        customer: { name: n, phone: "09" + String(10000000 + Math.floor(Math.random() * 89999999)), email: slug(n).replace(/-/g, ".") + "@example.com", city: "TP. Hồ Chí Minh", address: (10 + i) + " Võ Văn Ngân, Thủ Đức" } });
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date)); saveOrders(list);
    const msgs = store.get("messages", []);
    msgs.push({ demo: true, name: "Lê Khánh Vy", phone: "0912 111 222", topic: "Thuê số lượng lớn / kỷ yếu", msg: "Lớp mình 30 bạn muốn thuê đồ chụp kỷ yếu concept anime ngày 15/11, tiệm báo giá giúp nhé.", at: new Date().toISOString() });
    msgs.push({ demo: true, name: "Phạm Quốc Bảo", phone: "0987 333 444", topic: "Tư vấn trang phục", msg: "Mình cao 1m75 nặng 68kg thì mặc size nào của bộ Samurai Áo Lam?", at: new Date(Date.now() - 36e5).toISOString() });
    store.set("messages", msgs);
    const bk = store.get("bookings", []);
    bk.push({ demo: true, code: "BKDEMO1", service: "photo", date: K.addDays(K.today(), 2), time: "14:00", people: "3", name: "Bùi Thảo My" });
    store.set("bookings", bk);
    toast("Đã tạo 28 đơn hàng mẫu, 2 tin nhắn và 1 lịch hẹn"); route();
  }

  /* =============== ĐƠN HÀNG =============== */
  let oFilter = { q: "", s: "all" };
  R.orders = () => `
    <div class="a-toolbar">
      <div class="a-filters"><input class="input" id="oq" placeholder="Tìm mã đơn, tên, số điện thoại…" value="${esc(oFilter.q)}">
        <select class="input" id="os"><option value="all">Tất cả trạng thái</option>${STATUS.map((l, i) => `<option value="${i}" ${String(i) === oFilter.s ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="a-actions"><button class="btn btn-sm" id="oCsv">${ico("package", "sm")} Xuất CSV</button></div></div>
    <section class="a-card" id="oList"></section>`;
  function filteredOrders() {
    const q = K.norm(oFilter.q.trim());
    return orders().filter(o => (oFilter.s === "all" || statusOf(o) === +oFilter.s) && (!q || K.norm(o.code + " " + o.customer.name + " " + o.customer.phone).includes(q)));
  }
  B.orders = () => {
    const draw = () => { const l = filteredOrders(); $("#oList").innerHTML = `<div class="a-card-head"><h3>${l.length} đơn hàng</h3></div>` + ordersTable(l, false); };
    draw();
    $("#oq").oninput = e => { oFilter.q = e.target.value; draw(); };
    $("#os").onchange = e => { oFilter.s = e.target.value; draw(); };
    $("#oCsv").onclick = () => {
      const rows = [["Mã đơn", "Ngày", "Khách hàng", "SĐT", "Địa chỉ", "Số SP", "Thanh toán", "Tổng tiền", "Trạng thái"]].concat(filteredOrders().map(o => [o.code, fmtDT(o.date), o.customer.name, o.customer.phone, o.customer.address, o.items.length, PAY[o.pay], o.totals.total, STATUS[statusOf(o)]]));
      const csv = "﻿" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "don-hang-kagami.csv"; a.click();
      toast("Đã xuất file don-hang-kagami.csv");
    };
    bindOrderActions(draw);
  };
  function bindOrderActions(redraw) {
    const main = $("#aMain");
    main.onclick = e => {
      const v = e.target.closest("[data-view]"), d = e.target.closest("[data-del-order]");
      if (v) orderDetail(v.dataset.view);
      if (d) confirmBox(`Xoá đơn #${d.dataset.delOrder}? Thao tác này không hoàn tác được.`, () => { saveOrders(orders().filter(o => o.code !== d.dataset.delOrder)); toast("Đã xoá đơn hàng", "info"); redraw ? redraw() : route(); counts(); });
    };
    main.onchange = e => {
      const s = e.target.closest("[data-st]"); if (!s) return;
      const list = orders(), o = list.find(x => x.code === s.dataset.st), v = +s.value;
      o.adminStatus = v; o.status = v === 4 ? 4 : 0; saveOrders(list);
      s.className = "st-select s" + v; toast(`Đơn #${o.code}: ${STATUS[v]}`); counts();
    };
  }
  function orderDetail(code) {
    const o = orders().find(x => x.code === code); if (!o) return;
    const s = statusOf(o);
    const m = modal(`<div class="a-modal"><div class="a-card-head"><h2>Đơn #${o.code}</h2>${badge(s)}</div>
      <p class="muted">Đặt lúc ${fmtDT(o.date)} · Thanh toán: ${PAY[o.pay]} · Nhận hàng: ${{ fast: "Giao nhanh 2 giờ", std: "Giao tiêu chuẩn", store: "Nhận tại cửa hàng" }[o.ship] || o.ship}</p>
      <div class="a-two"><div><h4>Khách hàng</h4><p><b>${esc(o.customer.name)}</b><br>${esc(o.customer.phone)}<br>${esc(o.customer.email || "")}<br>${esc(o.customer.address || "")} ${esc(o.customer.city || "")}</p>${o.note ? `<h4>Ghi chú</h4><p>${esc(o.note)}</p>` : ""}</div>
      <div><h4>Cập nhật trạng thái</h4><div class="st-steps">${STATUS.map((l, i) => `<button class="chip ${i === s ? "active" : ""}" data-set="${i}">${l}</button>`).join("")}</div></div></div>
      <h4>Sản phẩm</h4><div class="table-wrap"><table class="a-table"><tbody>${o.items.map(it => { const p = K.byId(it.id) || { name: it.id, images: [""] }; return `<tr><td><div class="cell-prod"><img ${im(p.images[0])} alt=""><span><b>${esc(p.name)}</b><small class="muted">${it.mode === "rent" ? `Thuê ${it.days} ngày từ ${fmtDate(it.start)}` : "Mua"} · Size ${esc(it.size)}</small></span></div></td><td>x${it.qty}</td></tr>`; }).join("")}</tbody></table></div>
      <div class="a-sum"><div><span>Tạm tính</span><b>${money(o.totals.sub)}</b></div>${o.totals.disc ? `<div><span>Giảm giá (${o.totals.coupon})</span><b>-${money(o.totals.disc)}</b></div>` : ""}<div><span>Vận chuyển</span><b>${money(o.totals.ship)}</b></div><div><span>Tiền cọc</span><b>${money(o.totals.dep)}</b></div><div class="t"><span>Tổng</span><b>${money(o.totals.total)}</b></div></div></div>`, "sm");
    $(".st-steps", m).onclick = e => {
      const b = e.target.closest("[data-set]"); if (!b) return;
      const list = orders(), x = list.find(y => y.code === code), v = +b.dataset.set;
      x.adminStatus = v; x.status = v === 4 ? 4 : 0; saveOrders(list); toast(`Đơn #${code}: ${STATUS[v]}`); closeModal(); route();
    };
  }

  /* =============== SẢN PHẨM =============== */
  let pFilter = { q: "", c: "all" };
  R.products = () => `
    <div class="a-toolbar">
      <div class="a-filters"><input class="input" id="pq" placeholder="Tìm tên sản phẩm…" value="${esc(pFilter.q)}">
        <select class="input" id="pc"><option value="all">Tất cả danh mục</option>${D.categories.map(c => `<option value="${c.slug}" ${c.slug === pFilter.c ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
      <div class="a-actions"><button class="btn btn-sm btn-ghost" id="pReset">${ico("refresh", "sm")} Khôi phục dữ liệu gốc</button><button class="btn btn-sm btn-primary" id="pAdd">${ico("plus", "sm")} Thêm sản phẩm</button></div></div>
    <section class="a-card" id="pList"></section>`;
  B.products = () => {
    const draw = () => {
      const q = K.norm(pFilter.q.trim());
      const l = products().filter(p => (pFilter.c === "all" || p.cat === pFilter.c) && (!q || K.norm(p.name).includes(q)));
      $("#pList").innerHTML = `<div class="a-card-head"><h3>${l.length} sản phẩm</h3></div><div class="table-wrap"><table class="a-table"><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Thuê/ngày</th><th>Giá bán</th><th>Giảm</th><th>Đã thuê</th><th>Hiển thị</th><th></th></tr></thead><tbody>
      ${l.map(p => `<tr class="${p.hidden ? "is-hidden" : ""}"><td><div class="cell-prod"><img ${im(p.images[0])} alt=""><span><b>${esc(p.name)}</b><small class="muted">${p.sizes.join(", ")}${p.tags.length ? " · " + p.tags.map(t => t.toUpperCase()).join(", ") : ""}</small></span></div></td>
        <td>${catName(p.cat)}</td><td><b>${money(p.rent)}</b></td><td>${p.buy == null ? '<span class="muted">Chỉ thuê</span>' : money(p.buy)}</td><td>${p.sale ? p.sale + "%" : "—"}</td><td>${p.sold}</td>
        <td><label class="switch" title="Hiện/ẩn trên website"><input type="checkbox" data-toggle="${p.id}" ${p.hidden ? "" : "checked"}><i></i></label></td>
        <td class="row-act"><a class="icon-btn" href="product.html?id=${p.id}" target="_blank" title="Xem trên web">${ico("eye", "sm")}</a><button class="icon-btn" data-edit="${p.id}" title="Sửa">${ico("settings", "sm")}</button><button class="icon-btn" data-del="${p.id}" title="Xoá">${ico("trash", "sm")}</button></td></tr>`).join("")}</tbody></table></div>`;
    };
    draw();
    $("#pq").oninput = e => { pFilter.q = e.target.value; draw(); };
    $("#pc").onchange = e => { pFilter.c = e.target.value; draw(); };
    $("#pAdd").onclick = () => productForm(null, draw);
    $("#pReset").onclick = () => confirmBox("Khôi phục toàn bộ sản phẩm về dữ liệu gốc? Mọi thay đổi trong trang quản trị sẽ mất.", () => { try { localStorage.removeItem("kagami_admin_products"); } catch (e) {} location.reload(); });
    $("#pList").onclick = e => {
      const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
      if (ed) productForm(ed.dataset.edit, draw);
      if (del) { const p = K.byId(del.dataset.del); confirmBox(`Xoá sản phẩm “${p.name}”?`, () => { D.allProducts = D.allProducts.filter(x => x.id !== p.id); saveProducts(); toast("Đã xoá sản phẩm", "info"); draw(); }); }
    };
    $("#pList").onchange = e => {
      const t = e.target.closest("[data-toggle]"); if (!t) return;
      const p = D.allProducts.find(x => x.id === t.dataset.toggle); p.hidden = !t.checked; saveProducts();
      t.closest("tr").classList.toggle("is-hidden", p.hidden); toast(p.hidden ? `Đã ẩn “${p.name}” khỏi website` : `Đã hiện “${p.name}” trên website`);
    };
  };
  function productForm(id, done) {
    const p = id ? D.allProducts.find(x => x.id === id) : { name: "", cat: D.categories[0].slug, rent: 100000, buy: null, deposit: 300000, sale: 0, sizes: ["S", "M", "L"], tags: ["new"], desc: "", images: [], rating: 5, reviews: 0, sold: 0, material: "", include: "", order: D.allProducts.length };
    let imgs = [...p.images];
    const m = modal(`<form class="a-modal" id="pf" novalidate><h2>${id ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
      <div class="field"><label for="fName">Tên sản phẩm *</label><input class="input" id="fName" value="${esc(p.name)}" required><span class="err-msg">Nhập tên sản phẩm</span></div>
      <div class="form-row"><div class="field"><label for="fCat">Danh mục</label><select class="input" id="fCat">${D.categories.map(c => `<option value="${c.slug}" ${c.slug === p.cat ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="fSizes">Kích thước (cách nhau dấu phẩy)</label><input class="input" id="fSizes" value="${esc(p.sizes.join(", "))}"></div></div>
      <div class="form-row three"><div class="field"><label for="fRent">Giá thuê/ngày (đ) *</label><input class="input" id="fRent" type="number" min="0" step="1000" value="${p.rent}"><span class="err-msg">Giá không hợp lệ</span></div>
        <div class="field"><label for="fBuy">Giá bán (để trống = chỉ thuê)</label><input class="input" id="fBuy" type="number" min="0" step="1000" value="${p.buy ?? ""}"></div>
        <div class="field"><label for="fDep">Tiền cọc (đ)</label><input class="input" id="fDep" type="number" min="0" step="1000" value="${p.deposit}"></div></div>
      <div class="form-row"><div class="field"><label for="fSale">Giảm giá (%)</label><input class="input" id="fSale" type="number" min="0" max="90" value="${p.sale || 0}"></div>
        <div class="field"><label>Nhãn</label><div style="display:flex;gap:16px;align-items:center;height:48px"><label class="check"><input type="checkbox" id="tNew" ${p.tags.includes("new") ? "checked" : ""}> Mới</label><label class="check"><input type="checkbox" id="tHot" ${p.tags.includes("hot") ? "checked" : ""}> Hot</label></div></div></div>
      <div class="field"><label for="fDesc">Mô tả</label><textarea class="input" id="fDesc">${esc(p.desc)}</textarea></div>
      <div class="field"><label>Ảnh sản phẩm (tối đa 3)</label><div class="img-pick" id="imgPick"></div>
        <div class="form-row" style="margin-top:8px"><input class="input" id="fUrl" placeholder="Dán link ảnh (https://…) rồi bấm Thêm"><div style="display:flex;gap:8px"><button type="button" class="btn btn-sm" id="fAddUrl">Thêm link</button><label class="btn btn-sm" for="fFile">Tải ảnh lên</label><input type="file" id="fFile" accept="image/*" hidden multiple></div></div></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><button type="button" class="btn" data-close>Huỷ</button><button class="btn btn-primary">${id ? "Lưu thay đổi" : "Thêm sản phẩm"}</button></div></form>`, "sm");
    const drawImgs = () => { $("#imgPick", m).innerHTML = imgs.map((k, i) => `<figure><img ${im(k)} alt=""><button type="button" data-ri="${i}" aria-label="Bỏ ảnh">${ico("x", "sm")}</button></figure>`).join("") || '<p class="muted" style="margin:0">Chưa có ảnh.</p>'; };
    drawImgs();
    $("#imgPick", m).onclick = e => { const b = e.target.closest("[data-ri]"); if (b) { imgs.splice(+b.dataset.ri, 1); drawImgs(); } };
    $("#fAddUrl", m).onclick = () => { const u = $("#fUrl", m).value.trim(); if (!/^https?:\/\//.test(u)) return toast("Link ảnh phải bắt đầu bằng http(s)://", "err"); if (imgs.length >= 3) return toast("Tối đa 3 ảnh", "err"); imgs.push(u); $("#fUrl", m).value = ""; drawImgs(); };
    $("#fFile", m).onchange = e => {
      [...e.target.files].slice(0, 3 - imgs.length).forEach(f => {
        const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => {
          // thu nhỏ ảnh để vừa bộ nhớ trình duyệt
          const c = document.createElement("canvas"), s = Math.min(1, 640 / img.width); c.width = img.width * s; c.height = img.height * s;
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); imgs.push(c.toDataURL("image/jpeg", .78)); drawImgs();
        }; img.src = r.result; }; r.readAsDataURL(f);
      });
      e.target.value = "";
    };
    $("#pf", m).onsubmit = e => {
      e.preventDefault();
      const name = $("#fName", m).value.trim(), rent = +$("#fRent", m).value;
      $("#fName", m).closest(".field").classList.toggle("error", !name);
      $("#fRent", m).closest(".field").classList.toggle("error", !(rent > 0));
      if (!name || !(rent > 0)) return;
      if (!imgs.length) return toast("Thêm ít nhất 1 ảnh cho sản phẩm", "err");
      const tags = []; if ($("#tNew", m).checked) tags.push("new"); if ($("#tHot", m).checked) tags.push("hot");
      const buyV = $("#fBuy", m).value.trim();
      Object.assign(p, { name, cat: $("#fCat", m).value, rent, buy: buyV === "" ? null : +buyV, deposit: +$("#fDep", m).value || 0, sale: Math.min(90, Math.max(0, +$("#fSale", m).value || 0)),
        sizes: $("#fSizes", m).value.split(",").map(s => s.trim()).filter(Boolean), tags, desc: $("#fDesc", m).value.trim(), images: [imgs[0], imgs[1] || imgs[0], imgs[2] || imgs[1] || imgs[0]] });
      if (!p.sizes.length) p.sizes = ["Freesize"];
      if (!id) { let s = slug(name) || "san-pham", k = s, n = 2; while (D.allProducts.some(x => x.id === k)) k = s + "-" + n++; p.id = k; p.material = p.material || "Đang cập nhật"; p.include = p.include || "Trọn bộ như hình"; D.allProducts.unshift(p); }
      try { saveProducts(); } catch (err) { return toast("Bộ nhớ trình duyệt đã đầy, hãy dùng link ảnh thay vì tải ảnh lên", "err"); }
      if (localStorage.getItem("kagami_admin_products") === null) return toast("Không lưu được: bộ nhớ trình duyệt đầy hoặc bị chặn", "err");
      closeModal(); toast(id ? "Đã lưu thay đổi" : `Đã thêm “${name}”`); done();
    };
  }

  /* =============== KHÁCH HÀNG =============== */
  R.customers = () => {
    const users = store.get("users", []), os = orders();
    const rows = users.map(u => { const mine = os.filter(o => o.owner === u.email || (o.customer.email || "").toLowerCase() === u.email); return { u, n: mine.length, spent: mine.filter(o => statusOf(o) !== 4).reduce((s, o) => s + revenueOf(o), 0) }; });
    // khách đặt hàng không tạo tài khoản
    const guests = {}; os.forEach(o => { if (!users.some(u => u.email === (o.customer.email || "").toLowerCase() || u.phone === o.customer.phone)) { const k = o.customer.phone; guests[k] = guests[k] || { name: o.customer.name, phone: k, n: 0, spent: 0 }; guests[k].n++; if (statusOf(o) !== 4) guests[k].spent += revenueOf(o); } });
    return `<section class="a-card"><div class="a-card-head"><h3>Tài khoản thành viên (${users.length})</h3></div>
      ${users.length ? `<div class="table-wrap"><table class="a-table"><thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Ngày tạo</th><th>Số đơn</th><th>Đã chi</th><th></th></tr></thead><tbody>
      ${rows.map(({ u, n, spent }) => `<tr><td><div class="cell-prod"><span class="avatar">${initials(u.name)}</span><span><b>${esc(u.name)}</b><small class="muted">${esc(u.email)}</small></span></div></td><td>${esc(u.phone || "")}</td><td>${u.created ? fmtDate(u.created.slice(0, 10)) : "—"}</td><td>${n}</td><td><b>${money(spent)}</b></td>
        <td class="row-act"><button class="icon-btn" data-ofind="${esc(u.phone || u.email)}" title="Xem đơn">${ico("package", "sm")}</button><button class="icon-btn" data-udel="${esc(u.email)}" title="Xoá tài khoản">${ico("trash", "sm")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${ico("user")}<p>Chưa có khách đăng ký tài khoản.</p></div>`}</section>
      <section class="a-card"><div class="a-card-head"><h3>Khách mua không đăng ký (${Object.keys(guests).length})</h3></div>
      ${Object.keys(guests).length ? `<div class="table-wrap"><table class="a-table"><thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Số đơn</th><th>Đã chi</th><th></th></tr></thead><tbody>${Object.values(guests).map(g => `<tr><td><b>${esc(g.name)}</b></td><td>${esc(g.phone)}</td><td>${g.n}</td><td><b>${money(g.spent)}</b></td><td class="row-act"><button class="icon-btn" data-ofind="${esc(g.phone)}" title="Xem đơn">${ico("package", "sm")}</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Chưa có.</p>`}</section>`;
  };
  B.customers = () => {
    $("#aMain").onclick = e => {
      const f = e.target.closest("[data-ofind]"), d = e.target.closest("[data-udel]");
      if (f) { oFilter = { q: f.dataset.ofind, s: "all" }; location.hash = "#orders"; }
      if (d) confirmBox(`Xoá tài khoản ${d.dataset.udel}? Đơn hàng của khách vẫn được giữ lại.`, () => { store.set("users", store.get("users", []).filter(u => u.email !== d.dataset.udel)); const cu = store.get("user", null); if (cu && cu.email === d.dataset.udel) store.set("user", null); toast("Đã xoá tài khoản", "info"); route(); });
    };
  };

  /* =============== LIÊN HỆ & LỊCH HẸN =============== */
  const SVC = { photo: "Combo chụp ảnh", makeup: "Makeup & làm tóc", model: "PG / PB sự kiện" };
  R.inbox = () => {
    const msgs = store.get("messages", []).map((m, i) => ({ ...m, i })).reverse(), bks = store.get("bookings", []).map((b, i) => ({ ...b, i })).reverse(), subs = store.get("subs", []);
    return `<div class="a-grid">
      <section class="a-card"><div class="a-card-head"><h3>Tin nhắn liên hệ (${msgs.length})</h3></div>
        ${msgs.length ? msgs.map(m => `<article class="msg-item"><div class="cell-prod"><span class="avatar">${initials(m.name)}</span><span><b>${esc(m.name)}</b><small class="muted">${esc(m.phone)} · ${fmtDT(m.at)}</small></span><button class="icon-btn" data-mdel="${m.i}" title="Xoá" style="margin-left:auto">${ico("trash", "sm")}</button></div><span class="chip" style="margin:8px 0">${esc(m.topic)}</span><p>${esc(m.msg)}</p></article>`).join("") : `<div class="empty">${ico("mail")}<p>Chưa có tin nhắn.</p></div>`}</section>
      <div>
      <section class="a-card"><div class="a-card-head"><h3>Lịch hẹn dịch vụ (${bks.length})</h3></div>
        ${bks.length ? `<div class="table-wrap"><table class="a-table"><thead><tr><th>Mã</th><th>Khách</th><th>Dịch vụ</th><th>Thời gian</th><th></th></tr></thead><tbody>${bks.map(b => `<tr><td>${esc(b.code)}</td><td>${esc(b.name)}<br><small class="muted">${esc(b.people)} người</small></td><td>${SVC[b.service] || b.service}</td><td>${fmtDate(b.date)} ${esc(b.time)}</td><td class="row-act"><button class="icon-btn" data-bdel="${b.i}" title="Xoá">${ico("trash", "sm")}</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Chưa có lịch hẹn.</p>`}</section>
      <section class="a-card"><div class="a-card-head"><h3>Email nhận tin (${subs.length})</h3></div>${subs.length ? `<ul class="sub-list">${subs.map((s, i) => `<li>${esc(s)} <button class="icon-btn" data-sdel="${i}" title="Xoá">${ico("x", "sm")}</button></li>`).join("")}</ul>` : `<p class="muted">Chưa có ai đăng ký.</p>`}</section>
      </div></div>`;
  };
  B.inbox = () => {
    $("#aMain").onclick = e => {
      const del = (key, idx) => { const l = store.get(key, []); l.splice(idx, 1); store.set(key, l); route(); };
      const m = e.target.closest("[data-mdel]"), b = e.target.closest("[data-bdel]"), s = e.target.closest("[data-sdel]");
      if (m) del("messages", +m.dataset.mdel); if (b) del("bookings", +b.dataset.bdel); if (s) del("subs", +s.dataset.sdel);
    };
  };

  /* =============== MÃ GIẢM GIÁ =============== */
  const CTYPE = { percent: "Giảm theo %", fixed: "Giảm số tiền", ship: "Miễn phí vận chuyển" };
  R.coupons = () => `
    <div class="a-toolbar"><p class="muted" style="margin:0">Mã được áp dụng ngay ở giỏ hàng và trang thanh toán.</p><div class="a-actions"><button class="btn btn-sm btn-primary" id="cAdd">${ico("plus", "sm")} Thêm mã</button></div></div>
    <section class="a-card"><div class="table-wrap"><table class="a-table"><thead><tr><th>Mã</th><th>Loại</th><th>Giá trị</th><th>Đơn tối thiểu</th><th>Mô tả</th><th></th></tr></thead><tbody>
    ${Object.entries(D.coupons).map(([k, c]) => `<tr><td><code class="code">${esc(k)}</code></td><td>${CTYPE[c.type]}</td><td><b>${c.type === "percent" ? c.value + "%" : c.type === "fixed" ? money(c.value) : "—"}</b></td><td>${c.min ? money(c.min) : "Không"}</td><td>${esc(c.desc)}</td>
      <td class="row-act"><button class="icon-btn" data-cedit="${esc(k)}" title="Sửa">${ico("settings", "sm")}</button><button class="icon-btn" data-cdel="${esc(k)}" title="Xoá">${ico("trash", "sm")}</button></td></tr>`).join("")}</tbody></table></div></section>`;
  B.coupons = () => {
    $("#cAdd").onclick = () => couponForm(null);
    $("#aMain").onclick = e => {
      const ed = e.target.closest("[data-cedit]"), d = e.target.closest("[data-cdel]");
      if (ed) couponForm(ed.dataset.cedit);
      if (d) confirmBox(`Xoá mã ${d.dataset.cdel}?`, () => { delete D.coupons[d.dataset.cdel]; saveCoupons(); toast("Đã xoá mã", "info"); route(); });
    };
  };
  function couponForm(code) {
    const c = code ? D.coupons[code] : { type: "percent", value: 10, min: 0, desc: "" };
    const m = modal(`<form class="a-modal" id="cf" novalidate><h2>${code ? "Sửa mã " + esc(code) : "Thêm mã giảm giá"}</h2>
      <div class="form-row"><div class="field"><label for="cCode">Mã *</label><input class="input" id="cCode" value="${esc(code || "")}" ${code ? "disabled" : ""} style="text-transform:uppercase" placeholder="VD: TET2027"><span class="err-msg">Mã chỉ gồm chữ và số, 3–20 ký tự, chưa tồn tại</span></div>
        <div class="field"><label for="cType">Loại</label><select class="input" id="cType">${Object.entries(CTYPE).map(([k, l]) => `<option value="${k}" ${k === c.type ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
      <div class="form-row"><div class="field"><label for="cVal">Giá trị (% hoặc đ)</label><input class="input" id="cVal" type="number" min="0" value="${c.value}"></div>
        <div class="field"><label for="cMin">Đơn tối thiểu (đ)</label><input class="input" id="cMin" type="number" min="0" step="1000" value="${c.min}"></div></div>
      <div class="field"><label for="cDesc">Mô tả hiển thị cho khách</label><input class="input" id="cDesc" value="${esc(c.desc)}"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn" data-close>Huỷ</button><button class="btn btn-primary">Lưu mã</button></div></form>`, "sm");
    $("#cf", m).onsubmit = e => {
      e.preventDefault();
      const k = code || $("#cCode", m).value.trim().toUpperCase();
      const bad = !/^[A-Z0-9]{3,20}$/.test(k) || (!code && D.coupons[k]);
      $("#cCode", m).closest(".field").classList.toggle("error", !!bad); if (bad) return;
      const type = $("#cType", m).value, value = +$("#cVal", m).value || 0;
      if (type === "percent" && (value <= 0 || value > 90)) return toast("Phần trăm giảm phải từ 1 đến 90", "err");
      D.coupons[k] = { type, value: type === "ship" ? 0 : value, min: +$("#cMin", m).value || 0, desc: $("#cDesc", m).value.trim() || CTYPE[type] };
      saveCoupons(); closeModal(); toast(`Đã lưu mã ${k}`); route();
    };
  }

  // ---------- hộp xác nhận (thay cho confirm) ----------
  function confirmBox(text, yes) {
    const m = modal(`<div class="a-modal"><h3 style="margin-top:0">Xác nhận</h3><p>${esc(text)}</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-close>Huỷ</button><button class="btn btn-primary" id="cfYes">Đồng ý</button></div></div>`, "sm");
    $("#cfYes", m).onclick = () => { closeModal(); yes(); };
  }

  ss.get("kagami_admin") ? start() : showLogin();
})();
