/* =========================================================
   KAGAMI COSPLAY – effects.js
   Màn nhung mở đầu · thanh tiến trình cuộn · header ẩn/hiện
   Banner trượt toàn màn hình · chữ bay từng ký tự · hộp thông báo
   Ghép ảnh cắt dán + parallax · combo kéo ngang · thẻ nghiêng 3D
   Lightbox · nút hút nam châm · chuyển trang mượt
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- 1. Màn nhung mở đầu ---------- */
  const root = document.documentElement;
  if (root.classList.contains("show-curtain")) {
    const open = () => {
      root.classList.add("curtain-open"); ss.set("kagami_curtain", "1");
      setTimeout(() => root.classList.remove("show-curtain", "curtain-open"), 1700);
    };
    if (document.readyState === "complete") setTimeout(open, 500);
    else { addEventListener("load", () => setTimeout(open, 300)); setTimeout(open, 2600); }
  }

  /* ---------- 2. Thanh tiến trình + header ẩn khi cuộn xuống ---------- */
  const bar = document.createElement("div"); bar.className = "scroll-progress"; document.body.appendChild(bar);
  const header = $(".header");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (header) {
      if (header.classList.contains("overlay")) header.classList.toggle("stuck", y > 140);
      const down = y > lastY + 4, up = y < lastY - 4;
      if (down && y > 420 && !$(".drawer.open")) header.classList.add("hide");
      if (up || y < 200) header.classList.remove("hide");
    }
    lastY = y; parallax(); ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- 3. Tách chữ để bay lên từng ký tự ---------- */
  function split(el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = 1;
    let i = 0;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w =>
      `<span class="w"><span class="clip">${[...w].map(c => `<span class="c" style="--i:${i++}">${c}</span>`).join("")}</span></span>`).join(" ");
  }
  $$("[data-split]").forEach(split);

  /* ---------- 4. Banner trượt toàn màn hình ---------- */
  const hs = $("#heroSlider");
  if (hs) {
    const slides = $$(".hs-slide", hs), bars = $$(".hs-bars button", hs), DUR = 7000;
    let cur = 0, timer = null, busy = false;
    hs.style.setProperty("--dur", DUR + "ms");
    const setUI = () => {
      bars.forEach((b, i) => { b.classList.toggle("done", i < cur); b.classList.remove("on"); });
      void hs.offsetWidth; // khởi động lại hiệu ứng thanh tiến trình
      bars[cur] && bars[cur].classList.add("on");
      const c = $(".hs-count b", hs); if (c) c.textContent = String(cur + 1).padStart(2, "0");
    };
    function go(n, back = false) {
      if (busy || n === cur) return; busy = true;
      const from = slides[cur], to = slides[(n + slides.length) % slides.length];
      cur = (n + slides.length) % slides.length;
      from.classList.remove("active"); from.classList.add("leaving");
      to.classList.add("entering"); to.classList.toggle("back", back);
      setUI();
      setTimeout(() => { from.classList.remove("leaving"); to.classList.remove("entering", "back"); to.classList.add("active"); busy = false; }, reduce ? 50 : 1150);
      restart();
    }
    const restart = () => { clearTimeout(timer); if (!hs.classList.contains("paused")) timer = setTimeout(() => go(cur + 1), DUR); };
    $(".hs-next", hs).onclick = () => go(cur + 1);
    $(".hs-prev", hs).onclick = () => go(cur - 1, true);
    bars.forEach((b, i) => b.onclick = () => go(i, i < cur));
    hs.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { hs.classList.add("paused"); clearTimeout(timer); } });
    hs.addEventListener("pointerleave", () => { hs.classList.remove("paused"); restart(); });
    document.addEventListener("visibilitychange", () => document.hidden ? clearTimeout(timer) : restart());
    document.addEventListener("keydown", e => { if (scrollY > hs.offsetHeight) return; if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1, true); });
    let sx = null; // vuốt trên điện thoại
    hs.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    hs.addEventListener("touchend", e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) dx < 0 ? go(cur + 1) : go(cur - 1, true); sx = null; });
    setUI(); restart();

    // hộp thông báo giờ mở cửa
    const nt = $(".hs-notice", hs);
    if (nt && !ss.get("kagami_notice")) {
      setTimeout(() => nt.classList.add("show"), root.classList.contains("show-curtain") ? 2400 : 1200);
      $(".n-close", nt).onclick = () => { nt.classList.remove("show"); ss.set("kagami_notice", "1"); };
      setTimeout(() => { nt.classList.remove("show"); }, 16000);
    }
  }

  /* ---------- 5. Ghép ảnh cắt dán: xuất hiện + parallax ---------- */
  const collage = $("#collage"), pieces = collage ? $$(".piece .inner", collage) : [];
  if (collage) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { collage.classList.add("in"); io.disconnect(); } }), { threshold: .2 });
    io.observe(collage);
  }
  function parallax() {
    if (reduce) return;
    if (pieces.length) {
      const r = collage.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        const p = (r.top + r.height / 2 - innerHeight / 2);
        pieces.forEach(el => el.style.setProperty("--py", (p * -(+el.parentElement.dataset.speed || .1)).toFixed(1) + "px"));
        const sun = $(".sun", collage); if (sun) sun.style.transform = `translateY(${(p * .25).toFixed(1)}px)`;
      }
    }
    $$(".page-hero.photo > img").forEach(img => { if (scrollY < 800) img.style.translate = `0 ${(scrollY * .3).toFixed(1)}px`; });
  }

  /* ---------- 6. Kéo ngang bằng chuột (combo, đánh giá) ---------- */
  $$(".drag-track").forEach(tr => {
    let down = false, x0 = 0, s0 = 0, moved = false;
    tr.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = tr.scrollLeft; });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { moved = true; tr.classList.add("dragging"); } tr.scrollLeft = s0 - dx; });
    addEventListener("pointerup", () => { if (!down) return; down = false; setTimeout(() => tr.classList.remove("dragging"), 0); });
    tr.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });
  $$("[data-scroll-target]").forEach(b => b.onclick = () => {
    const tr = $(b.dataset.scrollTarget); const card = tr.firstElementChild;
    tr.scrollBy({ left: (card ? card.offsetWidth + 18 : 300) * (+b.dataset.dir || 1), behavior: "smooth" });
  });

  /* ---------- 7. Thẻ sản phẩm nghiêng 3D ---------- */
  if (fine && !reduce) {
    let active = null;
    document.addEventListener("pointermove", e => {
      const c = e.target.closest && e.target.closest(".p-card");
      if (active && active !== c) { active.style.transform = ""; active.classList.remove("tilting"); active = null; }
      if (!c) return;
      if (!c.querySelector(".shine")) c.insertAdjacentHTML("beforeend", '<span class="shine"></span>');
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.classList.add("tilting"); active = c;
      c.style.transform = `perspective(900px) rotateX(${((.5 - y) * 7).toFixed(2)}deg) rotateY(${((x - .5) * 8).toFixed(2)}deg) translateY(-6px)`;
      c.style.setProperty("--sx", x * 100 + "%"); c.style.setProperty("--sy", y * 100 + "%");
    });
    document.addEventListener("pointerleave", () => { if (active) { active.style.transform = ""; active = null; } });
  }
  // ảnh đã tải xong thì tắt hiệu ứng shimmer
  document.addEventListener("load", e => { if (e.target.tagName === "IMG") e.target.classList.add("loaded"); }, true);
  $$("img").forEach(i => { if (i.complete && i.naturalWidth) i.classList.add("loaded"); });

  /* ---------- 8. Lightbox xem ảnh lớn ---------- */
  let lb, lbList = [], lbI = 0;
  function lightbox(list, i = 0, cap = "") {
    if (!lb) {
      lb = document.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Xem ảnh");
      lb.innerHTML = `<button class="lb-close" aria-label="Đóng">${K.ico("x")}</button><button class="lb-btn lb-prev" aria-label="Ảnh trước">${K.ico("left")}</button><img alt=""><button class="lb-btn lb-next" aria-label="Ảnh sau">${K.ico("right")}</button><div class="lb-cap"></div>`;
      document.body.appendChild(lb);
      lb.addEventListener("click", e => {
        if (e.target.closest(".lb-prev")) show(lbI - 1); else if (e.target.closest(".lb-next")) show(lbI + 1);
        else if (e.target === lb || e.target.closest(".lb-close")) close();
      });
      document.addEventListener("keydown", e => { if (!lb.classList.contains("open")) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(lbI + 1); if (e.key === "ArrowLeft") show(lbI - 1); });
    }
    lbList = list; lb.querySelector(".lb-cap").textContent = cap; show(i);
    lb.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function show(i) { lbI = (i + lbList.length) % lbList.length; K.setImg(lb.querySelector("img"), lbList[lbI]); $$(".lb-btn", lb).forEach(b => b.hidden = lbList.length < 2); }
  function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-lightbox]"); if (!t) return;
    e.preventDefault();
    const group = $$(`[data-lightbox="${t.dataset.lightbox}"]`);
    lightbox(group.map(g => g.dataset.key), group.indexOf(t), t.dataset.cap || "");
  });

  /* ---------- 9. Thêm combo vào giỏ ---------- */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-combo]"); if (!b) return;
    e.preventDefault(); K.Cart.add({ id: b.dataset.combo, mode: "rent", qty: 1, days: 1 }); K.openMini();
  });

  /* ---------- 10. Nút nam châm ---------- */
  if (fine && !reduce) $$(".magnetic").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener("pointerleave", () => b.style.transform = "");
  });

  /* ---------- 11. Chuyển trang mượt ---------- */
  if (!reduce) document.addEventListener("click", e => {
    const a = e.target.closest("a[href]"); if (!a || e.defaultPrevented) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download") || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    if (!/\.html(\?|#|$)/.test(href) || /^[a-z]+:/i.test(href)) return;
    if (href.split("#")[0] === location.pathname.split("/").pop() + location.search && href.includes("#")) return;
    e.preventDefault(); document.body.classList.add("leaving"); setTimeout(() => { location.href = href; }, 220);
  });
  addEventListener("pageshow", e => { if (e.persisted) document.body.classList.remove("leaving"); });

  onScroll();
  window.KFX = { lightbox, split };
})();
