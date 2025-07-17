from db.init_db import sql_query

def get_closet_by_user(user_id):
  
    rows = sql_query(
        """
        SELECT id, user_id, image_url, type, color,
               etiquette, description, timetag
        FROM clothes
        WHERE user_id = ?
        ORDER BY type
        """,
        params=(user_id,),
        fetch=True
    )

    return [dict(r) for r in rows]

def get_user_style(user_id):
    row = sql_query(
        """
        SELECT COALESCE(style,'') AS style      
        FROM   users
        WHERE  id = ?
        """,
        (user_id,),
        fetch=True,
    )
    return row[0]["style"] if row else ""
