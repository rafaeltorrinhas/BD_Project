import os
import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request, redirect, url_for
import pyodbc
import math


load_dotenv()

DB_DRIVER = os.getenv('DB_DRIVER')
DB_SERVER = os.getenv('DB_SERVER')
DB_PORT = os.getenv('DB_PORT')
DB_DATABASE = os.getenv('DB_DATABASE')
DB_USER = os.getenv('DB_USER',     'none')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'none')


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
# acho que o params é o suficiente para parar sql ejection


def getInfo(query, params=None):
    try:
        cnxn = get_connection()
        cursor = cnxn.cursor()
        if params is not None:
            cursor.execute(query, params)  # Ensure params is passed as a tuple
        else:
            cursor.execute(query)

        # Collect columns and rows
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

    cols, serialized = getInfo(
        '''
            SELECT
            uni.Name AS Nome,
            uni.Address AS Endereço,
            ass.Id as IdAssociação,
            ass.Name AS NomeAssociação,
            ass.Sigla AS SiglaAssociação
            FROM
            FADU_UNIVERSIDADE uni
            JOIN
            FADU_ASSOCIAÇAO_ACADEMICA ass
            ON uni.Ass_Id = ass.Id
            '''
    )

    return render_template('uni.html', title='Universidades', columns=cols, rows=serialized)


@app.route('/Ass/')
def get_ass():

    return render_template('ass.html', title='Associações')



@app.route('/api/AssInfo')
def get_Acc_Info():
        page = request.args.get('page', 1, type=int)
        per_page = 15
        offset = (page - 1) * per_page

        filters = []
        params = []

        # Filter: acc Name
        acc_name = request.args.get('acc_name', '').strip()
        if acc_name:
            filters.append("ass.Name LIKE ?")
            params.append(f"%{acc_name}%")


        # Sorting
        sort_by = request.args.get('sort_by', '').strip()
        sort_clause = "ORDER BY ass.Id"
        if sort_by:
            sort_map = {
                "name_asc": "ass.Name ASC",
                "name_desc": "ass.Name DESC",
                "sigla_asc": "ass.Sigla ASC",
                "sigla_desc": "ass.Sigla DESC",
                "ouro_asc" : "Ouro ASC",
                "ouro_desc" : "Ouro DESC",
                "prata_asc": "Prata ASC",
                "prata_desc": "Prata DESC",
                "bronze_asc": "Bronze ASC",
                "bronze_desc": "Bronze DESC"
            }
            sort_clause = f"ORDER BY {sort_map.get(sort_by, 'ass.Id')}"

        # Base query
        query = (
            '''
                SELECT
                    ass.Id AS Id,
                    ass.Name AS Nome,
                    ass.Sigla AS Sigla,
                    STRING_AGG(mod.Name, ', ') AS Modalidades,
                    SUM(CASE WHEN tm.Type = 'Ouro' THEN 1 ELSE 0 END) AS Ouro,
                    SUM(CASE WHEN tm.Type = 'Prata' THEN 1 ELSE 0 END) AS Prata,
                    SUM(CASE WHEN tm.Type = 'Bronze' THEN 1 ELSE 0 END) AS Bronze

                FROM
                    FADU_ASSOCIAÇAO_ACADEMICA ass
                LEFT JOIN
                    FADU_ASSMODALIDADE ma ON ass.Id = ma.Ass_Id
                LEFT JOIN
                    FADU_MODALIDADE mod ON ma.Mod_Id = mod.Id
                LEFT JOIN
                    FADU_MEDALHAS med ON ma.Mod_Id = med.Mod_Id AND ma.Ass_Id = med.Ass_Id
                LEFT JOIN
                    FADU_TIPOMEDALHA tm ON med.TypeMedal_Id = tm.Id
                GROUP BY
                    ass.Id, ass.Name, ass.Sigla

                '''
        )

        if filters:
            query += " WHERE " + " AND ".join(filters)

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
            FADU_ASSOCIAÇAO_ACADEMICA 
        '''
        if filters:
            count_query += " WHERE " + " AND ".join(filters)

        count_cols, count_data = getInfo(count_query, params)
        total_ass = count_data[0][0] if count_data else 0
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
    cols, serialized = getInfo(
        '''
        SELECT
            jogo.Id AS ID,
            accCasa.Name AS Casa,
            jogo.Resultado AS Resultado,
            accOponente.Name AS Fora,
            mod.Name AS Modalidade  -- Add Modality Name
        FROM
            FADU_JOGO jogo
        LEFT JOIN
            FADU_EQUIPA casa ON casa.Id = jogo.Equipa_id1
        LEFT JOIN
            FADU_EQUIPA oponente ON oponente.Id = jogo.Equipa_id2
        LEFT JOIN
            FADU_ASSOCIAÇAO_ACADEMICA accCasa ON accCasa.Id = casa.Ass_id
        LEFT JOIN
            FADU_ASSOCIAÇAO_ACADEMICA accOponente ON accOponente.Id = oponente.Ass_id
        LEFT JOIN
            FADU_MODALIDADE mod ON mod.Id = jogo.Mod_Id
        '''
    )
    return render_template('jogos.html', title='Jogos', columns=cols, rows=serialized)


@app.route('/Jogos/<GameId>')
def get_Jogo_Id(GameId):
    # Query to get the game details
    query = f'''
    SELECT
         jogo.Id AS Id,
         accCasa.[Name] AS Casa,
         jogo.Resultado AS Resultado,
         accOponente.[Name] AS Oponente,
         jogo.Duracao AS Tempo,
         Jogo.LocalJogo AS Local,
         mod.[Name] AS Modalidade
     FROM FADU_JOGO jogo
     INNER JOIN FADU_MODALIDADE mod ON mod.Id=jogo.Mod_Id
     INNER JOIN FADU_EQUIPA casa ON casa.Id = jogo.Equipa_id1
     INNER JOIN FADU_EQUIPA oponente ON oponente.Id = jogo.Equipa_id2
     INNER JOIN FADU_ASSOCIAÇAO_ACADEMICA accCasa ON accCasa.Id = casa.Ass_id
     INNER JOIN FADU_ASSOCIAÇAO_ACADEMICA accOponente ON accOponente.Id = oponente.Ass_id
     WHERE jogo.Id = ?
    '''
    cols, serialized = getInfo(query, GameId)

    # Query to get the team player details
    queryTeams = f'''
        SELECT
            T.TeamType,
            T.TeamId,
            person.[Name] AS PlayerName,
            person.Id AS PlayerId
        FROM FADU_JOGO jogo
        CROSS APPLY (VALUES
            ('Host', jogo.Equipa_id1),
            ('Opponent', jogo.Equipa_id2)
        ) AS T(TeamType, TeamId)
        JOIN FADU_PERSONEQUIPA personTeam ON personTeam.EQUIPA_Id = T.TeamId
        JOIN FADU_PERSON person ON person.Id = personTeam.Person_Id
        WHERE jogo.Id = ?
        ORDER BY T.TeamType, PlayerName, PlayerId;
    '''
    colsTeams, Teams = getInfo(queryTeams, GameId)

    # Get the game result (from the `Resultado` field)
    game_result = serialized[0][2] if serialized else "Resultado não disponível"

    # Pass the data to the template
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


@app.route('/Fases/<FaseId>')
def get_Fases_Id(FaseId):
    query = f'''
    select fase.Id as Id ,
    fase.[Name] as FaseName,
    ass.[Name] AS AssociacaoOrg,
    jogo.Id AS GameID,
    jogo.Equipa_id1 AS Casa,
    jogo.Resultado AS Resultado,
    jogo.Equipa_id2 AS Fora
    from FADU_FASE fase
    join FADU_ORGANIZACAO org on org.Fase_Id = fase.id
    join FADU_ASSOCIAÇAO_ACADEMICA ass ON ass.Org_Id=org.Id
    join FADU_JOGO jogo ON jogo.Fase_Id=fase.Id
    where fase.Id = ?
    '''
    cols, serialized = getInfo(query, FaseId)

    faseName = serialized[0][1] if serialized else "Fase desconhecida ou sem jogos."

    return render_template('faseDetalhes.html', faseName=faseName, columns=cols, rows=serialized)


@app.route('/Ass/<AssId>')
def get_Ass_Id(AssId):
    # Query to retrieve association details
    query = f'''
    SELECT
        ass.Id AS Id,
        ass.Name AS Nome,
        ass.Sigla AS Sigla,
        STRING_AGG(mod.Name, ', ') AS Modalidades
    FROM
        FADU_ASSOCIAÇAO_ACADEMICA ass
    LEFT JOIN
        FADU_ASSMODALIDADE am ON ass.Id = am.Ass_Id
    LEFT JOIN
        FADU_MODALIDADE mod ON am.Mod_Id = mod.Id
    WHERE ass.Id = ?
    GROUP BY
        ass.Id, ass.Name, ass.Sigla;
    '''

    # Query for medals
    medals_query = f'''
    SELECT
        tm.Type AS Tipo,
        med.Year AS Ano
    FROM
        FADU_MEDALHAS med
    LEFT JOIN
        FADU_TIPOMEDALHA tm ON med.TypeMedal_Id = tm.Id
    WHERE med.Ass_Id = ?
    ORDER BY med.Year, tm.Type;
    '''

    # Queries for athletes, coaches, and referees
    athletes_query = f'''
    SELECT
        person.Id AS Person_Id,
        person.Name AS Athlete_Name
    FROM
        FADU_ATLETA atle
    JOIN
        FADU_PERSON person ON person.Id = atle.Person_Id
    WHERE person.Ass_Id = ?
    '''
    coaches_query = f'''
    SELECT
        person.Id AS Person_Id,
        person.Name AS Coach_Name
    FROM
        FADU_TREINADOR coach
    JOIN
        FADU_PERSON person ON person.Id = coach.Person_Id
    WHERE person.Ass_Id = ?
    '''
    referees_query = f'''
    SELECT
        person.Id AS Person_Id,
        person.Name AS Referee_Name
    FROM
        FADU_ARBITRO arb
    JOIN
        FADU_PERSON person ON person.Id = arb.Person_Id
    WHERE person.Ass_Id = ?
    '''

    # Execute the queries and get the results
    cols, association_data = getInfo(query, (AssId,))
    medals_cols, medals_data = getInfo(medals_query, (AssId,))
    athletes_cols, athletes_data = getInfo(athletes_query, (AssId,))
    coaches_cols, coaches_data = getInfo(coaches_query, (AssId,))
    referees_cols, referees_data = getInfo(referees_query, (AssId,))

    # Process athletes, coaches, and referees data
    # Only extract the Name (second element of the tuple)
    athletes_data = [athlete[1]
                     for athlete in athletes_data] if athletes_data else []
    coaches_data = [coach[1] for coach in coaches_data] if coaches_data else []
    referees_data = [referee[1]
                     for referee in referees_data] if referees_data else []

    # Association name (use the first row, which should contain the association name)
    assName = association_data[0][1] if association_data else "Associação desconhecida"

    # Return the rendered template with all the necessary data
    return render_template('assDetalhes.html',
                           AssName=assName,
                           columns=cols,
                           rows=association_data,
                           medals_columns=medals_cols,
                           medals_rows=medals_data,
                           athletes_columns=athletes_cols,
                           athletes=athletes_data,
                           coaches=coaches_data,
                           referees=referees_data)


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
    if assId == 'NULL':
        query = '''SELECT Address, Name FROM FADU_UNIVERSIDADE WHERE Ass_id IS NULL'''
        uni_cols, uni_data = getInfo(query)
    else :
        query = ''' SELECT Address, Name FROM FADU_UNIVERSIDADE WHERE Ass_id = ?'''
        uni_cols, uni_data = getInfo(query, assId)
    
    return jsonify({'columns': uni_cols, 'rows': uni_data})
    

    


@app.route('/api/search_athletes', methods=['GET'])
def search_athletes():
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = 15
    offset = (page - 1) * per_page

    if len(search) < 2:
        return jsonify([])

    # Main query with pagination
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
    if( request.method == 'POST'):
        name = request.form.get('assName', '').strip()
        sigla = request.form.get('assSigla', '').strip()
        universityAddres = request.form.get('universityAddres', '').strip()
        callUserProcessure = '''
        DECLARE @NewAccId INT;
        EXEC dbo.addAss ?, ?, ?, @NewAccId OUTPUT;
        SELECT @NewAccId;
        '''
        callUserPro(callUserProcessure, [
                    name, sigla, universityAddres])
        return jsonify({'status': 'success'})
        

    else:
        associations_query = "SELECT Id, Name FROM FADU_ASSOCIAÇAO_ACADEMICA"
        associations_cols, associations_data = getInfo(associations_query)
        return jsonify({'columns': associations_cols, 'rows': associations_data})


@app.route('/api/associacoes/<acc>', methods=['DELETE'])
def api_delete_acc(acc):
    print(acc)
    try:
        acc = int(acc)
        callUserProcedure = '''
            EXEC dbo.deleteAcc ? ;
        '''
        callUserPro(callUserProcedure, [acc])
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Error deleting athlete: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500




@app.route('/api/search_associacoes', methods=['GET'])
def search_ass():
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = 15
    offset = (page - 1) * per_page

    if len(search) < 2:
        return jsonify([])

    # Main query with pagination
    query = '''
        SELECT
            ass.Id AS Id,
            ass.Name AS Nome,
            ass.Sigla AS Sigla,
            STRING_AGG(mod.Name, ', ') AS Modalidades,
            SUM(CASE WHEN tm.Type = 'Ouro' THEN 1 ELSE 0 END) AS Ouro,
            SUM(CASE WHEN tm.Type = 'Prata' THEN 1 ELSE 0 END) AS Prata,
            SUM(CASE WHEN tm.Type = 'Bronze' THEN 1 ELSE 0 END) AS Bronze
        FROM
            FADU_ASSOCIAÇAO_ACADEMICA ass
        LEFT JOIN
            FADU_ASSMODALIDADE ma ON ass.Id = ma.Ass_Id
        LEFT JOIN
            FADU_MODALIDADE mod ON ma.Mod_Id = mod.Id
        LEFT JOIN
            FADU_MEDALHAS med ON ma.Mod_Id = med.Mod_Id AND ma.Ass_Id = med.Ass_Id
        LEFT JOIN
            FADU_TIPOMEDALHA tm ON med.TypeMedal_Id = tm.Id
        WHERE
            ass.Name LIKE ?
        GROUP BY
            ass.Id, ass.Name, ass.Sigla
        ORDER BY
            ass.Id
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
    '''
    params = [f'%{search}%', offset, per_page]
    acc_cols, acc_data = getInfo(query, params)
    results = [
        [row[0], row[1], row[2], row[3], row[4], row[5], row[6]]
        for row in acc_data
    ]

    # Count query for pagination
    count_query = '''
        SELECT COUNT(*)
        FROM
            FADU_ASSOCIAÇAO_ACADEMICA ass
        WHERE
            ass.Name LIKE ?
    '''
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

# @app.route('/api/inscritos', methods=['POST', 'GET'])
# def api_add_athlete():
#     if (request.method == 'POST'):
#         nome = request.form.get('athleteName', '').strip()
#         numero_cc = request.form.get('athleteNumeroCC', '').strip()
#         date_birth = request.form.get('athleteDateBirth', '').strip()
#         email = request.form.get('athleteEmail', '').strip()
#         phone = request.form.get('athletePhone', '').strip()
#         ass_id = request.form.get('athleteAssId', '').strip()

#         callUserProcessure = '''
#         DECLARE @NewPersonId INT;
#         EXEC dbo.addAthlete ?, ?, ?, ?, ?, ?, @NewPersonId OUTPUT;
#         SELECT @NewPersonId;
#         '''
#         callUserPro(callUserProcessure, [
#                     nome, numero_cc, date_birth, email, phone, ass_id])
#         return jsonify({'status': 'success'})
#     else:
#         page = request.args.get('page', 1, type=int)
#         per_page = 15
#         offset = (page - 1) * per_page

#         athletes_query = '''
#         SELECT
#             person.Id AS Person_Id,
#             person.Name AS Athlete_Name
#         FROM
#             FADU_ATLETA atle
#         JOIN
#             FADU_PERSON person ON person.Id = atle.Person_Id
#         ORDER BY
#             person.Id
#         OFFSET ? ROWS
#         FETCH NEXT ? ROWS ONLY;
#         '''
#         athletes_cols, athletes_data = getInfo(
#             athletes_query, [offset, per_page])

#         count_query = "SELECT COUNT(*) FROM FADU_ATLETA"
#         total_athletes = getInfo(count_query)[1][0][0]
#         total_pages = math.ceil(total_athletes / per_page)

#         response = {
#             'columns': athletes_cols,
#             'rows': athletes_data,
#             'total_athletes': total_athletes,
#             'total_pages': total_pages,
#             'current_page': page
#         }
#         print(response)
#         return jsonify(response)


@app.route('/api/inscritos/<athlete>', methods=['DELETE'])
def api_delete_athlete(athlete):
    try:
        athlete = int(athlete)
        callUserProcedure = '''
            EXEC dbo.deleteAthlete ? ;
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

        # Call the stored procedure
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
        A.Name AS AssociationName
    FROM dbo.FADU_PERSON P
    INNER JOIN dbo.FADU_ATLETA AT ON P.Id = AT.Person_Id
    INNER JOIN dbo.FADU_ASSOCIAÇAO_ACADEMICA A ON P.Ass_Id = A.Id
    WHERE P.Id = ?
    """
    cols, rows = getInfo(query, (athlete_id,))

    if rows:
        row = rows[0]
        athlete = {
            'id': row[0],
            'name': row[1],
            'numeroCC': row[2],
            # Ensure date formatting
            'dateBirth': row[3][:10] if row[3] else None,
            'email': row[4],
            'phone': row[5],
            'associationName': row[6]
        }
        return jsonify(status='success', athlete=athlete)
    else:
        return jsonify(status='error', message='Athlete not found'), 404


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
        callUserProcessure = '''
        DECLARE @NewPersonId INT;
        EXEC dbo.addAthlete ?, ?, ?, ?, ?, ?,?, @NewPersonId OUTPUT;
        SELECT @NewPersonId;
        '''
        callUserPro(callUserProcessure, [
                    nome, numero_cc, date_birth, email, phone, ass_id,modalidadesIds])
        return jsonify({'status': 'success'})
    else:
        page = request.args.get('page', 1, type=int)
        per_page = 15
        offset = (page - 1) * per_page

        filters = []
        params = []

        # Filter: CC Number
        cc_number = request.args.get('cc_number', '').strip()
        if cc_number:
            filters.append("person.NumeroCC LIKE ?")
            params.append(f"%{cc_number}%")

        # Filter: Phone Number
        phone_number = request.args.get('phone_number', '').strip()
        if phone_number:
            filters.append("person.Phone LIKE ?")
            params.append(f"%{phone_number}%")

        # Filter: Age
        age = request.args.get('age', '').strip()
        if age:
            try:
                age_int = int(age)
                current_year = datetime.datetime.now().year
                birth_year = current_year - age_int
                filters.append("YEAR(person.DateBirth) = ?")
                params.append(birth_year)
            except ValueError:
                pass  # Skip invalid ages

        # Sorting
        sort_by = request.args.get('sort_by', '').strip()
        sort_clause = "ORDER BY person.Id"
        if sort_by:
            sort_map = {
                "name_asc": "person.Name ASC",
                "name_desc": "person.Name DESC",
                "age_asc": "person.DateBirth DESC",  # younger first
                "age_desc": "person.DateBirth ASC",  # older first
                "birth_date_asc": "person.DateBirth ASC",
                "birth_date_desc": "person.DateBirth DESC",
                "association_asc": "ass.Name ASC",
                "association_desc": "ass.Name DESC"
            }
            sort_clause = f"ORDER BY {sort_map.get(sort_by, 'person.Id')}"

        # Base query
        query = '''
        SELECT 
            person.Id AS Person_Id,
            person.Name AS Athlete_Name,
            ass.Name AS Association_Name
        FROM 
            FADU_ATLETA atle
        JOIN 
            FADU_PERSON person ON person.Id = atle.Person_Id
        JOIN
            FADU_ASSOCIAÇAO_ACADEMICA ass ON person.Ass_Id = ass.Id
        '''

        if filters:
            query += " WHERE " + " AND ".join(filters)

        query += f'''
        {sort_clause}
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
        '''
        params_with_paging = params + [offset, per_page]

        athletes_cols, athletes_data = getInfo(query, params_with_paging)

        # Count query for pagination
        count_query = '''
        SELECT COUNT(*) 
        FROM 
            FADU_ATLETA atle
        JOIN 
            FADU_PERSON person ON person.Id = atle.Person_Id
        JOIN
            FADU_ASSOCIAÇAO_ACADEMICA ass ON person.Ass_Id = ass.Id
        '''
        if filters:
            count_query += " WHERE " + " AND ".join(filters)

        count_cols, count_data = getInfo(count_query, params)
        total_athletes = count_data[0][0] if count_data else 0
        total_pages = math.ceil(total_athletes / per_page)

        response = {
            'columns': athletes_cols,
            'rows': athletes_data,
            'total_athletes': total_athletes,
            'total_pages': total_pages,
            'current_page': page
        }
        return jsonify(response)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
