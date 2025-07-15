from db.init_db import sql_query

def store_quiz_result(
    user_id,
    username,
    avatar_url,
    bio,
    age,
    gender,
    style_labels,
):

    style = ", ".join(style_labels)

    query = """
        UPDATE users
        SET username   = ?,
            avatar_url = ?,
            bio        = ?,
            age        = ?,
            gender     = ?,
            style      = ?
        WHERE id = ?
    """
    sql_query(query, params=(username, avatar_url, bio, age, gender, style, user_id))
