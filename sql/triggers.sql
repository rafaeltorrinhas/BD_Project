CREATE TRIGGER trg_DELETEMEDALS
ON FADU_MEDALHAS
INSTEAD OF DELETE
AS
BEGIN
    BEGIN TRY
    BEGIN TRANSACTION;
        -- First delete dependent children
        DELETE MP
        FROM FADU_MEDPERS MP
        INNER JOIN deleted D
            ON MP.Mod_Id = D.Mod_Id AND MP.Ass_Id = D.Ass_Id AND MP.Year = D.Year;

        -- Then decrement medals
        UPDATE AM
        SET AM.Number_medals = AM.Number_medals - D.NumCount
        FROM FADU_ASSMODALIDADE AM
        INNER JOIN (
            SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
            FROM deleted
            GROUP BY Mod_Id, Ass_Id
        ) AS D ON AM.Mod_Id = D.Mod_Id AND AM.Ass_Id = D.Ass_Id;

        -- Then delete parent
        DELETE FM
        FROM FADU_MEDALHAS FM
        INNER JOIN deleted D
            ON FM.Mod_Id = D.Mod_Id AND FM.Ass_Id = D.Ass_Id AND FM.Year = D.Year;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating Number_medals after deletion.';
        THROW;
    END CATCH
END;
go


CREATE TRIGGER trg_INCREMENTNUMMED
ON FADU_MEDALHAS
AFTER INSERT
AS
BEGIN
    BEGIN TRY
    BEGIN TRANSACTION;
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
        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating Number_medals after insertion.';
        THROW;
    END CATCH
END;
go

CREATE TRIGGER trg_UPDATEMEDALSINFO
ON FADU_MEDALHAS
AFTER UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN deleted d ON i.Year = d.Year AND i.Mod_Id = d.Mod_Id AND i.Ass_Id = d.Ass_Id
        WHERE i.Mod_Id <> d.Mod_Id OR i.Ass_Id <> d.Ass_Id
    )
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;

            -- Increment medals for the new Mod_Id and Ass_Id
            UPDATE FADU_ASSMODALIDADE
            SET Number_medals = Number_medals + I.NumCount
            FROM FADU_ASSMODALIDADE AM
            INNER JOIN (
                SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
                FROM inserted
                GROUP BY Mod_Id, Ass_Id
            ) AS I ON AM.Mod_Id = I.Mod_Id AND AM.Ass_Id = I.Ass_Id;

            -- Insert new rows into FADU_MEDPERS
            INSERT INTO FADU_MEDPERS ([Year], Mod_Id, Ass_Id, Person_Id)
            SELECT i.Year, i.Mod_Id, i.Ass_Id, pe.Person_Id 
            FROM inserted i
            JOIN FADU_EQUIPA e ON e.Mod_Id = i.Mod_Id AND e.Ass_Id = i.Ass_Id
            JOIN FADU_PERSONEQUIPA pe ON pe.EQUIPA_Id = e.Id;

            -- Decrement medals for the old Mod_Id and Ass_Id
            UPDATE FADU_ASSMODALIDADE
            SET Number_medals = Number_medals - D.NumCount
            FROM FADU_ASSMODALIDADE AM
            INNER JOIN (
                SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
                FROM deleted
                GROUP BY Mod_Id, Ass_Id
            ) AS D ON AM.Mod_Id = D.Mod_Id AND AM.Ass_Id = D.Ass_Id;

            -- Delete old rows from FADU_MEDPERS
            DELETE FROM FADU_MEDPERS
            WHERE EXISTS (
                SELECT 1
                FROM deleted d
                WHERE FADU_MEDPERS.Mod_Id = d.Mod_Id
                  AND FADU_MEDPERS.Ass_Id = d.Ass_Id
                  AND FADU_MEDPERS.Year = d.Year
            );

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            PRINT('Error updating assModalidade');
            ROLLBACK TRANSACTION;
            THROW;
        END CATCH
    END
END;
GO

go

-- on delet of a player it will put all the team ID where he is as the default -1  medPerson and PERSONEUIPA AND PERSON MOD 

CREATE TRIGGER trg_DeletAthelete
ON FADU_ATLETA
AFTER DELETE
AS
BEGIN
    BEGIN TRY
    BEGIN TRANSACTION;
        DECLARE @DummyPersonId INT;
        SET @DummyPersonId = 0
        
        UPDATE dbo.FADU_PERSONEQUIPA
        SET Person_Id = @DummyPersonId
        WHERE Person_Id IN (SELECT Person_Id FROM deleted);

        UPDATE dbo.FADU_PERSONMOD
        SET Person_id = @DummyPersonId
        WHERE Person_id IN (SELECT Person_Id FROM deleted);

        UPDATE dbo.FADU_MEDPERS
        SET Person_Id = @DummyPersonId
        WHERE Person_Id IN (SELECT Person_Id FROM deleted);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating tables on delet of a player after check if player with id -1 exists.';
        THROW;
    END CATCH
END;
go



-- Trigger to handle cascading deletion when removing modalidades from an association
CREATE OR ALTER TRIGGER trg_DeleteAssModalidade
ON FADU_ASSMODALIDADE
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Delete related records from FADU_MEDALHAS
    DELETE med
    FROM FADU_MEDALHAS med
    INNER JOIN deleted d ON med.Ass_Id = d.Ass_Id AND med.Mod_Id = d.Mod_Id;
    
    -- Delete related records from FADU_JOGO
    DELETE j
    FROM FADU_JOGO j
    INNER JOIN deleted d ON j.Mod_Id = d.Mod_Id
    INNER JOIN FADU_EQUIPA e1 ON j.Equipa_id1 = e1.Id
    INNER JOIN FADU_EQUIPA e2 ON j.Equipa_id2 = e2.Id
    WHERE e1.Ass_id = d.Ass_Id OR e2.Ass_id = d.Ass_Id;
END;
GO

-- checks if adter adding a person Modalidade if the ass that person is has that mod if not add it 
CREATE OR ALTER TRIGGER trg_CHECKMODASS
ON FADU_PERSONMOD
AFTER INSERT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals)
        SELECT DISTINCT
            i.Mod_Id,
            p.Ass_Id,
            0  
        FROM inserted AS i
        JOIN FADU_PERSON AS p ON p.Id = i.Person_id
        LEFT JOIN FADU_ASSMODALIDADE AS assM
            ON assM.Mod_Id = i.Mod_Id AND assM.Ass_Id = p.Ass_Id
        WHERE assM.Mod_Id IS NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating Number_medals after insertion.';
        THROW;
    END CATCH
END;
GO
CREATE OR ALTER TRIGGER trg_DeleteTeam
ON FADU_EQUIPA
INSTEAD OF DELETE
AS
BEGIN
    BEGIN TRY
    BEGIN TRANSACTION;
        -- First delete all player relationships
        DELETE FROM FADU_PERSONEQUIPA
        WHERE EQUIPA_Id IN (SELECT Id FROM deleted);
        
        -- Then delete all games
        DELETE FROM FADU_JOGO
        WHERE Equipa_id1 IN (SELECT Id FROM deleted) OR Equipa_id2 IN (SELECT Id FROM deleted);
        
        -- Finally delete the team
        DELETE FROM FADU_EQUIPA
        WHERE Id IN (SELECT Id FROM deleted);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while deleting the team and related records.';
        THROW;
    END CATCH
END;
GO

CREATE TRIGGER trg_CHECKTEAMNUMBER
ON FADU_PERSONEQUIPA
AFTER INSERT
AS
BEGIN
    BEGIN TRY
    BEGIN TRANSACTION;
        IF (SELECT COUNT(*) 
            FROM FADU_PERSONEQUIPA 
            WHERE EQUIPA_Id IN (SELECT EQUIPA_Id FROM INSERTED)) 
            >= (SELECT MaxPlayers 
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
