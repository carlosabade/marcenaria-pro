-- DATA PACK: EUCATEX (Popular Patterns)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    fab_id BIGINT;
BEGIN
    -- Find or Create Eucatex
    SELECT id INTO fab_id FROM fabricantes_mdf WHERE nome = 'Eucatex';
    
    IF fab_id IS NULL THEN
        INSERT INTO fabricantes_mdf (nome, site_oficial, total_padroes, descricao)
        VALUES ('Eucatex', 'https://www.eucatex.com.br', 80, 'Soluções versáteis em painéis de madeira.')
        RETURNING id INTO fab_id;
    END IF;

    -- BULK INSERT PATTERNS
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Eucalipto', 'madeirado', 'Madeira Clara', 'BP Raízes', true),
    (fab_id, 'Nórdico', 'madeirado', 'Madeira Clara', 'BP Raízes', true),
    (fab_id, 'Naturalle', 'madeirado', 'Madeira Mel', 'BP Raízes', true),
    (fab_id, 'Carbono', 'unicolor', 'Preto Fosco', 'Lacca', true),
    (fab_id, 'Cinza Itália', 'unicolor', 'Cinza', 'Lacca', true),
    (fab_id, 'Branco Neve', 'unicolor', 'Branco Brilhante', 'Lacca', true),
    (fab_id, 'Fumê', 'madeirado', 'Madeira Escura', 'BP Raízes', true),
    (fab_id, 'Argento', 'metalizado', 'Cinza Prata', 'BP Matt Plus', true),
    (fab_id, 'Grafite Intenso', 'unicolor', 'Cinza Escuro', 'BP Matt Plus', true);

    -- Update stats
    UPDATE fabricantes_mdf SET total_padroes = (SELECT COUNT(*) FROM padroes_mdf WHERE fabricante_id = fab_id) WHERE id = fab_id;

END $$;
