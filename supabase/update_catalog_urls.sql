-- Add example PDF URLs for testing
UPDATE fabricantes_mdf 
SET catalogo_url = 'https://www.guararapes.com.br/catalogo-digital' 
WHERE nome ILIKE '%Guararapes%';

UPDATE fabricantes_mdf 
SET catalogo_url = 'https://www.arauco.com/brasil/ferramentas/catalogos/' 
WHERE nome ILIKE '%Arauco%';

UPDATE fabricantes_mdf 
SET catalogo_url = 'https://www.duratexmadeira.com.br/downloads/' 
WHERE nome ILIKE '%Duratex%';

UPDATE fabricantes_mdf 
SET catalogo_url = 'https://www.eucatex.com.br/paineis/downloads' 
WHERE nome ILIKE '%Eucatex%';

UPDATE fabricantes_mdf 
SET catalogo_url = 'https://www.sudati.com.br/downloads' 
WHERE nome ILIKE '%Sudati%';
