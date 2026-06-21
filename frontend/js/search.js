// ===================================
// IPTrip Global Search Engine
// Motor de pesquisa local - sem APIs externas
// ===================================

(function () {
    "use strict";

    // ── Dados em memória ──────────────────────────────────────────────────────
    var searchIndex = {
        destinations: [],
        packages: []
    };

    var debounceTimer = null;
    var dataLoaded = false;
    var searchInput = null;
    var searchResults = null;

    // ── Normalização de texto (remove acentos, lowercase) ────────────────────
    function normalize(str) {
        if (!str) return "";
        return str.toString().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    // ── Score de relevância ───────────────────────────────────────────────────
    function scoreMatch(haystack, needle) {
        var h = normalize(haystack);
        var n = normalize(needle);
        if (!n) return 0;
        if (h === n) return 100;
        if (h.startsWith(n)) return 90;
        if (h.includes(" " + n)) return 85;
        if (h.includes(n)) return 70;

        var tokens = n.split(/\s+/).filter(Boolean);
        if (tokens.length > 1) {
            var matched = tokens.filter(function(tok) { return h.includes(tok); });
            if (matched.length === tokens.length) return 80;
            if (matched.length > 0) return 40 * (matched.length / tokens.length);
        }
        return 0;
    }

    // ── Pesquisar destinos ───────────────────────────────────────────────────
    function searchDestinations(query) {
        return searchIndex.destinations.map(function(d) {
            var tName = d.nome, tDesc = d.descricao, tMon = "";
            if (window.i18n && d.translation_idx != null) {
                var idx = d.translation_idx;
                var kN = "destinos.destination" + idx + "Title";
                var kD = "destinos.destination" + idx + "Desc";
                var kM = "destinos.destination" + idx + "Monuments";
                var rN = i18n.t(kN); if (rN !== kN) tName = rN;
                var rD = i18n.t(kD); if (rD !== kD) tDesc = rD;
                var rM = i18n.t(kM); if (rM !== kM) tMon = rM;
            }
            var tiposLabel = (d.tipo || "").split(",").map(function(t) {
                return window.i18n ? i18n.translateCategory(t.trim()) : t.trim();
            }).join(" ");

            var score = Math.max(
                scoreMatch(tName, query) * 2.0,
                scoreMatch(d.pais, query) * 1.5,
                scoreMatch(tDesc, query) * 1.0,
                scoreMatch(tiposLabel, query) * 0.8,
                scoreMatch(tMon, query) * 0.6
            );
            return { item: d, score: score, tName: tName, tDesc: tDesc };
        })
        .filter(function(r) { return r.score > 0; })
        .sort(function(a, b) { return b.score - a.score; })
        .slice(0, 5);
    }

    // ── Pesquisar pacotes ────────────────────────────────────────────────────
    function searchPackages(query) {
        return searchIndex.packages.map(function(p) {
            var tName = p.nome, tDesc = p.descricao, tDest = p.destino_principal, tItems = [];
            if (window.i18n && p.translation_idx != null) {
                var idx = p.translation_idx;
                var kN = "pacotes.package" + idx + "Name";
                var kD = "pacotes.package" + idx + "Desc";
                var rN = i18n.t(kN); if (rN !== kN) tName = rN;
                var rD = i18n.t(kD); if (rD !== kD) tDesc = rD;
                for (var j = 1; j <= 4; j++) {
                    var kI = "pacotes.package" + idx + "Item" + j;
                    var rI = i18n.t(kI); if (rI !== kI) tItems.push(rI);
                }
                if (window.translateDestinoPrincipal) tDest = translateDestinoPrincipal(p.destino_principal);
            }
            var catLabel = window.i18n ? i18n.translateCategory(p.categoria) : (p.categoria || "");

            var score = Math.max(
                scoreMatch(tName, query) * 2.0,
                scoreMatch(tDest, query) * 1.5,
                scoreMatch(tDesc, query) * 1.0,
                scoreMatch(catLabel, query) * 0.8,
                scoreMatch(tItems.join(" "), query) * 0.5
            );
            return { item: p, score: score, tName: tName, tDesc: tDesc, tDest: tDest };
        })
        .filter(function(r) { return r.score > 0; })
        .sort(function(a, b) { return b.score - a.score; })
        .slice(0, 5);
    }

    // ── Escape HTML ───────────────────────────────────────────────────────────
    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ── Renderizar resultados ─────────────────────────────────────────────────
    function renderResults(query) {
        if (!searchResults) return;
        var q = (query || "").trim();

        if (!q || q.length < 2) {
            searchResults.innerHTML = "";
            searchResults.style.display = "none";
            return;
        }

        var destResults = searchDestinations(q);
        var pkgResults  = searchPackages(q);

        if (destResults.length === 0 && pkgResults.length === 0) {
            var noMsg = window.i18n ? i18n.t("search.noResults") : "Sem resultados para";
            searchResults.innerHTML =
                '<div class="search-no-results">' +
                '<i class="fas fa-search"></i>' +
                '<span>' + noMsg + ' <strong>' + escapeHtml(q) + '</strong></span>' +
                '</div>';
            searchResults.style.display = "block";
            return;
        }

        var html = "";

        if (destResults.length > 0) {
            var dLabel = window.i18n ? i18n.t("search.destinations") : "Destinos";
            html += '<div class="search-group-label"><i class="fas fa-map-marker-alt"></i> ' + dLabel + '</div>';
            destResults.forEach(function(r) {
                var d = r.item;
                var fromLabel = window.i18n ? i18n.t("common.from") : "Desde";
                var tiposLabel = (d.tipo || "").split(",").map(function(t) {
                    return window.i18n ? i18n.translateCategory(t.trim()) : t.trim();
                }).join(", ");
                html +=
                    '<a class="search-result-item" href="destinos.html#dest-' + d.id + '">' +
                    (d.imagem_url
                        ? '<img class="search-result-img" src="' + escapeHtml(d.imagem_url) + '" alt="" loading="lazy">'
                        : '<div class="search-result-img-placeholder"><i class="fas fa-map-marker-alt"></i></div>') +
                    '<div class="search-result-info">' +
                    '<div class="search-result-name">' + escapeHtml(r.tName) + '</div>' +
                    '<div class="search-result-meta">' +
                    '<span><i class="fas fa-tag"></i> ' + escapeHtml(tiposLabel) + '</span>' +
                    '<span class="search-result-price" data-eur="' + Number(d.preco_medio) + '">' + fromLabel + ' ' + (window.currency ? currency.format(d.preco_medio) : 'EUR ' + Number(d.preco_medio).toFixed(0)) + '</span>' +
                    '</div></div></a>';
            });
        }

        if (pkgResults.length > 0) {
            var pLabel = window.i18n ? i18n.t("search.packages") : "Pacotes";
            html += '<div class="search-group-label"><i class="fas fa-suitcase-rolling"></i> ' + pLabel + '</div>';
            pkgResults.forEach(function(r) {
                var p = r.item;
                var nights = window.i18n ? i18n.t("common.nights") : "noites";
                var catLabel = window.i18n ? i18n.translateCategory(p.categoria) : (p.categoria || "");
                html +=
                    '<a class="search-result-item" href="pacotes.html#pkg-' + p.id + '">' +
                    (p.imagem_url
                        ? '<img class="search-result-img" src="' + escapeHtml(p.imagem_url) + '" alt="" loading="lazy">'
                        : '<div class="search-result-img-placeholder"><i class="fas fa-suitcase-rolling"></i></div>') +
                    '<div class="search-result-info">' +
                    '<div class="search-result-name">' + escapeHtml(r.tName) + '</div>' +
                    '<div class="search-result-meta">' +
                    '<span><i class="fas fa-clock"></i> ' + p.duracao + ' ' + nights + '</span>' +
                    '<span><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(r.tDest) + '</span>' +
                    '<span class="search-result-price" data-eur="' + Number(p.preco) + '">' + (window.currency ? currency.format(p.preco) : 'EUR ' + Number(p.preco).toFixed(0)) + '</span>' +
                    '</div></div></a>';
            });
        }

        var seeAllDest = window.i18n ? i18n.t("search.seeAllDestinations") : "Ver todos os destinos";
        var seeAllPkg  = window.i18n ? i18n.t("search.seeAllPackages") : "Ver todos os pacotes";
        html += '<div class="search-see-all">' +
            '<a href="destinos.html?q=' + encodeURIComponent(q) + '"><i class="fas fa-map-marker-alt"></i> ' + seeAllDest + '</a>' +
            '<a href="pacotes.html?q=' + encodeURIComponent(q) + '"><i class="fas fa-suitcase-rolling"></i> ' + seeAllPkg + '</a>' +
            '</div>';

        searchResults.innerHTML = html;
        searchResults.style.display = "block";
    }

    // ── Carregar dados da API ─────────────────────────────────────────────────
    var PACKAGE_NAME_TO_INDEX = {
        "Romance em Paris": 1, "Lua de Mel nas Maldivas": 2, "Aventura em Toquio": 3,
        "New York Explorer": 4, "Praias de Cancun": 5, "Dubai Luxury": 6,
        "Roma Classica": 7, "Bali Espiritual": 8
    };

    function loadSearchData() {
        if (dataLoaded) return Promise.resolve();
        var destP = fetch(API + "/destinos").then(function(r) { return r.json(); })
            .then(function(list) {
                searchIndex.destinations = list.map(function(d) {
                    return { id: d.destination_id, nome: d.nome, pais: d.pais, descricao: d.descricao,
                             tipo: d.tipo, preco_medio: d.preco_medio, imagem_url: d.imagem_url,
                             translation_idx: d.destination_id };
                });
            });
        var pkgP = fetch(API + "/pacotes").then(function(r) { return r.json(); })
            .then(function(list) {
                searchIndex.packages = list.map(function(p) {
                    return { id: p.package_id, nome: p.nome, descricao: p.descricao,
                             categoria: p.categoria, destino_principal: p.destino_principal,
                             preco: p.preco, duracao: p.duracao, imagem_url: p.imagem_url,
                             translation_idx: PACKAGE_NAME_TO_INDEX[p.nome] || null };
                });
            });
        return Promise.all([destP, pkgP])
            .then(function() { dataLoaded = true; })
            .catch(function(e) { console.warn("Search: erro ao carregar dados", e); });
    }

    // ── Aplicar query da URL nas páginas de destinos/pacotes ─────────────────
    function applyUrlQuery() {
        var urlQ = new URLSearchParams(window.location.search).get("q");
        if (!urlQ) return;
        var page = window.location.pathname;
        if (page.includes("destinos")) {
            var sf = document.getElementById("searchFilter");
            if (sf) { sf.value = urlQ; sf.dispatchEvent(new Event("input")); }
        }
        if (page.includes("pacotes")) {
            var sfp = document.getElementById("searchFilterPacotes");
            if (sfp) { sfp.value = urlQ; sfp.dispatchEvent(new Event("input")); }
        }
        // Pre-fill the hero search bar too
        if (searchInput) { searchInput.value = urlQ; }
    }

    // ── Injetar secção de pesquisa ABAIXO DA HERO ─────────────────────────────
    function injectSearchSection() {
        // Só injecta em páginas que têm hero (não no dashboard, checkout, etc.)
        var hero = document.querySelector(".hero, .page-hero");
        if (!hero) return;

        // Não duplicar
        if (document.getElementById("heroSearchSection")) return;

        var placeholder = window.i18n ? i18n.t("search.placeholder") : "Pesquisar destinos e pacotes...";

        var section = document.createElement("section");
        section.id = "heroSearchSection";
        section.className = "hero-search-section";
        section.innerHTML =
            '<div class="container">' +
            '<div class="hero-search-bar">' +
            '<i class="fas fa-search hero-search-icon"></i>' +
            '<input type="text" id="heroSearchInput" class="hero-search-input"' +
            ' placeholder="' + escapeHtml(placeholder) + '"' +
            ' data-i18n-placeholder="search.placeholder"' +
            ' autocomplete="off">' +
            '<button type="button" class="hero-search-clear" id="heroSearchClear" style="display:none" aria-label="Limpar">' +
            '<i class="fas fa-times"></i>' +
            '</button>' +
            '</div>' +
            '<div class="hero-search-results" id="heroSearchResults" style="display:none"></div>' +
            '</div>';

        // Insere imediatamente depois da hero
        hero.parentNode.insertBefore(section, hero.nextSibling);

        searchInput   = document.getElementById("heroSearchInput");
        searchResults = document.getElementById("heroSearchResults");

        // Eventos do input
        searchInput.addEventListener("input", function() {
            var q = searchInput.value;
            var clearBtn = document.getElementById("heroSearchClear");
            if (clearBtn) clearBtn.style.display = q ? "flex" : "none";
            loadSearchData().then(function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() { renderResults(q); }, 180);
            });
        });

        searchInput.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                searchInput.value = "";
                searchResults.innerHTML = "";
                searchResults.style.display = "none";
                var clearBtn = document.getElementById("heroSearchClear");
                if (clearBtn) clearBtn.style.display = "none";
            }
        });

        var clearBtn = document.getElementById("heroSearchClear");
        if (clearBtn) {
            clearBtn.addEventListener("click", function() {
                searchInput.value = "";
                clearBtn.style.display = "none";
                searchResults.innerHTML = "";
                searchResults.style.display = "none";
                searchInput.focus();
            });
        }

        // Atalho Ctrl+K ou /
        document.addEventListener("keydown", function(e) {
            if ((e.key === "/" || (e.ctrlKey && e.key === "k")) &&
                document.activeElement !== searchInput &&
                document.activeElement.tagName !== "INPUT" &&
                document.activeElement.tagName !== "TEXTAREA") {
                e.preventDefault();
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });

        // Re-traduz ao mudar língua
        document.addEventListener("languageChanged", function() {
            if (searchInput && window.i18n) {
                searchInput.placeholder = i18n.t("search.placeholder");
            }
            if (searchInput && searchInput.value) {
                renderResults(searchInput.value);
            }
        });
    }

    // ── Inicialização ─────────────────────────────────────────────────────────
    function init() {
        injectSearchSection();
        setTimeout(loadSearchData, 800);
        applyUrlQuery();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
