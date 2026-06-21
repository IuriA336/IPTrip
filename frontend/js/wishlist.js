// ===================================
// Wishlist Page JavaScript
// ===================================

document.addEventListener("DOMContentLoaded", function() {
    loadWishlistPage();
    document.addEventListener("languageChanged", loadWishlistPage);
    document.addEventListener("currencyChanged", loadWishlistPage);
});

function loadWishlistPage() {
    var userId = localStorage.getItem("user_id");
    var container = document.getElementById("wishlistPage");

    if (!userId) {
        container.innerHTML = '<div class="empty-state-full">' +
            '<i class="fas fa-user-lock"></i>' +
            '<h3>' + (window.i18n ? i18n.t("wishlist.loginRequired") : "Faca login para ver a sua lista de desejos") + '</h3>' +
            '<p>' + (window.i18n ? i18n.t("wishlist.loginRequiredDesc") : "Os seus destinos de sonho sao guardados na sua conta.") + '</p>' +
            '<a href="cliente.html" class="btn btn-primary">' + (window.i18n ? i18n.t("wishlist.loginButton") : "Entrar / Criar Conta") + '</a>' +
        '</div>';
        return;
    }

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("common.loading") : "Carregando...") + '</div>';

    fetch(API + "/dreams/" + userId)
        .then(function(r) { return r.json(); })
        .then(function(dreams) {
            var explore = window.i18n ? i18n.t("common.exploreDestinations") : "Explorar Destinos";
            var remove = window.i18n ? i18n.t("common.remove") : "Remover";
            var countLabel = window.i18n ? i18n.t("wishlist.countLabel") : "destino(s) na sua lista";
            var bookNow = window.i18n ? i18n.t("common.bookNow") : "Reservar Agora";

            if (dreams.length === 0) {
                container.innerHTML = '<div class="empty-state-full">' +
                    '<i class="fas fa-heart-broken"></i>' +
                    '<h3>' + (window.i18n ? i18n.t("wishlist.emptyTitle") : "A sua lista de desejos esta vazia") + '</h3>' +
                    '<p>' + (window.i18n ? i18n.t("wishlist.emptyDesc") : "Explore os nossos destinos e adicione os seus favoritos clicando no coracao!") + '</p>' +
                    '<a href="destinos.html" class="btn btn-primary">' + explore + '</a>' +
                '</div>';
                return;
            }

            container.innerHTML = '<h2>' + dreams.length + ' ' + countLabel + '</h2>' +
                '<div class="wishlist-page-grid">' +
                    dreams.map(function(rawD) {
                        var d = window.translateDestination ? translateDestination(rawD) : rawD;

                        var types = (d.tipo || "").split(",").map(function(t) {
                            var tag = t.trim();
                            var label = window.i18n ? i18n.translateCategory(tag) : tag;
                            return '<span class="dest-tag">' + label + '</span>';
                        }).join("");

                        return '<div class="wishlist-page-card">' +
                            '<div class="wpc-img">' +
                                '<img src="' + (d.imagem_url || "") + '" alt="' + d.nome + '">' +
                            '</div>' +
                            '<div class="wpc-body">' +
                                '<h3>' + d.nome + '</h3>' +
                                '<p class="wpc-desc">' + (d.descricao || "").substring(0, 120) + '...</p>' +
                                '<div class="wpc-tags">' + types + '</div>' +
                                '<div class="wpc-footer">' +
                                    '<span class="wpc-price" data-eur="' + Number(d.preco_medio) + '">' + (window.currency ? currency.format(d.preco_medio) : 'EUR ' + Number(d.preco_medio).toFixed(0)) + '</span>' +
                                    '<div class="wpc-actions">' +
                                        '<button class="btn btn-accent btn-sm" onclick="bookDestination(' + d.destination_id + ')"><i class="fas fa-suitcase-rolling"></i> ' + bookNow + '</button>' +
                                        '<button class="btn btn-danger btn-sm" onclick="removeFromWishlistPage(' + d.dream_id + ')"><i class="fas fa-trash"></i> ' + remove + '</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    }).join("") +
                '</div>';
        })
        .catch(function(err) {
            console.error("Error:", err);
            container.innerHTML = '<p>' + (window.i18n ? i18n.t("wishlist.loadError") : "Erro ao carregar lista de desejos.") + '</p>';
        });
}

function removeFromWishlistPage(dreamId) {
    fetch(API + "/dreams/delete/" + dreamId, { method: "DELETE" })
        .then(function(r) { return r.json(); })
        .then(function() {
            showNotification(window.i18n ? i18n.t("notifications.removedFromWishlist") : "Removido da lista de desejos!", "info");
            loadWishlistPage();
            updateWishlistCount();
        })
        .catch(function() {
            showNotification(window.i18n ? i18n.t("notifications.removeError") : "Erro ao remover.", "error");
        });
}

window.removeFromWishlistPage = removeFromWishlistPage;
