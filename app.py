import os
import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify
import pyodbc

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
        if params != None:
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
        cursor.close()
        cnxn.close()
        return jsonify({'error': str(e)}), 400


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


@app.route('/api/Uni/')
def get_uni():

    cols, serialized = getInfo(
        '''
            SELECT 
            uni.Name AS UniversityName,
            uni.Address AS UniversityAddress,
            acc.Name AS AssociationName,
            acc.Sigla AS AssociationSigla
            FROM 
            FADU_UNIVERSIDADE uni
            JOIN 
            FADU_ASSOCIAÇAO_ACADEMICA acc
            ON uni.Ass_Id = acc.Id
            '''
    )

    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/api/Ass/')
def get_ass():

    cols, serialized, =    getInfo(
        '''
            SELECT 
                acc.Id AS AssociationId,
                acc.Name AS AssociationName,
                acc.Sigla AS AssociationSigla,
                STRING_AGG(mod.Name, ', ') AS Modalidades,
                SUM(CASE WHEN tm.Type = 'Ouro' THEN 1 ELSE 0 END) AS OuroCount,
                SUM(CASE WHEN tm.Type = 'Prata' THEN 1 ELSE 0 END) AS PrataCount,
                SUM(CASE WHEN tm.Type = 'Bronze' THEN 1 ELSE 0 END) AS BronzeCount

            FROM 
                FADU_ASSOCIAÇAO_ACADEMICA acc
            LEFT JOIN 
                FADU_ASSMODALIDADE ma ON acc.Id = ma.Ass_Id
            LEFT JOIN 
                FADU_MODALIDADE mod ON ma.Mod_Id = mod.Id
            LEFT JOIN 
                FADU_MEDALHAS med ON ma.Mod_Id = med.Mod_Id AND ma.Ass_Id = med.Ass_Id
            LEFT JOIN 
                FADU_TIPOMEDALHA tm ON med.TypeMedal_Id = tm.Id
            GROUP BY 
                acc.Id, acc.Name, acc.Sigla
            ORDER BY 
                acc.Id
            '''
    )

    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/api/Jogos/')
def get_Jogos():
    cols, serialized, =    getInfo(
        '''
        SELECT 
    jogo.Id AS GameID, 
    accCasa.Name AS Casa, 
    jogo.Resultado AS Resultado, 
    accOponente.Name AS Oponente 
FROM FADU_JOGO jogo
LEFT JOIN FADU_EQUIPA casa ON casa.Id = jogo.Equipa_id1
LEFT JOIN FADU_EQUIPA oponente ON oponente.Id = jogo.Equipa_id2  -- Assuming Equipa_id2 is for the opponent team
LEFT JOIN FADU_ASSOCIAÇAO_ACADEMICA accCasa ON accCasa.Id = casa.Ass_id
LEFT JOIN FADU_ASSOCIAÇAO_ACADEMICA accOponente ON accOponente.Id = oponente.Ass_id;
'''
    )
    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/api/Jogos/<GameId>')
def get_Jogo_Id(GameId):
    query = f'''
     SELECT 
         jogo.Id AS GameID, 
         accCasa.[Name] AS Casa,
         jogo.Resultado AS Resultado, 
         accOponente.[Name] AS Oponente, 
         jogo.Duracao AS Time,
         Jogo.LocalJogo AS LocalJogo,
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
    queryTeams = f'''
        SELECT 
            jogo.Id AS GameId, 
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
        ORDER BY T.TeamType, PlayerName,PlayerId;
    
    '''
    colsTeams, Teams = getInfo(queryTeams, GameId)

    return jsonify({'columns': cols, 'rows': serialized, 'TeamsCols': colsTeams, 'TeamsPlayers': Teams})


@app.route('/api/Fases/')
def get_Fases():
    query = f'''
    select * from FADU_FASE
    '''
    cols, serialized = getInfo(query)
    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/api/Fases/<FaseId>')
def get_Fases_Id(FaseId):
    query = f'''
    select fase.Id AS FaseId,fase.[Name] AS FaseName,
	ass.Id AS AssId,ass.[Name] AS AssName,
	ass.Sigla as AssSigla,
	ass.Org_Id AS AssOrgID, 
	jogo.Id AS GameID, 
    jogo.Equipa_id1 AS Casa,
    jogo.Resultado AS Resultado, 
    jogo.Equipa_id2 AS Oponente 
	from FADU_FASE fase
	join FADU_ORGANIZACAO org on org.Fase_Id = fase.id
	join FADU_ASSOCIAÇAO_ACADEMICA ass ON ass.Org_Id=org.Id
	join FADU_JOGO jogo ON jogo.Fase_Id=fase.Id
    where fase.Id = ?
    '''
    cols, serialized = getInfo(query, FaseId)
    return jsonify({'columns': cols, 'rows': serialized})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
