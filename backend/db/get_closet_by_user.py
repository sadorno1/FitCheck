from db.init_db import sql_query

def get_closet_by_user(user_id: int):
    rows = sql_query(
        f"""
        SELECT id, user_id, image_url, type, color,
               etiquette, description, timetag
        FROM clothes
        WHERE user_id = {user_id}
        ORDER BY type
        """,
        fetch=True
    )

    # map each row to a dict with named keys
    return [
        {
            "id": r[0],
            "user_id": r[1],
            "image_url": r[2],
            "type": r[3],
            "color": r[4],
            "etiquette": r[5],
            "description": r[6],
            "timetag": r[7],
        }
        for r in rows
    ]