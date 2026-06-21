// ===================================
// Destinos Page JavaScript
// ===================================

var allDestinations = [];
var lastRenderedAt = 0;
var renderVersion = 0;

document.addEventListener("DOMContentLoaded", function() {
    loadDestinations();
    setupFilters();
    document.addEventListener("languageChanged", function() {
        renderDestinations(allDestinations);
        checkWishlistState(allDestinations, renderVersion);
    });

    document.addEventListener("currencyChanged", function() {
        renderDestinations(allDestinations);
        checkWishlistState(allDestinations, renderVersion);
    });

});


function loadDestinations() {
    fetch(API + "/destinos")
        .then(function(r) { return r.json(); })
        .then(function(destinos) {
            allDestinations = destinos;
            renderDestinations(destinos);
            checkWishlistState(destinos);
        })
        .catch(function(err) {
            console.error("Error:", err);
            showNotification(window.i18n ? i18n.t("notifications.loadDestinationsError") : "Erro ao carregar destinos.", "error");
        });
}


function renderDestinations(destinos) {
    var grid = document.getElementById("destinationsGrid");
    var noResults = document.getElementById("noResults");

    // Atualiza marcador para evitar aplicar wishlist em DOM antigo
    lastRenderedAt = Date.now();
    renderVersion += 1;
    var versionAtCall = renderVersion;

    // Remove referência de DOM antigo rapidamente para evitar inconsistências visuais
    grid.innerHTML = "";

    if (destinos.length === 0) {
        grid.innerHTML = "";
        noResults.style.display = "block";
        noResults.style.padding = "80px 20px";
        return versionAtCall;
    }


    noResults.style.display = "none";

    var fromLabel = window.i18n ? i18n.t("common.from") : "Desde";
    var addWishlist = window.i18n ? i18n.t("common.addToWishlist") : "Adicionar aos Desejos";
    var wishTitle = window.i18n ? i18n.t("common.addToWishlistTitle") : "Adicionar aos desejos";
    var bookNow = window.i18n ? i18n.t("common.bookNow") : "Reservar Agora";

    grid.innerHTML = destinos.map(function(d) {
        var types = (d.tipo || "").split(",").map(function(t) {
            var tag = t.trim();
            var label = window.i18n ? i18n.translateCategory(tag) : tag;
            return '<span class="dest-tag">' + label + '</span>';
        }).join("");

        // Tradução dos monumentos/destaques
        var destaquesList = d.destaques || [];
        var monumentsRaw = "";

        // Garantir que vamos usar destination_id como chave para traduções
        // (backend já devolve destination_id e deve ser único)
        var destinosIndex = d.destination_id != null ? d.destination_id : null;

        if (window.i18n && destinosIndex != null) {
            var idxMon = parseInt(destinosIndex, 10);
            if (!isNaN(idxMon)) {
                var monumentsKey = "destinos.destination" + idxMon + "Monuments";
                var trMon = i18n.t(monumentsKey);
                if (trMon !== monumentsKey) monumentsRaw = trMon;
            }
        }

        var monumentsArr = [];
        if (monumentsRaw) {
            monumentsArr = monumentsRaw.split(",").map(function(s) {
                return s.trim();
            }).filter(Boolean);
        }

        var destaques = (monumentsArr.length ? monumentsArr : destaquesList).map(function(item) {
            var out = item;
            return '<li><i class="fas fa-check-circle"></i> ' + out + '</li>';
        }).join("");

        // Tradução do título/descrição do destino (dinâmica)
        var title = d.nome || "";
        var desc = d.descricao || "";

        if (window.i18n && destinosIndex != null) {
            var idx = parseInt(destinosIndex, 10);
            if (!isNaN(idx)) {
                var titleKey = "destinos.destination" + idx + "Title";
                var descKey = "destinos.destination" + idx + "Desc";

                var tTitle = i18n.t(titleKey);
                var tDesc = i18n.t(descKey);

                if (tTitle !== titleKey) title = tTitle;
                if (tDesc !== descKey) desc = tDesc;
            }
        }

        var destinationId = d.destination_id;

        return '<div class="destination-card-full" data-id="' + destinationId + '" data-continent="' + d.continente + '" data-type="' + d.tipo + '" data-budget="' + d.preco_medio + '">' +
            '<div class="dest-image-full">' +
                '<img src="' + (d.imagem_url || "") + '" alt="' + title + '" loading="lazy" data-destination-id="' + destinationId + '">' +
                '<button class="btn-wishlist" id="wish-' + destinationId + '" onclick="toggleWishlist(' + destinationId + ', this, event)" title="' + wishTitle + '">' +
                    '<i class="far fa-heart"></i>' +
                '</button>' +
            '</div>' +
            '<div class="dest-content-full">' +
                '<div class="dest-header-full">' +
                    '<h3>' + title + '</h3>' +
                '</div>' +
                '<p class="dest-desc-full">' + desc + '</p>' +
                '<div class="dest-tags">' + types + '</div>' +
                '<ul class="dest-highlights">' + destaques + '</ul>' +
                '<div class="dest-footer-full">' +
                    '<div class="dest-price-full">' +
                        '<span class="price-label">' + fromLabel + '</span>' +
                        '<span class="price-value" data-eur="' + Number(d.preco_medio) + '">' + (window.currency ? currency.format(d.preco_medio) : 'EUR ' + Number(d.preco_medio).toFixed(0)) + '</span>' +
                    '</div>' +
                    '<div class="dest-actions">' +
                        '<button class="btn btn-primary btn-sm" onclick="toggleWishlist(' + destinationId + ', document.getElementById(\'wish-' + destinationId + '\'), event)"><i class="fas fa-heart"></i> ' + addWishlist + '</button>' +
                        '<button class="btn btn-accent btn-sm" onclick="bookDestination(' + destinationId + ')"><i class="fas fa-suitcase-rolling"></i> ' + bookNow + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join("");

    return versionAtCall;
}

function checkWishlistState(destinos, expectedVersion) {
    var userId = localStorage.getItem("user_id");
    if (!userId) return;

    // Captura token/versão do render atual; se o DOM mudar durante o fetch, ignora
    var tokenAtCall = lastRenderedAt;
    var versionAtCall = expectedVersion;

    fetch(API + "/dreams/" + userId)

        .then(function(r) { return r.json(); })
        .then(function(dreams) {
            // Se entretanto houve novo render (filtros/idioma), não mexer no DOM antigo
            if (tokenAtCall !== lastRenderedAt) return;
            if (versionAtCall !== expectedVersion) return;

            var dreamIds = dreams.map(function(d) { return d.destination_id; });
            destinos.forEach(function(d) {
                var btn = document.getElementById("wish-" + d.destination_id);

                if (btn && dreamIds.indexOf(d.destination_id) !== -1) {
                    var icon = btn.querySelector("i");
                    if (icon) {
                        icon.classList.remove("far");
                        icon.classList.add("fas");
                    }
                    btn.classList.add("active");
                }
            });
        })
        .catch(function() {});
}

function setupFilters() {
    var filters = ["continentFilter", "typeFilter", "budgetFilter", "searchFilter"];
    filters.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("input", applyFilters);
    });
}

function applyFilters() {
    var continent = document.getElementById("continentFilter").value;
    var type = document.getElementById("typeFilter").value;
    var budget = document.getElementById("budgetFilter").value;
    var search = document.getElementById("searchFilter").value.toLowerCase();

    var filtered = allDestinations.filter(function(d) {
        if (continent !== "all" && d.continente !== continent) return false;
        if (type !== "all" && (d.tipo || "").indexOf(type) === -1) return false;
        if (budget !== "all") {
            var p = d.preco_medio;
            if (budget === "low" && p > 1500) return false;
            if (budget === "medium" && (p < 1500 || p > 3000)) return false;
            if (budget === "high" && (p < 3000 || p > 5000)) return false;
            if (budget === "premium" && p < 5000) return false;
        }
        if (search && (d.nome + " " + d.pais + " " + d.descricao).toLowerCase().indexOf(search) === -1) return false;
        return true;
    });

    renderDestinations(filtered);
    // Se o usuário mexer nos filtros rapidamente, o renderVersion garante que só o último render atualiza o DOM.
    checkWishlistState(filtered, renderVersion);
}


