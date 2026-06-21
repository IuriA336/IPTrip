// ===================================
// IPTrip Currency Switcher
// ===================================

(function () {
    "use strict";

    var STORAGE_KEY = "iptrip_currency";
    var DEFAULT_CURRENCY = "EUR";

    var CURRENCIES = {
        EUR: { symbol: "€",  code: "EUR", rate: 1.0000 },
        USD: { symbol: "$",  code: "USD", rate: 1.0850 },
        GBP: { symbol: "£",  code: "GBP", rate: 0.8570 },
        CHF: { symbol: "Fr", code: "CHF", rate: 0.9650 }
    };

    var currentCurrency = DEFAULT_CURRENCY;

    // ── Persistência ──────────────────────────────────────────────────────────
    function getStoredCurrency() {
        var stored = localStorage.getItem(STORAGE_KEY);
        return CURRENCIES[stored] ? stored : DEFAULT_CURRENCY;
    }

    function setCurrency(code) {
        if (!CURRENCIES[code]) return;
        currentCurrency = code;
        localStorage.setItem(STORAGE_KEY, code);
        updateSwitcherUI();
        document.dispatchEvent(new CustomEvent("currencyChanged", { detail: { currency: code } }));
        convertPagePrices();
    }

    // ── API pública ───────────────────────────────────────────────────────────
    // Converte valor em EUR para a moeda atual e devolve string formatada
    function format(eurValue, decimals) {
        var cur = CURRENCIES[currentCurrency];
        var val = Number(eurValue) * cur.rate;
        var dec = (decimals !== undefined) ? decimals : (val % 1 === 0 ? 0 : 2);
        // Forçar 0 casas decimais em valores grandes (destinos/pacotes)
        if (eurValue >= 100) dec = 0;
        return cur.symbol + "\u00A0" + val.toFixed(dec);
    }

    // Devolve o código actual
    function getCode() { return currentCurrency; }
    function getCur()  { return CURRENCIES[currentCurrency]; }

    window.currency = { format: format, getCode: getCode, getCur: getCur, set: setCurrency };

    // ── Converter preços já no DOM ────────────────────────────────────────────
    // Os elementos com data-eur guardam o valor original em EUR
    function convertPagePrices() {
        document.querySelectorAll("[data-eur]").forEach(function (el) {
            var eur = parseFloat(el.getAttribute("data-eur"));
            if (isNaN(eur)) return;
            el.textContent = format(eur);
        });
    }

    // ── Injetar o dropdown na navbar ─────────────────────────────────────────
    function injectSwitcher() {
        // Não duplicar
        if (document.getElementById("currencySwitcher")) return;

        var langSwitcher = document.getElementById("langSwitcher");
        if (!langSwitcher) return;

        var switcher = document.createElement("div");
        switcher.className = "lang-switcher currency-switcher";
        switcher.id = "currencySwitcher";

        switcher.innerHTML =
            '<button class="lang-switcher-btn nav-btn" id="currencySwitcherBtn" type="button"' +
            ' aria-haspopup="listbox" aria-expanded="false">' +
            '<i class="fas fa-coins"></i>' +
            '<span class="lang-switcher-label" id="currencySwitcherLabel">' + currentCurrency + '</span>' +
            '<i class="fas fa-chevron-down lang-switcher-chevron"></i>' +
            '</button>' +
            '<ul class="lang-switcher-menu" id="currencySwitcherMenu" role="listbox">' +
            '<li role="option"><button type="button" data-cur="EUR" class="lang-option">€ EUR — Euro</button></li>' +
            '<li role="option"><button type="button" data-cur="USD" class="lang-option">$ USD — Dólar</button></li>' +
            '<li role="option"><button type="button" data-cur="GBP" class="lang-option">£ GBP — Libra</button></li>' +
            '<li role="option"><button type="button" data-cur="CHF" class="lang-option">Fr CHF — Franco Suíço</button></li>' +
            '</ul>';

        // Inserir ANTES do lang-switcher
        langSwitcher.parentNode.insertBefore(switcher, langSwitcher);

        // Lógica do botão toggle
        var btn  = document.getElementById("currencySwitcherBtn");
        var menu = document.getElementById("currencySwitcherMenu");

        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var open = switcher.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            // Fechar lang-switcher se estiver aberto
            var ls = document.getElementById("langSwitcher");
            if (ls) ls.classList.remove("open");
        });

        menu.querySelectorAll(".lang-option").forEach(function (opt) {
            opt.addEventListener("click", function (e) {
                e.stopPropagation();
                switcher.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
                setCurrency(opt.getAttribute("data-cur"));
            });
        });

        document.addEventListener("click", function () {
            switcher.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                switcher.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
            }
        });

        updateSwitcherUI();
    }

    function updateSwitcherUI() {
        var label = document.getElementById("currencySwitcherLabel");
        if (label) label.textContent = currentCurrency;

        document.querySelectorAll("#currencySwitcherMenu .lang-option").forEach(function (btn) {
            var active = btn.getAttribute("data-cur") === currentCurrency;
            btn.classList.toggle("active", active);
            btn.setAttribute("aria-selected", active ? "true" : "false");
        });
    }

    // ── Inicialização ─────────────────────────────────────────────────────────
    function init() {
        currentCurrency = getStoredCurrency();
        injectSwitcher();
        convertPagePrices();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
