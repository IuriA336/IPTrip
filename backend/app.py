from flask import Flask
from flask_cors import CORS
from db import init_db, close_db
from routes.auth import auth_bp
from routes.clientes import clientes_bp
from routes.destinos import destinos_bp
from routes.pacotes import pacotes_bp
from routes.reservas import reservas_bp
from routes.dreams import dreams_bp


def create_app():
    app = Flask(__name__, static_folder="../frontend", static_url_path="")
    app.config["SECRET_KEY"] = "iptrip-secret-key-2024"
    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(clientes_bp)
    app.register_blueprint(destinos_bp)
    app.register_blueprint(pacotes_bp)
    app.register_blueprint(reservas_bp)
    app.register_blueprint(dreams_bp)

    @app.teardown_appcontext
    def teardown(exception):
        close_db()

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    with app.app_context():
        init_db()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)