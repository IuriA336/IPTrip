from flask import Blueprint, jsonify
from db import get_db

clientes_bp = Blueprint("clientes", __name__)


@clientes_bp.get("/api/user/<int:user_id>")
def get_user(user_id):
    db = get_db()
    user = db.execute(
        "SELECT user_id, nome, email, telefone, tipo_conta, data_criacao FROM users WHERE user_id=?",
        (user_id,),
    ).fetchone()

    if not user:
        return jsonify({"status": "error", "message": "Utilizador nao encontrado"}), 404

    return jsonify(dict(user))