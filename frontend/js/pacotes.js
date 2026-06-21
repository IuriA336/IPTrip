// ===================================
// Pacotes Page JavaScript
// ===================================

var allPackages = [];

document.addEventListener("DOMContentLoaded", function() {
    loadPackages();
    setupCategoryTabs();
    document.addEventListener("languageChanged", function() {
        applyPackageFilters();
    });

    document.addEventListener("currencyChanged", function() {
        applyPackageFilters();
    });
});

function loadPackages() {
    fetch(API + "/pacotes")
        .then(function(r) { return r.json(); })
        .then(function(pacotes) {
            allPackages = pacotes;
            renderPackages(pacotes);
        })
        .catch(function(err) {
            console.error("Error:", err);
            showNotification(window.i18n ? i18n.t("notifications.loadPackagesError") : "Erro ao carregar pacotes.", "error");
        });
}

function renderPackages(pacotes) {
    var grid = document.getElementById("packagesGrid");
    if (!grid) return;

    var fromLabel = window.i18n ? i18n.t("common.from") : "Desde";
    var perPerson = window.i18n ? i18n.t("common.perPerson") : "/ pessoa";
    var nights = window.i18n ? i18n.t("common.nights") : "noites";
    var bookNow = window.i18n ? i18n.t("common.bookNow") : "Reservar Agora";

    grid.innerHTML = pacotes.map(function(rawP) {
        var p = translatePackage(rawP);

        var items = (p.itens_incluidos || []).map(function(i) {
            return '<li><i class="fas fa-check"></i> ' + i + '</li>';
        }).join("");

        var catLabel = window.i18n ? i18n.translateCategory(p.categoria) : (p.categoria || "");

        return '<div class="package-card-full" data-category="' + (p.categoria || "") + '">' +
            '<div class="pkg-image-full">' +
                '<img src="' + (p.imagem_url || "") + '" alt="' + p.nome + '" loading="lazy">' +
                '<div class="pkg-badges">' +
                    '<span class="pkg-duration"><i class="fas fa-clock"></i> ' + p.duracao + ' ' + nights + '</span>' +
                    '<span class="pkg-category-badge">' + catLabel + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="pkg-content-full">' +
                '<h3>' + p.nome + '</h3>' +
                '<p class="pkg-destination"><i class="fas fa-map-marker-alt"></i> ' + (p.destino_principal || "") + '</p>' +
                '<p class="pkg-desc">' + (p.descricao || "") + '</p>' +
                '<ul class="pkg-items-full">' + items + '</ul>' +
                '<div class="pkg-footer-full">' +
                    '<div class="pkg-price-full">' +
                        '<span class="price-label">' + fromLabel + '</span>' +
                        '<span class="price-value" data-eur="' + Number(p.preco) + '">' + (window.currency ? currency.format(p.preco) : 'EUR ' + Number(p.preco).toFixed(0)) + '</span>' +
                        '<span class="price-person">' + perPerson + '</span>' +
                    '</div>' +
                    '<button class="btn btn-primary" onclick="bookPackage(' + p.package_id + ')">' + bookNow + '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join("");
}

function setupCategoryTabs() {
    var tabs = document.querySelectorAll(".category-tab");
    tabs.forEach(function(tab) {
        tab.addEventListener("click", function() {
            var category = tab.dataset.category;

            tabs.forEach(function(t) { t.classList.remove("active"); });
            tab.classList.add("active");

            applyPackageFilters();
        });
    });

    // Search filter for packages
    var sf = document.getElementById("searchFilterPacotes");
    if (sf) {
        sf.addEventListener("input", applyPackageFilters);
    }
}

function applyPackageFilters() {
    var activeTab = document.querySelector(".category-tab.active");
    var category = activeTab ? activeTab.dataset.category : "all";
    var sf = document.getElementById("searchFilterPacotes");
    var query = sf ? sf.value.toLowerCase().trim() : "";

    var filtered = allPackages.filter(function(rawP) {
        // Filter by category tab
        if (category !== "all" && rawP.categoria !== category) return false;

        // Filter by search text (searches in translated fields)
        if (query) {
            var p = translatePackage(rawP);
            var haystack = normalize(
                (p.nome || "") + " " +
                (p.descricao || "") + " " +
                (p.destino_principal || "") + " " +
                (p.categoria || "") + " " +
                (p.itens_incluidos || []).join(" ")
            );
            if (!haystack.includes(normalize(query))) return false;
        }

        return true;
    });

    renderPackages(filtered);

    // Show/hide no-results
    var noRes = document.getElementById("noResultsPacotes");
    if (noRes) noRes.style.display = filtered.length === 0 ? "block" : "none";
}

function normalize(str) {
    if (!str) return "";
    return str.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
