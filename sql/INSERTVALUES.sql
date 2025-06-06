-- ========================
-- COMPATIBLE FADU SCHEMA DATASET
-- ========================

-- First, clear existing data to avoid conflicts
DELETE FROM FADU_MEDPERS;
DELETE FROM FADU_MEDALHAS;
DELETE FROM FADU_PERSONEQUIPA;
DELETE FROM FADU_PERSONMOD;
DELETE FROM FADU_JOGO;
DELETE FROM FADU_EQUIPA;
DELETE FROM FADU_ASSMODALIDADE;
DELETE FROM FADU_PERSON;
DELETE FROM FADU_UNIVERSIDADE;
DELETE FROM FADU_ASSOCIAÇAO_ACADEMICA;
DELETE FROM FADU_ORGANIZACAO;
DELETE FROM FADU_FASE;
DELETE FROM FADU_MODALIDADE;
DELETE FROM FADU_TIPOMEDALHA;

-- to reset the ids to start at 1
DBCC CHECKIDENT ('FADU_FASE', RESEED, 0);
DBCC CHECKIDENT ('FADU_MODALIDADE', RESEED, 0);
DBCC CHECKIDENT ('FADU_TIPOMEDALHA', RESEED, 0);
DBCC CHECKIDENT ('FADU_ORGANIZACAO', RESEED, 0);
DBCC CHECKIDENT ('FADU_ASSOCIAÇAO_ACADEMICA', RESEED, 0);
DBCC CHECKIDENT ('FADU_PERSON', RESEED, 0);
DBCC CHECKIDENT ('FADU_EQUIPA', RESEED, 0);


-- Now insert data in proper dependency order

-- 1. FASE (no dependencies)
INSERT INTO FADU_FASE ([Name]) VALUES
('Fase de Grupos'), ('Fase Final');

-- 2. ORGANIZA��O (depends on FASE)
INSERT INTO FADU_ORGANIZACAO (Fase_id)
SELECT Id FROM FADU_FASE;


-- 3. MODALIDADE (no dependencies)
INSERT INTO FADU_MODALIDADE ([Name], [NumeroMaxPlayers]) VALUES
('Futebol', 11),
('Futebol Feminino', 11),
('Futsal', 5),
('Basquetebol', 5),
('Basquetebol 3x3', 3),
('Andebol', 7),
('Voleibol', 6),
('Natação', 1),
('Atletismo', 1),
('Ténis de Mesa', 1),
('Badminton', 1),
('Xadrez', 1),
('Ténis', 1),
('Padel', 2),
('Rugby', 15),
('Hóquei em Patins', 5),
('Esgrima', 1),
('Ginástica', 1),
('Taekwondo', 1),
('Judô', 1),
('Canoagem', 1),
('Remo', 1);


-- 4. TIPO DE MEDALHAS (no dependencies)
INSERT INTO FADU_TIPOMEDALHA ([Type]) VALUES
('Ouro'), ('Prata'), ('Bronze'), ('Mérito'),
('Honra'), ('Excelência'), ('Participação'), ('Fair Play');

-- 5. ASSOCIA��ES ACAD�MICAS (depends on ORGANIZA��O)
INSERT INTO FADU_ASSOCIAÇAO_ACADEMICA ([Name], [Sigla], Org_Id) VALUES
('Associação Académica do Norte Virtual', 'AANV', 1),
('Associação Estudantil Técnica Avançada', 'AETA', 1),
('Núcleo Universitário Digital do Sul', 'NUDS', 1),
('Federação Académica Virtual Atlântica', 'FAVA', 1),
('Liga Académica do Centro', 'LAC', 1),
('União de Estudantes Insulares', 'UEI', 1),
('Associação Politécnica Digital', 'APD', 2),
('Conselho Universitário Litoral', 'CUL', 2),
('Aliança de Escolas Técnicas', 'AET', 2),
('Federação de Estudantes do Interior', 'FEI', 2),
('Associação de Medicina e Saúde', 'AMS', 2),
('Liga das Engenharias', 'LE', 2 );

-- 6. UNIVERSIDADES (depends on ASSOCIA��ES)
INSERT INTO FADU_UNIVERSIDADE ([Address], [Name], [Ass_Id]) VALUES
('Rua do Saber 21', 'Universidade Lúcida', 1),
('Avenida do Conhecimento 42', 'Instituto Omega', 2),
('Praça Académica 88', 'Escola Superior Nova Era', 3),
('Largo das Ciências 99', 'Universidade Marítima Digital', 4),
('Alameda das Artes 15', 'Universidade Criativa', 5),
('Travessa da Inovação 77', 'Instituto Politécnico Global', 6),
('Rotunda Científica 33', 'Universidade de Ciências Aplicadas', 7),
('Boulevard Tecnológico 12', 'Faculdade de Engenharia Avançada', 8),
('Avenida Médica 56', 'Escola Superior de Saúde', 9),
('Passeio das Letras 24', 'Universidade Humanística', 10),
('Largo das Descobertas 19', 'Academia de Investigação', 11),
('Praça do Conhecimento 68', 'Universidade Internacional', 12);

-- 7. PESSOAS (depends on ASSOCIA��ES)
INSERT INTO FADU_PERSON ([Name], [NumeroCC], [DateBirth], Email, Phone, Ass_Id) VALUES
('Ana Ribeiro', '123456789', '2001-05-21', 'ana.ribeiro@lucida.edu', '912345678', 1),
('Carlos Mendes', '987654321', '2000-03-15', 'carlos.mendes@omega.pt', '934567891', 2),
('Helena Silva', '456123789', '1999-07-10', 'helena.silva@nuds.edu', '926789345', 3),
('Duarte Costa', '112233445', '2002-11-30', 'duarte.costa@fava.org', '913221100', 4),
('Marta Lopes', '998877665', '1998-01-12', 'marta.lopes@novaera.edu', '915998877', 3),
('Rui Almeida', '223344556', '2001-08-24', 'rui.almeida@lucida.edu', '917223344', 1),
('Sofia Cardoso', '334455667', '2000-12-05', 'sofia.cardoso@omega.pt', '918334455', 2),
('Tiago Nunes', '445566778', '1999-04-18', 'tiago.nunes@nuds.edu', '919445566', 3),
('Beatriz Gomes', '556677889', '2002-09-11', 'beatriz.gomes@fava.org', '920556677', 4),
('Pedro Machado', '667788990', '1998-06-30', 'pedro.machado@novaera.edu', '921667788', 3),
('Inês Ferreira', '778899001', '2001-02-14', 'ines.ferreira@lucida.edu', '922778899', 1),
('Miguel Santos', '889900112', '2000-10-27', 'miguel.santos@omega.pt', '923889900', 2),
('Catarina Lima', '990011223', '1999-03-08', 'catarina.lima@nuds.edu', '924990011', 3),
('André Marques', '001122334', '2002-07-22', 'andre.marques@fava.org', '925001122', 4),
('Diana Sousa', '112233446', '1998-11-15', 'diana.sousa@novaera.edu', '926112233', 3),
('João Pinto', '223344557', '2001-01-28', 'joao.pinto@lucida.edu', '927223344', 1),
('Leonor Teixeira', '334455668', '2000-05-09', 'leonor.teixeira@omega.pt', '928334455', 2),
('Francisco Rocha', '445566779', '1999-09-02', 'francisco.rocha@nuds.edu', '929445566', 3),
('Matilde Coelho', '556677880', '2002-04-17', 'matilde.coelho@fava.org', '930556677', 4),
('Gonçalo Neves', '667788991', '1998-08-20', 'goncalo.neves@novaera.edu', '931667788', 3);

-- 8. EQUIPAS (depends on MODALIDADE and ASSOCIA��ES)
INSERT INTO FADU_EQUIPA (Mod_Id, Ass_id) VALUES
-- AANV teams
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1),
-- AETA teams
(1, 2), (3, 2), (4, 2), (6, 2), (7, 2),
-- NUDS teams
(2, 3), (5, 3), (8, 3), (9, 3), (10, 3),
-- FAVA teams
(1, 4), (4, 4), (7, 4), (10, 4), (13, 4),
-- LAC teams
(2, 5), (5, 5), (8, 5), (11, 5), (14, 5),
-- UEI teams
(3, 6), (6, 6), (9, 6), (12, 6), (15, 6);

-- 9. ASSMODALIDADE (depends on MODALIDADE and ASSOCIA��ES)
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES
(1, 1, 5), (2, 1, 3), (3, 1, 2),
(4, 2, 4), (5, 2, 1), (6, 2, 2),
(7, 3, 3), (8, 3, 2), (9, 3, 4),
(10, 4, 1), (11, 4, 3), (12, 4, 2),
(13, 5, 2), (14, 5, 1), (15, 5, 3),
(16, 6, 4), (17, 6, 2), (18, 6, 1);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (1, 2, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (1, 3, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (2, 2, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (2, 4, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (4, 3, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (5, 1, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (5, 5, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (6, 6, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (7, 1, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (7, 6, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (8, 1, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (8, 4, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (4, 5, 0);
INSERT INTO FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES (5, 6, 0);


-- 10. MEDALHAS (depends on ASSMODALIDADE and TIPOMEDALHA)
INSERT INTO FADU_MEDALHAS (TypeMedal_Id, [Year], Mod_Id, Ass_Id) VALUES
(1, '2023', 1, 1), (2, '2023', 1, 2), (3, '2023', 1, 3),
(1, '2024', 2, 2), (2, '2024', 2, 4), (3, '2024', 2, 1),
(1, '2023', 4, 2), (2, '2023', 4, 3), (3, '2023', 4, 5),
(1, '2024', 5, 5), (2, '2024', 5, 2), (3, '2024', 5, 6),
(1, '2023', 7, 3), (2, '2023', 7, 6), (3, '2023', 7, 1),
(1, '2024', 8, 1), (2, '2024', 8, 3), (3, '2024', 8, 4);

-- 11. PERSONMOD (depends on PESSOAS and MODALIDADE)
INSERT INTO FADU_PERSONMOD (Person_id, Mod_Id) VALUES
(1, 1), (1, 8), (1, 9),
(2, 2), (2, 10),
(3, 3), (3, 11),
(4, 4), (4, 12),
(5, 5), (5, 13),
(6, 6), (6, 14),
(7, 7), (7, 15),
(8, 8), (8, 16),
(9, 9), (9, 17),
(10, 10), (10, 18);

-- 12. PERSONEQUIPA (depends on PESSOAS and EQUIPAS)
INSERT INTO FADU_PERSONEQUIPA (EQUIPA_Id, Person_Id, [DateOfReg]) VALUES
(1, 1, '2024-09-01'), (1, 11, '2024-09-02'), (1, 16, '2024-09-03'),
(6, 2, '2024-09-01'), (6, 12, '2024-09-02'), (6, 17, '2024-09-03'),
(11, 4, '2024-09-01'), (11, 14, '2024-09-02'), (11, 19, '2024-09-03'),
(16, 5, '2024-09-01'), (16, 15, '2024-09-02'), (16, 20, '2024-09-03'),
(21, 6, '2024-09-01'), (21, 7, '2024-09-02'), (21, 8, '2024-09-03');

-- 13. MEDPERS (depends on MEDALHAS and PESSOAS)
INSERT INTO FADU_MEDPERS ([Year], Mod_Id, Ass_Id, Person_Id) VALUES
('2023', 1, 1, 1), ('2023', 1, 2, 11), ('2023', 1, 3, 16),
('2024', 2, 2, 2), ('2024', 2, 4, 12), ('2024', 2, 1, 17),
('2023', 4, 2, 4), ('2023', 4, 3, 14), ('2023', 4, 5, 19),
('2024', 5, 5, 5), ('2024', 5, 2, 15), ('2024', 5, 6, 20);

-- 14. JOGOS (depends on FASE, MODALIDADE, and EQUIPAS)
INSERT INTO FADU_JOGO ([Data], Duracao, Resultado, LocalJogo, Fase_Id, Mod_Id, Equipa_id1, Equipa_id2) VALUES
-- Football matches
('2025-01-15', '01:30:00', '3-2', 'Estádio Alfa', 1, 1, 1, 6),
('2025-01-22', '01:30:00', '1-1', 'Estádio Beta', 1, 1, 6, 11),
-- Basketball matches
('2025-01-16', '01:00:00', '78-65', 'Pavilhão Norte', 1, 4, 4, 9),
('2025-01-23', '01:00:00', '72-72', 'Pavilhão Sul', 1, 4, 9, 14),
-- Handball matches
('2025-01-17', '00:50:00', '28-25', 'Pavilhão Leste', 1, 6, 6, 11),
('2025-01-24', '00:50:00', '24-24', 'Pavilhão Azul', 1, 6, 11, 16);

-- 15. SPECIALIZED TABLES (depends on PESSOAS)
INSERT INTO FADU_ATLETA (Person_Id) VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10);
INSERT INTO FADU_TREINADOR (Person_Id) VALUES (11), (12), (13), (14), (15);
INSERT INTO FADU_ARBITRO (Person_Id) VALUES (16), (17), (18), (19), (20);


-- 2. Enable explicit identity insert
SET IDENTITY_INSERT dbo.FADU_PERSON ON;

-- 3. Insert the dummy row with ID = -1
INSERT INTO dbo.FADU_PERSON
    (Id, Name, NumeroCC, DateBirth, Email, Phone, Ass_Id)
VALUES
    (0, 'Dummy Person', '000000000', '1900-01-01', 'dummy@dummy.com', '000000000', 1);

-- 4. Disable explicit identity insert
SET IDENTITY_INSERT dbo.FADU_PERSON OFF;

