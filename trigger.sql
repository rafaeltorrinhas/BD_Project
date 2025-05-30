CREATE TRIGGER trg_DELETEMEDALS
ON FADU_MEDALHAS
AFTER DELETE
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE AM
        SET AM.Number_medals = AM.Number_medals - D.NumCount
        FROM FADU_ASSMODALIDADE AM
        INNER JOIN (
            SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
            FROM deleted
            GROUP BY Mod_Id, Ass_Id
        ) AS D ON AM.Mod_Id = D.Mod_Id AND AM.Ass_Id = D.Ass_Id;

        DELETE FROM FADU_MEDPERS
        WHERE (Mod_Id, Ass_Id, Year) IN (
            SELECT Mod_Id, Ass_Id, Year
            FROM deleted
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating Number_medals after deletion.';
        THROW;
    END CATCH
END;



CREATE TRIGGER trg_INCREMENTNUMMED
ON FADU_MEDALHAS
AFTER INSERT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE FADU_ASSMODALIDADE
        SET Number_medals = Number_medals + I.NumCount
        FROM FADU_ASSMODALIDADE AM
        INNER JOIN (
            SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
            FROM inserted
            GROUP BY Mod_Id, Ass_Id
        ) AS I ON AM.Mod_Id = I.Mod_Id AND AM.Ass_Id = I.Ass_Id;


        INSERT INTO FADU_MEDPERS ([Year], Mod_Id, Ass_Id, Person_Id)
        SELECT i.Year, i.Mod_Id, i.Ass_Id, pe.Person_Id 
        FROM inserted i
        JOIN FADU_EQUIPA e ON e.Mod_Id = i.Mod_Id AND e.Ass_Id = i.Ass_Id
        JOIN FADU_PERSONEQUIPA pe ON pe.EQUIPA_Id = e.Id;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating Number_medals after insertion.';
        THROW;
    END CATCH
END;

CREATE TRIGGER trg_UPDATEMEDALSINFO
ON FADU_MEDALHAS
AFTER UPDATE
AS
IF EXISTS (
    SELECT 1
    FROM inserted i
    where i.Mod_Id<> (select Mod_id from deleted ) or i.Ass_Id <> (select Ass_Id from deleted )
)
BEGIN 


        BEGIN TRANSACTION;
        BEGIN TRY

    
            UPDATE FADU_ASSMODALIDADE
            SET Number_medals = Number_medals + I.NumCount
            FROM FADU_ASSMODALIDADE AM
            INNER JOIN (
                SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
                FROM inserted
                GROUP BY Mod_Id, Ass_Id
            ) AS I ON AM.Mod_Id = I.Mod_Id AND AM.Ass_Id = I.Ass_Id;


            INSERT INTO FADU_MEDPERS ([Year], Mod_Id, Ass_Id, Person_Id)
            SELECT i.Year, i.Mod_Id, i.Ass_Id, pe.Person_Id 
            FROM inserted i
            JOIN FADU_EQUIPA e ON e.Mod_Id = i.Mod_Id AND e.Ass_Id = i.Ass_Id
            JOIN FADU_PERSONEQUIPA pe ON pe.EQUIPA_Id = e.Id;

            UPDATE FADU_ASSMODALIDADE
            SET Number_medals = Number_medals - I.NumCount
            FROM FADU_ASSMODALIDADE AM
            INNER JOIN (
                SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
                FROM deleted
                GROUP BY Mod_Id, Ass_Id
            ) AS I ON AM.Mod_Id = I.Mod_Id AND AM.Ass_Id = I.Ass_Id;
            COMMIT TRANSACTION;

            DELETE FROM FADU_MEDPERS
            WHERE (Mod_Id, Ass_Id, Year) IN (
                SELECT Mod_Id, Ass_Id, Year
                FROM deleted
            );

        END TRY
        BEGIN CATCH
            PRINT('Error updating assModalidade ')
            ROLLBACK TRANSACTION;
            THROW;
        END CATCH



END;


CREATE TRIGGER trg_CheckTeamNumber
ON FADU_PERSONEQUIPA
AFTER INSERT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        IF (SELECT COUNT(*) 
            FROM FADU_PERSONEQUIPA 
            WHERE EQUIPA_Id IN (SELECT EQUIPA_Id FROM INSERTED)) 
            >= (SELECT NumeroMaxPlayers 
                 FROM FADU_EQUIPA AS e
                 JOIN FADU_MODALIDADE AS mod ON mod.ID = e.Mod_Id
                 WHERE e.Id IN (SELECT EQUIPA_Id FROM INSERTED))
    BEGIN
            ROLLBACK TRANSACTION;
            THROW 51000, 'Cannot add another player to this team; maximum number of players reached.', 1;
        END
    BEGIN
        COMMIT TRANSACTION;
        PRINT 'Player added successfully to the team.';
    END
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error hen cheching the number of players in that team.';
        THROW;
    END CATCH
END;