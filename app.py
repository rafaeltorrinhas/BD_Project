import os
import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request, redirect, url_for
import pyodbc
import math
import json
from querrys import querrys

load_dotenv()

DB_DRIVER = os.getenv('DB_DRIVER')
DB_SERVER = os.getenv('DB_SERVER')
DB_PORT = os.getenv('DB_PORT')
DB_DATABASE = os.getenv('DB_DATABASE')
DB_USER = os.getenv('DB_USER',     'none')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'none')

q = querrys()


def get_connection():

    if (DB_USER == 'none'):
        conn_str = ("Driver={ODBC Driver 17 for SQL Server};"
                    f"Server={os.getenv('DB_SERVER')};"
                    f"Database={os.getenv('DB_DATABASE')};"
                    "Trusted_Connection=yes;"
                    )
    else:
        conn_str = (
            f"Driver={{{DB_DRIVER}}};"
            f"Server={DB_SERVER},{DB_PORT};"
            f"Database={DB_DATABASE};"
            f"UID={DB_USER};"
            f"PWD={DB_PASSWORD};"
        )

    return pyodbc.connect(conn_str)


app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


def getInfo(query, params=None):
    try:
        cnxn = get_connection()
        cursor = cnxn.cursor()
        if params is not None:
            cursor.execute(query, params) 
        else:
            cursor.execute(query)

        cols = [col[0] for col in cursor.description]
        raw_rows = cursor.fetchall()

        serialized = []
        for row in raw_rows:
            new_row = []
            for cell in row:
                if isinstance(cell, (datetime.date, datetime.time, datetime.datetime)):
                    new_row.append(cell.isoformat())
                else:
                    new_row.append(cell)
            serialized.append(new_row)

        cursor.close()
        cnxn.close()
        return cols, serialized
    except Exception as e:
        print(f"Error: {e}")
        return [], []


@app.route('/api/table_columns')
def table_columns():
    cnxn = get_connection()
    cursor = cnxn.cursor()
    cursor.execute("""
        SELECT t.TABLE_NAME, c.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLES AS t
          JOIN INFORMATION_SCHEMA.COLUMNS AS c
            ON t.TABLE_NAME = c.TABLE_NAME
         WHERE t.TABLE_TYPE = 'BASE TABLE'
         ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    """)
    tables = {}
    for tbl, col in cursor.fetchall():
        tables.setdefault(tbl, []).append(col)
    cursor.close()
    cnxn.close()
    return jsonify(tables)


@app.route('/api/table/<table_name>')
def get_table(table_name):
    cols, serialized = getInfo(f"SELECT * FROM [{table_name}]")
    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/Uni/')
def get_uni():
    querry = q.get_Unis()
    cols, serialized = getInfo(querry)

    return render_template('uni.html', title='Universidades', columns=cols, rows=serialized)


@app.route('/Ass/')
def get_ass():
    return render_template('ass.html', title='Associações')


@app.route('/api/AssInfo')
def get_Ass_Info():
    page = request.args.get('page', 1, type=int)
    per_page = 15
    offset = (page - 1) * per_page

    filters = []
    params = []

    acc_name = request.args.get('acc_name', '').strip()
    if acc_name:
        filters.append("ass.Name LIKE ?")
        params.append(f"%{acc_name}%")

    modalidades = request.args.getlist('modalidade')
    if modalidades:
        placeholders = ','.join(['?'] * len(modalidades))
        filters.append(f"mod.Id IN ({placeholders})")
        params.extend(modalidades)

    sort_by = request.args.get('sort_by', '').strip()
    sort_clause = "ORDER BY ass.Id"
    if sort_by:
        sort_map = {
            "name_asc": "ass.Name ASC",
            "name_desc": "ass.Name DESC",
            "sigla_asc": "ass.Sigla ASC",
            "sigla_desc": "ass.Sigla DESC",
            "ouro_asc": "Ouro ASC",
            "ouro_desc": "Ouro DESC",
            "prata_asc": "Prata ASC",
            "prata_desc": "Prata DESC",
            "bronze_asc": "Bronze ASC",
            "bronze_desc": "Bronze DESC"
        }
        sort_clause = f"ORDER BY {sort_map.get(sort_by, 'ass.Id')}"

    query = q.get_Ass()

    if filters:
        query += " WHERE " + " AND ".join(filters)

    query += '''
                GROUP BY
                    ass.Id, ass.Name, ass.Sigla
        '''

    query += f'''
        {sort_clause}
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
        '''
    params_with_paging = params + [offset, per_page]
    associations_cols, associations_data = getInfo(query, params_with_paging)

    # Count query for pagination
    count_query = '''
        SELECT COUNT(*) 
        FROM 
            FADU_ASSOCIAÇAO_ACADEMICA ass
        LEFT JOIN
            FADU_ASSMODALIDADE ma ON ass.Id = ma.Ass_Id
        LEFT JOIN
            FADU_MODALIDADE mod ON ma.Mod_Id = mod.Id
        '''
    if filters:
        count_query += " WHERE " + " AND ".join(filters)
    count_query += " GROUP BY ass.Id, ass.Name, ass.Sigla"
    count_cols, count_data = getInfo(count_query, params)
    total_ass = len(count_data) if count_data else 0
    total_pages = math.ceil(total_ass / per_page)

    response = {
        'columns': associations_cols,
        'rows': associations_data,
        'total_ass': total_ass,
        'total_pages': total_pages,
        'current_page': page
    }
    return jsonify(response)


@app.route('/Jogos/')
def get_Jogos():
    return render_template('jogos.html', title='Jogos')


@app.route('/logging/')
def get_log():
    return render_template('logging.html', title='log')


@app.route('/api/log',methods=['POST'])
def get_logInfo():
    try:
        data = request.get_json()
        password = data.get('pass')
        email =data.get('mail')

        callUserPro('EXEC dbo.ValidateLogin',[email,password])
        return jsonify({'status': 'success'}), 201
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400
        
    


@app.route('/api/register',methods=['POST'])
def get_regInfo():
    try:
        data = request.get_json()
        password = data.get('pass')
        email = data.get('mail')

        if not email or not password:
            return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400

        result = callUserPro('EXEC dbo.InsertLogin ?, ?', [email, password])

        return jsonify({'status': 'success'}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'status': 'error', 'message': 'An error occurred during registration'}), 500




@app.route('/api/jogo/<Id>', methods=['DELETE', 'GET', 'PUT'])
def get_jogos_id(Id):
    if request.method == 'GET':
        querry = '''SELECT * FROM FADU_JOGO WHERE Id=?'''
        cols, serialized = getInfo(querry, [Id])
        return jsonify({'columns': cols, 'rows': serialized})
    elif request.method == 'PUT':

        data = request.get_json()

        required_fields = ['hostTeam', 'opponentTeam', 'modality', 'date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        host_team = data.get('hostTeam')
        opponent_team = data.get('opponentTeam')
        modality = data.get('modality')
        duration = data.get('duration', '00:00')
        phase = data.get('phase')
        location = data.get('location', '')
        date = data.get('date')
        result = data.get('result', '')  

        # Validate that host and opponent teams are different
        if host_team == opponent_team:
            return jsonify({'error': 'Host team and opponent team cannot be the same'}), 400

        update_query = q.put_jogo()

        params = [
            date,
            duration,
            result,
            location,
            phase if phase else None,  
            modality,
            host_team,
            opponent_team,
            Id
        ]
        print(update_query)
        print(params)
        callUserPro(update_query, params)
        return jsonify({'status': 'success'})
    elif request.method == 'DELETE':
        callUserPro("DELETE FROM FADU_JOGO WHERE Id=?", [Id])
        return jsonify({'status': 'success'})


@app.route('/api/jogos/', methods=['POST', 'GET'])
def get_jogos():
    if request.method == 'GET':
        page = request.args.get('page', 1, type=int)
        per_page = 15
        offset = (page - 1) * per_page
        querry = q.get_Jogos()
        cols, serialized = getInfo(querry, [offset, per_page])
        return jsonify({'columns': cols, 'rows': serialized})
    else:
        data = request.get_json()
        print(data)
        host_team = data.get('hostTeam')
        opponent_team = data.get('opponentTeam')
        modality = data.get('modality')
        duration = data.get('duration')
        phase = data.get('phase')
        location = data.get('location')
        date = data.get('date')
        querry = q.post_jogo()
        callUserPro(querry, [date, duration, location,
                    phase, modality, host_team, opponent_team])
        return jsonify({'status': 'success'})


@app.route('/Jogos/<GameId>')
def get_Jogo_Id(GameId):
    # Query to get the game details
    query = q.get_Game_Details()
    cols, serialized = getInfo(query, GameId)

    # Query to get the team player details
    queryTeams = q.get_Player_From_Game()
    colsTeams, Teams = getInfo(queryTeams, GameId)

    game_result = serialized[0][2] if serialized else "Resultado não disponível"

    return render_template('jogoDetalhes.html',
                           jogoId=GameId,
                           columns=cols,
                           rows=serialized,
                           teamsColumns=colsTeams,
                           teamsPlayers=Teams,
                           game_result=game_result)


@app.route('/Fases/')
def get_Fases():
    query = f'''
    select * from FADU_FASE
    '''
    cols, serialized = getInfo(query)
    return render_template('fases.html', title='Fases', columns=cols, rows=serialized)


@app.route("/api/fases")
def get_fases():
    query = f'''
    select * from FADU_FASE
    '''
    cols, serialized = getInfo(query)
    return jsonify({'columns': cols, 'rows': serialized})


@app.route("/api/teams/<modId>")
def get_team_mod(modId):
    query = q.get_team_modId()
    cols, serialized = getInfo(query, [modId])
    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/Fases/<FaseId>')
def get_Fases_Id(FaseId):
    query = q.get_Fase_Info()
    cols, serialized = getInfo(query, FaseId)

    faseName = serialized[0][1] if serialized else "Fase desconhecida ou sem jogos."

    return render_template('faseDetalhes.html', faseName=faseName, columns=cols, rows=serialized)


@app.route('/Ass/<AssId>')
def get_Ass_Id(AssId):
    # Query to retrieve association details
    query = q.get_Ass_Details()

    # Query for medals
    teams_query = q.get_Ass_Teams()
    medals_query = q.get_Ass_Med()
    # Queries for athletes, coaches, and referees
    cols, association_data = getInfo(query, (AssId,))
    medals_cols, medals_data = getInfo(medals_query, (AssId,))
    teams_cols, teams_data = getInfo(teams_query, (AssId,))

    assName = association_data[0][1] if association_data else "Associação desconhecida"

    return render_template('assDetalhes.html',
                           AssName=assName,
                           columns=cols,
                           rows=association_data,
                           medals_columns=medals_cols,
                           medals_rows=medals_data,
                           teams_cols=teams_cols,
                           teams_rows=teams_data)


def callUserPro(query, params=None):
    try:
        cnxn = get_connection()
        cursor = cnxn.cursor()

        cursor.execute(query, params)

        cnxn.commit()
        cursor.close()
        cnxn.close()
        return "Sucess"

    except Exception as e:
        print(f"Error: {e}")


@app.route('/Inscritos', methods=['GET'])
def inscritos_page():
    return render_template('inscritos.html')


@app.route('/api/universityAss/<assId>', methods=['GET'])
def get_uni_accId(assId):
    query = '''SELECT Address, Name FROM FADU_UNIVERSIDADE WHERE Ass_id IS NULL'''
    uni_cols, uni_data = getInfo(query)
    return jsonify({'columns': uni_cols, 'rows': uni_data})


@app.route('/api/uniNullAss', methods=['GET'])
def get_uni_null_ass():
    query = '''SELECT Name FROM FADU_UNIVERSIDADE WHERE Ass_id IS NULL'''
    uni_cols, uni_data = getInfo(query)
    return jsonify({'columns': uni_cols, 'rows': uni_data})


@app.route('/api/search_athletes', methods=['GET'])
def search_athletes():
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = 15
    offset = (page - 1) * per_page

    if len(search) < 2:
        return jsonify([])

    query = '''
        SELECT
            person.Id AS Person_Id,
            person.Name AS Athlete_Name
        FROM
            FADU_ATLETA atle
        JOIN
            FADU_PERSON person ON person.Id = atle.Person_Id
        WHERE
            person.Name LIKE ?
        ORDER BY
            person.Id
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
    '''
    params = [f'%{search}%', offset, per_page]
    athletes_cols, athletes_data = getInfo(query, params)

    results = [[row[0], row[1]] for row in athletes_data]

    # Count query for pagination
    count_query = '''
        SELECT COUNT(*)
        FROM
            FADU_ATLETA atle
        JOIN
            FADU_PERSON person ON person.Id = atle.Person_Id
        WHERE
            person.Name LIKE ?
    '''
    count_cols, count_data = getInfo(count_query, [f'%{search}%'])
    total_athletes = count_data[0][0] if count_data else 0
    total_pages = math.ceil(total_athletes / per_page)

    response = {
        'columns': athletes_cols,
        'rows': results,
        'total_athletes': total_athletes,
        'total_pages': total_pages,
        'current_page': page
    }
    return jsonify(response)


@app.route('/api/associacoes', methods=['GET', 'POST'])
def api_get_associacoes():
    if request.method == 'POST':
        try:
            name = request.form.get('assName', '').strip()
            sigla = request.form.get('assSigla', '').strip()
            raw_universities = request.form.get('universities', '[]')
            raw_modalidades = request.form.get('modalidades', '[]')
            print("Raw universities:", raw_universities)
            print("Raw modalidades:", raw_modalidades)
            try:
                universities = json.loads(raw_universities) if raw_universities else []
            except Exception as e:
                print("Error parsing universities:", e)
                universities = []
            try:
                modalidades = json.loads(raw_modalidades) if raw_modalidades else []
            except Exception as e:
                print("Error parsing modalidades:", e)
                modalidades = []
            print("Parsed universities:", universities)
            print("Parsed modalidades:", modalidades)
            if not universities:
                return jsonify({'status': 'error', 'message': 'No universities selected'})

            university_address = universities[0]  

            cnxn = get_connection()
            cursor = cnxn.cursor()

            sql = '''
            DECLARE @NewAccId INT;
            EXEC dbo.addAss @assName=?, @assSigla=?, @universityAddress=?, @NewAccId=@NewAccId OUTPUT;
            SELECT @NewAccId;
            '''
            cursor.execute(sql, (name, sigla, university_address))
            new_ass_id = cursor.fetchone()[0]

            cnxn.commit()
            cursor.close()
            cnxn.close()

            if len(universities) > 1:
                for university_address in universities[1:]:
                    callUserPro(
                        'UPDATE FADU_UNIVERSIDADE SET Ass_Id = ? WHERE Address = ?',
                        [new_ass_id, university_address])

            # Insert modalidades for the new association
            if modalidades:
                for modalidade in modalidades:
                    callUserPro(
                        'INSERT INTO FADU_ASSMODALIDADE (Ass_Id, Mod_Id) VALUES (?, ?)',
                        [new_ass_id, modalidade]
                    )

            return jsonify({'status': 'success'})
        except Exception as e:
            print("Error in /api/associacoes POST:", e)
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
        associations_query = "SELECT Id, Name FROM FADU_ASSOCIAÇAO_ACADEMICA"
        associations_cols, associations_data = getInfo(associations_query)
        return jsonify({'columns': associations_cols, 'rows': associations_data})


@app.route('/api/associacoes/<ass>', methods=['DELETE'])
def api_delete_ass(ass):
    try:
        callUserPro("EXEC dbo.deleteAcc ?", [ass])

        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/api/associacoes/<ass>', methods=['PUT'])
def api_update_ass(ass):
    try:
        assName = request.form.get('assName')
        assSigla = request.form.get('assSigla')
        universities = json.loads(request.form.get('universities', '[]'))
        modalidades = json.loads(request.form.get('modalidades', '[]'))

        if not universities:
            return jsonify({'status': 'error', 'message': 'No universities selected'})

        university_address = universities[0] 

        cnxn = get_connection()
        cursor = cnxn.cursor()
        
        # First, remove the association from any university that currently has it
        cursor.execute('UPDATE FADU_UNIVERSIDADE SET Ass_Id = NULL WHERE Ass_Id = ?', [ass])
        
        # Then update the association and assign it to the first university
        cursor.execute('''
            UPDATE FADU_ASSOCIAÇAO_ACADEMICA 
            SET Name = ?, Sigla = ? 
            WHERE Id = ?
        ''', [assName, assSigla, ass])
        
        # Update the first university
        cursor.execute('''
            UPDATE FADU_UNIVERSIDADE 
            SET Ass_Id = ? 
            WHERE Address = ?
        ''', [ass, university_address])
        
        # Update remaining universities if any
        if len(universities) > 1:
            for university_address in universities[1:]:
                cursor.execute('''
                    UPDATE FADU_UNIVERSIDADE 
                    SET Ass_Id = ? 
                    WHERE Address = ?
                ''', [ass, university_address])
        
        cnxn.commit()
        cursor.close()
        cnxn.close()

        # Remove old modalidades
        callUserPro('DELETE FROM FADU_ASSMODALIDADE WHERE Ass_Id = ?', [ass])
        # Insert new modalidades
        if modalidades:
            for modalidade in modalidades:
                callUserPro(
                    'INSERT INTO FADU_ASSMODALIDADE (Ass_Id, Mod_Id) VALUES (?, ?)',
                    [ass, modalidade]
                )

        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/api/search_associacoes', methods=['GET'])
def search_ass():
    search = request.args.get('search', '').strip()
    print(f"[DEBUG] /api/search_associacoes called with search='{search}'")
    page = request.args.get('page', 1, type=int)
    per_page = 15
    offset = (page - 1) * per_page

    if len(search) < 2:
        response = {
            'columns': [],
            'rows': [],
            'total_ass': 0,
            'total_pages': 0,
            'current_page': page
        }
        return jsonify(response)

    query = q.get_Ass_Search_Name()
    params = [f'%{search}%', offset, per_page]
    acc_cols, acc_data = getInfo(query, params)
    results = [
        [row[0], row[1], row[2], row[3], row[4], row[5], row[6]]
        for row in acc_data
    ]

    count_query = q.get_Count_Ass_Search_Name()
    count_cols, count_data = getInfo(count_query, [f'%{search}%'])
    total_ass = count_data[0][0] if count_data else 0
    total_pages = math.ceil(total_ass / per_page)

    response = {
        'columns': acc_cols,
        'rows': results,
        'total_ass': total_ass,
        'total_pages': total_pages,
        'current_page': page
    }
    return jsonify(response)


@app.route('/api/modalidades', methods=['GET'])
def api_get_modalidades():
    modalidades_query = "SELECT Id, Name  from FADU_MODALIDADE"
    modalidades_cols, modalidades_data = getInfo(modalidades_query)
    return jsonify({'columns': modalidades_cols, 'rows': modalidades_data})


@app.route('/api/ass/<int:ass_id>/modalidades', methods=['GET'])
def api_get_ass_modalidades(ass_id):
    query = '''
    SELECT mod.Id, mod.Name
    FROM FADU_MODALIDADE mod
    JOIN FADU_ASSMODALIDADE am ON mod.Id = am.Mod_Id
    WHERE am.Ass_Id = ?
    '''
    cols, data = getInfo(query, (ass_id,))
    return jsonify({'columns': cols, 'rows': data})


@app.route('/api/ass/<int:ass_id>/modalidades', methods=['PUT'])
def api_update_ass_modalidades(ass_id):
    try:
        data = request.get_json()
        modalidades = data.get('modalidades', [])

        cnxn = get_connection()
        cursor = cnxn.cursor()

        # First, get current modalidades
        cursor.execute(
            "SELECT Mod_Id FROM FADU_ASSMODALIDADE WHERE Ass_Id = ?", (ass_id,))
        current_modalidades = [row[0] for row in cursor.fetchall()]

        # Get the IDs for the new modalidades
        cursor.execute("SELECT Id, Name FROM FADU_MODALIDADE WHERE Name IN ({})".format(
            ','.join(['?'] * len(modalidades))), modalidades)
        new_modalidades = {row[1]: row[0] for row in cursor.fetchall()}

        # Delete modalidades that are no longer selected
        cursor.execute("""
            DELETE FROM FADU_ASSMODALIDADE 
            WHERE Ass_Id = ? 
            AND Mod_Id NOT IN ({})
        """.format(','.join(['?'] * len(new_modalidades.values()))),
            [ass_id] + list(new_modalidades.values()))

        # Insert new modalidades that weren't already there
        for modalidade_name, modalidade_id in new_modalidades.items():
            cursor.execute("""
                IF NOT EXISTS (
                    SELECT 1 FROM FADU_ASSMODALIDADE 
                    WHERE Ass_Id = ? AND Mod_Id = ?
                )
                BEGIN
                    INSERT INTO FADU_ASSMODALIDADE (Ass_Id, Mod_Id)
                    VALUES (?, ?)
                END
            """, (ass_id, modalidade_id, ass_id, modalidade_id))

        cnxn.commit()
        cursor.close()
        cnxn.close()

        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating modalidades: {e}")  
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/inscritos/<athlete>', methods=['DELETE'])
def api_delete_athlete(athlete):
    try:
        athlete = int(athlete)
        callUserProcedure = '''
            EXEC dbo.deletePerson ? ;
        '''
        callUserPro(callUserProcedure, [athlete])
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Error deleting athlete: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/athlete/<int:athlete_id>', methods=['PUT'])
def update_athlete(athlete_id):
    nome = request.form.get('athleteName', '').strip()
    numero_cc = request.form.get('athleteNumeroCC', '').strip()
    date_birth = request.form.get('athleteDateBirth', '').strip()
    email = request.form.get('athleteEmail', '').strip()
    phone = request.form.get('athletePhone', '').strip()
    ass_id = request.form.get('athleteAssId', '').strip()

    try:
        cnxn = get_connection()
        cursor = cnxn.cursor()

        cursor.execute("""
            EXEC dbo.UpdateAthlete
                @Id = ?,
                @Name = ?,
                @NumeroCC = ?,
                @DateBirth = ?,
                @Email = ?,
                @Phone = ?,
                @Ass_Id = ?
        """, (athlete_id, nome, numero_cc, date_birth, email, phone, ass_id))

        cnxn.commit()

        cursor.close()
        cnxn.close()

        return jsonify({'status': 'success'}), 200

    except Exception as e:
        print(f"Error updating athlete: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/AssInscritos/<type>/<ass_id>', methods=['GET'])
def get_Ass_Inscritos_Type(type, ass_id):
    querry = q.get_Ass_Insc(str(type))
    cols, rows = getInfo(querry, [ass_id])
    return jsonify({'columns': cols, 'rows': rows})


@app.route('/api/athlete/<int:athlete_id>', methods=['GET'])
def get_athlete_details(athlete_id):
    query = """
    SELECT
        P.Id,
        P.Name,
        P.NumeroCC,
        P.DateBirth,
        P.Email,
        P.Phone,
        A.Name AS AssociationName,
        A.Id AS AssociationId
    FROM dbo.FADU_PERSON P
    INNER JOIN dbo.FADU_ASSOCIAÇAO_ACADEMICA A ON P.Ass_Id = A.Id
    WHERE P.Id = ?
    """
    cols, rows = getInfo(query, (athlete_id,))

    _, rowsCheck = getInfo('''
                         SELECT *  FROM dbo.FADU_ATLETA WHERE Person_id = ?
                         ''', (athlete_id,))
    if (rowsCheck):
        type = "athlete"
    else:
        _, rowsCheck = getInfo('''
                         SELECT *  FROM dbo.FADU_TREINADOR WHERE Person_id = ?
                         ''', (athlete_id,))
        if (rowsCheck):
            type = "coach"
        else:
            type = "refere"

    if rows:
        row = rows[0]
        modalidades_query = """
        SELECT m.Id, m.Name
        FROM FADU_MODALIDADE m
        JOIN FADU_PERSONMOD pm ON m.Id = pm.Mod_Id
        WHERE pm.Person_id = ?
        """
        modalidades_cols, modalidades_rows = getInfo(
            modalidades_query, (athlete_id,))

        athlete = {
            'id': row[0],
            'name': row[1],
            'numeroCC': row[2],
            'dateBirth': row[3][:10] if row[3] else None,
            'email': row[4],
            'phone': row[5],
            'associationName': row[6],
            'associationId': row[7],
            'modalidades': [{'id': m[0], 'name': m[1]} for m in modalidades_rows],
            'type': type
        }
        return jsonify(status='success', athlete=athlete)
    else:
        return jsonify(status='error', message='Athlete not found'), 404


@app.route('/api/athlete/<int:athlete_id>/modalidades', methods=['PUT'])
def api_update_athlete_modalidades(athlete_id):
    try:
        data = request.get_json()
        modalidades = data.get('modalidades', [])

        modalidades_ids = ','.join(str(m['id']) for m in modalidades)

        callUserProcedure = '''
            EXEC dbo.updateAthleteModalidades ?, ?;
        '''
        callUserPro(callUserProcedure, [athlete_id, modalidades_ids])

        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating athlete modalidades: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/inscritos', methods=['POST', 'GET'])
def api_add_athlete():
    if request.method == 'POST':
        nome = request.form.get('athleteName', '').strip()
        numero_cc = request.form.get('athleteNumeroCC', '').strip()
        date_birth = request.form.get('athleteDateBirth', '').strip()
        email = request.form.get('athleteEmail', '').strip()
        phone = request.form.get('athletePhone', '').strip()
        ass_id = request.form.get('athleteAssId', '').strip()
        modalidadesIds = request.form.get('modalidadesIds', '').strip()
        selectedType = int(request.form.get('selectedType', '').strip())
        if (selectedType==0):
            print('entrei')
            callUserProcessure = '''
            DECLARE @NewPersonId INT;
            EXEC dbo.addAthlete ?, ?, ?, ?, ?, ?,?, @NewPersonId OUTPUT;
            SELECT @NewPersonId;
            '''
        elif (selectedType == 1):
            callUserProcessure = '''
            DECLARE @NewPersonId INT;
            EXEC dbo.addTreinador ?, ?, ?, ?, ?, ?,?, @NewPersonId OUTPUT;
            SELECT @NewPersonId;
            '''
        elif (selectedType == 2):
            callUserProcessure = '''
            DECLARE @NewPersonId INT;
            EXEC dbo.addArbitro ?, ?, ?, ?, ?, ?,?, @NewPersonId OUTPUT;
            SELECT @NewPersonId;
            '''
        callUserPro(callUserProcessure, [
                    nome, numero_cc, date_birth, email, phone, ass_id, modalidadesIds])
        return jsonify({'status': 'success'})
    else:
        page = request.args.get('page', 1, type=int)
        per_page = 15
        offset = (page - 1) * per_page

        filters = []
        params = []

        cc_number = request.args.get('cc_number', '').strip()
        if cc_number:
            filters.append("NumeroCC LIKE ?")
            params.append(f"%{cc_number}%")

        phone_number = request.args.get('phone_number', '').strip()
        if phone_number:
            filters.append("Phone LIKE ?")
            params.append(f"%{phone_number}%")

        age = request.args.get('age', '').strip()
        if age:
            try:
                age_int = int(age)
                current_year = datetime.datetime.now().year
                birth_year = current_year - age_int
                filters.append("YEAR(DateBirth) = ?")
                params.append(birth_year)
            except ValueError:
                pass 

        inscrito_type = request.args.get('type', '').strip()
        if inscrito_type:
            filters.append("InscritoType = ?")
            params.append(inscrito_type)

        sort_by = request.args.get('sort_by', '').strip()
        sort_clause = "ORDER BY Person_Id"
        if sort_by:
            sort_map = {
                "name_asc": "Inscrito_Name ASC",
                "name_desc": "Inscrito_Name DESC",
                "age_asc": "DateBirth DESC",   
                "age_desc": "DateBirth ASC",  
                "birth_date_asc": "DateBirth ASC",
                "birth_date_desc": "DateBirth DESC",
                "association_asc": "Association_Name ASC",
                "association_desc": "Association_Name DESC",
                "type_asc": "InscritoType ASC",
                "type_desc": "InscritoType DESC"
            }
            sort_clause = f"ORDER BY {sort_map.get(sort_by, 'Person_Id')}"

        query = q.get_Atletas_search()+'''
        SELECT 
            Person_Id,
            Inscrito_Name,
            Modalidades,
            Association_Name,
            InscritoType
        FROM Inscritos
        '''

        if filters:
            query += " WHERE " + " AND ".join(filters)

        query += f'''
        {sort_clause}
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
        '''
        params_with_paging = params + [offset, per_page]

        inscritos_cols, inscritos_data = getInfo(query, params_with_paging)

        count_query = q.get_Atletas_search()+'''
        SELECT COUNT(*) FROM Inscritos
        '''
        if filters:
            count_query += " WHERE " + " AND ".join(filters)

        count_cols, count_data = getInfo(count_query, params)
        total_inscritos = count_data[0][0] if count_data else 0
        total_pages = math.ceil(total_inscritos / per_page)

        response = {
            'columns': inscritos_cols,
            'rows': inscritos_data,
            'total_inscritos': total_inscritos,
            'total_pages': total_pages,
            'current_page': page
        }
        return jsonify(response)


@app.route('/api/ass/<int:ass_id>/medalhas', methods=['POST', 'DELETE'])
def api_manage_medalhas(ass_id):

    if request.method == 'POST':
        data = request.get_json()
        modalidade = data.get('modalidade')
        tipo_medalha = data.get('tipoMedalha')
        ano = data.get('ano')
        print(ano, tipo_medalha, modalidade)

        callUserPro(
            """
                INSERT INTO FADU_MEDALHAS (Ass_Id, Mod_Id, TypeMedal_Id, Year)
                VALUES (?, ?, ?, ?)
            """, [ass_id, modalidade, tipo_medalha, ano]
        )

        return jsonify({"status": "success"})

    elif request.method == 'DELETE':
        data = request.get_json()
        modalidade = data.get('modalidade')
        tipo_medalha = data.get('tipoMedalha')
        ano = data.get('ano')
        print(ano, tipo_medalha, modalidade)

        callUserPro("""
                DELETE FROM FADU_MEDALHAS 
                WHERE Ass_Id = ? AND Mod_Id = ? AND Year = ?
            """, (ass_id, modalidade, ano))

        return jsonify({"status": "success"})


@app.route('/inscritos/<int:inscrito_id>')
def inscrito_details(inscrito_id):
    query = '''
    SELECT 
        person.Id,
        person.Name,
        person.NumeroCC,
        person.DateBirth,
        person.Email,
        person.Phone,
        ass.Name AS AssociationName,
        CASE 
            WHEN EXISTS (SELECT 1 FROM FADU_ATLETA a WHERE a.Person_Id = person.Id) THEN 'Athlete'
            WHEN EXISTS (SELECT 1 FROM FADU_TREINADOR t WHERE t.Person_Id = person.Id) THEN 'Coach'
            WHEN EXISTS (SELECT 1 FROM FADU_ARBITRO r WHERE r.Person_Id = person.Id) THEN 'Referee'
        END AS InscritoType,
        person.Ass_Id
    FROM 
        FADU_PERSON person
    JOIN
        FADU_ASSOCIAÇAO_ACADEMICA ass ON person.Ass_Id = ass.Id
    WHERE 
        person.Id = ?
    '''
    inscrito_cols, inscrito_data = getInfo(query, [inscrito_id])
    inscrito = inscrito_data[0] if inscrito_data else None

    if not inscrito:
        return "Inscrito não encontrado", 404

    modalidades = []
    athletes = []
    competitions = []

    if inscrito[7] == 'Athlete':
        modalidades_query = '''
        SELECT m.Id, m.Name
        FROM FADU_MODALIDADE m
        JOIN FADU_ATLETA_MODALIDADE am ON m.Id = am.Modalidade_Id
        WHERE am.Athlete_Id = ?
        '''
        modalidades_cols, modalidades_data = getInfo(
            modalidades_query, [inscrito_id])
        modalidades = modalidades_data

    elif inscrito[7] == 'Coach':
        # Get coach's athletes
        athletes_query = '''
        SELECT 
            a.Person_Id,
            p.Name
        FROM 
            FADU_ATLETA a
        JOIN 
            FADU_PERSON p ON p.Id = a.Person_Id
        WHERE 
            a.Coach_Id = ?
        '''
        athletes_cols, athletes_data = getInfo(athletes_query, [inscrito_id])
        athletes = athletes_data

    elif inscrito[7] == 'Referee':
        # Get referee's competitions
        competitions_query = '''
        SELECT 
            c.Id,
            c.Name
        FROM 
            FADU_COMPETICAO c
        JOIN 
            FADU_ARBITRO_COMPETICAO ac ON c.Id = ac.Competicao_Id
        WHERE 
            ac.Arbitro_Id = ?
        '''
        competitions_cols, competitions_data = getInfo(
            competitions_query, [inscrito_id])
        competitions = competitions_data

    return render_template('inscrito_details.html',
                           inscrito=inscrito,
                           modalidades=modalidades,
                           athletes=athletes,
                           competitions=competitions)


@app.route('/api/inscritos/edit', methods=['POST'])
def api_edit_inscrito():
    inscrito_id = request.form.get('id', '').strip()
    name = request.form.get('name', '').strip()
    numero_cc = request.form.get('numeroCC', '').strip()
    date_birth = request.form.get('dateBirth', '').strip()
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    ass_id = request.form.get('assId', '').strip()
    modalidadesIds = request.form.get('modalidadesIds', '').strip()

    # Get inscrito type
    query = '''
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM FADU_ATLETA a WHERE a.Person_Id = ?) THEN 'Athlete'
            WHEN EXISTS (SELECT 1 FROM FADU_TREINADOR t WHERE t.Person_Id = ?) THEN 'Coach'
            WHEN EXISTS (SELECT 1 FROM FADU_ARBITRO r WHERE r.Person_Id = ?) THEN 'Referee'
        END AS InscritoType
    '''
    cols, data = getInfo(query, [inscrito_id, inscrito_id, inscrito_id])
    inscrito_type = data[0][0] if data else None

    if not inscrito_type:
        return jsonify({'status': 'error', 'message': 'Inscrito não encontrado'})

    # Update person info
    update_person_query = '''
    UPDATE FADU_PERSON
    SET Name = ?, NumeroCC = ?, DateBirth = ?, Email = ?, Phone = ?, Ass_Id = ?
    WHERE Id = ?
    '''
    callUserPro(update_person_query, [
                name, numero_cc, date_birth, email, phone, ass_id, inscrito_id])

    if inscrito_type == 'Athlete' and modalidadesIds:
        # Delete existing modalidades
        delete_modalidades_query = '''
        DELETE FROM FADU_ATLETA_MODALIDADE
        WHERE Athlete_Id = ?
        '''
        callUserPro(delete_modalidades_query, [inscrito_id])

        # Add new modalidades
        for modalidade_id in modalidadesIds.split(','):
            add_modalidade_query = '''
            INSERT INTO FADU_ATLETA_MODALIDADE (Athlete_Id, Modalidade_Id)
            VALUES (?, ?)
            '''
            callUserPro(add_modalidade_query, [inscrito_id, modalidade_id])

    return jsonify({'status': 'success'})


@app.route('/api/inscritos/delete/<int:inscrito_id>', methods=['POST'])
def api_delete_inscrito(inscrito_id):
    # Get inscrito type
    query = '''
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM FADU_ATLETA a WHERE a.Person_Id = ?) THEN 'Athlete'
            WHEN EXISTS (SELECT 1 FROM FADU_TREINADOR t WHERE t.Person_Id = ?) THEN 'Coach'
            WHEN EXISTS (SELECT 1 FROM FADU_ARBITRO r WHERE r.Person_Id = ?) THEN 'Referee'
        END AS InscritoType
    '''
    cols, data = getInfo(query, [inscrito_id, inscrito_id, inscrito_id])
    inscrito_type = data[0][0] if data else None

    if not inscrito_type:
        return jsonify({'status': 'error', 'message': 'Inscrito não encontrado'})

    if inscrito_type == 'Athlete':
        # Delete athlete's modalidades
        delete_modalidades_query = '''
        DELETE FROM FADU_ATLETA_MODALIDADE
        WHERE Athlete_Id = ?
        '''
        callUserPro(delete_modalidades_query, [inscrito_id])

        # Delete athlete record
        delete_athlete_query = '''
        DELETE FROM FADU_ATLETA
        WHERE Person_Id = ?
        '''
        callUserPro(delete_athlete_query, [inscrito_id])

    elif inscrito_type == 'Coach':
        # Update athletes to remove coach reference
        update_athletes_query = '''
        UPDATE FADU_ATLETA
        SET Coach_Id = NULL
        WHERE Coach_Id = ?
        '''
        callUserPro(update_athletes_query, [inscrito_id])

        # Delete coach record
        delete_coach_query = '''
        DELETE FROM FADU_TREINADOR
        WHERE Person_Id = ?
        '''
        callUserPro(delete_coach_query, [inscrito_id])

    elif inscrito_type == 'Referee':
        # Delete referee's competitions
        delete_competitions_query = '''
        DELETE FROM FADU_ARBITRO_COMPETICAO
        WHERE Arbitro_Id = ?
        '''
        callUserPro(delete_competitions_query, [inscrito_id])

        # Delete referee record
        delete_referee_query = '''
        DELETE FROM FADU_ARBITRO
        WHERE Person_Id = ?
        '''
        callUserPro(delete_referee_query, [inscrito_id])

    delete_person_query = '''
    DELETE FROM FADU_PERSON
    WHERE Id = ?
    '''
    callUserPro(delete_person_query, [inscrito_id])

    return jsonify({'status': 'success'})


@app.route('/api/ass/<int:assId>/teams', methods=['POST', 'DELETE'])
def api_ass_teams(assId):
    if request.method == 'DELETE':
        try:
            print(f"Attempting to delete team with ID: {assId}")  
            
            callUserPro('''
                DELETE FROM FADU_EQUIPA
                WHERE Id = ?
            ''', [assId])
            
            return jsonify({'status': 'success'})
        except Exception as e:
            print(f"Error deleting team: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:  
        try:
            data = request.get_json()
            modalidade = data.get('modalidade')
            players = data.get('players', [])

            if not modalidade:
                return jsonify({'status': 'error', 'message': 'Modalidade é obrigatória'}), 400

            insertq = '''
                INSERT INTO FADU_EQUIPA (Ass_Id, Mod_Id)
                OUTPUT INSERTED.Id
                VALUES (?, ?)
            '''
            cnxn = get_connection()
            cursor = cnxn.cursor()
            cursor.execute(insertq, [assId, modalidade])
            team_id = cursor.fetchone()[0]

            if players:
                for player_id in players:
                    cursor.execute('''
                        INSERT INTO FADU_PERSONEQUIPA (Person_Id, EQUIPA_Id)
                        VALUES (?, ?)
                    ''', [player_id, team_id])

            cnxn.commit()
            cursor.close()
            cnxn.close()

            return jsonify({'status': 'success'})
        except Exception as e:
            print(f"Error creating team: {e}")  
            return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/ranking')
def ranking_page():
    return render_template('ranking.html')

@app.route('/api/ranking')
def get_ranking():
    try:
        cnxn = get_connection()
        cursor = cnxn.cursor()

        cursor.execute('''
            EXEC dbo.ranking_cursor
        ''')

        rows = cursor.fetchall()
        rows = [list(row) for row in rows]

        return jsonify({
            'columns': ['Associação ID', 'Associação', 'Jogos Ganhos'],
            'rows': rows
        })
    except Exception as e:
        print(f"Error getting ranking: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/addUniversidades', methods=['GET'])
def add_universidades():
    query = 'SELECT Name AS UniName, Address AS UniEndereco FROM FADU_UNIVERSIDADE'
    cols, rows = getInfo(query)
    return jsonify({'columns': cols, 'rows': rows})


@app.route('/api/universidades', methods=['POST'])
def add_universidade():
    data = request.get_json()
    uniName = data.get('uniName')
    uniEndereco = data.get('uniEndereco')
    callUserPro(
        "INSERT INTO FADU_UNIVERSIDADE (Name, Address) VALUES (?, ?)",
        [uniName, uniEndereco]
    )
    return jsonify({'status': 'success'})

@app.route('/api/universidades', methods=['DELETE'])
def remove_universidade():
    data = request.get_json()
    uniName = data.get('uniName')
    uniAddress = data.get('uniAddress')
    print(f"[DEBUG] Received for delete: Name='{uniName}', Address='{uniAddress}'")
    query = "DELETE FROM FADU_UNIVERSIDADE WHERE Name = ? AND Address = ?"
    callUserPro(query, [uniName, uniAddress])
    return jsonify({'status': 'success'})




@app.route('/api/universidades/sem_associacao', methods=['GET'])
def universidades_sem_associacao():
    ass_id = request.args.get('assId')
    if ass_id:
        query = "SELECT Address, Name FROM FADU_UNIVERSIDADE WHERE Ass_Id IS NULL OR Ass_Id = ?"
        cols, rows = getInfo(query, [ass_id])
    else:
        query = "SELECT Address, Name FROM FADU_UNIVERSIDADE WHERE Ass_Id IS NULL"
        cols, rows = getInfo(query)
    return jsonify({'columns': cols, 'rows': rows})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

