// ===================================
// i18n - IPTrip Language Switcher
// ===================================

(function() {
    var STORAGE_KEY = "iptrip_lang";
    var DEFAULT_LANG = "pt";
    var SUPPORTED = ["pt", "en", "fr", "es"];
    var LANG_HTML = { pt: "pt-PT", en: "en", fr: "fr", es: "es" };
    var LANG_SHORT = { pt: "PT", en: "EN", fr: "FR", es: "ES" };
    var DATE_LOCALE = { pt: "pt-PT", en: "en-GB", fr: "fr-FR", es: "es-ES" };

    var currentLang = DEFAULT_LANG;
    var translations = {};
    var ready = false;

    function getStoredLang() {
        var stored = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED.indexOf(stored) >= 0 ? stored : DEFAULT_LANG;
    }

    function t(key) {
        var parts = key.split(".");
        var value = translations;
        for (var i = 0; i < parts.length; i++) {
            if (!value || typeof value !== "object") return key;
            value = value[parts[i]];
        }
        return typeof value === "string" ? value : key;
    }

    function tf(key, vars) {
        var str = t(key);
        if (!vars) return str;
        Object.keys(vars).forEach(function(k) {
            str = str.replace("{" + k + "}", vars[k]);
        });
        return str;
    }

    function getDateLocale() {
        return DATE_LOCALE[currentLang] || "pt-PT";
    }

    function translateCategory(cat) {
        if (!cat) return "";
        return t("categories." + cat) !== "categories." + cat ? t("categories." + cat) : cat;
    }

    function translateContinent(cont) {
        if (!cont) return "";
        return t("continents." + cont) !== "continents." + cont ? t("continents." + cont) : cont;
    }

    function translateStatus(status) {
        if (!status) return "";
        var map = {
            pendente: "dashboard.statusPending",
            confirmada: "dashboard.statusConfirmed",
            confirmado: "dashboard.statusConfirmed",
            cancelada: "dashboard.statusCancelled",
            cancelado: "dashboard.statusCancelled"
        };
        var key = map[status.toLowerCase()];
        return key ? t(key) : status;
    }

    function applyTranslations() {
        document.querySelectorAll("[data-i18n]").forEach(function(el) {
            if (el.id === "clientNavLabel" && localStorage.getItem("user_id")) return;
            if (el.id === "clientName" && localStorage.getItem("user_id")) return;
            if (el.classList.contains("client-name") && el.textContent && localStorage.getItem("user_name")) return;
            el.textContent = t(el.getAttribute("data-i18n"));
        });

        document.querySelectorAll("[data-i18n-title]").forEach(function(el) {
            el.title = t(el.getAttribute("data-i18n-title"));
            if (el.id === "langSwitcherBtn") {
                el.setAttribute("aria-label", t(el.getAttribute("data-i18n-title")));
            }
        });

        document.querySelectorAll("[data-i18n-html]").forEach(function(el) {
            el.innerHTML = t(el.getAttribute("data-i18n-html"));
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
            el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
        });

        var titleKey = document.documentElement.getAttribute("data-i18n-title");
        if (titleKey) document.title = t(titleKey);

        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.hasAttribute("data-i18n-content")) {
            metaDesc.content = t(metaDesc.getAttribute("data-i18n-content"));
        }

        document.documentElement.lang = LANG_HTML[currentLang] || currentLang;
        updateLangSwitcherUI();

        document.dispatchEvent(new CustomEvent("languageChanged", {
            detail: { lang: currentLang }
        }));
    }

    function updateLangSwitcherUI() {
        var label = document.getElementById("langSwitcherLabel");
        if (label) label.textContent = LANG_SHORT[currentLang];

        document.querySelectorAll(".lang-option").forEach(function(btn) {
            btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
            btn.setAttribute("aria-selected", btn.getAttribute("data-lang") === currentLang ? "true" : "false");
        });
    }

    function setLang(lang) {
        if (SUPPORTED.indexOf(lang) < 0) return Promise.resolve();

        return fetch("locales/" + lang + ".json")
            .then(function(r) {
                if (!r.ok) throw new Error("Locale not found");
                return r.json();
            })
            .then(function(data) {
                currentLang = lang;
                translations = data;
                localStorage.setItem(STORAGE_KEY, lang);
                applyTranslations();
                ready = true;
                document.dispatchEvent(new CustomEvent("i18nReady", {
                    detail: { lang: currentLang }
                }));
            })
            .catch(function(err) {
                console.error("i18n error:", err);
                if (lang !== DEFAULT_LANG) return setLang(DEFAULT_LANG);
            });
    }

    function initLangSwitcher() {
        var switcher = document.getElementById("langSwitcher");
        var btn = document.getElementById("langSwitcherBtn");
        var menu = document.getElementById("langSwitcherMenu");
        if (!switcher || !btn || !menu) return;

        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            var open = switcher.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
        });

        menu.querySelectorAll(".lang-option").forEach(function(opt) {
            opt.addEventListener("click", function(e) {
                e.stopPropagation();
                switcher.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
                setLang(opt.getAttribute("data-lang"));
            });
        });

        document.addEventListener("click", function() {
            switcher.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        });

        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                switcher.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
            }
        });
    }

    function init() {
        initLangSwitcher();
        setLang(getStoredLang());
    }

    window.i18n = {
        t: t,
        tf: tf,
        setLang: setLang,
        getLang: function() { return currentLang; },
        getDateLocale: getDateLocale,
        translateCategory: translateCategory,
        translateContinent: translateContinent,
        translateStatus: translateStatus,
        isReady: function() { return ready; }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
