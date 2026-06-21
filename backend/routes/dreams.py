from flask import Blueprint, request, jsonify
from db import get_db

dreams_bp = Blueprint("dreams", __name__)


@dreams_bp.post("/api/dreams/add")
def add_dream():
    data = request.json
    user_id = data.get("user_id")
    destination_id = data.get("destination_id")

    if not user_id or not destination_id:
        return jsonify({"status": "error", "message": "Dados incompletos"}), 400

    db = get_db()

    existing = db.execute(
        "SELECT dream_id FROM dream_list WHERE user_id=? AND destination_id=?",
        (user_id, destination_id),
    ).fetchone()

    if existing:
        return jsonify({"status": "error", "message": "Destino ja esta na sua lista de desejos"}), 400

    db.execute(
        "INSERT INTO dream_list (user_id, destination_id) VALUES (?, ?)",
        (user_id, destination_id),
    )
    db.commit()

    return jsonify({"status": "ok"})


@dreams_bp.delete("/api/dreams/delete/<int:dream_id>")
def delete_dream(dream_id):
    db = get_db()
    db.execute("DELETE FROM dream_list WHERE dream_id=?", (dream_id,))
    db.commit()
    return jsonify({"status": "ok"})


@dreams_bp.get("/api/dreams/check/<int:user_id>/<int:destination_id>")
def check_dream(user_id, destination_id):
    db = get_db()
    row = db.execute(
        "SELECT dream_id FROM dream_list WHERE user_id=? AND destination_id=?",
        (user_id, destination_id),
    ).fetchone()

    return jsonify({"in_wishlist": row is not None, "dream_id": row["dream_id"] if row else None})


@dreams_bp.get("/api/dreams/<int:user_id>")
def get_dreams(user_id):
    db = get_db()
    rows = db.execute("""
        SELECT dl.dream_id, dl.data_adicionado,
               d.destination_id, d.nome, d.pais, d.descricao,
               d.preco_medio, d.imagem_url, d.continente, d.tipo
        FROM dream_list dl
        JOIN destinations d ON dl.destination_id = d.destination_id
        WHERE dl.user_id=?
        ORDER BY dl.data_adicionado DESC
    """, (user_id,)).fetchall()

    return jsonify([dict(r) for r in rows])