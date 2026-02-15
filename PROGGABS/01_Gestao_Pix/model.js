/* model.js - Versão Supabase */

export const Model = {
    // Busca todos os colaboradores direto da nuvem
    async listarTodos() {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro ao buscar:", error);
            return [];
        }
        return data;
    },

    // Filtra no banco de dados (mais rápido que filtrar no JS)
    async buscar(termo) {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            .ilike('nome', `%${termo}%`); // Busca parcial e insensível a maiúsculas
        
        return data || [];
    },

    // Salva ou atualiza (upsert)
    async salvar(dados) {
        const { error } = await _supabase
            .from('contatos')
            .insert([dados]);
        
        return { success: !error, error };
    },

    // Exclui por ID (mais seguro que por nome)
    async excluir(id) {
        const { error } = await _supabase
            .from('contatos')
            .delete()
            .eq('id', id);
        
        return { success: !error, error };
    }
};