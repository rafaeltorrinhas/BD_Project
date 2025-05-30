drop PROCEDURE dbo.addAthlete
drop PROCEDURE dbo.deleteAthlete
drop PROCEDURE dbo.updateAthlete

CREATE PROCEDURE dbo.addAthlete
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

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR ('Error', 16, 1);
    END CATCH
END;

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
        IF EXISTS (
            SELECT 1
            FROM dbo.FADU_PERSON
            WHERE NumeroCC = @NumeroCC
              AND Id <> @Id
        )
        BEGIN
            THROW 50001, 'Duplicate NumeroCC detected!', 1;
        END

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

