import os
import datetime
from dotenv import load_dotenv
from flask import Flask, flash, redirect, render_template, jsonify
import pyodbc
app = Flask(__name__)

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


@app.route('/delete_university/<int:university_id>', methods=['POST'])
def delete_university(university_id):
    # Connect to the database and delete the university by its ID
    try:
        query = "DELETE FROM FADU_UNIVERSIDADE WHERE Id = ?"
        cnxn = get_connection()
        cursor = cnxn.cursor()
        cursor.execute(query, (university_id,))
        cnxn.commit()  # Commit the deletion to the database
        cursor.close()
        cnxn.close()
        flash("Universidade apagada com sucesso!", "success")
    except Exception as e:
        flash(f"Erro ao apagar a universidade: {str(e)}", "error")
    return redirect('/Uni')  # Redirect back to the list of universities
