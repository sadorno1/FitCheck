from db.init_db import sql_query

def insert_clothing_item(user_id, image_url, tags):
    query = f'''
        INSERT INTO clothes (user_id, image_url, type, color, etiquette, description)
        VALUES ({user_id}, '{image_url}', '{tags.get("type")}', '{tags.get("color")}', '{tags.get("etiquette")}', '{tags.get("description")}')
    '''
    sql_query(query)
