/* Trang Tủ đồ: lọc theo danh mục / hình thức / giá / size / đánh giá, sắp xếp, phân trang, dạng lưới/danh sách */
(function () {
  const { D, $, $$, ico, card, esc, norm, money, priceRent, priceBuy, catName, store } = K;
  const PER = 9;
  const P = new URLSearchParams(location.search);
  const S = {
    cats: P.get("cat") ? P.get("cat").split(",") : [],
    q: P.get("q") || "",
    mode: P.get("mode") || "all",
    max: +P.get("max") || 400000,
    sizes: P.get("size") ? P.get("size").split(",") : [],
    rating: +P.get("rating") || 0,
    tag: P.get("tag") || "",
    sort: P.get("sort") || "pop",
    page: +P.get("page") || 1,
    view: store.get("view", "grid")
  };
  const ALL_SIZES = [...new Set(D.products.flatMap(p => p.sizes))];

  // ---- dựng bộ lọc
  $("#fCats").innerHTML = D.categories.map(c => `<label class="check"><input type="checkbox" value="${c.slug}" ${S.cats.includes(c.slug) ? "checked" : ""}> ${esc(c.name)} <span class="count">${c.count}</span></label>`).join("");
  $("#fSizes").innerHTML = ALL_SIZES.map(s => `<button type="button" data-s="${s}" class="${S.sizes.includes(s) ? "active" : ""}">${s}</button>`).join("");
  $("#fRating").innerHTML = [0, 4.5, 4.7, 4.9].map(r => `<label class="check"><input type="radio" name="rt" value="${r}" ${S.rating === r ? "checked" : ""}> ${r ? K.stars(r) + " từ " + r : "Tất cả"}</label>`).join("");
  $("#fTags").innerHTML = [["", "Tất cả"], ["sale", "Đang giảm giá"], ["new", "Hàng mới về"], ["hot", "Bán chạy"]].map(([v, l]) => `<button type="button" class="chip ${S.tag === v ? "active" : ""}" data-t="${v}">${l}</button>`).join("");
  $("#fMax").value = S.max; $("#fMaxTxt").textContent = money(S.max);
  $("#sort").value = S.sort; $("#q").value = S.q;
  $$("#fMode button").forEach(b => b.classList.toggle("active", b.dataset.m === S.mode));

  function filtered() {
    const q = norm(S.q.trim());
    let list = D.products.filter(p =>
      (!S.cats.length || S.cats.includes(p.cat)) &&
      (!q || norm(p.name + " " + p.desc + " " + catName(p.cat)).includes(q)) &&
      (S.mode !== "buy" || p.buy != null) &&
      priceRent(p) <= S.max &&
      (!S.sizes.length || p.sizes.some(s => S.sizes.includes(s))) &&
      p.rating >= S.rating &&
      (!S.tag || (S.tag === "sale" ? p.sale > 0 : p.tags.includes(S.tag))));
    const sorters = {
      pop: (a, b) => b.sold - a.sold,
      new: (a, b) => (b.tags.includes("new") - a.tags.includes("new")) || b.order - a.order,
      rentAsc: (a, b) => priceRent(a) - priceRent(b),
      rentDesc: (a, b) => priceRent(b) - priceRent(a),
      buyAsc: (a, b) => (priceBuy(a) ?? 1e9) - (priceBuy(b) ?? 1e9),
      rate: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      name: (a, b) => a.name.localeCompare(b.name, "vi")
    };
    return list.sort(sorters[S.sort]);
  }

  function syncURL() {
    const u = new URLSearchParams();
    if (S.cats.length) u.set("cat", S.cats.join(","));
    if (S.q) u.set("q", S.q);
    if (S.mode !== "all") u.set("mode", S.mode);
    if (S.max < 400000) u.set("max", S.max);
    if (S.sizes.length) u.set("size", S.sizes.join(","));
    if (S.rating) u.set("rating", S.rating);
    if (S.tag) u.set("tag", S.tag);
    if (S.sort !== "pop") u.set("sort", S.sort);
    if (S.page > 1) u.set("page", S.page);
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  }

  function render(scroll) {
    const list = filtered(), pages = Math.max(1, Math.ceil(list.length / PER));
    S.page = Math.min(S.page, pages);
    const slice = list.slice((S.page - 1) * PER, S.page * PER);
    const grid = $("#grid");
    grid.className = "grid-products " + (S.view === "list" ? "list" : "cols-3");
    grid.innerHTML = slice.length ? slice.map(p => card(p)).join("")
      : `<div class="empty" style="grid-column:1/-1">${ico("search")}<h3>Không có trang phục phù hợp</h3><p>Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác nhé.</p><button class="btn btn-sm" id="resetAll2">Xoá bộ lọc</button></div>`;
    $("#count").innerHTML = `Hiển thị <b>${slice.length}</b> / <b>${list.length}</b> trang phục`;
    $$(".view-toggle button").forEach(b => b.classList.toggle("active", b.dataset.v === S.view));

    // tiêu đề trang theo danh mục
    $("#shopTitle").textContent = S.cats.length === 1 ? catName(S.cats[0]) : S.q ? `Kết quả cho “${S.q}”` : "Tủ phục trang";
    $("#crumbCat").textContent = S.cats.length === 1 ? catName(S.cats[0]) : "Tất cả";

    // chip bộ lọc đang áp dụng
    const chips = [];
    S.cats.forEach(c => chips.push([`cat:${c}`, catName(c)]));
    if (S.q) chips.push(["q", `“${S.q}”`]);
    if (S.mode !== "all") chips.push(["mode", S.mode === "rent" ? "Cho thuê" : "Có bán"]);
    if (S.max < 400000) chips.push(["max", `≤ ${money(S.max)}/ngày`]);
    S.sizes.forEach(s => chips.push([`size:${s}`, `Size ${s}`]));
    if (S.rating) chips.push(["rating", `${S.rating}★ trở lên`]);
    if (S.tag) chips.push(["tag", { sale: "Giảm giá", new: "Mới về", hot: "Bán chạy" }[S.tag]]);
    $("#activeFilters").innerHTML = chips.map(([k, l]) => `<button class="chip active" data-rm="${k}">${esc(l)} ${ico("x", "sm")}</button>`).join("") +
      (chips.length ? `<button class="chip" id="resetAll">Xoá tất cả</button>` : "");

    // phân trang
    let pg = `<button ${S.page === 1 ? "disabled" : ""} data-p="${S.page - 1}" aria-label="Trang trước">${ico("left", "sm")}</button>`;
    for (let i = 1; i <= pages; i++) pg += `<button class="${i === S.page ? "active" : ""}" data-p="${i}">${i}</button>`;
    pg += `<button ${S.page === pages ? "disabled" : ""} data-p="${S.page + 1}" aria-label="Trang sau">${ico("right", "sm")}</button>`;
    $("#pager").innerHTML = pages > 1 ? pg : "";
    syncURL();
    if (scroll) $("#shopTop").scrollIntoView({ behavior: "smooth" });
  }
  function syncUI() {
    $$("#fCats input").forEach(i => i.checked = S.cats.includes(i.value));
    $$("#fSizes button").forEach(b => b.classList.toggle("active", S.sizes.includes(b.dataset.s)));
    $$("#fMode button").forEach(b => b.classList.toggle("active", b.dataset.m === S.mode));
    $$("#fRating input").forEach(i => i.checked = +i.value === S.rating);
    $$("#fTags button").forEach(b => b.classList.toggle("active", b.dataset.t === S.tag));
    $("#fMax").value = S.max; $("#fMaxTxt").textContent = money(S.max); $("#q").value = S.q;
  }
  const reset = () => { Object.assign(S, { cats: [], q: "", mode: "all", max: 400000, sizes: [], rating: 0, tag: "", page: 1 }); syncUI(); render(); };

  // ---- sự kiện
  $("#fCats").addEventListener("change", () => { S.cats = $$("#fCats input:checked").map(i => i.value); S.page = 1; render(); });
  $("#fMode").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.mode = b.dataset.m; $$("#fMode button").forEach(x => x.classList.toggle("active", x === b)); S.page = 1; render(); });
  $("#fMax").addEventListener("input", e => { S.max = +e.target.value; $("#fMaxTxt").textContent = money(S.max); S.page = 1; render(); });
  $("#fSizes").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; b.classList.toggle("active"); S.sizes = $$("#fSizes .active").map(x => x.dataset.s); S.page = 1; render(); });
  $("#fRating").addEventListener("change", e => { S.rating = +e.target.value; S.page = 1; render(); });
  $("#fTags").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.tag = b.dataset.t; $$("#fTags button").forEach(x => x.classList.toggle("active", x === b)); S.page = 1; render(); });
  $("#sort").addEventListener("change", e => { S.sort = e.target.value; render(); });
  let t; $("#q").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { S.q = e.target.value; S.page = 1; render(); }, 250); });
  $(".view-toggle").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.view = b.dataset.v; store.set("view", S.view); render(); });
  $("#pager").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.disabled) return; S.page = +b.dataset.p; render(true); });
  document.addEventListener("click", e => {
    if (e.target.closest("#resetAll, #resetAll2, #fReset")) return reset();
    const rm = e.target.closest("[data-rm]"); if (!rm) return;
    const [k, v] = rm.dataset.rm.split(":");
    if (k === "cat") S.cats = S.cats.filter(c => c !== v);
    if (k === "size") S.sizes = S.sizes.filter(s => s !== v);
    if (k === "q") { S.q = ""; $("#q").value = ""; }
    if (k === "mode") S.mode = "all";
    if (k === "max") S.max = 400000;
    if (k === "rating") S.rating = 0;
    if (k === "tag") S.tag = "";
    syncUI();
    S.page = 1; render();
  });
  // bộ lọc dạng ngăn kéo trên mobile
  $("#openFilters").onclick = () => $("#filters").classList.add("open");
  $$("[data-close-filters]").forEach(b => b.onclick = () => $("#filters").classList.remove("open"));

  render();
})();
