class querrys:
    def __init__(self):
        pass
    
    def get_Ass_Insc(self,type ):
        type =str(type) 
        print(type)
        return f'''
                SELECT p.Id, p.Name, STRING_AGG(m.Name, ', ') as Modalidades
                FROM FADU_PERSON p
                JOIN FADU_ATLETA as type on type.Person_Id = p.id 
                LEFT JOIN FADU_PERSONMOD pm ON p.Id = pm.Person_id
                LEFT JOIN FADU_MODALIDADE m ON pm.Mod_Id = m.Id
                WHERE p.Ass_id = ?
                GROUP BY p.Id, p.Name
                '''

    def get_Fase_Info(self):
       return '''
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
            
    def get_Game_Details(self):
        return f'''
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
    
    def get_Player_From_Game(self):
        return f'''
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
    def get_Ass_Search_Name(self):
        return self.get_Ass() + self.search_Ass_name()
    
    def get_Ass(self):
        return '''
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
    '''
        
    def search_Ass_name(self):
        return '''
        WHERE
            ass.Name LIKE ?
        GROUP BY
            ass.Id, ass.Name, ass.Sigla
        ORDER BY
            ass.Id
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
        '''
    
    def get_Jogos(self):
        return '''
        SELECT
            jogo.Id AS ID,
            accCasa.Name AS Casa,
            jogo.Resultado AS Resultado,
            accOponente.Name AS Fora,
            mod.Name AS Modalidade
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
        ORDER BY
            jogo.Id
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY;
        '''
        
    def get_Atletas_search(self):
        return  '''
    WITH Inscritos AS (
            SELECT 
                p.Id AS Person_Id,
                p.Name AS Inscrito_Name,
                p.NumeroCC,
                p.Phone,
                p.DateBirth,
                STRING_AGG(m.Name, ', ') AS Modalidades,
                ass.Name AS Association_Name,
                'Athlete' AS InscritoType
            FROM 
                FADU_PERSON p
            JOIN 
                FADU_ATLETA atle ON p.Id = atle.Person_Id
            JOIN
                FADU_ASSOCIAÇAO_ACADEMICA ass ON p.Ass_Id = ass.Id
            LEFT JOIN
                FADU_PERSONMOD pm ON p.Id = pm.Person_id
            LEFT JOIN
                FADU_MODALIDADE m ON pm.Mod_Id = m.Id
            GROUP BY
                p.Id, p.Name, p.NumeroCC, p.Phone, p.DateBirth, ass.Name
            UNION ALL
            SELECT 
                p.Id AS Person_Id,
                p.Name AS Inscrito_Name,
                p.NumeroCC,
                p.Phone,
                p.DateBirth,
                NULL AS Modalidades,
                ass.Name AS Association_Name,
                'Coach' AS InscritoType
            FROM 
                FADU_PERSON p
            JOIN 
                FADU_TREINADOR coach ON p.Id = coach.Person_Id
            JOIN
                FADU_ASSOCIAÇAO_ACADEMICA ass ON p.Ass_Id = ass.Id
            UNION ALL
            SELECT 
                p.Id AS Person_Id,
                p.Name AS Inscrito_Name,
                p.NumeroCC,
                p.Phone,
                p.DateBirth,
                NULL AS Modalidades,
                ass.Name AS Association_Name,
                'Referee' AS InscritoType
            FROM 
                FADU_PERSON p
            JOIN 
                FADU_ARBITRO arb ON p.Id = arb.Person_Id
            JOIN
                FADU_ASSOCIAÇAO_ACADEMICA ass ON p.Ass_Id = ass.Id
        )
        '''
    def get_Unis(self):
        return'''
            SELECT
            uni.Name AS Nome,
            uni.Address AS Endereço,
            ass.Id as IdAssociação,
            ass.Name AS NomeAssociação,
            ass.Sigla AS SiglaAssociação
            FROM
            FADU_UNIVERSIDADE uni
            LEFT JOIN
            FADU_ASSOCIAÇAO_ACADEMICA ass
            ON uni.Ass_Id = ass.Id
            '''
    def get_Ass_Details(self):
        return f'''
    SELECT
        ass.Id AS Id,
        ass.Name AS Nome,
        ass.Sigla AS Sigla,
        STRING_AGG(CONCAT(mod.Id, ':', mod.Name), ', ') AS Modalidades
    FROM
        FADU_ASSOCIAÇAO_ACADEMICA ass
    LEFT JOIN
        FADU_ASSMODALIDADE ma ON ass.Id = ma.Ass_Id
    LEFT JOIN
        FADU_MODALIDADE mod ON ma.Mod_Id = mod.Id
    WHERE
        ass.Id = ?
    GROUP BY
        ass.Id, ass.Name, ass.Sigla
    '''
    def get_Ass_Med(self):
        return f'''
    SELECT
        tm.Type AS Tipo,
        med.Year AS Ano,
        med.Mod_Id AS Mod
    FROM
        FADU_MEDALHAS med
    LEFT JOIN
        FADU_TIPOMEDALHA tm ON med.TypeMedal_Id = tm.Id
    WHERE med.Ass_Id = ?
    ORDER BY med.Year, tm.Type;
    '''
    def get_Count_Ass_Search_Name():
            # Count query for pagination
        return  '''
            SELECT COUNT(*)
            FROM
                FADU_ASSOCIAÇAO_ACADEMICA ass
            WHERE
                ass.Name LIKE ?
        '''
    def get_Ass_Teams(self):
        return '''
        SELECT 
            e.Id AS TeamId,
            m.Name AS Modalidade,
            m.MaxPlayers AS MaxPlayers,
            COUNT(pe.Person_Id) AS CurrentPlayers,
            STRING_AGG(p.Name, ', ') AS Players
        FROM 
            FADU_EQUIPA e
        JOIN 
            FADU_MODALIDADE m ON e.Mod_Id = m.Id
        LEFT JOIN 
            FADU_PERSONEQUIPA pe ON e.Id = pe.EQUIPA_Id
        LEFT JOIN 
            FADU_PERSON p ON pe.Person_Id = p.Id
        WHERE 
            e.Ass_id = ?
        GROUP BY 
            e.Id, m.Name, m.MaxPlayers
        ORDER BY 
            m.Name;
        '''
        
    def get_team_modId(self):
        return'''
        select * from FADU_EQUIPA 
        JOIN  FADU_ASSOCIAÇAO_ACADEMICA ass ON Ass_Id = ass.Id
        where Mod_Id = ?
    '''
    
    def post_jogo(self):
        return '''
        INSERT INTO FADU_JOGO (Data, Duracao, Resultado, LocalJogo, Fase_Id, Mod_Id, Equipa_id1, Equipa_id2)
        VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
    '''
    
    def put_jogo(self):
        return'''
                UPDATE FADU_JOGO 
                SET Data=?, Duracao=?, Resultado=?, LocalJogo=?, Fase_Id=?, Mod_Id=?, 
                    Equipa_id1=?, Equipa_id2=?
                WHERE Id=?
            '''
    def get_log(self):
        return'''
        SELECT * from FADU_PERSON
        JOIN FADU_LOGIN l AS l.Person_Id 
        WHERE Email = ? and l.Pass = ?

    '''