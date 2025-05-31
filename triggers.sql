
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