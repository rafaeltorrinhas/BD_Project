from flask import Flask, render_template, jsonify
import os
import pyodbc
app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/table_columns')
def table_columns():
    # reconnect (or reuse your existing connection)
    cnxn = pyodbc.connect(
        f"Driver={{ODBC Driver 17 for SQL Server}};"
        f"Server={os.getenv('DB_SERVER','localhost')},1433;"
        f"Database={os.getenv('DB_DATABASE','master')};"
        f"UID={os.getenv('DB_USER','sa')};"
        f"PWD={os.getenv('DB_PASSWORD','StrongPassw0rd')};"
    )
    cursor = cnxn.cursor()
    cursor.execute("""
        SELECT t.TABLE_NAME, c.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLES t
        JOIN INFORMATION_SCHEMA.COLUMNS c
          ON t.TABLE_NAME = c.TABLE_NAME
        WHERE t.TABLE_TYPE = 'BASE TABLE'
        ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    """)
    table_map = {}
    for table, column in cursor.fetchall():
        table_map.setdefault(table, []).append(column)
    cursor.close()
    cnxn.close()
    return jsonify(table_map)
