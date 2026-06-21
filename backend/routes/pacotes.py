from flask import Blueprint, jsonify, request
from db import get_db

pacotes_bp = Blueprint("pacotes", __name__)


@pacotes_bp.get("/api/pacotes")
def listar_pacotes():
    db = get_db()
    # O seed de dados acumulou multiplas copias dos mesmos 8 pacotes (mesmo nome,
    # descricao, etc., apenas com package_id diferente). Para evitar listar o
    # mesmo pacote repetidamente, devolvemos apenas uma ocorrencia por nome
    # (a de menor package_id), preservando a ordenacao por popularidade.
    rows = db.execute("""
        SELECT package_id, nome, descricao, preco, duracao,
               popularidade, destino_principal, categoria, imagem_url,
               item1, item2, item3, item4
        FROM travel_packages
        WHERE package_id IN (
            SELECT MIN(package_id) FROM travel_packages GROUP BY nome
        )
        ORDER BY popularidade DESC, package_id ASC
    """).fetchall()

    pacotes = []
    for r in rows:
        p = dict(r)
        p["itens_incluidos"] = [i for i in [p.pop("item1"), p.pop("item2"), p.pop("item3"), p.pop("item4")] if i]
        pacotes.append(p)

    return jsonify(pacotes)


@pacotes_bp.get("/api/pacotes/<int:package_id>")
def detalhes_pacote(package_id):
    db = get_db()
    row = db.execute("""
        SELECT package_id, nome, descricao, preco, duracao,
               popularidade, destino_principal, categoria, imagem_url,
               item1, item2, item3, item4
        FROM travel_packages
        WHERE package_id=?
    """, (package_id,)).fetchone()

    if not row:
        return jsonify({"error": "Pacote nao encontrado"}), 404

    p = dict(row)
    p["itens_incluidos"] = [i for i in [p.pop("item1"), p.pop("item2"), p.pop("item3"), p.pop("item4")] if i]
    return jsonify(p)


@pacotes_bp.get("/api/pacotes/filtrar")
def filtrar_pacotes():
    destino = request.args.get("destino")
    preco = request.args.get("preco")
    duracao = request.args.get("duracao")
    categoria = request.args.get("categoria")

    db = get_db()
    query = """
        SELECT package_id, nome, descricao, preco, duracao,
               popularidade, destino_principal, categoria, imagem_url
        FROM travel_packages
        WHERE package_id IN (SELECT MIN(package_id) FROM travel_packages GROUP BY nome)
    """
    params = []

    if destino:
        query += " AND destino_principal=?"
        params.append(destino)

    if categoria:
        query += " AND categoria=?"
        params.append(categoria)

    if preco:
        ranges = {
            "low": " AND preco <= 2000",
            "medium": " AND preco BETWEEN 2000 AND 4000",
            "high": " AND preco BETWEEN 4000 AND 6000",
            "premium": " AND preco >= 6000",
        }
        query += ranges.get(preco, "")

    if duracao:
        dur_ranges = {
            "curta": " AND duracao <= 5",
            "media": " AND duracao BETWEEN 6 AND 8",
            "longa": " AND duracao > 8",
        }
        query += dur_ranges.get(duracao, "")

    query += " ORDER BY popularidade DESC, package_id ASC"
    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])