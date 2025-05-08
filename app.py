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
    cnxn = get_connection()
    cursor = cnxn.cursor()
    try:
        cursor.execute(f"SELECT * FROM [{table_name}]")
    except Exception:
        cursor.close()
        cnxn.close()
        return jsonify({'error': 'Invalid table name'}), 400

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
    return jsonify({'columns': cols, 'rows': serialized})


@app.route('/api/Uni/<uni_name>')
def get_uni(uni_name):
    cnxn = get_connection()
    cursor = cnxn.cursor()
    try:
        cursor.execute(
            '''
            SELECT 
                uni.Acc_id,
                uni.Name, 
                COUNT(*) as MedalCount
            FROM 
                FADU_UNIVERSIDADE uni
            JOIN 
                FADU_MEDALHAS med 
                ON med.Acc_id = uni.Acc_id
            GROUP BY 
                uni.Name, uni.Acc_id
            ORDER BY 
                uni.Acc_id ASC
            '''
        )
    except Exception as e:
        cursor.close()
        cnxn.close()
        return jsonify({'error': str(e)}), 400

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

    print(f"Columns: {cols}")
    print(f"Rows: {serialized}")

    return jsonify({'columns': cols, 'rows': serialized})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
