/* model_nf.js - Agora integrado ao Supabase */

export const ModelNF = {
    // Busca as notas direto do banco
    async listarNotas() {
        const { data, error } = await _supabase
            .from('notas_fiscais')
            .select('*')
            .order('data', { ascending: false });
        
        if (error) {
            console.error("Erro ao buscar notas:", error);
            return [];
        }
        return data;
    },

    // Salva a nota no Supabase
    async adicionarNota(novaNota) {
        const { error } = await _supabase
            .from('notas_fiscais')
            .insert([novaNota]);
        
        return { success: !error, error };
    },

    // Exclui do banco
    async excluirNota(id) {
        const { error } = await _supabase
            .from('notas_fiscais')
            .delete()
            .eq('id', id);
        
        return { success: !error, error };
    },

    // Filtra por mês (usando a lógica do banco)
    async getNotasPorMes(mesSelecionado) {
        const { data, error } = await _supabase
            .from('notas_fiscais')
            .select('*');
        
        if (error) return [];

        return data.filter(nota => {
            const mesDaNota = parseInt(nota.data.split('-')[1]);
            return mesDaNota === parseInt(mesSelecionado);
        });
    }
};