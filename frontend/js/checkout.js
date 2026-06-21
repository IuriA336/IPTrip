// ===================================
// Checkout Page JavaScript (Mockup)
// ===================================

var currentBooking = null;

document.addEventListener("DOMContentLoaded", function() {
    loadCheckoutPage();
    document.addEventListener("languageChanged", function() {
        // Apenas re-renderiza se ainda nao foi para o ecra de sucesso/erro do pagamento
        if (currentBooking && !document.getElementById("checkoutSuccessState")) {
            renderCheckoutForm(currentBooking);
        }
    });
});

function getBookingIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var id = parseInt(params.get("booking_id"), 10);
    return isNaN(id) ? null : id;
}

function loadCheckoutPage() {
    var container = document.getElementById("checkoutPage");
    var bookingId = getBookingIdFromUrl();
    var userId = localStorage.getItem("user_id");

    if (!userId) {
        container.innerHTML = '<div class="empty-state-full">' +
            '<i class="fas fa-user-lock"></i>' +
            '<h3>' + (window.i18n ? i18n.t("confirmacao.loginRequired") : "Faça login para continuar") + '</h3>' +
            '<a href="cliente.html" class="btn btn-primary">' + (window.i18n ? i18n.t("wishlist.loginButton") : "Entrar / Criar Conta") + '</a>' +
        '</div>';
        return;
    }

    if (!bookingId) {
        renderCheckoutInvalid(container);
        return;
    }

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("common.loading") : "Carregando...") + '</div>';

    fetch(API + "/reservas/booking/" + bookingId)
        .then(function(r) {
            if (!r.ok) throw new Error("not found");
            return r.json();
        })
        .then(function(booking) {
            if (String(booking.user_id) !== String(userId)) {
                renderCheckoutInvalid(container);
                return;
            }
            if (booking.estado === "confirmada") {
                renderAlreadyConfirmed(container, booking);
                return;
            }
            currentBooking = booking;
            renderCheckoutForm(booking);
        })
        .catch(function() { renderCheckoutInvalid(container); });
}

function renderCheckoutInvalid(container) {
    container.innerHTML = '<div class="empty-state-full">' +
        '<i class="fas fa-exclamation-triangle"></i>' +
        '<h3>' + (window.i18n ? i18n.t("checkout.notFoundTitle") : "Reserva não encontrada") + '</h3>' +
        '<p>' + (window.i18n ? i18n.t("checkout.notFoundDesc") : "Não foi possível encontrar esta reserva.") + '</p>' +
        '<a href="destinos.html" class="btn btn-primary">' + (window.i18n ? i18n.t("common.exploreDestinations") : "Explorar Destinos") + '</a>' +
    '</div>';
}

function renderAlreadyConfirmed(container, booking) {
    container.innerHTML = '<div class="empty-state-full">' +
        '<i class="fas fa-check-circle" style="color:var(--success)"></i>' +
        '<h3>' + (window.i18n ? i18n.t("checkout.alreadyConfirmedTitle") : "Esta reserva já foi paga") + '</h3>' +
        '<p>' + (booking.nome_destino || "") + '</p>' +
        '<a href="dashboard.html" class="btn btn-primary">' + (window.i18n ? i18n.t("checkout.goToDashboard") : "Ir para o Dashboard") + '</a>' +
    '</div>';
}

function renderCheckoutForm(booking) {
    var container = document.getElementById("checkoutPage");

    var curTotal = window.currency ? currency.format(booking.total, 2) : ('EUR ' + Number(booking.total).toFixed(2));
    var payLabel = window.i18n ? i18n.tf("checkout.payAmount", { amount: curTotal }) : ("Pagar " + curTotal);

    container.innerHTML =
        '<div class="checkout-layout">' +
            '<div class="checkout-form-card">' +
                '<h3><i class="fas fa-credit-card"></i> ' + (window.i18n ? i18n.t("checkout.paymentDetails") : "Dados de Pagamento") + '</h3>' +
                '<p class="checkout-mock-notice"><i class="fas fa-info-circle"></i> ' + (window.i18n ? i18n.t("checkout.mockNotice") : "Esta é uma simulação. Nenhum pagamento real será efetuado.") + '</p>' +

                '<form id="checkoutForm">' +
                    '<div class="form-group">' +
                        '<label for="ccName"><i class="fas fa-user"></i> ' + (window.i18n ? i18n.t("checkout.cardName") : "Nome no Cartão") + '</label>' +
                        '<input type="text" id="ccName" placeholder="' + (window.i18n ? i18n.t("checkout.cardNamePlaceholder") : "Como aparece no cartão") + '" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="ccNumber"><i class="fas fa-credit-card"></i> ' + (window.i18n ? i18n.t("checkout.cardNumber") : "Número do Cartão") + '</label>' +
                        '<input type="text" id="ccNumber" placeholder="4242 4242 4242 4242" inputmode="numeric" maxlength="19" required>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group">' +
                            '<label for="ccExpiry"><i class="fas fa-calendar"></i> ' + (window.i18n ? i18n.t("checkout.cardExpiry") : "Validade") + '</label>' +
                            '<input type="text" id="ccExpiry" placeholder="MM/AA" maxlength="5" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="ccCvc"><i class="fas fa-lock"></i> CVC</label>' +
                            '<input type="text" id="ccCvc" placeholder="123" inputmode="numeric" maxlength="4" required>' +
                        '</div>' +
                    '</div>' +
                    '<button type="submit" class="btn btn-primary btn-block btn-lg" id="payBtn">' +
                        '<i class="fas fa-lock"></i> ' + payLabel +
                    '</button>' +
                '</form>' +
            '</div>' +

            '<div class="checkout-summary-card">' +
                '<h3>' + (window.i18n ? i18n.t("confirmacao.orderSummary") : "Resumo da Reserva") + '</h3>' +
                '<div class="checkout-summary-item">' +
                    '<img src="' + (booking.imagem_url || "") + '" alt="' + (booking.nome_destino || "") + '">' +
                    '<div>' +
                        '<strong>' + (booking.nome_destino || "") + '</strong>' +
                        (booking.duracao ? '<span>' + booking.duracao + ' ' + (window.i18n ? i18n.t("common.nights") : "noites") + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="confirmation-order-total">' +
                    '<span>' + (window.i18n ? i18n.t("confirmacao.total") : "Total") + '</span>' +
                    '<span data-eur="' + Number(booking.total) + '">' + (window.currency ? currency.format(booking.total, 2) : 'EUR ' + Number(booking.total).toFixed(2)) + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';

    setupCheckoutFormBehavior();

    document.getElementById("checkoutForm").addEventListener("submit", function(e) {
        e.preventDefault();
        processFakePayment(booking);
    });
}

function setupCheckoutFormBehavior() {
    var numberInput = document.getElementById("ccNumber");
    if (numberInput) {
        numberInput.addEventListener("input", function() {
            var digits = numberInput.value.replace(/\D/g, "").substring(0, 16);
            numberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
        });
    }

    var expiryInput = document.getElementById("ccExpiry");
    if (expiryInput) {
        expiryInput.addEventListener("input", function() {
            var digits = expiryInput.value.replace(/\D/g, "").substring(0, 4);
            if (digits.length > 2) {
                expiryInput.value = digits.substring(0, 2) + "/" + digits.substring(2);
            } else {
                expiryInput.value = digits;
            }
        });
    }

    var cvcInput = document.getElementById("ccCvc");
    if (cvcInput) {
        cvcInput.addEventListener("input", function() {
            cvcInput.value = cvcInput.value.replace(/\D/g, "").substring(0, 4);
        });
    }
}

function processFakePayment(booking) {
    var btn = document.getElementById("payBtn");
    var form = document.getElementById("checkoutForm");

    btn.disabled = true;
    form.querySelectorAll("input").forEach(function(input) { input.disabled = true; });
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("checkout.processing") : "A processar pagamento...");

    // Simula latencia de um gateway de pagamento real
    setTimeout(function() {
        fetch(API + "/reservas/" + booking.booking_id + "/confirmar", {
            method: "POST"
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status === "ok") {
                    var templateParams = {
                        to_email: booking.user_email || "",
                        booking_ref: booking.booking_id,
                        name: booking.nome_destino || "",
                        price: window.currency ? currency.format(booking.total, 2) : ("EUR " + Number(booking.total).toFixed(2)),
                        total: window.currency ? currency.format(booking.total, 2) : ("EUR " + Number(booking.total).toFixed(2))
                    };
                    emailjs.send("service_swiu58q", "template_15vvaum", templateParams)
                        .finally(function() {
                            renderSuccessState(booking);
                        });
                } else {
                    showNotification(window.i18n ? i18n.t("notifications.serverError") : "Erro ao conectar ao servidor.", "error");
                    btn.disabled = false;
                    form.querySelectorAll("input").forEach(function(input) { input.disabled = false; });
                    btn.innerHTML = '<i class="fas fa-lock"></i> ' + (window.i18n ? i18n.t("checkout.tryAgain") : "Tentar novamente");
                }
            })
            .catch(function() {
                showNotification(window.i18n ? i18n.t("notifications.serverError") : "Erro ao conectar ao servidor.", "error");
                btn.disabled = false;
                form.querySelectorAll("input").forEach(function(input) { input.disabled = false; });
                btn.innerHTML = '<i class="fas fa-lock"></i> ' + (window.i18n ? i18n.t("checkout.tryAgain") : "Tentar novamente");
            });
    }, 1800);
}

function renderSuccessState(booking) {
    var container = document.getElementById("checkoutPage");
    var userEmail = booking.user_email || "";

    // Atualiza indicador de passos para "concluido"
    document.querySelectorAll(".checkout-step").forEach(function(step) {
        step.classList.add("done");
        step.classList.remove("active");
    });
    document.querySelectorAll(".checkout-step-line").forEach(function(line) {
        line.classList.add("done");
    });
    document.querySelectorAll(".checkout-step-num").forEach(function(num) {
        num.innerHTML = '<i class="fas fa-check"></i>';
    });

    var emailMsg = window.i18n
        ? i18n.tf("checkout.emailNotice", { email: userEmail })
        : ("Será enviado um email de confirmação para " + userEmail + ".");

    container.innerHTML = '<div class="checkout-success" id="checkoutSuccessState">' +
        '<div class="checkout-success-icon"><i class="fas fa-check"></i></div>' +
        '<h2>' + (window.i18n ? i18n.t("checkout.successTitle") : "Compra Concluída!") + '</h2>' +
        '<p class="checkout-success-desc">' + (window.i18n ? i18n.t("checkout.successDesc") : "A sua reserva foi confirmada com sucesso.") + '</p>' +
        '<div class="checkout-success-email"><i class="fas fa-envelope"></i> ' + emailMsg + '</div>' +
        '<div class="checkout-success-details">' +
            '<div class="checkout-success-row"><span>' + (window.i18n ? i18n.t("checkout.bookingRef") : "Referência da Reserva") + '</span><span>#' + booking.booking_id + '</span></div>' +
            '<div class="checkout-success-row"><span>' + (booking.nome_destino || "") + '</span><span data-eur="' + Number(booking.total) + '">' + (window.currency ? currency.format(booking.total, 2) : 'EUR ' + Number(booking.total).toFixed(2)) + '</span></div>' +
        '</div>' +
        '<div class="checkout-success-actions">' +
            '<a href="dashboard.html" class="btn btn-primary"><i class="fas fa-th-large"></i> ' + (window.i18n ? i18n.t("checkout.goToDashboard") : "Ir para o Dashboard") + '</a>' +
            '<a href="destinos.html" class="btn btn-outline-dark"><i class="fas fa-compass"></i> ' + (window.i18n ? i18n.t("common.exploreDestinations") : "Explorar Destinos") + '</a>' +
        '</div>' +
    '</div>';

    updateWishlistCount();
}
