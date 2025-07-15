import sqlite3

from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
DB_NAME = BASE_DIR / "fitcheck.db"

def sql_query(query: str, params: tuple =(), fetch: bool = False):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cur  = conn.cursor()
    cur.execute(query, params)

    if fetch:
        rows = cur.fetchall()
        conn.close()
        return rows
    else:
        conn.commit()
        conn.close()



def init_db():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            firebase_uid TEXT UNIQUE NOT NULL,
            avatar_url   TEXT,
            bio          TEXT,
            username     TEXT,
            style        TEXT,
            gender       TEXT,
            age          INTEGER
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS clothes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            image_url   TEXT NOT NULL,
            type        TEXT,
            color       TEXT,
            etiquette   TEXT,
            description TEXT,
            timetag     DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS posts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id   INTEGER NOT NULL,
            image_url   TEXT NOT NULL,
            caption     TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            like_count  INTEGER DEFAULT 0,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS follows (
            follower_id INTEGER NOT NULL,
            followed_id INTEGER NOT NULL,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (follower_id, followed_id),
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS likes (
            post_id    INTEGER NOT NULL,
            user_id    INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """,
        # index for fast feed ordering
        "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);",
         """
    CREATE TABLE IF NOT EXISTS post_clothes (
        post_id   INTEGER NOT NULL,
        clothes_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, clothes_id),
        FOREIGN KEY (post_id)  REFERENCES posts(id)   ON DELETE CASCADE,
        FOREIGN KEY (clothes_id) REFERENCES clothes(id) ON DELETE CASCADE
    )
    """,
    """
CREATE TABLE IF NOT EXISTS recent_searches (
    user_id      INTEGER NOT NULL,
    searched_id  INTEGER NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, searched_id),
    FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (searched_id) REFERENCES users(id) ON DELETE CASCADE
)
"""

    ]

    for stmt in statements:
        sql_query(stmt)


def get_or_create_user_id(firebase_uid: str) -> int:
    row = sql_query(
        "SELECT id FROM users WHERE firebase_uid = ?",
        params=(firebase_uid,),
        fetch=True,
    )
    if row:
        return row[0]["id"]

    sql_query("INSERT INTO users (firebase_uid) VALUES (?)", (firebase_uid,))
    new_id = sql_query("SELECT last_insert_rowid()", fetch=True)[0][0]
    return new_id

def create_post(author_id: int, image_url: str, caption: str = "") -> int:
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO posts (author_id, image_url, caption) VALUES (?, ?, ?)",
        (author_id, image_url, caption)
    )
    post_id = cur.lastrowid   
    conn.commit()
    conn.close()
    return post_id



def toggle_like(user_id: int, post_id: int):
    liked = sql_query(
        "SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?",
        (post_id, user_id),
        fetch=True
    )

    if liked:
        # unlike
        sql_query(
            "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
            (post_id, user_id)
        )
        sql_query(
            "UPDATE posts SET like_count = like_count - 1 WHERE id = ?",
            (post_id,)
        )
    else:
        # like
        sql_query(
            "INSERT INTO likes (post_id, user_id) VALUES (?, ?)",
            (post_id, user_id)
        )
        sql_query(
            "UPDATE posts SET like_count = like_count + 1 WHERE id = ?",
            (post_id,)
        )


def toggle_follow(follower_id: int, followed_id: int):
    if follower_id == followed_id:
        return  
    exists = sql_query(
        "SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?",
        (follower_id, followed_id),
        fetch=True
    )

    if exists:
        sql_query(
            "DELETE FROM follows WHERE follower_id = ? AND followed_id = ?",
            (follower_id, followed_id)
        )
    else:
        sql_query(
            "INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)",
            (follower_id, followed_id)
        )


def get_feed(
    user_id: int,
    limit: int = 20,
    offset: int = 0
) -> list[dict]:
    rows = sql_query(
        "SELECT followed_id FROM follows WHERE follower_id = ?",
        (user_id,),
        fetch=True
    )
    author_ids = [r["followed_id"] for r in rows] + [user_id]

    placeholders = ",".join("?" * len(author_ids))
    query = f"""
        SELECT p.*, u.username, u.avatar_url
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.author_id IN ({placeholders})
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    """
    rows = sql_query(
        query,
        (*author_ids, limit, offset),
        fetch=True
    )

    posts = []
    for r in rows:
        post = dict(r)
        post["clothes"] = clothes_for_post(post["id"]) 
        posts.append(post)

    return posts

def get_following(user_id: int) -> list[dict]:
    rows = sql_query("""
        SELECT u.id, u.username, u.avatar_url
        FROM follows f
        JOIN users u ON f.followed_id = u.id
        WHERE f.follower_id = ?
    """, (user_id,), fetch=True)
    return [dict(r) for r in rows]

def add_clothes_to_post(post_id: int, clothes_ids: list[int]):
    for cid in clothes_ids:
        sql_query(
            "INSERT OR IGNORE INTO post_clothes (post_id, clothes_id) VALUES (?, ?)",
            (post_id, cid)
        )

def clothes_for_post(post_id: int) -> list[dict]:
    rows = sql_query("""
        SELECT c.id, c.image_url
        FROM post_clothes pc
        JOIN clothes c ON pc.clothes_id = c.id
        WHERE pc.post_id = ?
    """, (post_id,), fetch=True)
    return [dict(r) for r in rows]

#searches
#search routes
def top_users(limit: int, current_id: int):
    return sql_query("""
        SELECT u.id, u.username, u.avatar_url,
               EXISTS (SELECT 1 FROM follows
                       WHERE follower_id = ? AND followed_id = u.id) AS isFollowing,
               (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.id) AS followers
        FROM users u
        WHERE u.id != ?
        ORDER BY followers DESC
        LIMIT ?
    """, (current_id, current_id, limit), fetch=True)

def search_users(q: str, current_id: int):
    q = f'%{q.lower()}%'
    return sql_query("""
        SELECT u.id, u.username, u.avatar_url,
               EXISTS (SELECT 1 FROM follows
                       WHERE follower_id = ? AND followed_id = u.id) AS isFollowing
        FROM users u
        WHERE LOWER(u.username) LIKE ?
          AND u.id != ?
        LIMIT 20
    """, (current_id, q, current_id), fetch=True)

def recent_searches(uid: int):
    return sql_query("""
        SELECT DISTINCT s.searched_id AS id,
               u.username, u.avatar_url,
               EXISTS (SELECT 1 FROM follows
                       WHERE follower_id = ? AND followed_id = u.id) AS isFollowing
        FROM recent_searches s
        JOIN users u ON u.id = s.searched_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 10
    """, (uid, uid), fetch=True)
