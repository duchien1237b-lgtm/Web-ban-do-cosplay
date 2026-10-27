/* Tài khoản: đăng ký / đăng nhập (lưu localStorage – bản demo), đơn hàng, tra cứu đơn, hồ sơ */
(function () {
  const { $, $$, ico, esc, money, store, toast, fmtDate, initials, byId, Wish, card } = K;
  const STATUS = ["Chờ xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn tất", "Đã huỷ"];

  async function hash(s) {
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("kagami:" + s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
    } catch (e) { let h = 0; for (const c of "kagami:" + s) h = (h * 31 + c.charCodeAt(0)) | 0; return "x" + h; }
  }
  // Trạng thái đơn tự tiến triển theo thời gian (mô phỏng): mỗi 3 phút lên 1 bước
  const statusOf = o => o.status === 4 ? 4 : o.adminStatus != null ? o.adminStatus : Math.min(3, Math.floor((Date.now() - new Date(o.date)) / 180000));
  const fmtDT = iso => { const d = new Date(iso); return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); };

  function orderHTML(o, full) {
    const s = statusOf(o);
    return `<div class="order">
      <div class="order-head"><div><b>Đơn #${o.code}</b> <span class="muted" style="font-size:13px">· ${fmtDT(o.date)}</span></div><span class="status s${s}">${STATUS[s]}</span></div>
      <div class="order-thumbs">${o.items.map(it => { const p = byId(it.id); return p ? `<a href="${p.cat === "combo" ? "index.html#vai-dien" : "product.html?id=" + p.id}" title="${esc(p.name)}"><img ${K.im(p.images[0])} alt=""></a>` : ""; }).join("")}</div>
      <div class="muted" style="font-size:14px">${o.items.length} sản phẩm · ${o.items.some(i => i.mode === "rent") ? "Có đồ thuê" : "Mua"} · Thanh toán: ${{ cod: "Khi nhận hàng", bank: "Chuyển khoản", wallet: "Ví điện tử" }[o.pay]}</div>
      ${s < 4 ? `<div class="timeline">${STATUS.slice(0, 4).map((l, i) => `<div class="${i <= s ? "on" : ""}">${l}</div>`).join("")}</div>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:10px;flex-wrap:wrap"><span>Tổng: <b style="color:var(--brand);font-size:17px">${money(o.totals.total)}</b></span>
      <span style="display:flex;gap:8px">${full ? `<button class="btn btn-sm" data-reorder="${o.code}">${ico("refresh", "sm")} Đặt lại</button>` : ""}${s === 0 && full ? `<button class="btn btn-sm" data-cancel="${o.code}">Huỷ đơn</button>` : ""}</span></div></div>`;
  }

  const authBox = $("#authBox"), dash = $("#dash");
  const user = () => store.get("user", null);

  function showAuth() {
    authBox.classList.remove("hidden"); dash.classList.add("hidden");
    const tab = t => { $$(".auth-tabs button").forEach(b => b.classList.toggle("active", b.dataset.t === t)); $("#loginForm").classList.toggle("hidden", t !== "login"); $("#regForm").classList.toggle("hidden", t !== "reg"); };
    $(".auth-tabs").onclick = e => { const b = e.target.closest("button"); if (b) tab(b.dataset.t); };
    if (location.hash === "#register") tab("reg");
    $$(".pw-wrap button").forEach(b => b.onclick = () => { const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; $("use", b).setAttribute("href", i.type === "password" ? "#i-eye" : "#i-eyeoff"); });
    $("#rPass").addEventListener("input", e => {
      const v = e.target.value; let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^\w]/.test(v)) s++;
      const bar = $("#pwBar"); bar.style.width = s * 25 + "%"; bar.style.background = ["#d6303d", "#e98a15", "#d9a12b", "#1f9d6b", "#1f9d6b"][s];
      $("#pwTxt").textContent = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"][s];
    });
    const err = (id, msg) => { const f = $("#" + id).closest(".field"); f.classList.toggle("error", !!msg); if (msg) $(".err-msg", f).textContent = msg; return !msg; };

    $("#regForm").onsubmit = async e => {
      e.preventDefault();
      const name = $("#rName").value.trim(), email = $("#rEmail").value.trim().toLowerCase(), phone = $("#rPhone").value.trim(), pass = $("#rPass").value, pass2 = $("#rPass2").value;
      const users = store.get("users", []);
      const ok = [err("rName", name.length < 2 && "Nhập họ tên"),
        err("rEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "Email chưa hợp lệ" : users.some(u => u.email === email) && "Email này đã được đăng ký"),
        err("rPhone", !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone.replace(/\s/g, "")) && "Số điện thoại chưa hợp lệ"),
        err("rPass", pass.length < 6 && "Mật khẩu tối thiểu 6 ký tự"),
        err("rPass2", pass !== pass2 && "Mật khẩu nhập lại không khớp")].every(Boolean);
      if (!ok) return;
      const u = { name, email, phone, address: "", pass: await hash(pass), created: new Date().toISOString() };
      users.push(u); store.set("users", users);
      const { pass: _, ...pub } = u; store.set("user", pub);
      toast(`Chào mừng ${esc(name)}! Tặng bạn mã <b>KAGAMI10</b> 🎁`); showDash();
    };
    $("#loginForm").onsubmit = async e => {
      e.preventDefault();
      const email = $("#lEmail").value.trim().toLowerCase(), pass = $("#lPass").value;
      if (email === "admin@kagami.vn" && pass === "admin123") { try { sessionStorage.setItem("kagami_admin", "1"); } catch (e) {} toast("Xin chào Quản trị viên!"); location.href = "admin.html"; return; }
      const u = store.get("users", []).find(x => x.email === email);
      if (!err("lEmail", !u && "Không tìm thấy tài khoản với email này")) return;
      if (!err("lPass", u.pass !== await hash(pass) && "Mật khẩu không đúng")) return;
      const { pass: _, ...pub } = u; store.set("user", pub);
      if ($("#remember").checked) store.set("rememberEmail", email);
      toast(`Đăng nhập thành công. Chào ${esc(u.name)}!`); showDash();
    };
    $("#lEmail").value = store.get("rememberEmail", "");
    $("#forgot").onclick = e => { e.preventDefault(); toast("Bản demo: hãy đăng ký tài khoản mới hoặc liên hệ hotline để được hỗ trợ", "info"); };
  }

  function showDash() {
    const u = user(); authBox.classList.add("hidden"); dash.classList.remove("hidden");
    $$("[data-user-name]").forEach(el => el.textContent = u.name.split(" ").pop());
    $("#dAvatar").textContent = initials(u.name); $("#dName").textContent = u.name; $("#dEmail").textContent = u.email;
    const myOrders = () => store.get("orders", []).filter(o => o.owner === u.email || o.customer.email.toLowerCase() === u.email || o.customer.phone === u.phone);
    const panes = {
      overview() {
        const os = myOrders(), spent = os.filter(o => statusOf(o) !== 4).reduce((s, o) => s + o.totals.total - o.totals.dep, 0);
        return `<h2 style="font-family:var(--display)">Xin chào, ${esc(u.name)} 👋</h2><p class="muted">Quản lý đơn thuê, đơn mua và thông tin cá nhân của bạn.</p>
          <div class="stat-cards"><div class="stat-card"><small>Tổng đơn hàng</small><b>${os.length}</b></div><div class="stat-card"><small>Đã chi tiêu</small><b>${money(spent)}</b></div><div class="stat-card"><small>Hạng thành viên</small><b>${spent > 2000000 ? "Vàng ✦" : spent > 500000 ? "Bạc" : "Mới"}</b></div></div>
          <h3>Đơn gần đây</h3>${os.slice(0, 2).map(o => orderHTML(o, true)).join("") || `<div class="empty">${ico("package")}<p>Bạn chưa có đơn hàng nào.</p><a class="btn btn-primary btn-sm" href="shop.html">Thuê bộ đầu tiên</a></div>`}`;
      },
      orders() {
        const os = myOrders();
        return `<h2 style="font-family:var(--display)">Đơn hàng của tôi</h2>${os.map(o => orderHTML(o, true)).join("") || `<div class="empty">${ico("package")}<p>Chưa có đơn hàng.</p></div>`}`;
      },
      wish() {
        const l = Wish.list().map(byId).filter(Boolean);
        return `<h2 style="font-family:var(--display)">Danh sách yêu thích</h2>${l.length ? `<div class="grid-products cols-3">${l.map(p => card(p)).join("")}</div>` : `<div class="empty">${ico("heart")}<p>Chưa có trang phục yêu thích.</p></div>`}`;
      },
      profile() {
        return `<h2 style="font-family:var(--display)">Thông tin cá nhân</h2><form id="pfForm" class="card card-pad">
          <div class="form-row"><div class="field"><label>Họ tên</label><input class="input" id="pName" value="${esc(u.name)}"></div><div class="field"><label>Số điện thoại</label><input class="input" id="pPhone" value="${esc(u.phone || "")}"></div></div>
          <div class="field"><label>Email</label><input class="input" value="${esc(u.email)}" disabled></div>
          <div class="field"><label>Địa chỉ nhận hàng mặc định</label><input class="input" id="pAddr" value="${esc(u.address || "")}" placeholder="Số nhà, đường, phường, quận"></div>
          <button class="btn btn-primary">Lưu thay đổi</button></form>
          <form id="pwForm" class="card card-pad" style="margin-top:18px"><h3 style="font-size:17px">Đổi mật khẩu</h3>
          <div class="form-row"><div class="field"><label>Mật khẩu hiện tại</label><input class="input" type="password" id="pOld"></div><div class="field"><label>Mật khẩu mới</label><input class="input" type="password" id="pNew"></div></div>
          <button class="btn">Cập nhật mật khẩu</button></form>`;
      }
    };
    const open = k => {
      $$(".acc-menu [data-p]").forEach(b => b.classList.toggle("active", b.dataset.p === k));
      $("#pane").innerHTML = panes[k]();
      if (k === "profile") {
        $("#pfForm").onsubmit = e => {
          e.preventDefault(); const users = store.get("users", []); const i = users.findIndex(x => x.email === u.email);
          Object.assign(u, { name: $("#pName").value.trim() || u.name, phone: $("#pPhone").value.trim(), address: $("#pAddr").value.trim() });
          if (i >= 0) Object.assign(users[i], { name: u.name, phone: u.phone, address: u.address }); store.set("users", users); store.set("user", u);
          $("#dName").textContent = u.name; $("#dAvatar").textContent = initials(u.name); toast("Đã lưu thông tin");
        };
        $("#pwForm").onsubmit = async e => {
          e.preventDefault(); const users = store.get("users", []); const rec = users.find(x => x.email === u.email);
          if (!rec || rec.pass !== await hash($("#pOld").value)) return toast("Mật khẩu hiện tại không đúng", "err");
          if ($("#pNew").value.length < 6) return toast("Mật khẩu mới tối thiểu 6 ký tự", "err");
          rec.pass = await hash($("#pNew").value); store.set("users", users); e.target.reset(); toast("Đổi mật khẩu thành công");
        };
      }
    };
    $(".acc-menu").onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.p) open(b.dataset.p); if (b.id === "logout") { store.set("user", null); toast("Đã đăng xuất", "info"); location.reload(); } };
    $("#pane").onclick = e => {
      const c = e.target.closest("[data-cancel]"), r = e.target.closest("[data-reorder]");
      const orders = store.get("orders", []);
      if (c && confirm("Bạn chắc chắn muốn huỷ đơn này?")) { orders.find(o => o.code === c.dataset.cancel).status = 4; store.set("orders", orders); toast("Đã huỷ đơn hàng", "info"); open($(".acc-menu .active").dataset.p); }
      if (r) { orders.find(o => o.code === r.dataset.reorder).items.forEach(it => K.Cart.add({ ...it, start: K.addDays(K.today(), 1) })); K.openMini(); }
    };
    open(location.hash === "#orders" ? "orders" : "overview");
  }

  // Tra cứu đơn (không cần đăng nhập)
  $("#trackForm").onsubmit = e => {
    e.preventDefault(); const v = $("#trackCode").value.trim().toUpperCase().replace("#", "");
    const o = store.get("orders", []).find(x => x.code === v || x.customer.phone === v);
    $("#trackRes").innerHTML = o ? orderHTML(o, false) : `<p style="color:var(--danger);margin-top:12px">Không tìm thấy đơn với mã/số điện thoại “${esc(v)}”.</p>`;
  };

  user() ? showDash() : showAuth();
})();
