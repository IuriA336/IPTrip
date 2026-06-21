import sqlite3
import os
from flask import g

DB_PATH = os.path.join(os.path.dirname(__file__), "iptrip.db")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            telefone TEXT,
            password_hash TEXT NOT NULL,
            tipo_conta TEXT DEFAULT 'standard',
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS destinations (
            destination_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            pais TEXT NOT NULL,
            descricao TEXT,
            preco_medio REAL,
            continente TEXT,
            tipo TEXT,
            popularidade INTEGER DEFAULT 0,
            imagem_url TEXT,
            destaque1 TEXT,
            destaque2 TEXT,
            destaque3 TEXT,
            destaque4 TEXT
        );

        CREATE TABLE IF NOT EXISTS travel_packages (
            package_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco REAL,
            duracao INTEGER,
            popularidade INTEGER DEFAULT 0,
            destino_principal TEXT,
            categoria TEXT,
            imagem_url TEXT,
            item1 TEXT,
            item2 TEXT,
            item3 TEXT,
            item4 TEXT
        );

        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            package_id INTEGER,
            destination_id INTEGER,
            data_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total REAL,
            estado TEXT DEFAULT 'pendente',
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );

        CREATE TABLE IF NOT EXISTS dream_list (
            dream_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            destination_id INTEGER NOT NULL,
            data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (destination_id) REFERENCES destinations(destination_id),
            UNIQUE(user_id, destination_id)
        );

          CREATE TABLE IF NOT EXISTS destinations_en (
            destination_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_en TEXT NOT NULL,
            pais_en TEXT NOT NULL,
            descricao_en TEXT,
            preco_medio REAL,
            continente_en TEXT,
            tipo_en TEXT,
            popularidade INTEGER DEFAULT 0,
            imagem_url TEXT,
            destaque1_en TEXT,
            destaque2_en TEXT,
            destaque3_en TEXT,
            destaque4_en TEXT
        ); 

          CREATE TABLE IF NOT EXISTS travel_packages_en (
            package_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_en TEXT NOT NULL,
            descricao_en TEXT,
            preco REAL,
            duracao INTEGER,
            popularidade INTEGER DEFAULT 0,
            destino_principal_en TEXT,
            categoria_en TEXT,
            imagem_url TEXT,
            item1_en TEXT,
            item2_en TEXT,
            item3_en TEXT,
            item4_en TEXT
        ); 

          CREATE TABLE IF NOT EXISTS destinations_fr (
            destination_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_fr TEXT NOT NULL,
            pais_fr TEXT NOT NULL,
            descricao_fr TEXT,
            preco_medio REAL,
            continente_fr TEXT,
            tipo_fr TEXT,
            popularidade INTEGER DEFAULT 0,
            imagem_url TEXT,
            destaque1_fr TEXT,
            destaque2_fr TEXT,
            destaque3_fr TEXT,
            destaque4_fr TEXT
        );   

        CREATE TABLE IF NOT EXISTS travel_packages_fr (
            package_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_fr TEXT NOT NULL,
            descricao_fr TEXT,
            preco REAL,
            duracao INTEGER,
            popularidade INTEGER DEFAULT 0,
            destino_principal_fr TEXT,
            categoria_fr TEXT,
            imagem_url TEXT,
            item1_fr TEXT,
            item2_fr TEXT,
            item3_fr TEXT,
            item4_fr TEXT
        );  

          CREATE TABLE IF NOT EXISTS destinations_es (
            destination_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_es TEXT NOT NULL,
            pais_es TEXT NOT NULL,
            descricao_es TEXT,
            preco_medio REAL,
            continente_es TEXT,
            tipo_es TEXT,
            popularidade INTEGER DEFAULT 0,
            imagem_url TEXT,
            destaque1_es TEXT,
            destaque2_es TEXT,
            destaque3_es TEXT,
            destaque4_es TEXT
        ); 

          CREATE TABLE IF NOT EXISTS travel_packages_es (
            package_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_es TEXT NOT NULL,
            descricao_es TEXT,
            preco REAL,
            duracao INTEGER,
            popularidade INTEGER DEFAULT 0,
            destino_principal_es TEXT,
            categoria_es TEXT,
            imagem_url TEXT,
            item1_es TEXT,
            item2_es TEXT,
            item3_es TEXT,
            item4_es TEXT
        );  
    """)
    db.commit()

    cursor = db.execute("SELECT COUNT(*) FROM destinations")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_data(db)

    cursor = db.execute("SELECT COUNT(*) FROM destinations_en")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_data(db)

    cursor = db.execute("SELECT COUNT(*) FROM destinations_fr")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_data(db)

    cursor = db.execute("SELECT COUNT(*) FROM destinations_es")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_data(db)




def seed_data(db):
    destinations = [
        (1, "Paris", "Franca", "A cidade luz oferece romance, arte e gastronomia incomparável. Passeie pelos Champs-Elysees, visite o Louvre e desfrute de croissants frescos em cafés charmosos.", 2500, "Europa", "cultural,romantico,luxo", 95, "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", "Torre Eiffel", "Museu do Louvre", "Arco do Triunfo", "Notre-Dame"),
        (2, "Maldivas", "Maldivas", "Paraíso tropical com águas cristalinas e resorts exclusivos. Bangalôs sobre a água, mergulho com vida marinha exótica e pôr do sol inesquecível.", 5500, "Ásia", "praia,romantico,luxo", 92, "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80", "Resorts overwater", "Mergulho", "Praias paradisíacas", "Spa de luxo"),
        (3, "Nova York", "Estados Unidos", "A cidade que nunca dorme, repleta de cultura, arte e entretenimento. Da Broadway a Central Park, cada esquina conta uma história.", 3000, "América", "urbano,cultural,compras", 90, "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80", "Estátua da Liberdade", "Central Park", "Times Square", "Broadway"),
        (4, "Tóquio", "Japão", "Fusão perfeita entre tradição milenar e tecnologia futurista. Templos antigos ao lado de arranha-céus néon, gastronomia única.", 3500, "Ásia", "cultural,urbano,gastronomia", 88, "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80", "Templo Senso-ji", "Shibuya Crossing", "Monte Fuji", "Akihabara"),
        (5, "Cancún", "México", "Praias paradisíacas e ruínas maias em um só lugar. Águas turquesa, cenotes misteriosos e vida noturna vibrante.", 1800, "América", "praia,aventura,familia", 85, "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&q=80", "Praias de areia branca", "Ruínas Maias", "Cenotes", "Vida noturna"),
        (6, "Dubai", "Emirados Árabes Unidos", "Luxo e modernidade no coração do deserto árabe. Arranha-céus recordistas, shoppings gigantes e experiências únicas.", 4000, "Ásia", "luxo,compras,urbano,aventura", 87, "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", "Burj Khalifa", "Dubai Mall", "Safari no Deserto", "Palmeira de Jumeirah"),
        (7, "Roma", "Itália", "A cidade eterna onde a história vive em cada rua. Coliseu, Vaticano, gelato artesanal e a dolce vita italiana.", 2200, "Europa", "cultural,romantico,gastronomia", 89, "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80", "Coliseu", "Vaticano", "Fontana di Trevi", "Pantheon"),
        (8, "Santorini", "Grécia", "Ilhas gregas com pôr do sol espétacular e arquitetura icónica. Casas brancas com cúpulas azuis, vinhos locais e praias vulcânicas.", 2800, "Europa", "romantico,praia,luxo", 86, "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80", "Oia ao pôr do sol", "Praias vulcânicas", "Vinhos locais", "Fira"),
        (9, "Bali", "Indonésia", "Ilha dos Deuses com templos místicos, arrozais em terraços e surf de classe mundial. Espiritualidade e natureza em harmonia.", 1500, "Ásia", "praia,aventura,cultural", 84, "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", "Templo Uluwatu", "Arrozais de Tegallalang", "Ubud", "Praias de surf"),
        (10, "Barcelona", "Espanha", "Arquitetura de Gaudi, praias mediterrâneas e tapas incríveis. Uma cidade vibrante onde arte, cultura e festa se encontram.", 2000, "Europa", "cultural,praia,urbano,gastronomia", 83, "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80", "Sagrada Família", "Park Guell", "Las Ramblas", "Praia de Barceloneta"),
        (11, "Machu Picchu", "Peru", "Cidade perdida dos Incas nas alturas dos Andes. Uma das maravilhas do mundo moderno, cheia de mistério e beleza natural.", 2100, "América", "aventura,cultural", 82, "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80", "Cidadela Inca", "Trilha Inca", "Vale Sagrado", "Águas Quentes"),
        (12, "Londres", "Reino Unido", "Capital britânica com história milenar, museus de classe mundial e vida cultural vibrante. Do Big Ben a Camden Town.", 2700, "Europa", "cultural,urbano,compras", 88, "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80", "Big Ben", "Museu Britâncio", "Tower Bridge", "Palácio de Buckingham"),
    ]
    db.executemany("""
        INSERT INTO destinations (destination_id, nome, pais, descricao, preco_medio, continente, tipo, popularidade, imagem_url, destaque1, destaque2, destaque3, destaque4)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, destinations)

def seed_data(db):
    destinations_en = [
        ("Paris", "France", "The city of light offers romace, art and an incomparable cuisine. Stroll along the Champs-Élysées, visit the Louvre, and enjoy fresh croissants at charming cafés.", 2500, "Europe", "cultural,romantic,luxury", 95, "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", "Eiffel Tower", "The Louvre Musuem", "Triumphal Arch", "Notre-Dame"),
        ("Maldives", "Maldives", "A tropical paradise with crystal-clear waters and exclusive resorts. Overwater bungalows, diving among exotic marine life, and unforgettable sunsets.", 5500, "Asia", "beach,romantic,luxury", 92, "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80", "Overwater Resorts", "Sea Dive", "Paradisiacal Beaches", "Luxury Spa"),
        ("New York", "United States", "The city that never sleeps, brimming with culture, art, and entertainment. From Broadway to Central Park, every corner tells a story.", 3000, "America", "urban,cultural,shopping", 90, "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80", "Estatua da Liberdade", "Central Park", "Times Square", "Broadway"),
        ("Tokyo", "Japan", "A perfect fusion of ancient tradition and futuristic technology. Ancient temples alongside neon-lit skyscrapers, unique cuisine.", 3500, "Asia", "cultural,urban,gastronomy", 88, "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80", "Senso-ji Temple", "Shibuya Crossing", "Mount Fuji", "Akihabara"),
        ("Cancun", "Mexico", "Paradise-like beaches and Mayan ruins all in one place. Turquoise waters, mysterious cenotes, and vibrant nightlife.", 1800, "America", "beach,adventure,family", 85, "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&q=80", "Beaches with White Sand", "Mayan ruins", "Cenotes", "Nightlife"),
        ("Dubai", "United Arab Emirates", "Luxury and modernity in the heart of the Arabian Desert. Record-breaking skyscrapers, giant shopping malls, and unique experiences.", 4000, "Asia", "luxury,shopping,urban,adventure", 87, "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", "Burj Khalifa", "Dubai Mall", "Safari on the Desert", "Jumeirah Palm"),
        ("Rome", "Italy", "A cidade eterna onde a historia vive em cada rua. Coliseu, Vaticano, gelato artesanal e a dolce vita italiana.", 2200, "Europa", "cultural,romantic,gastronomy", 89, "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80", "Colosseum", "Vatican", "Fontana di Trevi", "Pantheon"),
        ("Santorini", "Greece", "Greek islands with spectacular sunsets and iconic architecture. White houses with blue domes, local wines, and volcanic beaches.", 2800, "Europe", "romantic,beach,luxury", 86, "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80", "Oia at Sunset", "Vulcanic Beaches", "Local Wines", "Fira"),
        ("Bali", "Indonesia", "The Island of the Gods, with mystical temples, terraced rice paddies, and world-class surfing. Spirituality and nature in harmony.", 1500, "Asia", "beach,adventure,cultural", 84, "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", "Uluwatu Temple", "Tegallalang Terraced Rice Paddies", "Ubud", "Surf Beaches"),
        ("Barcelona", "Spain", "Gaudí's architecture, Mediterranean beaches, and incredible tapas. A vibrant city where art, culture, and partying come together.", 2000, "Europe", "cultural,beach,urban,gastronomy", 83, "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80", "Sagrada Familia", "Park Guell", "Las Ramblas", "Barceloneta Beach"),
        ("Machu Picchu", "Peru", "The lost city of the Incas high in the Andes. One of the wonders of the modern world, full of mystery and natural beauty.", 2100, "America", "adventure,cultural", 82, "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80", "Cidadela Inca", "Inca Trail", "Sacred Valley", "Hot Waters"),
        ("London", "United Kingdom", "A British capital with a history stretching back thousands of years, world-class museums, and a vibrant cultural scene. From Big Ben to Camden Town.", 2700, "Europe", "cultural,urban,shopping", 88, "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80", "Big Ben", "British Museum", "Tower Bridge", "Buckingham Palace"),
    ]
    db.executemany("""
        INSERT INTO destinations (nome_en, pais_en, descricao_en, preco_medio, continente_en, tipo, popularidade, imagem_url, destaque1_en, destaque2_en, destaque3_en, destaque4_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, destinations_en)

def seed_data(db):
    destinations_fr = [
        ("Paris", "France", "La Ville Lumière offre romance, art et une cuisine incomparable. Promenez-vous sur les Champs-Élysées, visitez le Louvre et dégustez des croissants tout juste sortis du four dans de charmants cafés", 2500, "Europe", "culturel, romantique, luxe", 95, "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", "Tour Eiffel", "Musée du Louvre", "Arc de Triomphe", "Notre-Dame"),
        ("Maldives", "Maldives", "Un paradis tropical aux eaux cristallines et aux complexes hôteliers exclusifs. Des bungalows sur pilotis, de la plongée au milieu d’une faune marine exotique et des couchers de soleil inoubliables.", 5500, "Asie", "plage, romantique, luxe", 92, "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80", "Complexes hôteliers sur pilotis", "Plongée en mer", "Plages paradisiaques", "Spa de luxe"),
        ("New York", "États-Unis", "La ville qui ne dort jamais, débordante de culture, d'art et de divertissements. De Broadway à Central Park, chaque recoin raconte une histoire.", 3000, "Amérique", "urbain, culturel, shopping", 90, "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80", "Statue de la Liberté", "Central Park", "Times Square", "Broadway"),
        ("Tokyo", "Japon", "Une fusion parfaite entre tradition ancestrale et technologie futuriste. Des temples anciens côtoient des gratte-ciel illuminés par les néons, une cuisine unique.", 3500, "Asie", "culture, ville, gastronomie", 88, "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80", "Temple Senso-ji", "Carrefour de Shibuya", "Mont Fuji", "Akihabara"),
        ("Cancún", "Mexique", "Des plages paradisiaques et des ruines mayas, le tout au même endroit. Des eaux turquoise, des cénotes mystérieux et une vie nocturne animée. ", 1800, "Amérique", "plage, aventure, famille", 85, "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&q=80", "Plages de sable blanc", "Ruines mayas", "Cénotes", "Vie nocturne"),
        ("Dubai", "United Arab Emirates", "Luxury and modernity in the heart of the Arabian Desert. Record-breaking skyscrapers, giant shopping malls, and unique experiences.", 4000, "Asia", "luxury,shopping,urban,adventure", 87, "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", "Burj Khalifa", "Dubai Mall", "Safari on the Desert", "Jumeirah Palm"),
        ("Rome", "Italy", "A cidade eterna onde a historia vive em cada rua. Coliseu, Vaticano, gelato artesanal e a dolce vita italiana.", 2200, "Europa", "cultural,romantic,gastronomy", 89, "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80", "Colosseum", "Vatican", "Fontana di Trevi", "Pantheon"),
        ("Santorini", "Greece", "Greek islands with spectacular sunsets and iconic architecture. White houses with blue domes, local wines, and volcanic beaches.", 2800, "Europe", "romantic,beach,luxury", 86, "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80", "Oia at Sunset", "Vulcanic Beaches", "Local Wines", "Fira"),
        ("Bali", "Indonesia", "The Island of the Gods, with mystical temples, terraced rice paddies, and world-class surfing. Spirituality and nature in harmony.", 1500, "Asia", "beach,adventure,cultural", 84, "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", "Uluwatu Temple", "Tegallalang Terraced Rice Paddies", "Ubud", "Surf Beaches"),
        ("Barcelona", "Spain", "Gaudí's architecture, Mediterranean beaches, and incredible tapas. A vibrant city where art, culture, and partying come together.", 2000, "Europe", "cultural,beach,urban,gastronomy", 83, "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80", "Sagrada Familia", "Park Guell", "Las Ramblas", "Barceloneta Beach"),
        ("Machu Picchu", "Peru", "The lost city of the Incas high in the Andes. One of the wonders of the modern world, full of mystery and natural beauty.", 2100, "America", "adventure,cultural", 82, "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80", "Cidadela Inca", "Inca Trail", "Sacred Valley", "Hot Waters"),
        ("London", "United Kingdom", "A British capital with a history stretching back thousands of years, world-class museums, and a vibrant cultural scene. From Big Ben to Camden Town.", 2700, "Europe", "cultural,urban,shopping", 88, "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80", "Big Ben", "British Museum", "Tower Bridge", "Buckingham Palace"),
    ]
    

    packages = [
        ("Romance em Paris", "7 noites em hotel 4 estrelas com vista para a Torre Eiffel, jantar em restaurante Michelin e cruzeiro no Sena.", 3200, 7, 95, "Paris", "romantico", "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80", "Voo ida e volta", "Hotel 4 estrelas", "Jantar romantico", "Cruzeiro no Sena"),
        ("Lua de Mel nas Maldivas", "10 noites em resort overwater all-inclusive com spa, mergulho e jantar privado na praia.", 8500, 10, 92, "Maldivas", "romantico", "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80", "Resort overwater", "All-inclusive", "Spa para casal", "Jantar na praia"),
        ("Aventura em Toquio", "8 noites explorando templos, bairros neon, gastronomia e cultura pop japonesa.", 4200, 8, 88, "Toquio", "cultural", "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80", "Hotel em Shinjuku", "Japan Rail Pass", "Tour gastronomico", "Dia no Monte Fuji"),
        ("New York Explorer", "5 noites em Manhattan com ingressos para Broadway, visita a museus e tour de helicóptero.", 3800, 5, 87, "Nova York", "urbano", "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80", "Hotel em Manhattan", "Ingressos Broadway", "Museus incluidos", "Tour helicoptero"),
        ("Praias de Cancun", "7 noites all-inclusive em resort 5 estrelas com excursoes a ruinas maias e cenotes.", 2400, 7, 85, "Cancun", "praia", "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80", "Resort 5 estrelas", "All-inclusive", "Tour ruinas maias", "Cenotes"),
        ("Dubai Luxury", "6 noites de luxo com safari no deserto, Burj Khalifa e experiencias exclusivas.", 5500, 6, 86, "Dubai", "luxo", "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80", "Hotel 5 estrelas", "Safari no deserto", "Burj Khalifa VIP", "Jantar no Atmosphere"),
        ("Roma Classica", "5 noites descobrindo o Coliseu, Vaticano e a gastronomia italiana autentica.", 2100, 5, 84, "Roma", "cultural", "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&q=80", "Hotel no centro", "Tour guiado", "Aula de culinaria", "Vaticano sem fila"),
        ("Bali Espiritual", "9 noites entre templos, arrozais e praias. Inclui retiro de yoga e aulas de surf.", 2000, 9, 83, "Bali", "aventura", "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80", "Villa privada", "Retiro de yoga", "Aulas de surf", "Tour de templos"),
    ]

    db.executemany("""
        INSERT INTO travel_packages (nome, descricao, preco, duracao, popularidade, destino_principal, categoria, imagem_url, item1, item2, item3, item4)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, packages)

    db.commit()