create table dbo.FADU_FASE (
    Id int identity primary key,
    Name varchar(64)
)
go create table dbo.FADU_MODALIDADE (
        Id int identity primary key,
        Name varchar(64) not null,
        MaxPlayers int not NULL
    )
go create table dbo.FADU_ORGANIZACAO (
        Id int identity primary key,
        Fase_id int constraint FK_ORG_FASE references dbo.FADU_FASE
    )
go create table dbo.FADU_ASSOCIAÇAO_ACADEMICA (
        Id int identity primary key,
        Name varchar(128) not null,
        Sigla varchar(16) not null,
        Org_Id int constraint FK_ASS_ORG references dbo.FADU_ORGANIZACAO
    )
go create table dbo.FADU_ASSMODALIDADE (
        Mod_Id int not null constraint FK_ASSMOD_MOD references dbo.FADU_MODALIDADE,
        Ass_Id int not null constraint FK_ASSMOD_ASS references dbo.FADU_ASSOCIAÇAO_ACADEMICA,
        Number_medals int,
        primary key (Mod_Id, Ass_Id)
    )
go create table dbo.FADU_EQUIPA (
        Id int identity primary key,
        Mod_Id int constraint FK_EQ_MOD references dbo.FADU_MODALIDADE,
        Ass_id int constraint FK_EQ_ASS references dbo.FADU_ASSOCIAÇAO_ACADEMICA
    )
go create table dbo.FADU_JOGO (
        Id int identity primary key,
        Data date,
        Duracao time,
        Resultado varchar(32),
        LocalJogo varchar(64),
        Fase_Id int constraint FK_EQJOGO_FASE references dbo.FADU_FASE,
        Mod_Id int constraint FK_JOGO_MOD references dbo.FADU_MODALIDADE,
        Equipa_id1 int constraint FK_JOGOEQ1 references dbo.FADU_EQUIPA,
        Equipa_id2 int constraint FK_JOGOEQ2 references dbo.FADU_EQUIPA
    )
go create table dbo.FADU_PERSON (
        Id int identity primary key,
        Name varchar(64),
        NumeroCC char(9) UNIQUE not null  check  (
            [NumeroCC] like '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        ),
        DateBirth date,
        Email varchar(64),
        Phone char(9) not null check (
            [Phone] like '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        ),
        Ass_Id int constraint FK_PERSON_ASS references dbo.FADU_ASSOCIAÇAO_ACADEMICA
    )
go create table dbo.FADU_ARBITRO (
        Person_Id int not null primary key references dbo.FADU_PERSON
    )
go create table dbo.FADU_ATLETA (
        Person_Id int not null primary key references dbo.FADU_PERSON
    )
go create table dbo.FADU_PERSONEQUIPA (
        EQUIPA_Id int not null constraint FK_PERSONEQ_EQ references dbo.FADU_EQUIPA,
        Person_Id int not null constraint FK_PERSONEQ_PERSON references dbo.FADU_PERSON,
        DateOfReg date,
        primary key (EQUIPA_Id, Person_Id)
    )
go create table dbo.FADU_PERSONMOD (
        Person_id int not null constraint FK_PERSONMOD_PERSON references dbo.FADU_PERSON,
        Mod_Id int not null constraint FK_PERSONMOD_MOD references dbo.FADU_MODALIDADE,
        primary key (Person_id, Mod_Id)
    )
go create table dbo.FADU_TIPOMEDALHA (
        Id int identity primary key,
        Type varchar(64)
    )
go create table dbo.FADU_MEDALHAS (
        TypeMedal_Id int not null constraint FK_MED_TYPEM references dbo.FADU_TIPOMEDALHA,
        Year char(4) not null,
        Mod_Id int not null,
        Ass_Id int not null,
        primary key (Mod_Id, Ass_Id, Year),
        constraint FK_MED_ASS foreign key (Mod_Id, Ass_Id) references dbo.FADU_ASSMODALIDADE
    )
go create table dbo.FADU_MEDPERS (
        Year char(4) not null,
        Mod_Id int not null,
        Ass_Id int not null,
        Person_Id int not null constraint FK_MEDPERSON_PERSON references dbo.FADU_PERSON,
        primary key (Year, Mod_Id, Ass_Id, Person_Id),
        constraint FK_MEDPERSON_MED foreign key (Mod_Id, Ass_Id, Year) references dbo.FADU_MEDALHAS (Mod_Id, Ass_Id, Year)
    )
go create table dbo.FADU_TREINADOR (
        Person_Id int not null primary key references dbo.FADU_PERSON
    )
go create table dbo.FADU_UNIVERSIDADE (
        Address varchar(32) not null,
        Name varchar(64) not null,
        Ass_Id int constraint FK_UNI_ASS references dbo.FADU_ASSOCIAÇAO_ACADEMICA,
        primary key (Address, Name)
    )
go




-- could increse perfomance CREATE INDEX IDX_FADU_PERSONEQUIPA_MOD_ASS ON FADU_PERSONEQUIPA(Mod_Id, Ass_Id);
