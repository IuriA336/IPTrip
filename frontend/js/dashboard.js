// ===================================
// Dashboard Page JavaScript
// ===================================

var dashboardUserId = null;

document.addEventListener("DOMContentLoaded", function() {
    dashboardUserId = localStorage.getItem("user_id");

    if (!dashboardUserId) {
        window.location.href = "cliente.html";
        return;
    }

    initDashboard(dashboardUserId);

    document.addEventListener("languageChanged", function() {
        loadWishlist(dashboardUserId);
        loadBookings(dashboardUserId);
    });
    document.addEventListener("currencyChanged", function() {
        loadWishlist(dashboardUserId);
        loadBookings(dashboardUserId);
    });
});

function initDashboard(userId) {
    loadUserData(userId);
    loadWishlist(userId);
    loadBookings(userId);
    setupDashboardNav();
}

function loadUserData(userId) {
    fetch(API + "/user/" + userId)
        .then(function(r) { return r.json(); })
        .then(function(user) {
            document.querySelectorAll(".client-name").forEach(function(el) {
                el.textContent = user.nome;
            });
            document.querySelectorAll(".client-email").forEach(function(el) {
                el.textContent = user.email;
            });

            var phone = document.getElementById("clientPhone");
            if (phone) phone.textContent = user.telefone || "-";

            var since = document.getElementById("clientSince");
            if (since && user.data_criacao) {
                var locale = window.i18n ? i18n.getDateLocale() : "pt-PT";
                since.textContent = new Date(user.data_criacao).toLocaleDateString(locale);
            }
        })
        .catch(function(err) {
            console.error("Error loading user:", err);
            showNotification(window.i18n ? i18n.t("notifications.loadUserError") : "Erro ao carregar dados do utilizador.", "error");
        });
}

function loadWishlist(userId) {
    fetch(API + "/dreams/" + userId)
        .then(function(r) { return r.json(); })
        .then(function(dreams) {
            var statEl = document.getElementById("statDreams");
            if (statEl) statEl.textContent = dreams.length;

            renderWishlistPreview(dreams);
            renderWishlistFull(dreams);
        })
        .catch(function(err) {
            console.error("Error loading wishlist:", err);
        });
}

function renderWishlistPreview(dreams) {
    var container = document.getElementById("wishlistPreview");
    if (!container) return;

    var explore = window.i18n ? i18n.t("common.exploreDestinations") : "Explorar destinos";
    var emptyMsg = window.i18n ? i18n.t("dashboard.emptyWishlistPreview") : "Ainda nao adicionou destinos a sua lista de desejos.";

    if (dreams.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-heart-broken"></i> ' + emptyMsg + ' <a href="destinos.html">' + explore + '</a></p>';
        return;
    }

    var viewAll = window.i18n ? i18n.t("common.viewAll") : "Ver todos";
    var bookNow = window.i18n ? i18n.t("common.bookNow") : "Reservar Agora";
    var preview = dreams.slice(0, 3);
    container.innerHTML = '<div class="wishlist-preview-grid">' +
        preview.map(function(rawD) {
            var d = window.translateDestination ? translateDestination(rawD) : rawD;
            return '<div class="wishlist-preview-card">' +
                '<img src="' + (d.imagem_url || "") + '" alt="' + d.nome + '">' +
                '<div class="wpc-info">' +
                    '<strong>' + d.nome + '</strong>' +
                    '<button class="btn btn-accent btn-sm" onclick="event.stopPropagation(); bookDestination(' + d.destination_id + ')"><i class="fas fa-suitcase-rolling"></i> ' + bookNow + '</button>' +
                '</div>' +
            '</div>';
        }).join("") +
    '</div>' +
    (dreams.length > 3 ? '<a href="#" class="view-all-link" onclick="document.querySelector(\'[data-section=wishlist]\').click(); return false;">' + viewAll + ' (' + dreams.length + ')</a>' : '');
}

function renderWishlistFull(dreams) {
    var container = document.getElementById("wishlistFull");
    if (!container) return;

    var loading = window.i18n ? i18n.t("common.loading") : "Carregando...";
    var remove = window.i18n ? i18n.t("common.remove") : "Remover";
    var addedOn = window.i18n ? i18n.t("common.addedOn") : "Adicionado:";
    var explore = window.i18n ? i18n.t("common.exploreDestinations") : "Explorar Destinos";
    var bookNow = window.i18n ? i18n.t("common.bookNow") : "Reservar Agora";
    var locale = window.i18n ? i18n.getDateLocale() : "pt-PT";

    if (dreams.length === 0) {
        container.innerHTML = '<div class="empty-state-full">' +
            '<i class="fas fa-heart-broken"></i>' +
            '<h3 data-i18n="dashboard.emptyWishlistFull">' + (window.i18n ? i18n.t("dashboard.emptyWishlistFull") : "A sua lista de desejos esta vazia") + '</h3>' +
            '<p data-i18n="dashboard.emptyWishlistFullDesc">' + (window.i18n ? i18n.t("dashboard.emptyWishlistFullDesc") : "Explore os nossos destinos e adicione os seus favoritos!") + '</p>' +
            '<a href="destinos.html" class="btn btn-primary">' + explore + '</a>' +
        '</div>';
        return;
    }

    container.innerHTML = '<div class="wishlist-grid">' +
        dreams.map(function(rawD) {
            var d = window.translateDestination ? translateDestination(rawD) : rawD;

            var types = (d.tipo || "").split(",").map(function(t) {
                var tag = t.trim();
                var label = window.i18n ? i18n.translateCategory(tag) : tag;
                return '<span class="dest-tag">' + label + '</span>';
            }).join("");

            return '<div class="wishlist-card">' +
                '<div class="wc-image">' +
                    '<img src="' + (d.imagem_url || "") + '" alt="' + d.nome + '">' +
                '</div>' +
                '<div class="wc-content">' +
                    '<h4>' + d.nome + '</h4>' +
                    '<p class="wc-desc">' + (d.descricao || "").substring(0, 100) + '...</p>' +
                    '<div class="wc-tags">' + types + '</div>' +
                    '<div class="wc-footer">' +
                        '<span class="wc-price" data-eur="' + Number(d.preco_medio) + '">' + (window.currency ? currency.format(d.preco_medio) : 'EUR ' + Number(d.preco_medio).toFixed(0)) + '</span>' +
                        '<span class="wc-date">' + addedOn + ' ' + new Date(d.data_adicionado).toLocaleDateString(locale) + '</span>' +
                        '<div class="wc-actions">' +
                            '<button class="btn btn-accent btn-sm" onclick="bookDestination(' + d.destination_id + ')"><i class="fas fa-suitcase-rolling"></i> ' + bookNow + '</button>' +
                            '<button class="btn btn-danger btn-sm" onclick="removeDream(' + d.dream_id + ')"><i class="fas fa-trash"></i> ' + remove + '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join("") +
    '</div>';
}

function removeDream(dreamId) {
    fetch(API + "/dreams/delete/" + dreamId, { method: "DELETE" })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.status === "ok") {
                showNotification(window.i18n ? i18n.t("notifications.destinationRemoved") : "Destino removido da lista de desejos!", "info");
                loadWishlist(dashboardUserId);
                updateWishlistCount();
            }
        })
        .catch(function() {
            showNotification(window.i18n ? i18n.t("notifications.removeError") : "Erro ao remover.", "error");
        });
}

window.removeDream = removeDream;

function loadBookings(userId) {
    fetch(API + "/reservas/" + userId)
        .then(function(r) { return r.json(); })
        .then(function(reservas) {
            var statEl = document.getElementById("statBookings");
            if (statEl) statEl.textContent = reservas.length;

            var container = document.getElementById("bookingsList");
            if (!container) return;

            var viewPackages = window.i18n ? i18n.t("common.viewPackages") : "Ver Pacotes";
            var totalLabel = window.i18n ? i18n.t("dashboard.total") : "Total:";
            var bookingLabel = window.i18n ? i18n.t("dashboard.bookingLabel") : "Reserva #";
            var locale = window.i18n ? i18n.getDateLocale() : "pt-PT";

            if (reservas.length === 0) {
                container.innerHTML = '<div class="empty-state-full">' +
                    '<i class="fas fa-calendar-times"></i>' +
                    '<h3>' + (window.i18n ? i18n.t("dashboard.emptyBookings") : "Sem reservas ainda") + '</h3>' +
                    '<p>' + (window.i18n ? i18n.t("dashboard.emptyBookingsDesc") : "Explore os nossos pacotes e faca a sua primeira reserva!") + '</p>' +
                    '<a href="pacotes.html" class="btn btn-primary">' + viewPackages + '</a>' +
                '</div>';
                return;
            }

            container.innerHTML = reservas.map(function(r) {
                var estado = window.i18n ? i18n.translateStatus(r.estado) : r.estado;
                return '<div class="booking-card">' +
                    '<div class="bc-info">' +
                        '<h4><i class="fas fa-suitcase"></i> ' + (r.nome_destino || bookingLabel + r.booking_id) + '</h4>' +
                        '<p><i class="fas fa-calendar"></i> ' + new Date(r.data_reserva).toLocaleDateString(locale) + '</p>' +
                        '<p><i class="fas fa-credit-card"></i> ' + totalLabel + ' <span data-eur="' + Number(r.total) + '">' + (window.currency ? currency.format(r.total, 2) : 'EUR ' + Number(r.total).toFixed(2)) + '</span></p>' +
                    '</div>' +
                    '<span class="booking-status status-' + r.estado + '">' + estado + '</span>' +
                '</div>';
            }).join("");
        })
        .catch(function(err) {
            console.error("Error loading bookings:", err);
        });
}

function setupDashboardNav() {
    var links = document.querySelectorAll(".dashboard-menu a[data-section]");
    var panels = document.querySelectorAll(".dashboard-panel");

    links.forEach(function(link) {
        link.addEventListener("click", function(e) {
            e.preventDefault();

            var section = link.dataset.section;

            if (section === "logout") {
                localStorage.removeItem("user_id");
                localStorage.removeItem("user_name");
                showNotification(window.i18n ? i18n.t("notifications.logoutSuccess") : "Sessao terminada com sucesso!", "info");
                setTimeout(function() { window.location.href = "cliente.html"; }, 1000);
                return;
            }

            links.forEach(function(l) { l.classList.remove("active"); });
            link.classList.add("active");

            panels.forEach(function(panel) {
                if (panel.id === section) {
                    panel.classList.add("active");
                } else {
                    panel.classList.remove("active");
                }
            });
        });
    });
}
