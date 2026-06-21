from flask import Blueprint, jsonify, request
from db import get_db

destinos_bp = Blueprint("destinos", __name__)


@destinos_bp.get("/api/destinos")
def listar_destinos():
    db = get_db()
    rows = db.execute("""
        SELECT destination_id, nome, pais, descricao, preco_medio,
               continente, tipo, popularidade, imagem_url,
               destaque1, destaque2, destaque3, destaque4
        FROM destinations
        ORDER BY popularidade DESC
    """).fetchall()

    destinos = []
    for r in rows:
        d = dict(r)
        d["destaques"] = [h for h in [d.pop("destaque1"), d.pop("destaque2"), d.pop("destaque3"), d.pop("destaque4")] if h]
        destinos.append(d)

    return jsonify(destinos)


@destinos_bp.get("/api/destinos/<int:destination_id>")
def detalhes_destino(destination_id):
    db = get_db()
    row = db.execute("""
        SELECT destination_id, nome, pais, descricao, preco_medio,
               continente, tipo, popularidade, imagem_url,
               destaque1, destaque2, destaque3, destaque4
        FROM destinations
        WHERE destination_id=?
    """, (destination_id,)).fetchone()

    if not row:
        return jsonify({"error": "Destino nao encontrado"}), 404

    d = dict(row)
    d["destaques"] = [h for h in [d.pop("destaque1"), d.pop("destaque2"), d.pop("destaque3"), d.pop("destaque4")] if h]
    return jsonify(d)


@destinos_bp.get("/api/destinos/filtrar")
def filtrar_destinos():
    continente = request.args.get("continente")
    tipo = request.args.get("tipo")
    preco = request.args.get("preco")

    db = get_db()
    query = """
        SELECT destination_id, nome, pais, descricao, preco_medio,
               continente, tipo, popularidade, imagem_url
        FROM destinations WHERE 1=1
    """
    params = []

    if continente:
        query += " AND continente=?"
        params.append(continente)

    if tipo:
        query += " AND tipo LIKE ?"
        params.append(f"%{tipo}%")

    if preco:
        ranges = {
            "low": " AND preco_medio <= 1500",
            "medium": " AND preco_medio BETWEEN 1500 AND 3000",
            "high": " AND preco_medio BETWEEN 3000 AND 5000",
            "premium": " AND preco_medio >= 5000",
        }
        query += ranges.get(preco, "")

    query += " ORDER BY popularidade DESC"
    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])