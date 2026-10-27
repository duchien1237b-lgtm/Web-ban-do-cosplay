/* Trang chi tiết: thư viện ảnh + phóng to, chọn Thuê/Mua, size, ngày nhận, số ngày, đánh giá, sản phẩm liên quan */
(function () {
  const { D, $, $$, ico, card, esc, money, priceRent, priceBuy, rentTotal, rentDiscount, catName, stars, store, today, addDays, fmtDate, initials, toast, Cart, Wish } = K;
  const p = K.byId(K.qs("id")) || D.products[0];
  document.title = `${p.name} – Kagami Cosplay`;

  // lưu "đã xem gần đây"
  const recent = [p.id, ...store.get("recent", []).filter(x => x !== p.id)].slice(0, 10);
  store.set("recent", recent);

  const st = { img: 0, mode: "rent", size: p.sizes[0], qty: 1, days: 1, start: addDays(today(), 1) };
  const userReviews = store.get("reviews", {})[p.id] || [];

  const tagHTML = [p.tags.includes("new") && '<span class="tag new">Mới</span>', p.tags.includes("hot") && '<span class="tag hot">Hot</span>', p.sale && `<span class="tag sale">-${p.sale}%</span>`].filter(Boolean).join("");
  $("#crumbCat").innerHTML = `<a href="shop.html?cat=${p.cat}">${catName(p.cat)}</a>`;
  $("#crumbName").textContent = p.name;

  $("#pd").innerHTML = `
  <div class="gallery">
    <div class="thumbs">${p.images.map((src, i) => `<button class="${i ? "" : "active"}" data-i="${i}" aria-label="Ảnh ${i + 1}"><img ${K.im(src)} alt=""></button>`).join("")}</div>
    <div class="main-img" id="mainImg"><img ${K.im(p.images[0])} alt="${esc(p.name)}"><div class="p-badges">${tagHTML}</div></div>
  </div>
  <div class="pd-info">
    <span class="p-cat">${catName(p.cat)}</span>
    <h1>${esc(p.name)}</h1>
    <div class="pd-meta">${stars(p.rating)} <b style="color:var(--ink)">${p.rating}</b> <a href="#tabs" data-goto="rv">${p.reviews + userReviews.length} đánh giá</a> <span>·</span> <span>${p.sold} lượt thuê</span> <span>·</span> <span>Mã: KG-${String(p.order + 101).padStart(4, "0")}</span></div>
    <p class="muted" style="margin:14px 0 0">${esc(p.desc)}</p>
    <div class="mode-switch">
      <button class="mode-opt active" data-m="rent"><small>Giá thuê / ngày</small><b>${money(priceRent(p))}</b> ${p.sale ? `<span class="price-old">${money(p.rent)}</span>` : ""}<small>Cọc ${money(p.deposit)} (hoàn lại)</small></button>
      <button class="mode-opt" data-m="buy" ${p.buy == null ? "disabled" : ""}><small>Giá mua đứt</small><b>${p.buy == null ? "Không bán" : money(priceBuy(p))}</b> ${p.sale && p.buy ? `<span class="price-old">${money(p.buy)}</span>` : ""}<small>${p.buy == null ? "Mẫu chỉ cho thuê" : "Hàng mới 100%, kèm hộp"}</small></button>
    </div>
    <div class="pd-row"><div class="pd-label">Kích thước: <span id="sizeTxt" style="margin-left:6px;color:var(--brand)">${p.sizes[0]}</span><button type="button" id="sizeGuide" style="margin-left:auto">${ico("ruler", "sm")} Hướng dẫn chọn size</button></div>
      <div class="size-pills" id="sizes">${p.sizes.map((s, i) => `<button type="button" class="size-opt ${i ? "" : "active"}" data-s="${s}">${s}</button>`).join("")}</div></div>
    <div class="pd-row" id="rentBox"><div class="pd-label">Lịch thuê</div>
      <div class="rent-box">
        <div class="field"><label for="start">Ngày nhận đồ</label><input class="input" type="date" id="start" min="${today()}" value="${st.start}"></div>
        <div class="field"><label for="days">Số ngày thuê</label><select class="input" id="days">${Array.from({ length: 14 }, (_, i) => `<option value="${i + 1}">${i + 1} ngày${i + 1 >= 5 ? " (-20%)" : i + 1 >= 3 ? " (-10%)" : ""}</option>`).join("")}</select></div>
        <div class="rent-summary" id="rentSum"></div>
      </div></div>
    <div class="pd-row" style="display:flex;align-items:center;gap:16px"><span class="pd-label" style="margin:0">Số lượng</span>
      <div class="qty"><button type="button" data-q="-1" aria-label="Giảm">−</button><input id="qty" type="number" min="1" max="10" value="1" aria-label="Số lượng"><button type="button" data-q="1" aria-label="Tăng">+</button></div>
      <span class="muted" style="font-size:13.5px">Còn ${5 + p.reviews % 9} bộ sẵn tại tiệm</span></div>
    <div class="pd-buy">
      <button class="btn btn-lg" id="addCart">${ico("bag", "sm")} Thêm vào giỏ</button>
      <button class="btn btn-lg btn-primary" id="buyNow">${ico("zap", "sm")} <span id="buyNowTxt">Thuê ngay</span></button>
      <button class="icon-btn p-fav ${Wish.has(p.id) ? "on" : ""}" style="position:static;width:54px;height:54px;border:1.5px solid var(--line)" data-fav="${p.id}" aria-label="Yêu thích">${ico("heart")}</button>
    </div>
    <div class="pd-perks">
      <div>${ico("truck")} Giao nhanh 2h nội thành</div><div>${ico("shield")} Giặt hấp tiệt trùng</div>
      <div>${ico("refresh")} Đổi size trong 24h</div><div>${ico("wallet")} Hoàn cọc ngay khi trả</div>
    </div>
    <div class="pd-share">Chia sẻ: <button class="icon-btn" id="copyLink" title="Sao chép liên kết">${ico("link", "sm")}</button><button class="icon-btn" id="shareBtn" title="Chia sẻ">${ico("share", "sm")}</button></div>
  </div>`;

  // ---- thư viện ảnh
  const main = $("#mainImg"), mimg = $("img", main);
  $(".thumbs").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(".thumbs button").forEach(x => x.classList.toggle("active", x === b)); curImg = +b.dataset.i;
    mimg.style.opacity = 0; setTimeout(() => { K.setImg(mimg, p.images[+b.dataset.i]); mimg.style.opacity = 1; }, 150);
  });
  mimg.style.transition = "opacity .15s, transform .2s";
  main.addEventListener("mousemove", e => { const r = main.getBoundingClientRect(); mimg.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; });
  let curImg = 0;
  if (matchMedia("(pointer: fine)").matches) main.addEventListener("mouseenter", () => main.classList.add("zoom"));
  main.addEventListener("click", () => { main.classList.remove("zoom"); window.KFX && KFX.lightbox(p.images, curImg, p.name); });
  main.addEventListener("mouseleave", () => main.classList.remove("zoom"));

  // ---- chọn tuỳ chọn
  function update() {
    $("#rentBox").classList.toggle("hidden", st.mode !== "rent");
    $("#buyNowTxt").textContent = st.mode === "rent" ? "Thuê ngay" : "Mua ngay";
    if (st.mode === "rent") {
      const base = priceRent(p) * st.days, d = rentDiscount(st.days), total = rentTotal(p, st.days);
      $("#rentSum").innerHTML = `
        <div><span>${money(priceRent(p))} × ${st.days} ngày × ${st.qty}</span><span>${money(base * st.qty)}</span></div>
        ${d ? `<div style="color:var(--ok)"><span>Ưu đãi thuê dài ngày (-${d * 100}%)</span><span>-${money((base - total) * st.qty)}</span></div>` : ""}
        <div><span>Tiền cọc (hoàn lại)</span><span>${money(p.deposit * st.qty)}</span></div>
        <div><span>Trả đồ trước</span><span>${fmtDate(addDays(st.start, st.days))}</span></div>
        <div class="total"><span>Thanh toán khi nhận</span><span>${money(total * st.qty + p.deposit * st.qty)}</span></div>`;
    }
  }
  $(".mode-switch").addEventListener("click", e => { const b = e.target.closest(".mode-opt"); if (!b || b.disabled) return; st.mode = b.dataset.m; $$(".mode-opt").forEach(x => x.classList.toggle("active", x === b)); update(); });
  $("#sizes").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; st.size = b.dataset.s; $("#sizeTxt").textContent = st.size; $$("#sizes button").forEach(x => x.classList.toggle("active", x === b)); });
  $("#start").addEventListener("change", e => { if (e.target.value < today()) { e.target.value = today(); toast("Ngày nhận không được ở quá khứ", "err"); } st.start = e.target.value; update(); });
  $("#days").addEventListener("change", e => { st.days = +e.target.value; update(); });
  const qty = $("#qty");
  $(".pd-row .qty").addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (!b) return; st.qty = Math.max(1, Math.min(10, st.qty + +b.dataset.q)); qty.value = st.qty; update(); });
  qty.addEventListener("change", () => { st.qty = Math.max(1, Math.min(10, +qty.value || 1)); qty.value = st.qty; update(); });
  const item = () => ({ id: p.id, mode: st.mode, size: st.size, qty: st.qty, days: st.days, start: st.start });
  $("#addCart").onclick = () => { Cart.add(item()); K.openMini(); };
  $("#buyNow").onclick = () => { Cart.add(item()); location.href = "checkout.html"; };
  $("#copyLink").onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => toast("Đã sao chép liên kết sản phẩm")).catch(() => toast("Không sao chép được, hãy copy thanh địa chỉ", "err")); };
  $("#shareBtn").onclick = () => navigator.share ? navigator.share({ title: p.name, url: location.href }).catch(() => {}) : $("#copyLink").click();
  update();

  // ---- bảng size
  const SIZE_TABLE = `<table class="size-table"><thead><tr><th>Size</th><th>Chiều cao (cm)</th><th>Cân nặng (kg)</th><th>Vòng ngực</th><th>Vòng eo</th></tr></thead><tbody>
    <tr><td>S</td><td>150–158</td><td>40–47</td><td>78–82</td><td>60–64</td></tr><tr><td>M</td><td>158–165</td><td>47–54</td><td>82–86</td><td>64–68</td></tr>
    <tr><td>L</td><td>165–172</td><td>54–62</td><td>86–92</td><td>68–74</td></tr><tr><td>XL</td><td>172–178</td><td>62–72</td><td>92–98</td><td>74–80</td></tr>
    <tr><td>XXL</td><td>178–185</td><td>72–85</td><td>98–106</td><td>80–88</td></tr></tbody></table>`;
  $("#sizeGuide").onclick = () => {
    const m = K.modal(`<div class="card-pad" style="padding:32px"><h2 style="font-family:var(--display)">Hướng dẫn chọn size</h2>
      <p class="muted">Số đo tính bằng cm. Nếu nằm giữa hai size, chọn size lớn hơn với đồ nhiều lớp và size nhỏ hơn với đồ ôm.</p>${SIZE_TABLE}
      <h3 style="margin-top:24px;font-size:17px">Gợi ý size nhanh</h3>
      <div class="form-row"><div class="field"><label>Chiều cao (cm)</label><input class="input" id="hH" type="number" placeholder="160"></div><div class="field"><label>Cân nặng (kg)</label><input class="input" id="hW" type="number" placeholder="50"></div></div>
      <button class="btn btn-primary" id="hGo">Gợi ý size cho tôi</button> <span id="hRes" style="margin-left:10px;font-weight:700;color:var(--brand)"></span></div>`, "sm");
    $("#hGo", m).onclick = () => {
      const h = +$("#hH", m).value, w = +$("#hW", m).value;
      if (!h || !w) return $("#hRes", m).textContent = "Nhập đủ chiều cao và cân nặng nhé";
      const score = Math.max(h < 158 ? 0 : h < 165 ? 1 : h < 172 ? 2 : h < 178 ? 3 : 4, w < 47 ? 0 : w < 54 ? 1 : w < 62 ? 2 : w < 72 ? 3 : 4);
      const s = ["S", "M", "L", "XL", "XXL"][score];
      $("#hRes", m).textContent = `Size phù hợp: ${s}` + (p.sizes.includes(s) ? "" : " (mẫu này không có, hãy liên hệ tiệm)");
      const b = $(`#sizes [data-s="${s}"]`); if (b) b.click();
    };
  };

  // ---- tab thông tin
  const dist = [5, 4, 3, 2, 1].map(s => s === 5 ? 0.78 : s === 4 ? 0.16 : s === 3 ? 0.04 : 0.01);
  const pool = D.reviewsPool.map((r, i) => ({ name: r[0], text: r[1], rating: r[2], date: addDays(today(), -(i * 6 + p.order % 5 + 2)) }));
  const allReviews = () => [...(store.get("reviews", {})[p.id] || []), ...pool];
  function renderReviews() {
    const list = allReviews();
    $("#rvList").innerHTML = list.map(r => `<div class="review"><div class="review-head"><span class="avatar">${initials(r.name)}</span><div><b>${esc(r.name)}</b><div class="muted" style="font-size:13px">${stars(r.rating)} · ${fmtDate(r.date)} · Size ${esc(r.size || p.sizes[0])}</div></div></div><p>${esc(r.text)}</p></div>`).join("");
    $("#rvCount").textContent = p.reviews + list.length - pool.length;
  }
  $("#tabs").innerHTML = `
    <div class="tab-btns" role="tablist">
      <button class="active" data-t="ds">Mô tả</button><button data-t="sp">Thông số</button><button data-t="sz">Bảng size</button><button data-t="cs">Chính sách thuê</button><button data-t="rv">Đánh giá (<span id="rvCount"></span>)</button>
    </div>
    <div class="tab-pane active" id="t-ds"><p>${esc(p.desc)}</p><p>Mỗi bộ trang phục tại Kagami đều được may hoặc tuyển chọn bởi đội ngũ phục trang của tiệm, kiểm tra đường may sau mỗi lần thuê và giặt hấp tiệt trùng trước khi giao. Hình minh hoạ mang tính tham khảo, màu thực tế có thể chênh nhẹ do ánh sáng.</p>
      <p><b>Phù hợp:</b> chụp ảnh concept, lễ hội, sự kiện trường học, biểu diễn sân khấu, kỷ yếu.</p></div>
    <div class="tab-pane" id="t-sp"><table class="spec"><tbody>
      <tr><td>Danh mục</td><td>${catName(p.cat)}</td></tr><tr><td>Chất liệu</td><td>${p.material}</td></tr><tr><td>Bộ sản phẩm gồm</td><td>${p.include}</td></tr>
      <tr><td>Kích thước có sẵn</td><td>${p.sizes.join(", ")}</td></tr><tr><td>Giá thuê</td><td>${money(priceRent(p))}/ngày (cọc ${money(p.deposit)})</td></tr>
      <tr><td>Giá bán</td><td>${p.buy == null ? "Chỉ cho thuê" : money(priceBuy(p))}</td></tr><tr><td>Bảo quản</td><td>Giặt khô, không sấy nóng, treo nơi thoáng mát</td></tr></tbody></table></div>
    <div class="tab-pane" id="t-sz">${SIZE_TABLE}</div>
    <div class="tab-pane" id="t-cs"><ul style="display:grid;gap:10px">
      <li>✔ Thời gian thuê tính theo ngày, từ ngày nhận đến hết 21:00 ngày cuối.</li><li>✔ Thuê từ 3 ngày giảm 10%, từ 5 ngày giảm 20%.</li>
      <li>✔ Đặt cọc ${money(p.deposit)}/bộ, hoàn 100% khi trả đồ nguyên vẹn.</li><li>✔ Trả muộn: tính thêm 100% giá thuê/ngày.</li>
      <li>✔ Hư hỏng nhẹ (bung chỉ, dính bẩn thường) – miễn phí. Hư hỏng nặng/mất phụ kiện tính theo bảng phí tại <a href="policy.html#thue" style="color:var(--brand)">Chính sách thuê</a>.</li></ul></div>
    <div class="tab-pane" id="t-rv">
      <div class="review-sum"><div class="center"><div class="big">${p.rating}</div>${stars(p.rating)}<div class="muted" style="font-size:13px">${p.reviews} đánh giá</div></div>
        <div>${[5, 4, 3, 2, 1].map((s, i) => `<div class="bar-row"><span>${s} ★</span><span class="bar"><i style="width:${dist[i] * 100}%"></i></span><span class="muted">${Math.round(p.reviews * dist[i])}</span></div>`).join("")}</div></div>
      <form id="rvForm" class="card card-pad" style="margin-bottom:10px"><h3 style="font-size:17px">Viết đánh giá của bạn</h3>
        <div class="star-input">${[5, 4, 3, 2, 1].map(s => `<input type="radio" name="star" id="s${s}" value="${s}" ${s === 5 ? "checked" : ""}><label for="s${s}" title="${s} sao">★</label>`).join("")}</div>
        <div class="form-row"><div class="field"><label for="rvName">Tên của bạn <span class="req">*</span></label><input class="input" id="rvName" required maxlength="40"><span class="err-msg">Vui lòng nhập tên</span></div>
        <div class="field"><label for="rvSize">Size đã thuê</label><select class="input" id="rvSize">${p.sizes.map(s => `<option>${s}</option>`).join("")}</select></div></div>
        <div class="field"><label for="rvText">Nhận xét <span class="req">*</span></label><textarea class="input" id="rvText" maxlength="500" placeholder="Chất liệu, form dáng, dịch vụ..."></textarea><span class="err-msg">Nhận xét cần ít nhất 10 ký tự</span></div>
        <button class="btn btn-primary">Gửi đánh giá</button></form>
      <div id="rvList"></div></div>`;
  const openTab = k => { $$(".tab-btns button").forEach(b => b.classList.toggle("active", b.dataset.t === k)); $$(".tab-pane").forEach(x => x.classList.toggle("active", x.id === "t-" + k)); };
  $(".tab-btns").addEventListener("click", e => { const b = e.target.closest("button"); if (b) openTab(b.dataset.t); });
  document.addEventListener("click", e => { const g = e.target.closest("[data-goto]"); if (g) openTab(g.dataset.goto); });
  const u = store.get("user", null); if (u) $("#rvName").value = u.name;
  $("#rvForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#rvName").value.trim(), text = $("#rvText").value.trim();
    $("#rvName").parentElement.classList.toggle("error", !name);
    $("#rvText").parentElement.classList.toggle("error", text.length < 10);
    if (!name || text.length < 10) return;
    const all = store.get("reviews", {}); (all[p.id] = all[p.id] || []).unshift({ name, text, rating: +$("[name=star]:checked").value, size: $("#rvSize").value, date: today() });
    store.set("reviews", all); e.target.reset(); renderReviews(); toast("Cảm ơn bạn đã đánh giá! 💖");
  });
  renderReviews();

  // ---- liên quan & đã xem
  $("#related").innerHTML = D.products.filter(x => x.cat === p.cat && x.id !== p.id).concat(D.products.filter(x => x.cat !== p.cat && x.tags.includes("hot"))).slice(0, 4).map(x => card(x)).join("");
  const rv = recent.slice(1).map(K.byId).filter(Boolean);
  if (rv.length) { $("#recentSec").classList.remove("hidden"); $("#recent").innerHTML = rv.map(x => card(x)).join(""); }
})();
