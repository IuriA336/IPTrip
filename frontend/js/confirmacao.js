// ===================================
// Confirmacao Page JavaScript
// ===================================

document.addEventListener("DOMContentLoaded", function() {
    loadConfirmationPage();
    document.addEventListener("languageChanged", loadConfirmationPage);
});

function getUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
        type: params.get("type"),
        id: parseInt(params.get("id"), 10)
    };
}

function loadConfirmationPage() {
    var container = document.getElementById("confirmationPage");
    var params = getUrlParams();

    if (!params.type || !params.id || isNaN(params.id) || ["destino", "pacote"].indexOf(params.type) === -1) {
        renderInvalidRequest(container);
        return;
    }

    var userId = localStorage.getItem("user_id");
    if (!userId) {
        renderLoginRequired(container, params);
        return;
    }

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("common.loading") : "Carregando...") + '</div>';

    if (params.type === "destino") {
        fetch(API + "/destinos")
            .then(function(r) { return r.json(); })
            .then(function(destinos) {
                var d = destinos.find(function(item) { return item.destination_id === params.id; });
                if (!d) { renderInvalidRequest(container); return; }
                renderConfirmation(container, {
                    type: "destino",
                    id: d.destination_id,
                    nome: (window.translateDestination ? translateDestination(d).nome : d.nome),
                    descricao: (window.translateDestination ? translateDestination(d).descricao : d.descricao),
                    imagem: d.imagem_url,
                    preco: d.preco_medio,
                    precoLabel: window.i18n ? i18n.t("common.from") : "Desde"
                });
            })
            .catch(function() { renderInvalidRequest(container); });
    } else {
        fetch(API + "/pacotes")
            .then(function(r) { return r.json(); })
            .then(function(pacotes) {
                var p = pacotes.find(function(item) { return item.package_id === params.id; });
                if (!p) { renderInvalidRequest(container); return; }
                var tp = window.translatePackage ? translatePackage(p) : p;
                renderConfirmation(container, {
                    type: "pacote",
                    id: p.package_id,
                    nome: tp.nome,
                    descricao: tp.descricao,
                    imagem: p.imagem_url,
                    preco: p.preco,
                    duracao: p.duracao,
                    precoLabel: window.i18n ? i18n.t("common.from") : "Desde"
                });
            })
            .catch(function() { renderInvalidRequest(container); });
    }
}

function renderInvalidRequest(container) {
    container.innerHTML = '<div class="empty-state-full">' +
        '<i class="fas fa-exclamation-triangle"></i>' +
        '<h3>' + (window.i18n ? i18n.t("confirmacao.notFoundTitle") : "Item não encontrado") + '</h3>' +
        '<p>' + (window.i18n ? i18n.t("confirmacao.notFoundDesc") : "Não foi possível encontrar o destino ou pacote selecionado.") + '</p>' +
        '<a href="destinos.html" class="btn btn-primary">' + (window.i18n ? i18n.t("common.exploreDestinations") : "Explorar Destinos") + '</a>' +
    '</div>';
}

function renderLoginRequired(container, params) {
    var redirectUrl = "confirmacao.html?type=" + encodeURIComponent(params.type) + "&id=" + encodeURIComponent(params.id);
    container.innerHTML = '<div class="empty-state-full">' +
        '<i class="fas fa-user-lock"></i>' +
        '<h3>' + (window.i18n ? i18n.t("confirmacao.loginRequired") : "Faça login para continuar") + '</h3>' +
        '<p>' + (window.i18n ? i18n.t("confirmacao.loginRequiredDesc") : "Precisa de ter sessão iniciada para reservar uma viagem.") + '</p>' +
        '<a href="cliente.html?redirect=' + encodeURIComponent(redirectUrl) + '" class="btn btn-primary">' + (window.i18n ? i18n.t("wishlist.loginButton") : "Entrar / Criar Conta") + '</a>' +
    '</div>';
}

function renderConfirmation(container, item) {
    var nightsLabel = window.i18n ? i18n.t("common.nights") : "noites";
    var proceedLabel = window.i18n ? i18n.t("confirmacao.proceedToPayment") : "Avançar para o Pagamento";
    var backLabel = item.type === "destino"
        ? (window.i18n ? i18n.t("confirmacao.backToDestinations") : "Voltar aos Destinos")
        : (window.i18n ? i18n.t("confirmacao.backToPackages") : "Voltar aos Pacotes");
    var backHref = item.type === "destino" ? "destinos.html" : "pacotes.html";

    var userName = localStorage.getItem("user_name") || "";

    container.innerHTML =
        '<div class="confirmation-layout">' +
            '<div class="confirmation-summary-card">' +
                '<img src="' + (item.imagem || "") + '" alt="' + item.nome + '" class="confirmation-image">' +
                '<div class="confirmation-summary-body">' +
                    '<span class="confirmation-type-badge">' +
                        (item.type === "destino"
                            ? '<i class="fas fa-map-marker-alt"></i> ' + (window.i18n ? i18n.t("confirmacao.typeDestination") : "Destino")
                            : '<i class="fas fa-suitcase-rolling"></i> ' + (window.i18n ? i18n.t("confirmacao.typePackage") : "Pacote")) +
                    '</span>' +
                    '<h2>' + item.nome + '</h2>' +
                    (item.duracao ? '<p class="confirmation-duration"><i class="fas fa-clock"></i> ' + item.duracao + ' ' + nightsLabel + '</p>' : '') +
                    '<p class="confirmation-desc">' + (item.descricao || "") + '</p>' +
                '</div>' +
            '</div>' +

            '<div class="confirmation-order-card">' +
                '<h3 data-i18n="confirmacao.orderSummary">' + (window.i18n ? i18n.t("confirmacao.orderSummary") : "Resumo da Reserva") + '</h3>' +
                '<div class="confirmation-order-row">' +
                    '<span>' + item.nome + '</span>' +
                    '<span data-eur="' + Number(item.preco) + '">' + (window.currency ? currency.format(item.preco, 2) : 'EUR ' + Number(item.preco).toFixed(2)) + '</span>' +
                '</div>' +
                (userName ? '<div class="confirmation-order-row confirmation-order-user"><span data-i18n="confirmacao.reservingAs">' + (window.i18n ? i18n.t("confirmacao.reservingAs") : "A reservar como") + '</span><span>' + userName + '</span></div>' : '') +
                '<div class="confirmation-order-total">' +
                    '<span>' + (window.i18n ? i18n.t("confirmacao.total") : "Total") + '</span>' +
                    '<span data-eur="' + Number(item.preco) + '">' + (window.currency ? currency.format(item.preco, 2) : 'EUR ' + Number(item.preco).toFixed(2)) + '</span>' +
                '</div>' +
                '<button class="btn btn-primary btn-block btn-lg" id="proceedToPaymentBtn">' +
                    '<i class="fas fa-lock"></i> ' + proceedLabel +
                '</button>' +
                '<a href="' + backHref + '" class="confirmation-back-link"><i class="fas fa-arrow-left"></i> ' + backLabel + '</a>' +
            '</div>' +
        '</div>';

    document.getElementById("proceedToPaymentBtn").addEventListener("click", function() {
        createPendingBooking(item, this);
    });
}

function createPendingBooking(item, btn) {
    var userId = localStorage.getItem("user_id");
    if (!userId) {
        window.location.href = "cliente.html";
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("common.loading") : "Carregando...");

    var payload = {
        user_id: parseInt(userId, 10),
        total: item.preco
    };
    if (item.type === "destino") {
        payload.destination_id = item.id;
    } else {
        payload.package_id = item.id;
    }

    fetch(API + "/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.status === "ok" && data.booking_id) {
                window.location.href = "checkout.html?booking_id=" + data.booking_id;
            } else {
                showNotification((window.i18n ? i18n.t("notifications.bookingError") : "Erro na reserva: ") + (data.message || ""), "error");
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-lock"></i> ' + (window.i18n ? i18n.t("confirmacao.proceedToPayment") : "Avançar para o Pagamento");
            }
        })
        .catch(function() {
            showNotification(window.i18n ? i18n.t("notifications.serverError") : "Erro ao conectar ao servidor.", "error");
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> ' + (window.i18n ? i18n.t("confirmacao.proceedToPayment") : "Avançar para o Pagamento");
        });
}
