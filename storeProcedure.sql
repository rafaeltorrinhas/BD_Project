drop PROCEDURE dbo.addAthlete
drop PROCEDURE dbo.deleteAthlete
drop PROCEDURE dbo.updateAthlete
drop PROCEDURE dbo.deleteAcc
drop PROCEDURE dbo.addAss
go

CREATE PROCEDURE dbo.addAthlete
    @Name VARCHAR(64),
    @NumeroCC CHAR(9),
    @DateBirth DATE,
    @Email VARCHAR(64),
    @Phone CHAR(9),
    @Ass_Id INT,
    @NewModalidades VARCHAR(124),
    @NewPersonId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ToReturn INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert into FADU_PERSON
        INSERT INTO dbo.FADU_PERSON (Name, NumeroCC, DateBirth, Email, Phone, Ass_Id)
        VALUES (@Name, @NumeroCC, @DateBirth, @Email, @Phone, @Ass_Id);

        -- Fetch the new Person ID
        SELECT @ToReturn = Id
        FROM dbo.FADU_PERSON
        WHERE NumeroCC = @NumeroCC;

        INSERT INTO dbo.FADU_ATLETA (Person_Id)
        VALUES (@ToReturn);

        DECLARE @Pos INT = 0;
        DECLARE @Start INT = 1;
        DECLARE @Mod_Id INT;
        DECLARE @Len INT = LEN(@NewModalidades);
        DECLARE @NextComma INT;

        WHILE @Start <= @Len
        BEGIN
            SET @NextComma = CHARINDEX(',', @NewModalidades, @Start);

            IF @NextComma = 0
                SET @NextComma = @Len + 1;

            SET @Mod_Id = CAST(SUBSTRING(@NewModalidades, @Start, @NextComma - @Start) AS INT);

            INSERT INTO dbo.FADU_PERSONMOD (Person_id, Mod_Id)
            VALUES (@ToReturn, @Mod_Id);

            SET @Start = @NextComma + 1;
        END;

        SET @NewPersonId = @ToReturn;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
go


CREATE PROCEDURE dbo.deleteAthlete
    @PersonId INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM FADU_ATLETA
        WHERE Person_Id = @PersonId;

        DELETE FROM FADU_PERSON
        WHERE Id = @PersonId;

        DELETE FROM FADU_PERSONMOD
        WHERE Person_Id = @PersonId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR ('Error', 16, 1);
    END CATCH
END;
go
CREATE PROCEDURE dbo.updateAthlete
    @Id INT,
    @Name VARCHAR(64),
    @NumeroCC CHAR(9),
    @DateBirth DATE,
    @Email VARCHAR(64),
    @Phone CHAR(9),
    @Ass_Id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate updates: ensure no duplicates in NumeroCC
        --IF EXISTS (
        --    SELECT 1
        --    FROM dbo.FADU_PERSON
        --    WHERE NumeroCC = @NumeroCC or Email = @Email
        --      AND Id <> @Id
        --)
        --BEGIN
        --    THROW 50001, 'Duplicate NumeroCC detected or Email!', 1;
        --END

        -- Update athlete information
        UPDATE dbo.FADU_PERSON
        SET
            Name = @Name,
            NumeroCC = @NumeroCC,
            DateBirth = @DateBirth,
            Email = @Email,
            Phone = @Phone,
            Ass_Id = @Ass_Id
        WHERE Id = @Id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
go



CREATE PROCEDURE dbo.addAss
    @assName VARCHAR(64),
    @assSigla VARCHAR(100),
    @universityAddress VARCHAR(100),
    @NewAccId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ToReturn INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert into FADU_PERSON
        INSERT INTO dbo.FADU_ASSOCIAÇAO_ACADEMICA (Name, Sigla, Org_Id)
        VALUES (@assName, @assSigla,NULL);

        -- Fetch the new Person ID
        SELECT @ToReturn = Id
        FROM dbo.FADU_ASSOCIAÇAO_ACADEMICA
        WHERE Sigla = @assSigla;

        UPDATE FADU_UNIVERSIDADE
        set Ass_id = @ToReturn
        WHERE Address = @universityAddress

        SET @NewAccId = @ToReturn;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
go

CREATE PROCEDURE dbo.deleteAcc
    @Acc INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM FADU_ASSMODALIDADE
        WHERE Ass_Id = @Acc;

        DELETE FROM FADU_MEDALHAS
        WHERE Ass_Id = @Acc;

        UPDATE  FADU_PERSON
        SET Ass_id = NULL
        WHERE Ass_Id = @Acc;

        DELETE FROM FADU_JOGO
        WHERE Equipa_id1 IN (SELECT Id FROM FADU_EQUIPA WHERE Ass_id = @Acc)
        OR Equipa_id2 IN (SELECT Id FROM FADU_EQUIPA WHERE Ass_id = @Acc);

        DELETE FROM FADU_PERSONEQUIPA
        WHERE EQUIPA_Id IN (
            SELECT Id FROM FADU_EQUIPA WHERE Ass_id = @Acc
        );

        DELETE FROM FADU_EQUIPA WHERE Ass_id = @Acc;


        UPDATE FADU_UNIVERSIDADE
        set Ass_Id = NULL
        WHERE Ass_Id = @Acc;

        DELETE FROM [FADU_ASSOCIAÇAO_ACADEMICA]
        WHERE Id  = @Acc;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
            DECLARE @ErrorMessage NVARCHAR(4000);
            SET @ErrorMessage = ERROR_MESSAGE();
            RAISERROR (@ErrorMessage, 16, 1);
            RAISERROR ('Error', 16, 1);
    END CATCH
END;
go

CREATE PROCEDURE dbo.updateAthleteModalidades
    @PersonId INT,
    @ModalidadesIds VARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Delete existing modalidades
        DELETE FROM FADU_PERSONMOD
        WHERE Person_id = @PersonId;

        -- Insert new modalidades
        DECLARE @Pos INT = 0;
        DECLARE @Start INT = 1;
        DECLARE @Mod_Id INT;
        DECLARE @Len INT = LEN(@ModalidadesIds);
        DECLARE @NextComma INT;

        WHILE @Start <= @Len
        BEGIN
            SET @NextComma = CHARINDEX(',', @ModalidadesIds, @Start);

            IF @NextComma = 0
                SET @NextComma = @Len + 1;

            SET @Mod_Id = CAST(SUBSTRING(@ModalidadesIds, @Start, @NextComma - @Start) AS INT);

            INSERT INTO FADU_PERSONMOD (Person_id, Mod_Id)
            VALUES (@PersonId, @Mod_Id);

            SET @Start = @NextComma + 1;
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO


CREATE PROCEDURE dbo.addTreinador
    @Name VARCHAR(64),
    @NumeroCC CHAR(9),
    @DateBirth DATE,
    @Email VARCHAR(64),
    @Phone CHAR(9),
    @Ass_Id INT,
    @NewModalidades VARCHAR(124),
    @NewPersonId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ToReturn INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert into FADU_PERSON
        INSERT INTO dbo.FADU_PERSON (Name, NumeroCC, DateBirth, Email, Phone, Ass_Id)
        VALUES (@Name, @NumeroCC, @DateBirth, @Email, @Phone, @Ass_Id);

        -- Fetch the new Person ID
        SELECT @ToReturn = Id
        FROM dbo.FADU_PERSON
        WHERE NumeroCC = @NumeroCC;

        INSERT INTO dbo.FADU_TREINADOR (Person_Id)
        VALUES (@ToReturn);

        DECLARE @Pos INT = 0;
        DECLARE @Start INT = 1;
        DECLARE @Mod_Id INT;
        DECLARE @Len INT = LEN(@NewModalidades);
        DECLARE @NextComma INT;

        WHILE @Start <= @Len
        BEGIN
            SET @NextComma = CHARINDEX(',', @NewModalidades, @Start);

            IF @NextComma = 0
                SET @NextComma = @Len + 1;

            SET @Mod_Id = CAST(SUBSTRING(@NewModalidades, @Start, @NextComma - @Start) AS INT);

            INSERT INTO dbo.FADU_PERSONMOD (Person_id, Mod_Id)
            VALUES (@ToReturn, @Mod_Id);

            SET @Start = @NextComma + 1;
        END;

        SET @NewPersonId = @ToReturn;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
go

CREATE PROCEDURE dbo.addArbitro
    @Name VARCHAR(64),
    @NumeroCC CHAR(9),
    @DateBirth DATE,
    @Email VARCHAR(64),
    @Phone CHAR(9),
    @Ass_Id INT,
    @NewModalidades VARCHAR(124),
    @NewPersonId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ToReturn INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert into FADU_PERSON
        INSERT INTO dbo.FADU_PERSON (Name, NumeroCC, DateBirth, Email, Phone, Ass_Id)
        VALUES (@Name, @NumeroCC, @DateBirth, @Email, @Phone, @Ass_Id);

        -- Fetch the new Person ID
        SELECT @ToReturn = Id
        FROM dbo.FADU_PERSON
        WHERE NumeroCC = @NumeroCC;

        INSERT INTO dbo.FADU_ARBITRO (Person_Id)
        VALUES (@ToReturn);

        DECLARE @Pos INT = 0;
        DECLARE @Start INT = 1;
        DECLARE @Mod_Id INT;
        DECLARE @Len INT = LEN(@NewModalidades);
        DECLARE @NextComma INT;

        WHILE @Start <= @Len
        BEGIN
            SET @NextComma = CHARINDEX(',', @NewModalidades, @Start);

            IF @NextComma = 0
                SET @NextComma = @Len + 1;

            SET @Mod_Id = CAST(SUBSTRING(@NewModalidades, @Start, @NextComma - @Start) AS INT);

            INSERT INTO dbo.FADU_PERSONMOD (Person_id, Mod_Id)
            VALUES (@ToReturn, @Mod_Id);

            SET @Start = @NextComma + 1;
        END;

        SET @NewPersonId = @ToReturn;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
go

CREATE OR ALTER PROCEDURE dbo.ranking_cursor
AS
BEGIN
    SET NOCOUNT ON;

    -- Create temporary table to store each win (one row per win)
    CREATE TABLE #AllWins (Equipa_Id INT)

    -- Insert home team wins (one row per win)
    INSERT INTO #AllWins (Equipa_Id)
    SELECT Equipa_id1
    FROM FADU_JOGO
    WHERE Resultado LIKE '%-%' AND
          (CAST(SUBSTRING(Resultado, 1, CHARINDEX('-', Resultado) - 1) AS INT) >
           CAST(SUBSTRING(Resultado, CHARINDEX('-', Resultado) + 1, LEN(Resultado)) AS INT))

    -- Insert away team wins (one row per win)
    INSERT INTO #AllWins (Equipa_Id)
    SELECT Equipa_id2
    FROM FADU_JOGO
    WHERE Resultado LIKE '%-%' AND
          (CAST(SUBSTRING(Resultado, 1, CHARINDEX('-', Resultado) - 1) AS INT) <
           CAST(SUBSTRING(Resultado, CHARINDEX('-', Resultado) + 1, LEN(Resultado)) AS INT))

    -- Aggregate by association
    SELECT 
        E.Ass_Id, 
        A.Name AS Association_Name, 
        COUNT(*) as Total_Jogos_Ganhos
    FROM #AllWins W
    JOIN FADU_EQUIPA E ON W.Equipa_Id = E.Id
    JOIN FADU_ASSOCIAÇAO_ACADEMICA A ON E.Ass_Id = A.Id
    GROUP BY E.Ass_Id, A.Name
    ORDER BY Total_Jogos_Ganhos DESC

    DROP TABLE #AllWins
END