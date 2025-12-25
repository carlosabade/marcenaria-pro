import { supabase } from './supabaseClient';

export const seedDatabase = async () => {
    try {
        console.log('Starting seed...');

        // 1. Fabricantes
        const fabricantes = [
            { id: 1, nome: 'Guararapes', site_oficial: 'https://www.guararapes.com.br', total_padroes: 80, ano_catalogo: 2025, descricao: 'Líder em variedade com tecnologia exclusiva' },
            { id: 2, nome: 'Arauco', site_oficial: 'https://arauco.com.br', total_padroes: 80, ano_catalogo: 2024, descricao: 'Referência mundial em sustentabilidade' },
            { id: 3, nome: 'Eucatex', site_oficial: 'https://www.eucatex.com.br', total_padroes: 58, ano_catalogo: 2024, descricao: 'Inovação e qualidade em painéis' },
            { id: 4, nome: 'Duratex', site_oficial: 'https://www.duratexmadeira.com.br', total_padroes: 70, ano_catalogo: 2024, descricao: 'Tradição e durabilidade' },
            { id: 5, nome: 'Placas Brasil', site_oficial: 'https://placasdobrasil.com.br', total_padroes: 50, ano_catalogo: 2024, descricao: 'Padrões com a essência brasileira' }
        ];

        const { error: fabError } = await supabase.from('fabricantes_mdf').upsert(fabricantes, { onConflict: 'id' });
        if (fabError) throw fabError;

        // 2. Coleções
        const colecoes = [
            { id: 1, fabricante_id: 1, nome: 'Chroma Collection', ano_lancamento: 2024, conceito: 'Celebração 40 anos com foco em off-whites' },
            { id: 2, fabricante_id: 1, nome: 'Madeiras do Brasil', ano_lancamento: 2024, conceito: 'Inspiração na flora nacional' },
            { id: 3, fabricante_id: 2, nome: 'Tons do Brasil', ano_lancamento: 2024, conceito: 'Homenagem à diversidade brasileira' },
            { id: 4, fabricante_id: 3, nome: 'Origens Nativas', ano_lancamento: 2024, conceito: 'Resgate ancestralidade brasileira' },
            { id: 5, fabricante_id: 2, nome: 'Fundamental', ano_lancamento: 2024, conceito: 'Cores essenciais e atemporais' },
            { id: 6, fabricante_id: 4, nome: 'Essencial Wood', ano_lancamento: 2024, conceito: 'Madeiras clássicas e versáteis' },
            { id: 7, fabricante_id: 4, nome: 'Internos', ano_lancamento: 2024, conceito: 'Padrões ideais para parte interna de móveis' }
        ];

        const { error: colError } = await supabase.from('colecoes_mdf').upsert(colecoes, { onConflict: 'id' });
        if (colError) throw colError;

        // 3. Padrões
        const padroes = [
            // Guararapes
            {
                fabricante_id: 1, colecao_id: 1, nome: 'Lumen', linha: 'Off White Collection', categoria: 'unicolor',
                cor_base: 'Off-white amarelado', tonalidade: 'claro', acabamento: 'MR RUC', textura: 'Lisa', brilho: 'Fosco',
                resistencia_umidade: true, imagem_url: 'https://guararapes.com.br/assets/images/padroes/alecrim-mdf-guararapes.jpg', // Placeholder valid URL
                tags: ['off-white', 'neutro', 'claro']
            },
            {
                fabricante_id: 1, colecao_id: 2, nome: 'Alecrim', linha: 'Naturale', categoria: 'madeirado',
                cor_base: 'Verde/Madeira', tonalidade: 'medio', acabamento: 'Naturale', textura: 'Natural', brilho: 'Fosco',
                resistencia_umidade: false, imagem_url: 'https://guararapes.com.br/assets/images/padroes/alecrim-mdf-guararapes.jpg',
                tags: ['natureza', 'fresco', 'madeira clara']
            },
            // Arauco
            {
                fabricante_id: 2, colecao_id: 3, nome: 'Cristalina', linha: 'Tons do Brasil', categoria: 'madeirado',
                cor_base: 'Bege claro', tonalidade: 'claro', acabamento: 'Standard', textura: 'Veios naturais', brilho: 'Semi-Brilho',
                resistencia_umidade: false, imagem_url: 'https://arauco.com.br/assets/padroes/cristalina.jpg',
                tags: ['brasileiro', 'natural', 'madeira']
            },
            {
                fabricante_id: 2, colecao_id: 5, nome: 'Cinza Cristal', linha: 'Fundamental', categoria: 'unicolor',
                cor_base: 'Cinza Claro', tonalidade: 'claro', acabamento: 'Fosco', textura: 'Lisa', brilho: 'Fosco',
                resistencia_umidade: true, imagem_url: 'https://arauco.com.br/assets/padroes/cinza-cristal.jpg',
                tags: ['cinza', 'neutro', 'basico']
            },
            // Duratex
            {
                fabricante_id: 4, colecao_id: 6, nome: 'Carvalho Hanover', linha: 'Design', categoria: 'madeirado',
                cor_base: 'Mel', tonalidade: 'medio', acabamento: 'Texturizado', textura: 'Madeira', brilho: 'Fosco',
                resistencia_umidade: false, imagem_url: 'https://duratex.com.br/assets/padroes/carvalho.jpg',
                tags: ['classico', 'carvalho', 'mel']
            },
            // Eucatex
            {
                fabricante_id: 3, colecao_id: 4, nome: 'Louro Freijó', linha: 'BP Poro SuperMatt', categoria: 'madeirado',
                cor_base: 'Amarelado natural', tonalidade: 'medio', acabamento: 'BP Poro SuperMatt', textura: 'Poro profundo', brilho: 'Ultra fosco',
                resistencia_umidade: false, imagem_url: 'https://eucatex.com.br/assets/padroes/louro.jpg',
                tags: ['brasileiro', 'nobre', 'exclusivo']
            }
        ];

        // Insert patterns individually to avoid conflict issues if IDs are auto-generated differently
        // or check if we can upsert by name? No, names can duplicate across brands.
        // We'll just insert if empty.
        const { count } = await supabase.from('padroes_mdf').select('*', { count: 'exact', head: true });

        if (count === 0) {
            const { error: patError } = await supabase.from('padroes_mdf').insert(padroes);
            if (patError) throw patError;
            return { success: true, message: 'Banco de dados populado com sucesso!' };
        } else {
            return { success: true, message: 'Banco de dados já contém padrões.' };
        }

    } catch (error: any) {
        console.error('Seed error:', error);
        return { success: false, message: 'Erro ao popular banco: ' + error.message };
    }
};
