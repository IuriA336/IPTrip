from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/api/register")
def register():
    data = request.json
    nome = data.get("nome")
    email = data.get("email")
    telefone = data.get("telefone", "")
    password = data.get("password")

    if not nome or not email or not password:
        return jsonify({"status": "error", "message": "Dados incompletos"}), 400

    db = get_db()
    existing = db.execute("SELECT user_id FROM users WHERE email=?", (email,)).fetchone()
    if existing:
        return jsonify({"status": "error", "message": "Email ja registado"}), 400

    password_hash = generate_password_hash(password)
    cursor = db.execute(
        "INSERT INTO users (nome, email, telefone, password_hash) VALUES (?, ?, ?, ?)",
        (nome, email, telefone, password_hash),
    )
    db.commit()

    return jsonify({"status": "ok", "user_id": cursor.lastrowid})


@auth_bp.post("/api/login")
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    db = get_db()
    user = db.execute(
        "SELECT user_id, password_hash, nome FROM users WHERE email=?", (email,)
    ).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"status": "error", "message": "Credenciais invalidas"}), 401

    return jsonify({"status": "ok", "user_id": user["user_id"], "nome": user["nome"]})