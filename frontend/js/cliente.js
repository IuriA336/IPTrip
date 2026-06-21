// ===================================
// Cliente Page JavaScript (Login/Register)
// ===================================

document.addEventListener("DOMContentLoaded", function() {
    var userId = localStorage.getItem("user_id");
    if (userId) {
        window.location.href = getRedirectTarget();
        return;
    }

    setupAuthTabs();
    setupLogin();
    setupRegister();
});

function getRedirectTarget() {
    var params = new URLSearchParams(window.location.search);
    var redirect = params.get("redirect");
    // Apenas permite redirecionar para paginas internas (evita open redirect)
    if (redirect && redirect.indexOf("://") === -1 && redirect.indexOf("//") !== 0) {
        return redirect;
    }
    return "dashboard.html";
}

function setupAuthTabs() {
    var tabs = document.querySelectorAll(".auth-tab");
    var forms = document.querySelectorAll(".auth-form");

    tabs.forEach(function(tab) {
        tab.addEventListener("click", function() {
            var target = tab.dataset.tab;

            tabs.forEach(function(t) { t.classList.remove("active"); });
            tab.classList.add("active");

            forms.forEach(function(form) {
                if (form.id === target + "Form") {
                    form.classList.add("active");
                } else {
                    form.classList.remove("active");
                }
            });
        });
    });
}

function getLoginBtnHtml(loading) {
    if (loading) {
        return '<i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("cliente.loggingIn") : "Entrando...");
    }
    return '<i class="fas fa-sign-in-alt"></i> ' + (window.i18n ? i18n.t("cliente.loginButton") : "Entrar");
}

function getRegisterBtnHtml(loading) {
    if (loading) {
        return '<i class="fas fa-spinner fa-spin"></i> ' + (window.i18n ? i18n.t("cliente.creatingAccount") : "Criando conta...");
    }
    return '<i class="fas fa-user-plus"></i> ' + (window.i18n ? i18n.t("cliente.registerButton") : "Criar Conta");
}

function setupLogin() {
    var form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var email = document.getElementById("loginEmail").value.trim();
        var password = document.getElementById("loginPassword").value;

        if (!email || !password) {
            showNotification(window.i18n ? i18n.t("notifications.fillAllFields") : "Preencha todos os campos.", "error");
            return;
        }

        var btn = form.querySelector("button[type='submit']");
        btn.disabled = true;
        btn.innerHTML = getLoginBtnHtml(true);

        fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status === "ok") {
                    localStorage.setItem("user_id", data.user_id);
                    localStorage.setItem("user_name", data.nome);
                    showNotification(window.i18n ? i18n.t("notifications.loginSuccess") : "Login com sucesso! Redirecionando...", "success");
                    var target = getRedirectTarget();
                    setTimeout(function() { window.location.href = target; }, 1000);
                } else {
                    showNotification(data.message || (window.i18n ? i18n.t("notifications.invalidCredentials") : "Credenciais invalidas."), "error");
                    btn.disabled = false;
                    btn.innerHTML = getLoginBtnHtml(false);
                }
            })
            .catch(function() {
                showNotification(window.i18n ? i18n.t("notifications.serverError") : "Erro ao conectar ao servidor.", "error");
                btn.disabled = false;
                btn.innerHTML = getLoginBtnHtml(false);
            });
    });

    document.addEventListener("languageChanged", function() {
        var btn = form.querySelector("button[type='submit']");
        if (btn && !btn.disabled) btn.innerHTML = getLoginBtnHtml(false);
    });
}

function setupRegister() {
    var form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var nome = document.getElementById("registerName").value.trim();
        var email = document.getElementById("registerEmail").value.trim();
        var telefone = document.getElementById("registerPhone").value.trim();
        var password = document.getElementById("registerPassword").value;

        if (!nome || !email || !password) {
            showNotification(window.i18n ? i18n.t("notifications.fillRequired") : "Preencha todos os campos obrigatorios.", "error");
            return;
        }

        if (password.length < 6) {
            showNotification(window.i18n ? i18n.t("notifications.passwordMinLength") : "A senha deve ter pelo menos 6 caracteres.", "error");
            return;
        }

        var btn = form.querySelector("button[type='submit']");
        btn.disabled = true;
        btn.innerHTML = getRegisterBtnHtml(true);

        fetch(API + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nome, email: email, telefone: telefone, password: password })
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.status === "ok") {
                    showNotification(window.i18n ? i18n.t("notifications.accountCreated") : "Conta criada com sucesso! Faca login.", "success");
                    form.reset();
                    document.querySelector('.auth-tab[data-tab="login"]').click();
                } else {
                    showNotification(data.message || (window.i18n ? i18n.t("notifications.accountError") : "Erro ao criar conta."), "error");
                }
                btn.disabled = false;
                btn.innerHTML = getRegisterBtnHtml(false);
            })
            .catch(function() {
                showNotification(window.i18n ? i18n.t("notifications.serverError") : "Erro ao conectar ao servidor.", "error");
                btn.disabled = false;
                btn.innerHTML = getRegisterBtnHtml(false);
            });
    });

    document.addEventListener("languageChanged", function() {
        var btn = form.querySelector("button[type='submit']");
        if (btn && !btn.disabled) btn.innerHTML = getRegisterBtnHtml(false);
    });
}
