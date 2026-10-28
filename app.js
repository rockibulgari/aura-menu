(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var byId = {};
  MENU.forEach(function (d) { byId[d.id] = d; });

  var CART_KEY = "aura_cart";
  var USER_KEY = "aura_user";
  var CART_TTL = 24 * 60 * 60 * 1000; // корзина живёт сутки

  // Для показа демо в нерабочее время: добавьте ?demo к адресу сайта
  var DEMO = /[?&]demo\b/.test(location.search);

  function money(n) { return n.toLocaleString("ru-RU") + " ₽"; }

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* ---------- Время работы (по Москве) ---------- */
  function toMin(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function moscowMinutes() {
    var d = new Date();
    var utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
    return (utcMin + 180) % 1440;
  }
  var OPEN = toMin(CAFE.openFrom);              // 11:00
  var ORDERS_TO = toMin(CAFE.ordersTo);         // 23:30
  function canOrder() {
    if (DEMO) return true;
    var m = moscowMinutes();
    return m >= OPEN && m < ORDERS_TO;
  }
  function renderStatus() {
    var m = moscowMinutes();
    var el = $("status"), t = $("statusText");
    el.classList.remove("is-closed");
    if (canOrder()) {
      t.textContent = "Открыто · принимаем заказы до " + CAFE.ordersTo;
    } else if (m >= ORDERS_TO) {
      el.classList.add("is-closed");
      t.textContent = "Заказы на сегодня закончились · завтра с " + CAFE.openFrom;
    } else {
      el.classList.add("is-closed");
      t.textContent = "Сейчас закрыто · откроемся в " + CAFE.openFrom;
    }
    updateOrderBtn();
  }

  /* ---------- Корзина ---------- */
  var cart = {};
  (function loadCart() {
    var saved = store(CART_KEY);
    if (saved && saved.items && Date.now() - saved.ts < CART_TTL) {
      Object.keys(saved.items).forEach(function (id) {
        var q = parseInt(saved.items[id], 10);
        if (byId[id] && q > 0) cart[id] = Math.min(q, 99);
      });
    }
  })();
  function saveCart() { store(CART_KEY, { ts: Date.now(), items: cart }); }
  function count() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0); }
  function total() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id] * byId[id].price; }, 0); }

  var lastRemoved = null, toastTimer = null;

  function setQty(id, q) {
    var before = cart[id] || 0;
    q = Math.max(0, Math.min(99, q));
    if (q === 0) {
      delete cart[id];
      if (before > 0) showUndo(id, before);
    } else {
      cart[id] = q;
    }
    saveCart();
    renderCardCtrl(id);
    renderCartBar(q > before);
    if (!$("sheet").hidden) renderCart();
  }

  function showUndo(id, qty) {
    lastRemoved = { id: id, qty: qty };
    $("toastText").textContent = "«" + byId[id].name + "» удалено";
    $("toast").classList.toggle("on-sheet", !$("sheet").hidden);
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $("toast").hidden = true; lastRemoved = null; }, 5000);
  }
  $("toastBtn").addEventListener("click", function () {
    if (!lastRemoved) return;
    var r = lastRemoved; lastRemoved = null;
    $("toast").hidden = true;
    setQty(r.id, r.qty);
  });

  function stepperHTML(id, q, small) {
    return '<div class="step' + (small ? " step--small" : "") + '">' +
      '<button type="button" data-minus="' + id + '" aria-label="Убрать одну порцию">−</button>' +
      "<b>" + q + "</b>" +
      '<button type="button" data-plus="' + id + '" aria-label="Добавить ещё порцию">+</button></div>';
  }

  /* ---------- Меню ---------- */
  function renderMenu() {
    var tabs = "", html = "";
    CATEGORIES.forEach(function (c, i) {
      var items = MENU.filter(function (d) { return d.cat === c.id; });
      if (!items.length) return;
      tabs += '<button class="tab' + (i === 0 ? " is-active" : "") + '" type="button" data-tab="' + c.id + '">' + c.title + "</button>";
      html += '<section class="cat" id="cat-' + c.id + '"><h2 class="cat__title">' + c.title + '</h2><div class="grid">';
      items.forEach(function (d) {
        html += '<article class="card">' +
          '<img class="card__img" src="' + d.img + '" alt="' + d.name + '" width="800" height="600" loading="lazy" decoding="async">' +
          '<div class="card__body">' +
          '<h3 class="card__name">' + d.name + "</h3>" +
          (d.desc ? '<p class="card__desc">' + d.desc + "</p>" : "") +
          '<div class="card__meta"><span class="card__price">' + money(d.price) + "</span>" +
          (d.portion ? '<span class="card__portion">' + d.portion + "</span>" : "") + "</div>" +
          '<div class="card__ctrl" id="ctrl-' + d.id + '"></div>' +
          "</div></article>";
      });
      html += "</div></section>";
    });
    $("tabs").innerHTML = tabs;
    $("menu").innerHTML = html;
    MENU.forEach(function (d) { renderCardCtrl(d.id); });
  }

  function renderCardCtrl(id) {
    var el = $("ctrl-" + id);
    if (!el) return;
    var q = cart[id] || 0;
    el.innerHTML = q
      ? stepperHTML(id, q, false)
      : '<button class="add" type="button" data-plus="' + id + '">В корзину</button>';
  }

  function renderCartBar(bump) {
    var n = count();
    var bar = $("cartbar");
    bar.hidden = n === 0;
    $("cartCount").textContent = n;
    $("cartSum").textContent = money(total());
    if (bump && n) { bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump"); }
  }

  // Плюс / минус в любом месте страницы
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-plus],[data-minus],[data-tab],[data-close]");
    if (!t) return;
    if (t.dataset.plus) setQty(t.dataset.plus, (cart[t.dataset.plus] || 0) + 1);
    else if (t.dataset.minus) setQty(t.dataset.minus, (cart[t.dataset.minus] || 0) - 1);
    else if (t.dataset.tab) {
      var sec = $("cat-" + t.dataset.tab);
      if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
    } else if (t.hasAttribute("data-close")) closeSheet();
  });

  // Подсветка активной категории при прокрутке
  function watchTabs() {
    if (!("IntersectionObserver" in window)) return;
    var row = $("tabs");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace("cat-", "");
        document.querySelectorAll(".tab").forEach(function (b) {
          var on = b.dataset.tab === id;
          b.classList.toggle("is-active", on);
          // Двигаем только ленту вкладок, страницу не трогаем
          if (on && (b.offsetLeft < row.scrollLeft || b.offsetLeft + b.offsetWidth > row.scrollLeft + row.clientWidth)) {
            row.scrollTo({ left: b.offsetLeft - 16, behavior: "smooth" });
          }
        });
      });
    }, { rootMargin: "-70px 0px -60% 0px" });
    document.querySelectorAll(".cat").forEach(function (s) { io.observe(s); });
  }

  /* ---------- Панель ---------- */
  var VIEWS = ["viewCart", "viewCheckout", "viewDone", "viewThanks"];
  var TITLES = { viewCart: "Корзина", viewCheckout: "Оформление", viewDone: "Почти готово", viewThanks: "Готово" };

  function show(view) {
    VIEWS.forEach(function (v) { $(v).hidden = v !== view; });
    $("sheetTitle").textContent = TITLES[view];
    $("sheetBack").hidden = view !== "viewCheckout" && view !== "viewDone";
    $(view).scrollTop = 0;
  }
  // Кнопка «Назад» в телефоне закрывает панель, а не сайт.
  // Внутри чужой рамки (iframe) историю не трогаем.
  var useHistory = window.top === window;
  function openSheet(view) {
    $("overlay").hidden = false;
    $("sheet").hidden = false;
    document.body.classList.add("lock");
    if (view === "viewCart") renderCart();
    show(view);
    if (useHistory && !(history.state && history.state.sheet)) history.pushState({ sheet: 1 }, "");
  }
  function hideSheet() {
    $("overlay").hidden = true;
    $("sheet").hidden = true;
    $("toast").classList.remove("on-sheet");
    document.body.classList.remove("lock");
  }
  function closeSheet() {
    if (useHistory && history.state && history.state.sheet) history.back(); // popstate закроет панель
    else hideSheet();
  }
  window.addEventListener("popstate", function () { if (!$("sheet").hidden) hideSheet(); });

  $("cartbar").addEventListener("click", function () {
    if (restorePending()) return;
    openSheet("viewCart");
  });
  $("overlay").addEventListener("click", closeSheet);
  $("sheetClose").addEventListener("click", closeSheet);
  $("sheetBack").addEventListener("click", function () {
    if (!$("viewDone").hidden) show("viewCheckout");
    else { renderCart(); show("viewCart"); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("sheet").hidden) closeSheet(); });

  function renderCart() {
    var ids = Object.keys(cart);
    $("cartEmpty").hidden = ids.length > 0;
    $("cartFoot").hidden = ids.length === 0;
    $("cartList").innerHTML = ids.map(function (id) {
      var d = byId[id];
      return '<li class="citem"><img src="' + d.img + '" alt="" width="64" height="64">' +
        '<div><p class="citem__name">' + d.name + (d.portion ? ' <span class="opt">· ' + d.portion + "</span>" : "") + "</p>" +
        '<div class="citem__row">' + stepperHTML(id, cart[id], true) +
        '<span class="citem__sum">' + money(d.price * cart[id]) + "</span></div></div></li>";
    }).join("");
    $("cartTotal").textContent = money(total());
    $("coTotal").textContent = money(total());
    $("closedNote").hidden = canOrder();
    if (!ids.length && !$("viewCheckout").hidden) show("viewCart");
  }

  $("toCheckout").addEventListener("click", function () {
    $("coTotal").textContent = money(total());
    show("viewCheckout");
  });

  /* ---------- Форма ---------- */
  var form = $("viewCheckout");
  $("towns").innerHTML = TOWNS.map(function (t) { return '<option value="' + t + '">'; }).join("");

  var mapUrl = "https://yandex.ru/maps/?text=" + encodeURIComponent("Ингушетия, " + CAFE.address);
  $("mapLink").href = mapUrl;
  $("mapLink2").href = mapUrl;

  function val(name) { return (form.elements[name].value || "").trim(); }
  function radio(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }

  function syncForm() {
    var pickup = radio("method") === "pickup";
    $("deliveryBox").hidden = pickup;
    $("pickupBox").hidden = !pickup;
    $("coHint").textContent = pickup ? "Самовывоз — без доставки" : "Доставка — стоимость скажет менеджер";
    var transfer = radio("pay") === "transfer";
    $("changeBox").hidden = transfer;
    $("transferBox").hidden = !transfer;
  }
  form.addEventListener("change", function (e) {
    if (e.target.name === "method" || e.target.name === "pay") syncForm();
    saveUser();
  });

  // Маска телефона: +7 (999) 123-45-67
  // Первую 7 или 8 считаем кодом страны: «+7…», «8928…», «7928…»
  function phoneDigits(v) {
    var d = v.replace(/\D/g, "");
    if (/^\s*\+7/.test(v) || d[0] === "7" || d[0] === "8") d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(d) {
    if (!d) return "";
    var s = "+7 (" + d.slice(0, 3);
    if (d.length >= 3) s += ") " + d.slice(3, 6);
    if (d.length >= 6) s += "-" + d.slice(6, 8);
    if (d.length >= 8) s += "-" + d.slice(8, 10);
    return s;
  }
  $("fPhone").addEventListener("input", function (e) {
    var el = e.target;
    if (e.inputType && e.inputType.indexOf("delete") === 0) return; // не мешаем стирать
    var d = phoneDigits(el.value);
    // После «8» или «7» оставляем «+7 (», чтобы следующая 8 не считалась кодом снова
    el.value = d ? formatPhone(d) : (/\d/.test(el.value) ? "+7 (" : "");
  });
  $("fPhone").addEventListener("blur", function (e) { e.target.value = formatPhone(phoneDigits(e.target.value)); });
  $("fChange").addEventListener("input", function (e) { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6); });

  // Сброс ошибки, когда человек начал исправлять
  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("is-bad")) setErr(e.target.name, "");
  });

  function setErr(name, msg) {
    var p = form.querySelector('[data-err="' + name + '"]');
    if (p) p.textContent = msg;
    if (form.elements[name]) form.elements[name].classList.toggle("is-bad", !!msg);
  }

  function validate() {
    var bad = [];
    ["name", "phone", "town", "street", "change"].forEach(function (n) { setErr(n, ""); });
    if (val("name").length < 2) bad.push(["name", "Напишите, как к вам обращаться"]);
    if (phoneDigits(val("phone")).length !== 10) bad.push(["phone", "Номер не полный. Пример: +7 (928) 123-45-67"]);
    if (radio("method") === "delivery") {
      if (!val("town")) bad.push(["town", "Укажите город или село"]);
      if (val("street").length < 3) bad.push(["street", "Укажите улицу и номер дома"]);
    }
    if (radio("pay") === "cash" && val("change") && +val("change") < total()) {
      bad.push(["change", "Сумма меньше заказа (" + money(total()) + ")"]);
    }
    bad.forEach(function (b) { setErr(b[0], b[1]); });
    if (bad.length) {
      var first = form.elements[bad[0][0]];
      first.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
    }
    return bad.length === 0;
  }

  // Запоминаем данные клиента (но не корзину)
  var USER_FIELDS = ["name", "phone", "town", "street", "flat"];
  function saveUser() {
    var u = { method: radio("method"), pay: radio("pay") };
    USER_FIELDS.forEach(function (f) { u[f] = val(f); });
    store(USER_KEY, u);
  }
  (function loadUser() {
    var u = store(USER_KEY);
    if (!u) return;
    USER_FIELDS.forEach(function (f) { if (u[f]) form.elements[f].value = u[f]; });
    ["method", "pay"].forEach(function (n) {
      var r = form.querySelector('input[name="' + n + '"][value="' + u[n] + '"]');
      if (r) r.checked = true;
    });
  })();
  form.addEventListener("input", saveUser);

  function updateOrderBtn() {
    var ok = canOrder();
    $("orderBtn").disabled = !ok;
    $("orderBtnText").textContent = ok
      ? "Заказать"
      : "Сейчас закрыто · заказы с " + CAFE.openFrom;
    if ($("closedNote")) $("closedNote").hidden = ok;
  }

  /* ---------- Сообщение в WhatsApp ---------- */
  // Номер: день, месяц, время по Москве и 2 последние цифры телефона клиента
  function orderNumber() {
    var d = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + p(d.getMonth() + 1) + "-" + p(d.getHours()) + p(d.getMinutes()) +
      "-" + phoneDigits(val("phone")).slice(-2);
  }

  // Неотправленный заказ: если клиент вернулся из WhatsApp, снова спрашиваем, отправил ли он
  var PENDING_KEY = "aura_pending";
  var PENDING_TTL = 2 * 60 * 60 * 1000;
  function restorePending() {
    var p = store(PENDING_KEY);
    if (!p || !count() || Date.now() - p.ts > PENDING_TTL) return false;
    $("doneNum").textContent = "Заказ №" + p.num;
    $("waAgain").href = p.url;
    openSheet("viewDone");
    return true;
  }

  function buildMessage(num) {
    var pickup = radio("method") === "pickup";
    var lines = [];
    lines.push("🛒 *НОВЫЙ ЗАКАЗ №" + num + "*");
    lines.push("");
    Object.keys(cart).forEach(function (id) {
      var d = byId[id];
      lines.push("• " + d.name + " × " + cart[id] + " = " + money(d.price * cart[id]));
    });
    lines.push("");
    lines.push("💰 *Сумма: " + money(total()) + "*" + (pickup ? "" : " (без доставки)"));
    lines.push("");
    if (pickup) {
      lines.push("🏃 Самовывоз");
    } else {
      lines.push("🚗 Доставка");
      var addr = val("town") + ", " + val("street") + (val("flat") ? ", " + val("flat") : "");
      lines.push("📍 " + addr);
    }
    if (radio("pay") === "cash") {
      lines.push("💵 Оплата: наличными" + (val("change") ? ", сдача с " + val("change") + " ₽" : ""));
    } else {
      lines.push("💳 Оплата: переводом (пришлите номер для перевода)");
    }
    lines.push("");
    lines.push("👤 " + val("name"));
    lines.push("📞 " + formatPhone(phoneDigits(val("phone"))));
    if (val("comment")) { lines.push(""); lines.push("💬 " + val("comment")); }
    return lines.join("\n");
  }

  var waUrl = "";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!count()) { show("viewCart"); return; }
    if (!canOrder()) { updateOrderBtn(); return; }
    if (!validate()) return;
    saveUser();
    var num = orderNumber();
    waUrl = "https://wa.me/" + CAFE.whatsapp + "?text=" + encodeURIComponent(buildMessage(num));
    $("doneNum").textContent = "Заказ №" + num;
    $("waAgain").href = waUrl;
    store(PENDING_KEY, { num: num, url: waUrl, ts: Date.now() });
    // WhatsApp открывается обычной ссылкой по нажатию — так работает на всех телефонах
    show("viewDone");
  });

  $("sentBtn").addEventListener("click", function () {
    cart = {};
    saveCart();
    store(PENDING_KEY, null);
    MENU.forEach(function (d) { renderCardCtrl(d.id); });
    renderCartBar(false);
    show("viewThanks");
  });

  /* ---------- Старт ---------- */
  renderMenu();
  renderCartBar(false);
  syncForm();
  renderStatus();
  watchTabs();
  setInterval(renderStatus, 60000);
  restorePending();
  // Вернулись из WhatsApp в ту же вкладку (страница не перезагрузилась)
  window.addEventListener("pageshow", function (e) { if (e.persisted && $("sheet").hidden) restorePending(); });
})();
