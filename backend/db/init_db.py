import sqlite3

DB_NAME = 'fitcheck.db'

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firebase_uid TEXT UNIQUE NOT NULL,
            username TEXT
            style TEXT
            age INTEGER
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS clothes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            type TEXT,
            color TEXT,
            etiquette TEXT,
            description TEXT,
            timetag DATETIME DEFAULT CURRENT_TIMESTAMP
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()

def sql_query(query, fetch=False):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute(query)
    if fetch:
        result = c.fetchall()
        conn.close()
        return result
    else:
        conn.commit()
        conn.close()
