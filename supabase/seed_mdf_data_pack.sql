-- PACOTE DE DADOS EXTRAS: PADRÕES MDF --
-- Adiciona coleções e padrões reais para Guararapes, Arauco, Duratex e Eucatex.

-- GARANTIR IDS DOS FABRICANTES (Caso não existam, insere)
INSERT INTO fabricantes_mdf (id, nome, site_oficial) 
VALUES 
(1, 'Guararapes', 'https://www.guararapes.com.br'),
(2, 'Arauco', 'https://arauco.com.br'),
(3, 'Eucatex', 'https://www.eucatex.com.br'),
(4, 'Duratex', 'https://www.duratexmadeira.com.br')
ON CONFLICT (id) DO NOTHING;

-- NOVAS COLEÇÕES
INSERT INTO colecoes_mdf (fabricante_id, nome, conceito) VALUES
(1, 'Madeiras do Brasil', 'Inspiração na flora nacional'),
(2, 'Fundamental', 'Cores essenciais e atemporais'),
(4, 'Essencial Wood', 'Madeiras clássicas e versáteis'),
(4, 'Internos', 'Padrões ideais para parte interna de móveis');

-- ID das coleções criadas acima serão gerados automaticamente. 
-- Para simplificar, vou usar subqueries nos inserts abaixo para buscar pelo nome/fabricante.

-- PADRÕES GUARARAPES
INSERT INTO padroes_mdf (
  fabricante_id, colecao_id, nome, linha, categoria, cor_base, acabamento, 
  espessuras_disponiveis, aplicacoes, imagem_url, descricao, tags
) VALUES 
(1, (SELECT id FROM colecoes_mdf WHERE nome = 'Madeiras do Brasil' LIMIT 1), 'Alecrim', 'Naturale', 'madeirado', 'Verde/Madeira', 'Naturale',
ARRAY[15, 18, 25], ARRAY['Cozinha', 'Sala', 'Painel'], 
'https://guararapes.com.br/assets/images/padroes/alecrim-mdf-guararapes.jpg',
'Um madeirado com toque esverdeado, trazendo a natureza para dentro de casa.', 
ARRAY['natureza', 'fresco', 'madeira clara']),

(1, (SELECT id FROM colecoes_mdf WHERE nome = 'Madeiras do Brasil' LIMIT 1), 'Curupixá', 'Naturale', 'madeirado', 'Castanho Avermelhado', 'Naturale',
ARRAY[6, 15, 18], ARRAY['Quarto', 'Sala'], 
'https://guararapes.com.br/assets/images/padroes/curupixa-mdf-guararapes.jpg',
'Clássico brasileiro, com catedrais marcadas e tom aquecido.', 
ARRAY['classico', 'quente', 'tradicional']),

(1, 1, 'Areia', 'Colors', 'unicolor', 'Bege', 'Matt', -- Usa coleção ID 1 (Chroma) ou fallback
ARRAY[15, 18], ARRAY['Cozinha', 'Banheiro'], 
'https://guararapes.com.br/assets/images/padroes/areia-mdf-guararapes.jpg',
'O neutro perfeito. Nem branco, nem cinza. A base ideal para qualquer projeto.', 
ARRAY['neutro', 'bege', 'base']);

-- PADRÕES ARAUCO
INSERT INTO padroes_mdf (
  fabricante_id, colecao_id, nome, linha, categoria, cor_base, acabamento, 
  espessuras_disponiveis, aplicacoes, resistencia_umidade, tags
) VALUES 
(2, (SELECT id FROM colecoes_mdf WHERE nome = 'Fundamental' LIMIT 1), 'Cinza Cristal', 'Fundamental', 'unicolor', 'Cinza Claro', 'Fosco',
ARRAY[6, 15, 18, 25], ARRAY['Escritório', 'Cozinha', 'Interno'], true,
ARRAY['cinza', 'neutro', 'basico']),

(2, (SELECT id FROM colecoes_mdf WHERE nome = 'Fundamental' LIMIT 1), 'Grafite', 'Fundamental', 'unicolor', 'Cinza Escuro', 'Fosco',
ARRAY[15, 18], ARRAY['Sala', 'Cozinha', 'Corporativo'], true,
ARRAY['escuro', 'moderno', 'masculino']),

(2, 3, 'Nogueira Persa', 'Tons do Brasil', 'madeirado', 'Marrom Escuro', 'Nature',
ARRAY[15, 18, 25], ARRAY['Móveis de luxo', 'Painéis'], false,
ARRAY['nobre', 'escuro', 'sofisticado']);

-- PADRÕES DURATEX
INSERT INTO padroes_mdf (
  fabricante_id, colecao_id, nome, linha, categoria, cor_base, acabamento, 
  espessuras_disponiveis, aplicacoes, tags
) VALUES 
(4, (SELECT id FROM colecoes_mdf WHERE nome = 'Essencial Wood' LIMIT 1), 'Carvalho Hanover', 'Design', 'madeirado', 'Mel', 'Texturizado',
ARRAY[6, 15, 18], ARRAY['Quarto', 'Sala'], ARRAY['classico', 'carvalho', 'mel']),

(4, (SELECT id FROM colecoes_mdf WHERE nome = 'Essencial Wood' LIMIT 1), 'Itapuã', 'Essencial', 'madeirado', 'Bege Claro', 'Liso',
ARRAY[15, 18], ARRAY['Quarto Infantil', 'Interno'], ARRAY['claro', 'suave', 'nortico']),

(4, (SELECT id FROM colecoes_mdf WHERE nome = 'Internos' LIMIT 1), 'Gianduia', 'Trama', 'unicolor', 'Marrom Acinzentado', 'Trama',
ARRAY[15, 18], ARRAY['Cozinha', 'Armários'], ARRAY['elegante', 'neutro', 'tecido']);

-- PADRÕES EUCATEX
INSERT INTO padroes_mdf (
  fabricante_id, colecao_id, nome, linha, categoria, cor_base, acabamento, 
  espessuras_disponiveis, aplicacoes, tags
) VALUES 
(3, 4, 'Raízes', 'BP Raízes', 'madeirado', 'Escuro', 'Eros',
ARRAY[15, 18, 25], ARRAY['Painel TV', 'Cabeceira'], ARRAY['rustico', 'forte', 'textura']),

(3, 4, 'Fumê', 'Lacca', 'unicolor', 'Cinza Médio', 'Alto Brilho',
ARRAY[15, 18], ARRAY['Frentes', 'Portas'], ARRAY['brilho', 'vidro', 'moderno']);

-- Atualizar sequências (boas práticas)
-- Nota: O Supabase/Postgres cuida disso, mas em scripts manuais complexos é bom garantir.
