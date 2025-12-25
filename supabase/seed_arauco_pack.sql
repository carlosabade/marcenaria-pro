-- DATA PACK: ARAUCO (Popular Patterns)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    fab_id BIGINT;
BEGIN
    -- Find or Create Arauco
    SELECT id INTO fab_id FROM fabricantes_mdf WHERE nome = 'Arauco';
    
    IF fab_id IS NULL THEN
        INSERT INTO fabricantes_mdf (nome, site_oficial, total_padroes, descricao)
        VALUES ('Arauco', 'https://arauco.com.br', 100, 'Sustentabilidade e design inovador.')
        RETURNING id INTO fab_id;
    END IF;

    -- BULK INSERT PATTERNS
    -- 1. Woodgrains (Madeirados)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Carvalho Americano', 'madeirado', 'Madeira Clara', 'Fundamental', true),
    (fab_id, 'Nogueira Persa', 'madeirado', 'Madeira Escura', 'Fundamental', true),
    (fab_id, 'Pau-Ferro', 'madeirado', 'Madeira Escura', 'Fundamental', true),
    (fab_id, 'Louro Freijó', 'madeirado', 'Madeira Mel', 'Fundamental', true),
    (fab_id, 'Jatobá', 'madeirado', 'Madeira Avermelhada', 'Fundamental', true),
    (fab_id, 'Cumaru', 'madeirado', 'Madeira Média', 'Fundamental', true),
    (fab_id, 'Teca Pavia', 'madeirado', 'Madeira Mel', 'Fundamental', true);

    -- 2. Unicolors
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Branco Supremo', 'unicolor', 'Branco', 'Fundamental', true),
    (fab_id, 'Cinza Cristal', 'unicolor', 'Cinza Claro', 'Fundamental', true),
    (fab_id, 'Grafite Intenso', 'unicolor', 'Cinza Escuro', 'Fundamental', true),
    (fab_id, 'Preto', 'unicolor', 'Preto', 'Fundamental', true),
    (fab_id, 'Azul Lord', 'unicolor', 'Azul Escuro', 'Fundamental', true),
    (fab_id, 'Verde Jade', 'unicolor', 'Verde', 'Fundamental', true),
    (fab_id, 'Cinza Cobalto', 'unicolor', 'Cinza Azulado', 'Fundamental', true);

    -- 3. Others (Híbridos/Pedras)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Cimento Queimado', 'pedra', 'Cinza Concreto', 'Urbano', true),
    (fab_id, 'Titan', 'metalizado', 'Cinza Metálico', 'Urbano', true),
    (fab_id, 'Cobre', 'metalizado', 'Cobre', 'Metal', true);

    -- Update stats
    UPDATE fabricantes_mdf SET total_padroes = (SELECT COUNT(*) FROM padroes_mdf WHERE fabricante_id = fab_id) WHERE id = fab_id;

END $$;
