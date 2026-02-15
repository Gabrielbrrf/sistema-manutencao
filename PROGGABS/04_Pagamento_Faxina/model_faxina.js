/* model_faxina.js - Integrado com Supabase (SEM FILTRO DE CATEGORIA) */

const FaxinaModel = {
    tabelaPrecos: {}, // Será preenchido pelo banco de dados

    // 1. Sincroniza os preços da tabela 'tabela_precos' do Supabase
    async sincronizarPrecos() {
        const { data, error } = await _supabase
            .from('tabela_precos')
            .select('codigo, valor'); 
        
        if (data) {
            this.tabelaPrecos = data.reduce((acc, item) => {
                acc[item.codigo] = item.valor;
                return acc;
            }, {});
            console.log("Preços atualizados via Supabase!");
        } else if (error) {
            console.error("Erro ao sincronizar preços:", error);
        }
    },

    // 2. Busca TODOS os contatos da tabela 'contatos' (Sem filtro de categoria)
    async buscarFaxineiras() {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            // Removido o filtro .in('categoria') para puxar todo mundo (inclusive o Gabriel)
            .order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro ao buscar pessoas:", error);
            return [];
        }
        return data || [];
    },

    // 3. Lógica de cálculo (usando dados sincronizados do banco)
    calcular(textoCodigos) {
        const codigos = textoCodigos.toUpperCase().split(/[\s,]+/).filter(c => c.trim() !== "");
        let total = 0;
        let validos = [];
        let invalidos = [];

        codigos.forEach(cod => {
            if (this.tabelaPrecos[cod]) {
                total += this.tabelaPrecos[cod];
                validos.push(cod);
            } else {
                invalidos.push(cod);
            }
        });

        return { total, qtd: validos.length, invalidos };
    },

    // 4. Salva ou atualiza preço direto no banco de dados
    async salvarNovoPrecoNoBanco(cod, valor) {
        const { error } = await _supabase
            .from('tabela_precos')
            .upsert({ 
                codigo: cod.toUpperCase().trim(), 
                valor: parseFloat(valor) 
            }, { onConflict: 'codigo' });
        
        if (!error) {
            await this.sincronizarPrecos(); 
        } else {
            console.error("Erro ao salvar preço:", error);
        }
    }
};