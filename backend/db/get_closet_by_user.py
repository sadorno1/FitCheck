from db.init_db import sql_query

def get_closet_by_user(user_id):
    query = f'''
        SELECT * FROM clothes
        WHERE user_id = {user_id}
        ORDER BY type
    '''
    return sql_query(query, fetch=True)

