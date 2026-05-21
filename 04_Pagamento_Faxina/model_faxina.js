/* model_oficina.js - Lógica de Captura e Integração com Supabase */

const OficinaModel = {
    listaColaboradores: [],

    // Busca os contatos cadastrados na base do Gestão Pix
    async buscarColaboradores() {
        const { data, error } = await _supabase
            .from('contatos')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro ao buscar equipe:", error);
            return [];
        }
        this.listaColaboradores = data || [];
        return this.listaColaboradores;
    },

    // Lê o bloco de texto copiado e extrai cada campo dinamicamente
    interpretarTexto(texto) {
        if (!texto.trim()) {
            return this.retornarVazio();
        }

        // Regex inteligentes para capturar os padrões do seu relatório
        const osMatch = texto.match(/(?:OS|O\.S|Número|Nº)[\s:]*([0-9]+)/i);
        const totalServicoMatch = texto.match(/(?:Total do Serviço|Total Serviço|Serviço)[\s:]*R?\$?\s*([0-9.,]+)/i);
        const taxaMatch = texto.match(/(?:20%|Taxa)[\s:]*R?\$?\s*([0-9.,]+)/i);
        const subtotalMatch = texto.match(/(?:Subtotal|Sub total|Total Geral)[\s:]*R?\$?\s*([0-9.,]+)/i);
        const comissaoMatch = texto.match(/(?:Comissão|Comissao|A receber|Pagar)[\s:]*R?\$?\s*([0-9.,]+)/i);
        
        // Tenta capturar datas/status simples
        const prontoMatch = texto.match(/Pronto[\s:]*([^\n|]+)/i);
        const saidaMatch = texto.match(/Saída[\s:]*([^\n|]+)/i);
        
        // Tenta capturar o nome do serviço (geralmente uma linha que sobrou ou descrição)
        const servicoMatch = texto.match(/(?:Serviço|Desc|Descrição)[\s:]*([^\n]+)/i);

        return {
            os: osMatch ? osMatch[1] : "Não identificada",
            servico: servicoMatch ? servicoMatch[1].trim() : "Geral / Oficina",
            pronto: prontoMatch ? prontoMatch[1].trim() : "Ok",
            saida: saidaMatch ? saidaMatch[1].trim() : "Imediata",
            totalServico: totalServicoMatch ? this.converteValor(totalServicoMatch[1]) : 0,
            taxa: taxaMatch ? this.converteValor(taxaMatch[1]) : 0,
            subtotal: subtotalMatch ? this.converteValor(subtotalMatch[1]) : 0,
            comissao: comissaoMatch ? this.converteValor(comissaoMatch[1]) : 0
        };
    },

    // Auxiliar para transformar "1.250,50" ou "150.00" em float utilizável
    converteValor(stringValor) {
        if (!stringValor) return 0;
        let limpo = stringValor.replace('.', '').replace(',', '.').trim();
        return parseFloat(limpo) || 0;
    },

    retornarVazio() {
        return { os: "-", servico: "-", pronto: "-", saida: "-", totalServico: 0, taxa: 0, subtotal: 0, comissao: 0 };
    }
};