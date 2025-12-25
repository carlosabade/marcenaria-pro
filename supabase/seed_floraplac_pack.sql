-- DATA PACK: FLORAPLAC (Popular Patterns)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    fab_id BIGINT;
BEGIN
    -- Find or Create Floraplac
    SELECT id INTO fab_id FROM fabricantes_mdf WHERE nome = 'Floraplac';
    
    IF fab_id IS NULL THEN
        INSERT INTO fabricantes_mdf (nome, site_oficial, total_padroes, descricao)
        VALUES ('Floraplac', 'https://www.floraplac.com.br', 60, 'MDF da Amazônia, sustentável e de alta qualidade.')
        RETURNING id INTO fab_id;
    END IF;

    -- BULK INSERT PATTERNS
    -- 1. Woodgrains (Madeirados)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Freijó', 'madeirado', 'Madeira Mel', 'Elo', true),
    (fab_id, 'Nogueira', 'madeirado', 'Madeira Escura', 'Elo', true),
    (fab_id, 'Carvalho', 'madeirado', 'Madeira Clara', 'Elo', true),
    (fab_id, 'Ipê', 'madeirado', 'Madeira Avermelhada', 'Elo', true),
    (fab_id, 'Jatobá', 'madeirado', 'Madeira Avermelhada', 'Elo', true),
    (fab_id, 'Mogno', 'madeirado', 'Madeira Vermelha', 'Clássica', true);

    -- 2. Unicolors (Cores Lisas)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Branco TX', 'unicolor', 'Branco', 'Essencial', true),
    (fab_id, 'Preto TX', 'unicolor', 'Preto', 'Essencial', true),
    (fab_id, 'Grafite', 'unicolor', 'Cinza Escuro', 'Essencial', true),
    (fab_id, 'Areia', 'unicolor', 'Bege', 'Essencial', true),
    (fab_id, 'Cinza', 'unicolor', 'Cinza Claro', 'Essencial', true);

    -- 3. Others (Híbridos)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Concreto', 'pedra', 'Cinza Concreto', 'Urban', true),
    (fab_id, 'Cimento', 'pedra', 'Cinza Cimento', 'Urban', true);

    -- Update stats
    UPDATE fabricantes_mdf SET total_padroes = (SELECT COUNT(*) FROM padroes_mdf WHERE fabricante_id = fab_id) WHERE id = fab_id;

END $$;
