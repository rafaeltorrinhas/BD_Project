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

            UPDATE FADU_ASSMODALIDADE
            SET Number_medals = Number_medals - I.NumCount
            FROM FADU_ASSMODALIDADE AM
            INNER JOIN (
                SELECT Mod_Id, Ass_Id, COUNT(*) AS NumCount
                FROM deleted
                GROUP BY Mod_Id, Ass_Id
            ) AS I ON AM.Mod_Id = I.Mod_Id AND AM.Ass_Id = I.Ass_Id;
            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            PRINT('Error updating assModalidade ')
            ROLLBACK TRANSACTION;
            THROW;
        END CATCH


END;
go

-- on delet of a player it will put all the team ID where he is as the default -1  medPerson and PERSONEUIPA AND PERSON MOD 
CREATE TRIGGER trg_DeletAthelete
ON FADU_ATLETA
AFTER DELETE
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @DummyPersonId INT;
        @DummyPersonId = 0
        
        UPDATE dbo.FADU_PERSONEQUIPA
        SET Person_Id = @DummyPersonId
        WHERE Person_Id IN (SELECT Id FROM deleted);

        UPDATE dbo.FADU_PERSONMOD
        SET Person_id = @DummyPersonId
        WHERE Person_id IN (SELECT Id FROM deleted);

        UPDATE dbo.FADU_MEDPERS
        SET Person_Id = @DummyPersonId
        WHERE Person_Id IN (SELECT Id FROM deleted);

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
CREATE OR ALTER TRIGGER trg_CheckModAss
on FADU_PERSONMOD
after INSERT
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY;
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
    BEGIN CATCH;
        ROLLBACK TRANSACTION;
        PRINT 'Error occurred while updating Number_medals after insertion.';
        THROW;
    END CATCH

END;

