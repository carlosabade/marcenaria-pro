-- DATA PACK: SUDATI (Popular Patterns)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    fab_id BIGINT;
BEGIN
    -- Find or Create Sudati
    SELECT id INTO fab_id FROM fabricantes_mdf WHERE nome = 'Sudati';
    
    IF fab_id IS NULL THEN
        INSERT INTO fabricantes_mdf (nome, site_oficial, total_padroes, descricao)
        VALUES ('Sudati', 'https://www.sudati.com.br', 90, 'Design sofisticado e padrões que conectam com a natureza.')
        RETURNING id INTO fab_id;
    END IF;

    -- BULK INSERT PATTERNS
    -- 1. Woodgrains (Madeirados)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Glamour', 'madeirado', 'Madeira Escura', 'MDF', true),
    (fab_id, 'Tauari', 'madeirado', 'Madeira Clara', 'MDF', true),
    (fab_id, 'Asteca', 'madeirado', 'Madeira Média', 'MDF', true),
    (fab_id, 'Cacau', 'madeirado', 'Madeira Escura', 'MDF', true),
    (fab_id, 'Carvalho Berlin', 'madeirado', 'Madeira Clara', 'MDF', true),
    (fab_id, 'Nogueira', 'madeirado', 'Madeira Avermelhada', 'MDF', true),
    (fab_id, 'Ipê', 'madeirado', 'Madeira Natural', 'MDF', true);

    -- 2. Unicolors & Others
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Branco Supremo', 'unicolor', 'Branco', 'MDF', true),
    (fab_id, 'Preto', 'unicolor', 'Preto', 'MDF', true),
    (fab_id, 'Leon', 'unicolor', 'Bege Queimado', 'MDF', true),
    (fab_id, 'Vulcano', 'pedra', 'Cinza Pedra', 'MDF', true),
    (fab_id, 'Industrial', 'pedra', 'Cimento Queimado', 'MDF', true),
    (fab_id, 'Lino', 'tecido', 'Tecido Claro', 'MDF', true);

    -- Update stats
    UPDATE fabricantes_mdf SET total_padroes = (SELECT COUNT(*) FROM padroes_mdf WHERE fabricante_id = fab_id) WHERE id = fab_id;

END $$;
