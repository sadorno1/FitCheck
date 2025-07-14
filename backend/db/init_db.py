import sqlite3

from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
DB_NAME = BASE_DIR / "fitcheck.db"

def init_db():
    init_table_user_query= """
    CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT UNIQUE NOT NULL,
                avatar_url TEXT,
                bio TEXT,
                username TEXT,
                style TEXT,
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
                timetag DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
    """
    init_table_posts_query = """  
        CREATE TABLE IF NOT EXISTS posts (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id     INTEGER NOT NULL,
            image_url     TEXT NOT NULL,
            caption       TEXT,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
            like_count    INTEGER DEFAULT 0,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
    init_follow = """
 CREATE TABLE IF NOT EXISTS follows (
            follower_id  INTEGER NOT NULL,
            followed_id  INTEGER NOT NULL,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (follower_id, followed_id),
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    init_likes = """
 CREATE TABLE IF NOT EXISTS likes (
            post_id    INTEGER NOT NULL,
            user_id    INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
        )
        """
    
    init_index="CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);"
    
    sql_query(init_table_user_query)
    sql_query(init_table_clothes_query)
    sql_query(init_table_posts_query)
    sql_query(init_follow)
    sql_query(init_likes)
    sql_query(init_index)     


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
    escaped = firebase_uid.replace("'", "''")

    # look-up
    rows = sql_query(f"SELECT id FROM users WHERE firebase_uid = '{escaped}'",
                     fetch=True)
    if rows:
        return rows[0][0]

    # insert
    sql_query(f"INSERT INTO users (firebase_uid) VALUES ('{escaped}')")
    new_id = sql_query("SELECT last_insert_rowid()", fetch=True)[0][0]
    return new_id
