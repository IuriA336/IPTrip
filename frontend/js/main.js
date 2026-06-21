// ===================================
// Main JavaScript - IPTrip
// ===================================

const API = window.location.origin + "/api";

// ===============================
// NOTIFICATION SYSTEM
// ===============================
function showNotification(message, type) {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

    const notif = document.createElement("div");
    notif.className = "notification notification-" + type;

    const icons = { success: "check-circle", error: "exclamation-circle", info: "info-circle" };
    notif.innerHTML =
        '<i class="fas fa-' + (icons[type] || "info-circle") + '"></i>' +
        '<span>' + message + '</span>' +
        '<button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';

    container.appendChild(notif);
    setTimeout(function() { notif.classList.add("show"); }, 10);
    setTimeout(function() {
        notif.classList.remove("show");
        setTimeout(function() { notif.remove(); }, 300);
    }, 4000);
}

window.showNotification = showNotification;

// ===============================
// NAVIGATION
// ===============================
document.addEventListener("DOMContentLoaded", function() {
    var header = document.getElementById("header");
    var hamburger = document.getElementById("hamburger");
    var navMenu = document.getElementById("navMenu");

    window.addEventListener("scroll", function() {
        if (window.scrollY > 80) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
    });

    if (hamburger) {
        hamburger.addEventListener("click", function() {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }

    updateNavState();
    document.addEventListener("languageChanged", function() {
        updateNavState();
        if (document.getElementById("homeDestinations")) loadHomeDestinations();
        if (document.getElementById("homePackages")) loadHomePackages();
    });
    document.addEventListener("currencyChanged", function() {
        if (document.getElementById("homeDestinations")) loadHomeDestinations();
        if (document.getElementById("homePackages")) loadHomePackages();
    });
    document.addEventListener("i18nReady", updateNavState);

    if (document.getElementById("homeDestinations")) loadHomeDestinations();
    if (document.getElementById("homePackages")) loadHomePackages();

    updateWishlistCount();
});

function updateNavState() {
    var userId = localStorage.getItem("user_id");
    var userName = localStorage.getItem("user_name");
    var label = document.getElementById("clientNavLabel");
    var btn = document.getElementById("clientNavBtn");

    if (userId && label && btn) {
        label.textContent = userName || (window.i18n ? i18n.t("nav.dashboard") : "Dashboard");
        btn.href = "dashboard.html";
    } else if (label && btn) {
        label.textContent = window.i18n ? i18n.t("nav.login") : "Entrar";
        btn.href = "cliente.html";
    }
}

function updateWishlistCount() {
    var userId = localStorage.getItem("user_id");
    var badge = document.getElementById("wishlistCount");
    if (!userId || !badge) return;

    fetch(API + "/dreams/" + userId)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.length > 0) {
                badge.textContent = data.length;
                badge.style.display = "flex";
            } else {
                badge.style.display = "none";
            }
        })
        .catch(function() {});
}

function loadHomeDestinations() {
    fetch(API + "/destinos")
        .then(function(r) { return r.json(); })
        .then(function(destinos) {
            var grid = document.getElementById("homeDestinations");
            var top6 = destinos.slice(0, 6);
            grid.innerHTML = top6.map(function(d) {
                return destinationCard(d);
            }).join("");
        })
        .catch(function(err) {
            console.error("Error loading destinations:", err);
        });
}

function destinationCard(d) {
    var types = (d.tipo || "").split(",").map(function(t) {
        var tag = t.trim();
        var label = window.i18n ? i18n.translateCategory(tag) : tag;
        return '<span class="dest-tag">' + label + '</span>';
    }).join("");

    var fromLabel = window.i18n ? i18n.t("common.from") : "Desde";
    var seeMore = window.i18n ? i18n.t("common.seeMore") : "Ver Mais";
    var wishTitle = window.i18n ? i18n.t("common.addToWishlistTitle") : "Adicionar aos desejos";

    // Fallbacks (sem tradução)
    var title = d.nome || "";
    var desc = d.descricao || "";

    // Tradução de título/descrição do destino
    // O backend /api/destinos atualmente não devolve destination_index.
    // Portanto fazemos fallback por destination_id (no seed costuma ser 1..12).

    var destinosIndex = d.destination_index || d.index || null;
    if (!destinosIndex && d.destination_id != null) {
        destinosIndex = d.destination_id;
    }

    if (destinosIndex != null) {
        destinosIndex = parseInt(destinosIndex, 10);
        if (isNaN(destinosIndex)) destinosIndex = null;
    }

    if (destinosIndex && window.i18n) {
        var titleKey = "destinos.destination" + destinosIndex + "Title";
        var descKey = "destinos.destination" + destinosIndex + "Desc";

        var tTitle = i18n.t(titleKey);
        var tDesc = i18n.t(descKey);

        // Se a chave existir no JSON, t() retorna um valor diferente da própria chave
        if (tTitle !== titleKey) title = tTitle;
        if (tDesc !== descKey) desc = tDesc;
    }

    return '<div class="destination-card" data-id="' + d.destination_id + '">' +

        '<div class="dest-image">' +
            '<img src="' + (d.imagem_url || "") + '" alt="' + title + '" loading="lazy">' +
            '<div class="dest-overlay">' +
                '<button class="btn-wishlist" onclick="toggleWishlist(' + d.destination_id + ', this, event)" title="' + wishTitle + '">' +
                    '<i class="far fa-heart"></i>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div class="dest-content">' +
            '<div class="dest-header">' +
                '<h3>' + title + '</h3>' +
            '</div>' +
            '<p class="dest-description">' + desc.substring(0, 100) + '...</p>' +
            '<div class="dest-tags">' + types + '</div>' +
            '<div class="dest-footer">' +
                '<div class="dest-price">' +
                    '<span class="price-label">' + fromLabel + '</span>' +
                    '<span class="price-value" data-eur="' + Number(d.preco_medio) + '">' + (window.currency ? currency.format(d.preco_medio) : 'EUR ' + Number(d.preco_medio).toFixed(0)) + '</span>' +
                '</div>' +
                '<a href="confirmacao.html?type=destino&id=' + d.destination_id + '" class="btn btn-sm btn-outline">' + seeMore + '</a>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function loadHomePackages() {
    fetch(API + "/pacotes")
        .then(function(r) { return r.json(); })
        .then(function(pacotes) {
            var grid = document.getElementById("homePackages");
            var top4 = pacotes.slice(0, 4);
            grid.innerHTML = top4.map(function(p) {
                return packageCard(p);
            }).join("");
        })
        .catch(function(err) {
            console.error("Error loading packages:", err);
        });
}

function packageCard(rawP) {
    var p = translatePackage(rawP);
    var items = (p.itens_incluidos || []).slice(0, 3).map(function(i) {
        return '<li><i class="fas fa-check"></i> ' + i + '</li>';
    }).join("");

    var fromLabel = window.i18n ? i18n.t("common.from") : "Desde";
    var nights = window.i18n ? i18n.t("common.nights") : "noites";
    var book = window.i18n ? i18n.t("common.book") : "Reservar";
    var catLabel = window.i18n ? i18n.translateCategory(p.categoria) : (p.categoria || "");

    return '<div class="package-card">' +
        '<div class="pkg-image">' +
            '<img src="' + (p.imagem_url || "") + '" alt="' + p.nome + '" loading="lazy">' +
            '<span class="pkg-duration"><i class="fas fa-clock"></i> ' + p.duracao + ' ' + nights + '</span>' +
            '<span class="pkg-category">' + catLabel + '</span>' +
        '</div>' +
        '<div class="pkg-content">' +
            '<h3>' + p.nome + '</h3>' +
            '<p>' + (p.descricao || "").substring(0, 120) + '...</p>' +
            '<ul class="pkg-items">' + items + '</ul>' +
            '<div class="pkg-footer">' +
                '<div class="pkg-price">' +
                    '<span class="price-label">' + fromLabel + '</span>' +
                    '<span class="price-value" data-eur="' + Number(p.preco) + '">' + (window.currency ? currency.format(p.preco) : 'EUR ' + Number(p.preco).toFixed(0)) + '</span>' +
                '</div>' +
                '<a href="confirmacao.html?type=pacote&id=' + p.package_id + '" class="btn btn-sm btn-primary">' + book + '</a>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function toggleWishlist(destinationId, btn, event) {
    if (event) event.stopPropagation();

    var userId = localStorage.getItem("user_id");
    if (!userId) {
        showNotification(window.i18n ? i18n.t("notifications.loginForWishlist") : "Faca login para adicionar destinos a sua lista de desejos!", "info");
        setTimeout(function() { window.location.href = "cliente.html"; }, 1500);
        return;
    }

    var icon = btn.querySelector("i");
    var isActive = icon.classList.contains("fas");

    if (isActive) {
        fetch(API + "/dreams/check/" + userId + "/" + destinationId)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.dream_id) {
                    return fetch(API + "/dreams/delete/" + data.dream_id, { method: "DELETE" });
                }
            })
            .then(function() {
                icon.classList.remove("fas");
                icon.classList.add("far");
                btn.classList.remove("active");
                showNotification(window.i18n ? i18n.t("notifications.removedFromWishlist") : "Removido da lista de desejos!", "info");
                updateWishlistCount();
            })
            .catch(function() {
                showNotification(window.i18n ? i18n.t("notifications.removeError") : "Erro ao remover.", "error");
            });
    } else {
        fetch(API + "/dreams/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: parseInt(userId), destination_id: destinationId })
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status === "ok") {
                    icon.classList.remove("far");
                    icon.classList.add("fas");
                    btn.classList.add("active");
                    showNotification(window.i18n ? i18n.t("notifications.addedToWishlist") : "Adicionado a sua lista de desejos!", "success");
                    updateWishlistCount();
                } else {
                    showNotification(data.message || (window.i18n ? i18n.t("common.error") : "Erro"), "error");
                }
            })
            .catch(function() {
                showNotification(window.i18n ? i18n.t("notifications.addError") : "Erro ao adicionar.", "error");
            });
    }
}

window.toggleWishlist = toggleWishlist;

// ===============================
// PACKAGE TRANSLATION HELPERS (compartilhado entre main.js e pacotes.js)
// ===============================

// Mapeia o nome (PT, vindo do backend) para o indice 1-8 usado nas chaves
// de traducao "pacotes.packageNName" / "packageNDesc" / "packageNItemX".
var PACKAGE_NAME_TO_INDEX = {
    "Romance em Paris": 1,
    "Lua de Mel nas Maldivas": 2,
    "Aventura em Toquio": 3,
    "New York Explorer": 4,
    "Praias de Cancun": 5,
    "Dubai Luxury": 6,
    "Roma Classica": 7,
    "Bali Espiritual": 8
};

// Mapeia o destino_principal (PT, vindo do backend) para o destination_id
// real, reaproveitando as traducoes de "destinos.destinationNTitle".
var PACKAGE_DESTINO_TO_ID = {
    "Paris": 1,
    "Maldivas": 2,
    "Nova York": 3,
    "Toquio": 4,
    "Cancun": 5,
    "Dubai": 6,
    "Roma": 7,
    "Santorini": 8,
    "Bali": 9,
    "Barcelona": 10,
    "Machu Picchu": 11,
    "Londres": 12
};

function translateDestinoPrincipal(destinoPrincipal) {
    if (!window.i18n || !destinoPrincipal) return destinoPrincipal;
    var destId = PACKAGE_DESTINO_TO_ID[destinoPrincipal];
    if (!destId) return destinoPrincipal;

    var titleKey = "destinos.destination" + destId + "Title";
    var tTitle = i18n.t(titleKey);
    if (tTitle === titleKey) return destinoPrincipal;

    // O titulo de destinos vem como "Cidade, Pais" - usamos so a cidade
    return tTitle.split(",")[0].trim();
}

function translatePackage(p) {
    var idx = PACKAGE_NAME_TO_INDEX[p.nome];
    var nome = p.nome;
    var descricao = p.descricao;
    var itens = p.itens_incluidos;

    if (window.i18n && idx) {
        var nameKey = "pacotes.package" + idx + "Name";
        var descKey = "pacotes.package" + idx + "Desc";
        var tName = i18n.t(nameKey);
        var tDesc = i18n.t(descKey);
        if (tName !== nameKey) nome = tName;
        if (tDesc !== descKey) descricao = tDesc;

        var tItens = [];
        for (var j = 1; j <= 4; j++) {
            var itemKey = "pacotes.package" + idx + "Item" + j;
            var tItem = i18n.t(itemKey);
            if (tItem !== itemKey) tItens.push(tItem);
        }
        if (tItens.length) itens = tItens;
    }

    return Object.assign({}, p, {
        nome: nome,
        descricao: descricao,
        itens_incluidos: itens,
        destino_principal: translateDestinoPrincipal(p.destino_principal)
    });
}

window.translatePackage = translatePackage;
window.translateDestinoPrincipal = translateDestinoPrincipal;

// Traduz nome e descricao de um destino (objeto vindo da API, com destination_id)
// reaproveitando as chaves "destinos.destinationNTitle" / "destinationNDesc".
// Usado em paginas onde o destino aparece fora do contexto da pagina destinos.html,
// como a wishlist e o dashboard.
function translateDestination(d) {
    var nome = d.nome;
    var descricao = d.descricao;

    if (window.i18n && d.destination_id != null) {
        var idx = parseInt(d.destination_id, 10);
        if (!isNaN(idx)) {
            var titleKey = "destinos.destination" + idx + "Title";
            var descKey = "destinos.destination" + idx + "Desc";
            var tTitle = i18n.t(titleKey);
            var tDesc = i18n.t(descKey);
            if (tTitle !== titleKey) nome = tTitle;
            if (tDesc !== descKey) descricao = tDesc;
        }
    }

    return Object.assign({}, d, { nome: nome, descricao: descricao });
}

window.translateDestination = translateDestination;

// ===============================
// BOOKING NAVIGATION HELPERS (compartilhado entre todas as paginas)
// ===============================
function bookDestination(destinationId) {
    window.location.href = "confirmacao.html?type=destino&id=" + destinationId;
}

function bookPackage(packageId) {
    window.location.href = "confirmacao.html?type=pacote&id=" + packageId;
}

window.bookDestination = bookDestination;
window.bookPackage = bookPackage;

// ===============================
// COOKIE CONSENT BANNER
// ===============================
(function() {
    var STORAGE_KEY = "iptrip_cookie_consent";

    function getConsent() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function setConsent(value) {
        try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    }

    function tr(key, fallback) {
        return window.i18n ? i18n.t(key) : fallback;
    }

    function buildBanner() {
        var banner = document.createElement("div");
        banner.id = "cookieConsentBanner";
        banner.className = "cookie-consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-live", "polite");
        banner.setAttribute("aria-label", "Cookie consent");

        banner.innerHTML =
            '<div class="cookie-consent-inner">' +
                '<div class="cookie-consent-icon"><i class="fas fa-cookie-bite"></i></div>' +
                '<div class="cookie-consent-text">' +
                    '<h4 data-i18n="cookies.title">' + tr("cookies.title", "Usamos cookies") + '</h4>' +
                    '<p data-i18n="cookies.message">' + tr("cookies.message", "Utilizamos cookies para melhorar a sua experiencia, analisar o trafego do site e personalizar conteudo. Ao continuar a navegar, concorda com a nossa utilizacao de cookies.") + '</p>' +
                '</div>' +
                '<div class="cookie-consent-actions">' +
                    '<button type="button" class="btn btn-outline btn-sm" id="cookieRejectBtn" data-i18n="cookies.reject">' + tr("cookies.reject", "Recusar") + '</button>' +
                    '<button type="button" class="btn btn-primary btn-sm" id="cookieAcceptBtn" data-i18n="cookies.accept">' + tr("cookies.accept", "Aceitar") + '</button>' +
                '</div>' +
            '</div>';

        return banner;
    }

    function updateBannerTexts(banner) {
        var titleEl = banner.querySelector('[data-i18n="cookies.title"]');
        var msgEl = banner.querySelector('[data-i18n="cookies.message"]');
        var rejectEl = banner.querySelector('[data-i18n="cookies.reject"]');
        var acceptEl = banner.querySelector('[data-i18n="cookies.accept"]');
        if (titleEl) titleEl.textContent = tr("cookies.title", "Usamos cookies");
        if (msgEl) msgEl.textContent = tr("cookies.message", "");
        if (rejectEl) rejectEl.textContent = tr("cookies.reject", "Recusar");
        if (acceptEl) acceptEl.textContent = tr("cookies.accept", "Aceitar");
    }

    function showBanner() {
        if (document.getElementById("cookieConsentBanner")) return;

        var banner = buildBanner();
        document.body.appendChild(banner);

        requestAnimationFrame(function() {
            banner.classList.add("show");
        });

        document.addEventListener("languageChanged", function() {
            if (banner.parentNode) updateBannerTexts(banner);
        });

        document.getElementById("cookieAcceptBtn").addEventListener("click", function() {
            setConsent("accepted");
            hideBanner(banner);
        });

        document.getElementById("cookieRejectBtn").addEventListener("click", function() {
            setConsent("rejected");
            hideBanner(banner);
        });
    }

    function hideBanner(banner) {
        banner.classList.remove("show");
        setTimeout(function() {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 400);
    }

    function init() {
        if (!getConsent()) {
            // Pequeno atraso para nao competir com o carregamento inicial da pagina
            setTimeout(showBanner, 600);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
