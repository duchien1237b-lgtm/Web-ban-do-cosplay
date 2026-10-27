/* Trang chủ: danh mục, flash sale, tab sản phẩm nổi bật, đánh giá, lookbook, blog, video */
(function () {
  const { D, $, $$, ico, card, esc, initials, fmtDate } = K;

  // Danh mục
  $("#catGrid").innerHTML = D.categories.map(c => `
    <a class="cat-tile reveal" href="shop.html?cat=${c.slug}">
      <img ${K.im(c.image)} alt="${esc(c.name)}" loading="lazy">
      <span class="arrow">${ico("arrow", "sm")}</span>
      <div><b>${esc(c.name)}</b><small>${c.count} mẫu · ${esc(c.desc)}</small></div>
    </a>`).join("");

  // Flash sale: sản phẩm đang giảm giá
  $("#flashGrid").innerHTML = D.products.filter(p => p.sale).slice(0, 4).map(p => card(p, { flash: true })).join("");

  // Đồng hồ đếm ngược tới 23:59:59 hôm nay
  const cd = $("#countdown");
  const tick = () => {
    const now = new Date(), end = new Date(); end.setHours(23, 59, 59, 999);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
    cd.innerHTML = [[h, "Giờ"], [m, "Phút"], [s, "Giây"]].map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
  };
  tick(); setInterval(tick, 1000);

  // Tab nổi bật
  const sets = {
    hot: D.products.filter(p => p.tags.includes("hot")),
    new: D.products.filter(p => p.tags.includes("new")),
    most: [...D.products].sort((a, b) => b.sold - a.sold),
    rate: [...D.products].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
  };
  const showTab = k => { $("#featGrid").innerHTML = sets[k].slice(0, 8).map(p => card(p)).join(""); };
  $("#featTabs").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#featTabs button").forEach(x => x.classList.toggle("active", x === b)); showTab(b.dataset.k);
  });
  showTab("hot");

  // Cảm nhận khách hàng (slider kéo ngang)
  const track = $("#testiTrack");
  track.innerHTML = D.testimonials.concat(D.testimonials.slice(0, 2)).map(t => `
    <figure class="testi">${K.stars(t.rating)}<p>${esc(t.text)}</p>
      <figcaption class="who"><span class="avatar">${initials(t.name)}</span><span><b>${esc(t.name)}</b><small>${esc(t.role)}</small></span></figcaption></figure>`).join("");
  const step = () => track.querySelector(".testi").offsetWidth + 22;
  $("#testiPrev").onclick = () => track.scrollBy({ left: -step(), behavior: "smooth" });
  $("#testiNext").onclick = () => track.scrollBy({ left: step(), behavior: "smooth" });
  let auto = setInterval(() => {
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) track.scrollTo({ left: 0, behavior: "smooth" });
    else track.scrollBy({ left: step(), behavior: "smooth" });
  }, 5000);
  track.addEventListener("pointerenter", () => clearInterval(auto));

  // Lookbook
  const lb = ["kimono-hoa-anh-dao", "maid-classic", "phap-su-tinh-tu", "vampire-quy-toc", "toc-hong-twintail", "idol-san-khau", "hanbok-hong-phan", "mat-na-kitsune"];
  $("#lookbook").innerHTML = lb.map((id, i) => { const p = K.byId(id); const k = p.images[i % 2 ? 1 : 0]; return `<a href="product.html?id=${id}" data-lightbox="lookbook" data-key="${k}" data-cap="${esc(p.name)}" aria-label="Xem ảnh ${esc(p.name)}"><img ${K.im(k)} alt="${esc(p.name)}" loading="lazy"></a>`; }).join("");

  // Combo vai diễn của mùa này
  const cbox = $("#combos");
  if (cbox) cbox.innerHTML = D.combos.map(c => `
    <article class="combo"><img ${K.im(c.images[0])} alt="${esc(c.name)}" loading="lazy" draggable="false">
      <div class="c-top">${esc(c.name)}</div>
      <div class="c-bottom"><p>${esc(c.desc)}</p><span class="c-price">${K.money(c.rent)}<small>/ngày · cọc ${K.money(c.deposit)}</small></span>
      <button class="btn btn-sm" data-combo="${c.id}">${ico("bag", "sm")} Thuê combo</button></div></article>`).join("");

  // Blog mới nhất
  $("#blogGrid").innerHTML = D.posts.slice(0, 3).map(b => `
    <article class="post reveal"><a href="blog.html?id=${b.id}"><img ${K.im(b.image)} alt="" loading="lazy"></a>
      <div class="post-body"><div class="post-meta"><span class="tag">${b.tag}</span>${ico("calendar", "sm")} ${fmtDate(b.date)}</div>
      <h3><a href="blog.html?id=${b.id}">${esc(b.title)}</a></h3><p>${esc(b.excerpt)}</p>
      <a class="read-more" href="blog.html?id=${b.id}">Đọc tiếp ${ico("arrow", "sm")}</a></div></article>`).join("");

  // Video: nút phát
  const vf = $("#promoVideo");
  if (vf) {
    const v = $("video", vf);
    $(".play", vf).onclick = () => { vf.classList.add("playing"); v.controls = true; v.play(); };
    v.addEventListener("ended", () => { vf.classList.remove("playing"); v.controls = false; });
  }

  // Số liệu chạy
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; const el = en.target, to = +el.dataset.count; let n = 0;
    const t = setInterval(() => { n += Math.ceil(to / 40); if (n >= to) { n = to; clearInterval(t); } el.textContent = n.toLocaleString("vi-VN") + (el.dataset.suffix || ""); }, 30);
    io.unobserve(el);
  }));
  $$("[data-count]").forEach(el => io.observe(el));

  // hiện hiệu ứng cho phần tử thêm bằng JS
  requestAnimationFrame(() => $$(".reveal:not(.in)").forEach(el => {
    const ob = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { el.classList.add("in"); ob.disconnect(); } }), { threshold: .1 }); ob.observe(el);
  }));
})();
