from db.init_db import sql_query

def save_item_to_db(user_id, image_url, tags):
    query = '''
        INSERT INTO clothes (user_id, image_url, type, color, etiquette, description)
        VALUES (?, ?, ?, ?, ?, ?)
    '''
    params = (
        user_id,
        image_url,
        tags.get("type"),
        tags.get("color"),
        tags.get("etiquette"),
        tags.get("description")
    )
    sql_query(query, params=params)
