from db.init_db import sql_query

def store_quiz_result(user_id, style):
    query = f'''
        UPDATE users
        SET style = '{style}'
        WHERE id = {user_id}
    '''
    sql_query(query)
