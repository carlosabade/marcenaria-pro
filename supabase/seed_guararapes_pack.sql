-- DATA PACK: GUARARAPES (Popular Patterns)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    fab_id BIGINT;
BEGIN
    -- Find or Create Guararapes
    SELECT id INTO fab_id FROM fabricantes_mdf WHERE nome = 'Guararapes';
    
    IF fab_id IS NULL THEN
        INSERT INTO fabricantes_mdf (nome, site_oficial, total_padroes, descricao)
        VALUES ('Guararapes', 'https://www.guararapes.com.br', 120, 'Painéis de MDF com tecnologia exclusiva e design autêntico.')
        RETURNING id INTO fab_id;
    END IF;

    -- BULK INSERT PATTERNS
    -- 1. Woodgrains (Madeirados)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Savana', 'madeirado', 'Madeira Clara', 'Dual Syncro', true),
    (fab_id, 'Carvalho Natural', 'madeirado', 'Madeira Mel', 'Naturale', true),
    (fab_id, 'Freijó', 'madeirado', 'Madeira Mel', 'Naturale', true),
    (fab_id, 'Imbuia', 'madeirado', 'Madeira Escura', 'Naturale', true),
    (fab_id, 'Nogueira Caiena', 'madeirado', 'Madeira Avermelhada', 'Naturale', true),
    (fab_id, 'Curupixá', 'madeirado', 'Madeira Avermelhada', 'Naturale', true),
    (fab_id, 'Baviera', 'madeirado', 'Madeira Escura', 'Dual Syncro', true),
    (fab_id, 'Sibéria', 'madeirado', 'Madeira Clara', 'Dual Syncro', true);

    -- 2. Colors & Hybrids
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Areia', 'unicolor', 'Bege', 'Colors', true),
    (fab_id, 'Capuccino', 'unicolor', 'Marrom Claro', 'Colors', true),
    (fab_id, 'Marsala', 'unicolor', 'Vinho', 'Colors', true),
    (fab_id, 'Azul Petróleo', 'unicolor', 'Azul Escuro', 'Colors', true),
    (fab_id, 'Verde Floresta', 'unicolor', 'Verde Escuro', 'Colors', true),
    (fab_id, 'Chumbo', 'unicolor', 'Cinza Escuro', 'Colors', true),
    (fab_id, 'Grafite', 'unicolor', 'Cinza Médio', 'Colors', true),
    (fab_id, 'Tela', 'tecido', 'Cinza Têxtil', 'Innovus', true),
    (fab_id, 'Cimento', 'pedra', 'Cinza Concreto', 'Magma', true);

    -- Update stats
    UPDATE fabricantes_mdf SET total_padroes = (SELECT COUNT(*) FROM padroes_mdf WHERE fabricante_id = fab_id) WHERE id = fab_id;

END $$;
