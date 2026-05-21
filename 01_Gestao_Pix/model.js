/* model.js - Versão Supabase Adaptada */

export const Model = {
    // Busca todos os colaboradores
    async listarTodos() {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro ao listar:", error);
            return [];
        }
        return data;
    },

    // Busca filtrada por nome
    async buscar(termo) {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            .ilike('nome', `%${termo}%`)
            .order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro na busca:", error);
            return [];
        }
        return data;
    },

    /**
     * Salva ou Atualiza um colaborador
     * O Supabase entende que se houver um 'id' no objeto, ele deve atualizar.
     * Caso contrário, ele insere um novo.
     */
    async salvar(dados) {
        // Se dados.id existir, ele faz update. Se não, faz insert.
        const { data, error } = await _supabase
            .from('contatos')
            .upsert(dados, { onConflict: 'id' });
        
        if (error) {
            console.error("Erro ao salvar/atualizar:", error);
        }
        
        return { success: !error, error };
    },

    // Exclui por ID
    async excluir(id) {
        if (!id) return { success: false, error: "ID não fornecido" };

        const { error } = await _supabase
            .from('contatos')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error("Erro ao excluir:", error);
        }

        return { success: !error, error };
    }
};