/* Các trang phụ: Yêu thích, Tin tức, Liên hệ + Hỏi đáp, Dịch vụ (đặt lịch), Chính sách, Giới thiệu */
(function () {
  const { D, $, $$, ico, esc, card, store, toast, fmtDate, today, money } = K;

  /* ----- Yêu thích ----- */
  if ($("#wishGrid")) {
    const render = () => {
      const l = K.Wish.list().map(K.byId).filter(Boolean);
      $("#wishGrid").innerHTML = l.map(p => card(p)).join("");
      $("#wishEmpty").classList.toggle("hidden", l.length > 0);
      $("#wishBar").classList.toggle("hidden", !l.length);
      $("#wishCount").textContent = l.length;
    };
    document.addEventListener("wish:change", render);
    $("#wishAll").onclick = () => { K.Wish.list().forEach(id => { const p = K.byId(id); K.Cart.add({ id, mode: "rent", size: p.sizes[0], qty: 1, days: 1 }); }); K.openMini(); };
    $("#wishShare").onclick = () => { const url = location.href.split("?")[0] + "?ids=" + K.Wish.list().join(","); navigator.clipboard?.writeText(url).then(() => toast("Đã sao chép link danh sách yêu thích")); };
    const shared = K.qs("ids");
    if (shared) { const ids = shared.split(",").filter(K.byId); store.set("wish", [...new Set([...K.Wish.list(), ...ids])]); K.updateBadges(); }
    render();
  }

  /* ----- Tin tức ----- */
  if ($("#blogList")) {
    const id = K.qs("id"), post = D.posts.find(p => p.id === id);
    if (post) {
      document.title = post.title + " – Kagami Cosplay";
      $("#blogIndex").classList.add("hidden"); $("#blogPost").classList.remove("hidden");
      $("#pageTitle").textContent = post.title; $("#pageDesc").textContent = post.excerpt;
      $("#blogPost").innerHTML = `<article class="article"><div class="post-meta"><span class="tag">${post.tag}</span>${ico("calendar", "sm")} ${fmtDate(post.date)} · ${ico("clock", "sm")} ${Math.max(2, post.body.join(" ").split(" ").length / 200 | 0)} phút đọc</div>
        <img ${K.im(post.image)} alt="">${post.body.map(p => `<p>${esc(p)}</p>`).join("")}
        <div class="card card-pad" style="display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:30px"><b>Bạn thấy bài viết hữu ích?</b><span style="display:flex;gap:8px"><button class="btn btn-sm" id="likeBtn">${ico("heart", "sm")} Thích <span id="likeN"></span></button><a class="btn btn-sm btn-primary" href="shop.html">Xem trang phục</a></span></div>
        <h3 style="margin-top:40px">Bài viết khác</h3><div class="blog-grid">${D.posts.filter(p => p.id !== id).slice(0, 3).map(postCard).join("")}</div></article>`;
      const likes = store.get("likes", {}); $("#likeN").textContent = likes[id] ? "(" + likes[id] + ")" : "";
      $("#likeBtn").onclick = () => { likes[id] = (likes[id] || 0) + 1; store.set("likes", likes); $("#likeN").textContent = "(" + likes[id] + ")"; toast("Cảm ơn bạn! 💖"); };
    } else {
      const tags = ["Tất cả", ...new Set(D.posts.map(p => p.tag))];
      $("#blogTags").innerHTML = tags.map((t, i) => `<button class="chip ${i ? "" : "active"}" data-t="${t}">${t}</button>`).join("");
      const show = t => { $("#blogList").innerHTML = D.posts.filter(p => t === "Tất cả" || p.tag === t).map(postCard).join(""); };
      $("#blogTags").onclick = e => { const b = e.target.closest("button"); if (!b) return; $$("#blogTags button").forEach(x => x.classList.toggle("active", x === b)); show(b.dataset.t); };
      show("Tất cả");
    }
  }
  function postCard(b) {
    return `<article class="post"><a href="blog.html?id=${b.id}"><img ${K.im(b.image)} alt="" loading="lazy"></a><div class="post-body">
      <div class="post-meta"><span class="tag">${b.tag}</span>${ico("calendar", "sm")} ${fmtDate(b.date)}</div><h3><a href="blog.html?id=${b.id}">${esc(b.title)}</a></h3>
      <p>${esc(b.excerpt)}</p><a class="read-more" href="blog.html?id=${b.id}">Đọc tiếp ${ico("arrow", "sm")}</a></div></article>`;
  }

  /* ----- Hỏi đáp (accordion) ----- */
  if ($("#faq")) {
    $("#faq").innerHTML = D.faq.map(([q, a], i) => `<div class="acc-item ${i ? "" : "open"}"><button aria-expanded="${!i}">${esc(q)} ${ico("plus")}</button><div class="acc-body"><div>${esc(a)}</div></div></div>`).join("");
    $("#faq").onclick = e => { const b = e.target.closest("button"); if (!b) return; const it = b.parentElement; it.classList.toggle("open"); b.setAttribute("aria-expanded", it.classList.contains("open")); };
  }

  /* ----- Kiểm tra form chung (Liên hệ / Đặt lịch) ----- */
  function validateForm(form, rules) {
    let first = null;
    Object.entries(rules).forEach(([id, fn]) => {
      const el = $("#" + id, form), r = fn(el.value), f = el.closest(".field");
      f.classList.toggle("error", r !== true); if (r !== true) { $(".err-msg", f).textContent = r; first = first || el; }
    });
    if (first) first.focus();
    return !first;
  }
  const phoneOK = v => /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(v.replace(/\s|\./g, "")) || "Số điện thoại chưa hợp lệ";

  if ($("#contactForm")) {
    $("#contactForm").onsubmit = e => {
      e.preventDefault();
      if (!validateForm(e.target, { ctName: v => v.trim().length >= 2 || "Nhập họ tên", ctPhone: phoneOK, ctEmail: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Email chưa hợp lệ", ctMsg: v => v.trim().length >= 10 || "Nội dung tối thiểu 10 ký tự" })) return;
      const msgs = store.get("messages", []); msgs.push({ name: $("#ctName").value, phone: $("#ctPhone").value, topic: $("#ctTopic").value, msg: $("#ctMsg").value, at: new Date().toISOString() }); store.set("messages", msgs);
      e.target.reset(); toast("Đã gửi! Kagami sẽ liên hệ lại trong 15 phút (giờ làm việc) 💌"); K.play("success", .3);
    };
  }

  if ($("#bookForm")) {
    const PRICE = { photo: 990000, makeup: 350000, model: 1500000 };
    $("#bDate").min = today(); $("#bDate").value = K.addDays(today(), 2);
    const est = () => { const s = $("#bService").value, n = +$("#bPeople").value || 1; $("#bEst").textContent = money(PRICE[s] * (s === "photo" ? Math.ceil(n / 2) : n)); };
    ["bService", "bPeople"].forEach(id => $("#" + id).addEventListener("input", est)); est();
    $$("[data-book]").forEach(b => b.onclick = () => { $("#bService").value = b.dataset.book; est(); $("#booking").scrollIntoView({ behavior: "smooth" }); });
    $("#bookForm").onsubmit = e => {
      e.preventDefault();
      if (!validateForm(e.target, { bName: v => v.trim().length >= 2 || "Nhập họ tên", bPhone: phoneOK, bDate: v => (v && v >= today()) || "Chọn ngày từ hôm nay trở đi" })) return;
      const bk = store.get("bookings", []); const code = "BK" + Date.now().toString(36).toUpperCase().slice(-5);
      bk.push({ code, service: $("#bService").value, date: $("#bDate").value, time: $("#bTime").value, people: $("#bPeople").value, name: $("#bName").value }); store.set("bookings", bk);
      K.modal(`<div class="success-box" style="margin:0"><div class="success-ico">${ico("check")}</div><h2>Đặt lịch thành công!</h2><p class="muted">Mã lịch hẹn</p><div class="order-code">${code}</div><p>${esc($("#bService").selectedOptions[0].text)} · ${fmtDate($("#bDate").value)} lúc ${$("#bTime").value}</p><p class="muted">Nhân viên sẽ gọi xác nhận trong 30 phút.</p></div>`, "sm");
      e.target.reset(); $("#bDate").value = K.addDays(today(), 2); est(); K.play("success", .4);
    };
  }

  /* ----- Chính sách: làm nổi mục đang đọc ----- */
  if ($("#policyNav")) {
    const links = $$("#policyNav a");
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
    $$(".policy article section").forEach(s => io.observe(s));
  }

  /* ----- Số liệu chạy (giới thiệu) ----- */
  const io2 = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; const el = en.target, to = +el.dataset.count; let n = 0;
    const t = setInterval(() => { n += Math.ceil(to / 40); if (n >= to) { n = to; clearInterval(t); } el.textContent = n.toLocaleString("vi-VN") + (el.dataset.suffix || ""); }, 30);
    io2.unobserve(el);
  }));
  $$("[data-count]").forEach(el => io2.observe(el));
})();
