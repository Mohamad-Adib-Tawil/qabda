(() => {
  "use strict";
  const config = window.INVITATION_CONFIG;
  if (!config) return;
  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function fillContent() {
    const { baby, parents, copy, assets, links } = config;
    document.title = `بشارة مولود — ${baby.nameArabic}`;
    $("celebrantName").textContent = baby.nameArabic;
    $("coverKicker").textContent = copy.kicker;
    $("heroKicker").textContent = copy.kicker;
    $("heroGreet").textContent = `أهلاً بقدوم ${baby.nameArabic}`;
    $("englishName").textContent = baby.nameEnglish;
    $("welcomeText").textContent = copy.welcome;
    $("familyMessage").textContent = copy.familyMessage;
    $("familyNames").textContent = `والداه ${parents.father} و${parents.mother}`;
    $("closingText").textContent = copy.closing;
    $("closingParents").textContent = `${parents.father} و${parents.mother}`;
    $("heroImage").src = assets.heroImage;
    $("babyPhoto").src = assets.babyPhoto;
    $("entrance").poster = assets.videoPoster;
    const items = [{ label: "اسم المولود", value: baby.nameArabic }, { label: "تاريخ الميلاد", value: baby.birthDate }];
    const grid = $("certGrid");
    for (const item of items) {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = item.label;
      dd.textContent = item.value;
      wrap.append(dt, dd);
      grid.append(wrap);
    }
    for (const prayer of copy.prayers) {
      const article = document.createElement("article");
      article.className = "prayerCard";
      const quote = document.createElement("blockquote");
      const link = document.createElement("a");
      quote.textContent = `﴿${prayer.text}﴾`;
      link.href = prayer.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `القرآن الكريم · ${prayer.reference}`;
      article.append(quote, link);
      $("prayerList").append(article);
    }
    $("hadithText").textContent = copy.hadith.text;
    const source = $("hadithSource");
    source.href = copy.hadith.url;
    source.textContent = copy.hadith.attribution;
    if (links.whatsapp) {
      $("contactLink").href = links.whatsapp;
      $("contactBox").hidden = false;
    }
  }

  function renderWishes() {
    const root = $("wishList");
    root.replaceChildren();
    let extra = [];
    try { extra = JSON.parse(localStorage.getItem(config.interaction.guestbookStorageKey) || "[]"); } catch (_) { /* يبدأ دفتر التهاني فارغاً */ }
    [...config.guestbook, ...extra].forEach((wish, index) => {
      const row = document.createElement("article"); row.className = "wish";
      const avatar = document.createElement("span"); avatar.className = "wish-av";
      avatar.style.background = ["#3f88b0", "#e0ac33", "#7ec4e4", "#d29d80", "#a8cfe0"][index % 5];
      avatar.textContent = [...wish.name][0] || "♡";
      const body = document.createElement("div"); body.className = "wish-body";
      const name = document.createElement("p"); name.className = "wish-name"; name.textContent = wish.name;
      const message = document.createElement("p"); message.className = "wish-msg"; message.textContent = wish.message;
      body.append(name, message); row.append(avatar, body); root.append(row);
    });
  }

  function setupWishForm() {
    $("wishForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = $("guestName").value.trim();
      const message = $("guestMessage").value.trim();
      if (!name || !message) return;
      let wishes = [];
      try { wishes = JSON.parse(localStorage.getItem(config.interaction.guestbookStorageKey) || "[]"); } catch (_) { /* replace invalid local data */ }
      wishes.push({ name, message });
      try {
        localStorage.setItem(config.interaction.guestbookStorageKey, JSON.stringify(wishes.slice(-50)));
        event.currentTarget.reset();
        $("formStatus").textContent = "أُضيفت تهنئتك إلى هذا الجهاز.";
        renderWishes();
      } catch (_) {
        $("formStatus").textContent = "تعذّر حفظ التهنئة في هذا المتصفح.";
      }
    });
  }

  function openInvitation() {
    const cover = $("cover");
    if (cover.dataset.open === "true") return;
    cover.dataset.open = "true";
    cover.classList.add("is-flash");
    window.setTimeout(() => {
      cover.classList.add("is-open");
      $("invite").setAttribute("aria-hidden", "false");
      $("heroCap").classList.add("is-in");
      $("celebrantName").classList.add("is-written");
      document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
      makePetals();
      window.setTimeout(() => {
        cover.style.display = "none";
        const video = $("entrance"); video.pause();
      }, 1400);
    }, reducedMotion ? 0 : 500);
  }

  function setupCover() {
    const cover = $("cover"), grip = $("grip"), fill = $("progFill"), hint = $("coverHint"), button = $("openBtn"), video = $("entrance");
    const duration = config.interaction.pressDurationMs;
    let startedAt = 0, frame = 0, active = false, done = false;
    const progress = (now) => {
      if (!active || done) return;
      const ratio = Math.min(1, (now - startedAt) / duration);
      fill.style.width = `${ratio * 100}%`;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const start = Math.min(2.4, video.duration * 0.38);
        const finish = Math.min(video.duration - 0.08, start + 2.35);
        if (finish > start) video.currentTime = start + (finish - start) * ratio;
      }
      if (ratio >= 1) { done = true; active = false; openInvitation(); return; }
      frame = requestAnimationFrame(progress);
    };
    const start = (event) => {
      if (done || active || event.type === "keydown") return;
      event.preventDefault(); active = true; startedAt = performance.now();
      cover.classList.add("is-held"); hint.hidden = false; hint.textContent = "ثبّت إصبعك ولا ترفعه";
      if (video) video.pause();
      frame = requestAnimationFrame(progress);
    };
    const release = () => {
      if (!active || done) return;
      active = false; cancelAnimationFrame(frame); fill.style.width = "0"; cover.classList.remove("is-held");
      hint.hidden = false; hint.textContent = "ارفعت إصبعك مبكراً — ثبّته حتى تنفتح البشارة";
      if (video) { video.currentTime = 0; video.play().catch(() => {}); }
      window.setTimeout(() => { if (!done) hint.textContent = "مدّ إصبعك… واتركه"; }, 2200);
    };
    grip.addEventListener("pointerdown", start);
    grip.addEventListener("pointerup", release);
    grip.addEventListener("pointercancel", release);
    grip.addEventListener("pointerleave", release);
    grip.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); done = true; openInvitation(); }
    });
    button.addEventListener("click", () => { done = true; openInvitation(); });
    window.setTimeout(() => { if (!done) button.hidden = false; }, 10000);
    window.setTimeout(() => { if (!done && hint.hidden) hint.hidden = false; }, 5500);
    video.addEventListener("error", () => { button.hidden = false; });
    video.play().catch(() => { /* الملصق يبقى ظاهراً إن منع المتصفح التشغيل التلقائي */ });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) { target.classList.add("is-visible"); revealObserver.unobserve(target); }
    });
  }, { threshold: 0.12 });

  function makePetals() {
    if (reducedMotion) return;
    const root = $("petals");
    for (let i = 0; i < 14; i++) {
      const petal = document.createElement("span"); petal.className = "petal";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.background = ["#f4cdb4", "#e0ac33", "#dcedf6"][i % 3];
      petal.style.animationDelay = `${Math.random() * 9}s`;
      petal.style.animationDuration = `${9 + Math.random() * 8}s`;
      root.append(petal);
    }
  }

  function setupFog() {
    const wrap = $("fogWrap"), canvas = $("fogCanvas"), context = canvas.getContext("2d");
    if (reducedMotion) { canvas.remove(); $("photoCap").textContent = "صورة المولود"; return; }
    let drawing = false, previous = null, erased = 0, cleared = false;
    const paint = () => {
      const box = wrap.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const ratio = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(box.width * ratio); canvas.height = Math.round(box.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const gradient = context.createLinearGradient(0, 0, 0, box.height);
      gradient.addColorStop(0, "rgba(253,251,247,.97)"); gradient.addColorStop(.5, "rgba(247,244,238,.95)"); gradient.addColorStop(1, "rgba(241,237,230,.97)");
      context.fillStyle = gradient; context.fillRect(0, 0, box.width, box.height);
      for (let i = 0; i < 56; i++) {
        const x = Math.random() * box.width, y = Math.random() * box.height, r = 3 + Math.random() * 10;
        const glow = context.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, "rgba(255,255,255,.5)"); glow.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = glow; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
      }
    };
    const dab = (x, y) => {
      context.globalCompositeOperation = "destination-out";
      const radius = Math.max(24, wrap.clientWidth * .115);
      const edge = context.createRadialGradient(x, y, 0, x, y, radius);
      edge.addColorStop(0, "rgba(0,0,0,1)"); edge.addColorStop(.55, "rgba(0,0,0,.9)"); edge.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = edge; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
      context.globalCompositeOperation = "source-over";
    };
    const clear = () => {
      if (cleared) return;
      cleared = true; canvas.classList.add("is-gone"); $("photoCap").textContent = "أول صورة";
      window.setTimeout(() => canvas.remove(), 900);
    };
    const point = (event) => { const rect = canvas.getBoundingClientRect(); return [event.clientX - rect.left, event.clientY - rect.top]; };
    canvas.addEventListener("pointerdown", (event) => { drawing = true; previous = point(event); canvas.setPointerCapture(event.pointerId); dab(...previous); $("photoCap").classList.add("is-dim"); });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing || cleared) return;
      const next = point(event);
      if (previous) {
        const distance = Math.hypot(next[0] - previous[0], next[1] - previous[1]);
        const steps = Math.max(1, Math.ceil(distance / 12));
        for (let i = 1; i <= steps; i++) dab(previous[0] + (next[0] - previous[0]) * i / steps, previous[1] + (next[1] - previous[1]) * i / steps);
      }
      previous = next;
      if (++erased % 9 === 0) {
        const sample = document.createElement("canvas"); sample.width = 20; sample.height = 25;
        const sampleContext = sample.getContext("2d", { willReadFrequently: true }); sampleContext.drawImage(canvas, 0, 0, 20, 25);
        const pixels = sampleContext.getImageData(0, 0, 20, 25).data; let holes = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < 40) holes++;
        if (holes / 500 > .56) clear();
      }
    });
    const end = () => { drawing = false; previous = null; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    if ($("babyPhoto").complete) paint(); else $("babyPhoto").addEventListener("load", paint, { once: true });
    window.addEventListener("resize", () => { if (!cleared) paint(); }, { passive: true });
    window.setTimeout(clear, 20000);
  }

  fillContent();
  renderWishes();
  setupWishForm();
  setupCover();
  setupFog();
})();
