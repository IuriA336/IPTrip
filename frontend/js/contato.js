// ===================================
// Contact Page JavaScript
// ===================================

document.addEventListener("DOMContentLoaded", function() {
    setupContactForm();
    setupFAQ();
});

function setupContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var name = document.getElementById("contactName").value.trim();
        var email = document.getElementById("contactEmail").value.trim();
        var subject = document.getElementById("contactSubject").value.trim();
        var message = document.getElementById("contactMessage").value.trim();

        if (!name || !email || !subject || !message) {
            showNotification(window.i18n ? i18n.t("notifications.fillAllFields") : "Preencha todos os campos.", "error");
            return;
        }

        if (message.length < 10) {
            showNotification(window.i18n ? i18n.t("notifications.messageMinLength") : "A mensagem deve ter pelo menos 10 caracteres.", "error");
            return;
        }

        var btn = form.querySelector("button[type='submit']");
        btn.disabled = true;
        var sending = window.i18n ? i18n.t("contato.sending") : "Enviando...";
        var send = window.i18n ? i18n.t("contato.send") : "Enviar Mensagem";
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + sending;

        var templateParams = {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message
        };

        emailjs.send("service_swiu58q", "template_8mhm1ch", templateParams)
            .then(function() {
                showNotification(window.i18n ? i18n.t("notifications.messageSent") : "Mensagem enviada com sucesso! Responderemos em até 24 horas.", "success");
                form.reset();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span data-i18n="contato.send">' + send + '</span>';
                if (window.i18n) i18n.t("contato.send");
            }, function(error) {
                console.error("EmailJS error:", error);
                showNotification(window.i18n ? i18n.t("notifications.messageError") : "Erro ao enviar a mensagem. Por favor tente novamente.", "error");
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span data-i18n="contato.send">' + send + '</span>';
            });
    });

    document.addEventListener("languageChanged", function() {
        var btn = form.querySelector("button[type='submit']");
        if (btn && !btn.disabled) {
            var send = window.i18n ? i18n.t("contato.send") : "Enviar Mensagem";
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span data-i18n="contato.send">' + send + '</span>';
        }
    });
}

function setupFAQ() {
    var questions = document.querySelectorAll(".faq-question");

    questions.forEach(function(q) {
        q.addEventListener("click", function() {
            var item = q.parentElement;
            var answer = item.querySelector(".faq-answer");
            var isOpen = item.classList.contains("open");

            document.querySelectorAll(".faq-item").forEach(function(fi) {
                fi.classList.remove("open");
                fi.querySelector(".faq-answer").style.maxHeight = null;
            });

            if (!isOpen) {
                item.classList.add("open");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
}
