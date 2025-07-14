import sqlite3

DB_NAME = 'fitcheck.db'

def init_db():
    init_table_user_query= """
    CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT UNIQUE NOT NULL,
                username TEXT
                style TEXT
                age INTEGER
            )
    """

    init_table_clothes_query= """
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
    """
    sql_query(init_table_user_query)
    sql_query(init_table_clothes_query)


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

def get_or_create_user_id(firebase_uid: str) -> int:
    rows = sql_query(
        "SELECT id FROM user WHERE firebase_uid = ?",
        params=(firebase_uid,),
        fetch=True,
    )
    if rows:
        return rows[0][0]          

    sql_query(
        "INSERT INTO user (firebase_uid) VALUES (?)",
        params=(firebase_uid,),
        fetch=False,
    )
    rows = sql_query(
        "SELECT last_insert_rowid()",
        fetch=True,
    )
    return rows[0][0]