-- Insert data for FADU_FASE (only 2 phases as requested)
INSERT INTO dbo.FADU_FASE (Name) VALUES
('Fase de Grupos'),
('Fase Final');

-- Insert data for FADU_MODALIDADE (20 sports)
INSERT INTO dbo.FADU_MODALIDADE (Name, MaxPlayers) VALUES
('Futebol', 11),
('Basquetebol', 5),
('Voleibol', 6),
('Andebol', 7),
('Futsal', 5),
('Ténis', 1),
('Ténis de Mesa', 1),
('Badminton', 1),
('Natação', 1),
('Atletismo', 1),
('Rugby', 15),
('Hóquei em Campo', 11),
('Esgrima', 1),
('Judo', 1),
('Karaté', 1),
('Taekwondo', 1),
('Ciclismo', 1),
('Remo', 8),
('Vela', 2),
('Xadrez', 1);

-- Insert data for FADU_ORGANIZACAO (20 organizations)
INSERT INTO dbo.FADU_ORGANIZACAO (Fase_id) VALUES
(1), (1), (1), (1), (1), (1), (1), (1), (1), (1),
(2), (2), (2), (2), (2), (2), (2), (2), (2), (2);

-- Insert data for FADU_ASSOCIAÇAO_ACADEMICA (20 academic associations)
INSERT INTO dbo.FADU_ASSOCIAÇAO_ACADEMICA (Name, Sigla, Org_Id) VALUES
('Associação Académica de Coimbra', 'AAC', 1),
('Associação de Estudantes do Instituto Superior Técnico', 'AEIST', 2),
('Associação Académica da Universidade do Porto', 'AAUP', 3),
('Associação Académica da Universidade do Minho', 'AAUM', 4),
('Associação de Estudantes da Universidade de Aveiro', 'AEUA', 5),
('Associação Académica da Universidade Nova de Lisboa', 'AAUN', 6),
('Associação de Estudantes da Universidade do Algarve', 'AEUALG', 7),
('Associação Académica da Universidade da Beira Interior', 'AAUBI', 8),
('Associação de Estudantes da Universidade de Évora', 'AEUE', 9),
('Associação Académica da Universidade de Trás-os-Montes', 'AAUTM', 10),
('Associação de Estudantes da Universidade Católica', 'AEUCP', 11),
('Associação Académica do ISCTE', 'AAISCTE', 12),
('Associação de Estudantes da Universidade Lusíada', 'AEUL', 13),
('Associação Académica da Universidade Autónoma', 'AAUAL', 14),
('Associação de Estudantes do Instituto Politécnico de Lisboa', 'AEIPL', 15),
('Associação Académica do Instituto Politécnico do Porto', 'AAIPP', 16),
('Associação de Estudantes da Universidade Portucalense', 'AEUP', 17),
('Associação Académica da Universidade Lusófona', 'AAUL', 18),
('Associação de Estudantes da Universidade Fernando Pessoa', 'AEUFP', 19),
('Associação Académica da Universidade Europeia', 'AAUE', 20);

-- Insert data for FADU_ASSMODALIDADE (associations participating in sports)
INSERT INTO dbo.FADU_ASSMODALIDADE (Mod_Id, Ass_Id, Number_medals) VALUES
(1, 1, 3), (1, 2, 1), (1, 3, 2), (1, 4, 0), (1, 5, 1),
(2, 1, 2), (2, 2, 3), (2, 3, 1), (2, 6, 0), (2, 7, 1),
(3, 1, 1), (3, 3, 2), (3, 4, 3), (3, 8, 0), (3, 9, 1),
(4, 2, 2), (4, 5, 1), (4, 6, 3), (4, 10, 0), (4, 11, 1),
(5, 1, 1), (5, 7, 2), (5, 12, 3), (5, 13, 0), (5, 14, 1),
(6, 3, 2), (6, 8, 1), (6, 15, 3), (6, 16, 0), (6, 17, 1),
(7, 4, 1), (7, 9, 2), (7, 18, 3), (7, 19, 0), (7, 20, 1),
(8, 5, 2), (8, 10, 1), (8, 1, 3), (8, 2, 0), (8, 3, 1),
(9, 6, 1), (9, 11, 2), (9, 4, 3), (9, 5, 0), (9, 6, 1),
(10, 7, 2), (10, 12, 1), (10, 7, 3), (10, 8, 0), (10, 9, 1),
(11, 8, 1), (11, 13, 2), (11, 10, 3), (11, 11, 0), (11, 12, 1),
(12, 9, 2), (12, 14, 1), (12, 13, 3), (12, 14, 0), (12, 15, 1),
(13, 10, 1), (13, 15, 2), (13, 16, 3), (13, 17, 0), (13, 18, 1),
(14, 11, 2), (14, 16, 1), (14, 19, 3), (14, 20, 0), (14, 1, 1),
(15, 12, 1), (15, 17, 2), (15, 2, 3), (15, 3, 0), (15, 4, 1),
(16, 13, 2), (16, 18, 1), (16, 5, 3), (16, 6, 0), (16, 7, 1),
(17, 14, 1), (17, 19, 2), (17, 8, 3), (17, 9, 0), (17, 10, 1),
(18, 15, 2), (18, 20, 1), (18, 11, 3), (18, 12, 0), (18, 13, 1),
(19, 16, 1), (19, 1, 2), (19, 14, 3), (19, 15, 0), (19, 16, 1),
(20, 17, 2), (20, 2, 1), (20, 17, 3), (20, 18, 0), (20, 19, 1);

-- Insert data for FADU_EQUIPA (20 teams)
INSERT INTO dbo.FADU_EQUIPA (Mod_Id, Ass_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 2), (2, 3), (2, 6), (2, 7),
(3, 1), (3, 3), (3, 4), (3, 8), (3, 9),
(4, 2), (4, 5), (4, 6), (4, 10), (4, 11);

-- Insert data for FADU_JOGO (20 games)
INSERT INTO dbo.FADU_JOGO (Data, Duracao, Resultado, LocalJogo, Fase_Id, Mod_Id, Equipa_id1, Equipa_id2) VALUES
('2024-03-15', '01:30:00', '2-1', 'Estádio Universitário de Coimbra', 1, 1, 1, 2),
('2024-03-16', '01:35:00', '1-3', 'Campo da AAC', 1, 1, 3, 4),
('2024-03-17', '01:25:00', '0-2', 'Estádio do IST', 1, 1, 5, 1),
('2024-03-18', '02:10:00', '85-72', 'Pavilhão Multiusos', 1, 2, 6, 7),
('2024-03-19', '01:50:00', '68-74', 'Pavilhão da UP', 1, 2, 8, 9),
('2024-03-20', '01:45:00', '3-1', 'Pavilhão de Voleibol', 1, 3, 11, 12),
('2024-03-21', '01:40:00', '2-3', 'Pavilhão Universitário', 1, 3, 13, 14),
('2024-03-22', '01:55:00', '25-18', 'Pavilhão de Andebol', 1, 4, 16, 17),
('2024-04-15', '01:30:00', '3-0', 'Estádio Final', 2, 1, 1, 3),
('2024-04-16', '02:15:00', '92-88', 'Pavilhão Final', 2, 2, 6, 8),
('2024-04-17', '01:50:00', '3-2', 'Pavilhão Final', 2, 3, 11, 13),
('2024-04-18', '02:00:00', '28-25', 'Pavilhão Final', 2, 4, 16, 18),
('2024-03-23', '01:20:00', '4-2', 'Pavilhão Futsal', 1, 1, 2, 4),
('2024-03-24', '01:15:00', '1-5', 'Campo Universitário', 1, 1, 1, 5),
('2024-03-25', '02:05:00', '78-81', 'Pavilhão Basquete', 1, 2, 7, 9),
('2024-03-26', '01:48:00', '3-0', 'Pavilhão Volei', 1, 3, 12, 15),
('2024-03-27', '01:52:00', '22-19', 'Pavilhão Andebol', 1, 4, 17, 19),
('2024-04-19', '01:35:00', '2-1', 'Estádio Final', 2, 1, 2, 1),
('2024-04-20', '02:10:00', '89-85', 'Pavilhão Final', 2, 2, 7, 6),
('2024-04-21', '01:55:00', '3-1', 'Pavilhão Final', 2, 3, 12, 11);

-- Insert data for FADU_PERSON (50+ people to have more players per team)
INSERT INTO dbo.FADU_PERSON (Name, NumeroCC, DateBirth, Email, Phone, Ass_Id) VALUES
-- Players for AAC (Ass_Id = 1)
('João Silva', '123456789', '2001-05-15', 'joao.silva@student.uc.pt', '912345678', 1),
('Maria Santos', '234567890', '2000-08-22', 'maria.santos@student.uc.pt', '923456789', 1),
('Pedro Costa', '345678901', '2002-03-10', 'pedro.costa@student.uc.pt', '934567890', 1),
('Ana Ferreira', '456789012', '2001-11-05', 'ana.ferreira@student.uc.pt', '945678901', 1),
('Carlos Oliveira', '567890123', '2000-07-18', 'carlos.oliveira@student.uc.pt', '956789012', 1),
('Sofia Rodrigues', '678901234', '2002-01-25', 'sofia.rodrigues@student.uc.pt', '967890123', 1),
('Miguel Pereira', '789012345', '2001-09-12', 'miguel.pereira@student.uc.pt', '978901234', 1),
('Catarina Lima', '890123456', '2000-12-03', 'catarina.lima@student.uc.pt', '989012345', 1),
('Ricardo Martins', '901234567', '2002-04-20', 'ricardo.martins@student.uc.pt', '990123456', 1),
('Inês Alves', '012345678', '2001-06-14', 'ines.alves@student.uc.pt', '901234567', 1),
('Tiago Gonçalves', '123456780', '2000-10-08', 'tiago.goncalves@student.uc.pt', '912345679', 1),
('Joana Ribeiro', '234567801', '2002-02-17', 'joana.ribeiro@student.uc.pt', '923456780', 1),

-- Players for AEIST (Ass_Id = 2)
('António Mendes', '345678012', '2001-01-30', 'antonio.mendes@tecnico.ulisboa.pt', '934567801', 2),
('Beatriz Carvalho', '456789023', '2000-05-12', 'beatriz.carvalho@tecnico.ulisboa.pt', '945678012', 2),
('Francisco Nunes', '567890134', '2002-08-05', 'francisco.nunes@tecnico.ulisboa.pt', '956789023', 2),
('Rita Sousa', '678901245', '2001-12-18', 'rita.sousa@tecnico.ulisboa.pt', '967890134', 2),
('Diogo Fernandes', '789012356', '2000-03-25', 'diogo.fernandes@tecnico.ulisboa.pt', '978901245', 2),
('Marta Teixeira', '890123467', '2002-07-09', 'marta.teixeira@tecnico.ulisboa.pt', '989012356', 2),
('Bruno Correia', '901234578', '2001-11-22', 'bruno.correia@tecnico.ulisboa.pt', '990123467', 2),
('Leonor Pinto', '012345689', '2000-04-16', 'leonor.pinto@tecnico.ulisboa.pt', '901234578', 2),
('Gonçalo Vieira', '123456701', '2002-09-03', 'goncalo.vieira@tecnico.ulisboa.pt', '912345680', 2),
('Mariana Castro', '234567812', '2001-02-28', 'mariana.castro@tecnico.ulisboa.pt', '923456701', 2),
('Rui Baptista', '345678923', '2000-06-11', 'rui.baptista@tecnico.ulisboa.pt', '934567812', 2),
('Vera Moura', '456790034', '2002-10-24', 'vera.moura@tecnico.ulisboa.pt', '945678923', 2),

-- Players for AAUP (Ass_Id = 3)
('Hugo Barbosa', '567801145', '2001-03-07', 'hugo.barbosa@fe.up.pt', '956790034', 3),
('Cláudia Macedo', '678912256', '2000-07-20', 'claudia.macedo@fe.up.pt', '967801145', 3),
('André Monteiro', '789023367', '2002-11-13', 'andre.monteiro@fe.up.pt', '978912256', 3),
('Patrícia Lopes', '890134478', '2001-04-26', 'patricia.lopes@fe.up.pt', '989023367', 3),
('Nuno Campos', '901245589', '2000-08-09', 'nuno.campos@fe.up.pt', '990134478', 3),
('Sara Fonseca', '012356690', '2002-12-22', 'sara.fonseca@fe.up.pt', '901245589', 3),
('Filipe Cardoso', '123467701', '2001-05-15', 'filipe.cardoso@fe.up.pt', '912356690', 3),
('Helena Tavares', '234578812', '2000-09-28', 'helena.tavares@fe.up.pt', '923467701', 3),
('Marco Silva', '345689923', '2002-01-11', 'marco.silva@fe.up.pt', '934578812', 3),
('Cristina Reis', '456701034', '2001-06-04', 'cristina.reis@fe.up.pt', '945689923', 3),
('Vasco Duarte', '567812145', '2000-10-17', 'vasco.duarte@fe.up.pt', '956701034', 3),
('Diana Azevedo', '678923256', '2002-03-02', 'diana.azevedo@fe.up.pt', '967812145', 3),

-- Continue with more players for other associations
('Luís Moreira', '789034367', '2001-07-15', 'luis.moreira@uminho.pt', '978923256', 4),
('Paula Esteves', '890145478', '2000-11-28', 'paula.esteves@uminho.pt', '989034367', 4),
('Daniel Cunha', '901256589', '2002-04-12', 'daniel.cunha@uminho.pt', '990145478', 4),
('Isabel Rocha', '012367690', '2001-08-25', 'isabel.rocha@uminho.pt', '901256589', 4),

('Eduardo Marques', '123478701', '2000-12-08', 'eduardo.marques@ua.pt', '912367690', 5),
('Susana Gomes', '234589812', '2002-05-21', 'susana.gomes@ua.pt', '923478701', 5),
('Joaquim Pires', '345690923', '2001-09-04', 'joaquim.pires@ua.pt', '934589812', 5),
('Raquel Antunes', '456701934', '2000-01-17', 'raquel.antunes@ua.pt', '945690923', 5),

('Armando Freitas', '567812045', '2002-06-30', 'armando.freitas@unl.pt', '956701934', 6),
('Mónica Brito', '678923156', '2001-10-13', 'monica.brito@unl.pt', '967812045', 6),
('Sérgio Cabral', '789034267', '2000-02-26', 'sergio.cabral@unl.pt', '978923156', 6),
('Fátima Leite', '890145378', '2002-07-09', 'fatima.leite@unl.pt', '989034267', 6);

-- Insert data for FADU_ARBITRO (20 referees)
INSERT INTO dbo.FADU_ARBITRO (Person_Id) VALUES
(1), (5), (9), (13), (17), (21), (25), (29), (33), (37), (41), (45), (2), (6), (10), (14), (18), (22), (26), (30);

-- Insert data for FADU_ATLETA (all remaining people are athletes)
INSERT INTO dbo.FADU_ATLETA (Person_Id) VALUES
(3), (4), (7), (8), (11), (12), (15), (16), (19), (20), (23), (24), (27), (28), (31), (32), (34), (35), (36), (38), (39), (40), (42), (43), (44), (46), (47), (48);

-- Insert data for FADU_PERSONEQUIPA (players in teams)
INSERT INTO dbo.FADU_PERSONEQUIPA (EQUIPA_Id, Person_Id, DateOfReg) VALUES
-- Team 1 (Futebol AAC)
(1, 3, '2024-01-15'), (1, 4, '2024-01-15'), (1, 7, '2024-01-16'), (1, 8, '2024-01-16'),
(1, 11, '2024-01-17'), (1, 12, '2024-01-17'), (1, 23, '2024-01-18'), (1, 24, '2024-01-18'),
(1, 27, '2024-01-19'), (1, 28, '2024-01-19'), (1, 31, '2024-01-20'),

-- Team 2 (Futebol AEIST)
(2, 15, '2024-01-15'), (2, 16, '2024-01-15'), (2, 19, '2024-01-16'), (2, 20, '2024-01-16'),
(2, 32, '2024-01-17'), (2, 34, '2024-01-17'), (2, 35, '2024-01-18'), (2, 36, '2024-01-18'),
(2, 38, '2024-01-19'), (2, 39, '2024-01-19'), (2, 40, '2024-01-20'),

-- Team 6 (Basquetebol AAC)
(6, 3, '2024-01-22'), (6, 7, '2024-01-22'), (6, 11, '2024-01-23'), (6, 23, '2024-01-23'), (6, 27, '2024-01-24'),

-- Team 7 (Basquetebol AEIST)
(7, 15, '2024-01-22'), (7, 19, '2024-01-22'), (7, 32, '2024-01-23'), (7, 35, '2024-01-23'), (7, 38, '2024-01-24'),

-- Team 11 (Voleibol AAC)
(11, 4, '2024-01-25'), (11, 8, '2024-01-25'), (11, 12, '2024-01-26'), (11, 24, '2024-01-26'), 
(11, 28, '2024-01-27'), (11, 31, '2024-01-27'),

-- Team 12 (Voleibol AAUP)
(12, 42, '2024-01-25'), (12, 43, '2024-01-25'), (12, 44, '2024-01-26'), (12, 46, '2024-01-26'),
(12, 47, '2024-01-27'), (12, 48, '2024-01-27');

-- Insert data for FADU_PERSONMOD (people qualified for sports)
INSERT INTO dbo.FADU_PERSONMOD (Person_id, Mod_Id) VALUES
-- Referees qualified for multiple sports
(1, 1), (1, 5), (5, 2), (5, 3), (9, 4), (9, 6), (13, 7), (13, 8),
(17, 9), (17, 10), (21, 11), (21, 12), (25, 13), (25, 14), (29, 15), (29, 16),
-- Athletes qualified for their sports
(3, 1), (4, 1), (7, 1), (8, 1), (11, 1), (12, 1), (15, 1), (16, 1), (19, 1), (20, 1),
(3, 2), (7, 2), (11, 2), (15, 2), (19, 2), (4, 3), (8, 3), (12, 3), (24, 3), (28, 3),
(23, 4), (27, 4), (31, 4), (32, 4), (34, 4), (35, 5), (36, 5), (38, 5), (39, 5), (40, 5);

-- Insert data for FADU_TIPOMEDALHA (only 3 medal types: Gold, Silver, Bronze)
INSERT INTO dbo.FADU_TIPOMEDALHA (Type) VALUES
('Ouro'),
('Prata'),
('Bronze');

-- Insert data for FADU_MEDALHAS (medals awarded)
INSERT INTO dbo.FADU_MEDALHAS (TypeMedal_Id, Year, Mod_Id, Ass_Id) VALUES
('2023', 1, 1, 1), ('2023', 2, 1, 2), ('2023', 3, 1, 3), ('2023', 1, 2, 1), ('2023', 2, 2, 2),
('2022', 1, 3, 1), ('2022', 2, 3, 3), ('2022', 3, 3, 4), ('2022', 1, 4, 2), ('2022', 2, 4, 5),
('2021', 1, 5, 1), ('2021', 2, 5, 7), ('2021', 3, 5, 12), ('2021', 1, 6, 3), ('2021', 2, 6, 8),
('2020', 1, 7, 4), ('2020', 2, 7, 9), ('2020', 3, 7, 18), ('2020', 1, 8, 5), ('2020', 2, 8, 10);

-- Insert data for FADU_MEDPERS (individual medal winners)
INSERT INTO dbo.FADU_MEDPERS (Year, Mod_Id, Ass_Id, Person_Id) VALUES
('2023', 1, 1, 3), ('2023', 1, 1, 4), ('2023', 1, 2, 15), ('2023', 1, 2, 16), ('2023', 2, 1, 7),
('2022', 3, 1, 8), ('2022', 3, 3, 42), ('2022', 4, 2, 19), ('2022', 4, 5, 32), ('2021', 5, 1, 11),
('2021', 5, 7, 34), ('2021', 6, 3, 43), ('2021', 7, 4, 35), ('2020', 8, 5, 36), ('2020', 8, 10, 38),
('2023', 1, 3, 44), ('2022', 3, 4, 27), ('2021', 5, 12, 39), ('2020', 7, 18, 40), ('2020', 8, 10, 31);

-- Insert data for FADU_TREINADOR (20 coaches)
INSERT INTO dbo.FADU_TREINADOR (Person_Id) VALUES
(2), (6), (10), (14), (18), (22), (26), (30), (33), (37), (41), (45), (1), (5), (9), (13), (17), (21), (25), (29);

-- Insert data for FADU_UNIVERSIDADE (20 universities)
INSERT INTO dbo.FADU_UNIVERSIDADE (Address, Name, Ass_Id) VALUES
('Largo da Porta Férrea', 'Universidade de Coimbra', 1),
('Av. Rovisco Pais 1', 'Instituto Superior Técnico', 2),
('Rua Dr. Roberto Frias', 'Universidade do Porto', 3),
('Campus de Gualtar', 'Universidade do Minho', 4),
('Campus Universitário Santiago', 'Universidade de Aveiro', 5),
('Campus de Campolide', 'Universidade Nova de Lisboa', 6),
('Campus da Penha', 'Universidade do Algarve', 7),
('Rua Marquês de Ávila Bolama', 'Universidade da Beira Interior', 8),
('Largo dos Colegiais 2', 'Universidade de Évora', 9),
('Quinta de Prados', 'Universidade de Trás-os-Montes', 10),
('Palma de Cima', 'Universidade Católica Portuguesa', 11),
('Av. das Forças Armadas', 'ISCTE - Instituto Universitário', 12),
('Rua da Junqueira 188', 'Universidade Lusíada', 13),
('Rua Santa Marta 47', 'Universidade Autónoma de Lisboa', 14),
('Rua de Santa Apolónia 11', 'Instituto Politécnico de Lisboa', 15),
('Rua Dr. António Bernardino Almeida', 'Instituto Politécnico do Porto', 16),
('Rua Dr. António Bernardino Almeida 541', 'Universidade Portucalense', 17),
('Campo Grande 376', 'Universidade Lusófona', 18),
('Praça 9 de Abril 349', 'Universidade Fernando Pessoa', 19),
('Estrada da Correia 53', 'Universidade Europeia', 20);



-- 3. Insert the dummy row with ID = -1
INSERT INTO dbo.FADU_PERSON
    (Id, Name, NumeroCC, DateBirth, Email, Phone, Ass_Id)
VALUES
    (0, 'Dummy Person', '000000000', '1900-01-01', 'dummy@dummy.com', '000000000', 1);

-- 4. Disable explicit identity insert
SET IDENTITY_INSERT dbo.FADU_PERSON OFF;

