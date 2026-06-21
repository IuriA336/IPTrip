from flask import Blueprint, jsonify, request
from db import get_db

reservas_bp = Blueprint("reservas", __name__)


@reservas_bp.get("/api/reservas/<int:user_id>")
def get_reservas(user_id):
    db = get_db()
    rows = db.execute("""
        SELECT b.booking_id, b.data_reserva, b.total, b.estado,
               COALESCE(p.nome, d.nome) AS nome_destino
        FROM bookings b
        LEFT JOIN travel_packages p ON b.package_id = p.package_id
        LEFT JOIN destinations d ON b.destination_id = d.destination_id
        WHERE b.user_id=?
        ORDER BY b.data_reserva DESC
    """, (user_id,)).fetchall()

    return jsonify([dict(r) for r in rows])


@reservas_bp.post("/api/reservas")
def criar_reserva():
    data = request.json
    user_id = data.get("user_id")
    package_id = data.get("package_id")
    destination_id = data.get("destination_id")
    total = data.get("total", 0)

    if not user_id:
        return jsonify({"status": "error", "message": "user_id obrigatorio"}), 400

    db = get_db()
    cursor = db.execute(
        "INSERT INTO bookings (user_id, package_id, destination_id, total) VALUES (?, ?, ?, ?)",
        (user_id, package_id, destination_id, total),
    )
    db.commit()

    return jsonify({"status": "ok", "booking_id": cursor.lastrowid})


@reservas_bp.get("/api/reservas/booking/<int:booking_id>")
def get_booking(booking_id):
    db = get_db()
    row = db.execute("""
        SELECT b.booking_id, b.user_id, b.package_id, b.destination_id,
               b.data_reserva, b.total, b.estado,
               COALESCE(p.nome, d.nome) AS nome_destino,
               COALESCE(p.imagem_url, d.imagem_url) AS imagem_url,
               p.duracao AS duracao,
               u.nome AS user_nome, u.email AS user_email
        FROM bookings b
        LEFT JOIN travel_packages p ON b.package_id = p.package_id
        LEFT JOIN destinations d ON b.destination_id = d.destination_id
        LEFT JOIN users u ON b.user_id = u.user_id
        WHERE b.booking_id=?
    """, (booking_id,)).fetchone()

    if not row:
        return jsonify({"status": "error", "message": "Reserva nao encontrada"}), 404

    return jsonify(dict(row))


@reservas_bp.post("/api/reservas/<int:booking_id>/confirmar")
def confirmar_booking(booking_id):
    db = get_db()
    existing = db.execute("SELECT booking_id FROM bookings WHERE booking_id=?", (booking_id,)).fetchone()

    if not existing:
        return jsonify({"status": "error", "message": "Reserva nao encontrada"}), 404

    db.execute("UPDATE bookings SET estado='confirmada' WHERE booking_id=?", (booking_id,))
    db.commit()

    return jsonify({"status": "ok"})