from db.init_db import sql_query

def store_quiz_result(user_id, style):
    query = '''
        UPDATE users
        SET style = ?
        WHERE id = ?
    '''
    sql_query(query, params=(style, user_id))
