drop PROCEDURE dbo.addAtlete

CREATE PROCEDURE dbo.addAtlete
    @Name varchar(64),
    @NumeroCC char(9),
    @DateBirth date,
    @Email varchar(64),
    @Phone char(9),
    @Ass_Id int,
    @NewPersonId INT OUTPUT
AS
BEGIN
    DECLARE @ToReturn INT;

    -- Insert into FADU_PERSON
    INSERT INTO FADU_PERSON (Name, NumeroCC, DateBirth, Email, Phone, Ass_Id)
    VALUES (@Name, @NumeroCC, @DateBirth, @Email, @Phone, @Ass_Id);

    -- Fetch the new Person ID
    SELECT @ToReturn = Id
    FROM FADU_PERSON
    WHERE NumeroCC = @NumeroCC;

    -- Insert into FADU_ATLETA
    INSERT INTO FADU_ATLETA (Person_Id)
    VALUES (@ToReturn);

    -- Set the output parameter
    SET @NewPersonId = @ToReturn;

END;


CREATE PROCEDURE dbo.deleteAtlete
    @PersonId INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM FADU_ATLETA
        WHERE Person_Id = @PersonId;

        DELETE FROM FADU_PERSON
        WHERE Id = @PersonId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR ('Error', 16, 1);
    END CATCH
END;