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

    // Lê o bloco de texto copiado e extrai cada campo dinamicamente (Pronto para PDFs)
    interpretarTexto(texto) {
        if (!texto.trim()) {
            return this.retornarVazio();
        }

        // Roteador de Regex flexível: o "[\s\n:]*" aceita espaços, dois pontos e quebras de linha do PDF
        const osMatch = texto.match(/(?:OS|O\.S|Número|Nº|N[oO]|Num)[\s\n:]*([0-9]+)/i);
        const totalServicoMatch = texto.match(/(?:Total do Serviço|Total Serviço|Valor Serviço|Serviço)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        const taxaMatch = texto.match(/(?:20%|Taxa|Desc\.?\s*20%)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        const subtotalMatch = texto.match(/(?:Subtotal|Sub\s*total|Total Geral|Líquido|Valor Líquido)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        const comissaoMatch = texto.match(/(?:Comissão|Comissao|A receber|Pagar|Valor Comissão)[\s\n:]*R?\$?\s*([0-9.,]+)/i);
        
        // Captura de Strings/Textos de status e descrição
        const prontoMatch = texto.match(/Pronto[\s\n:]*([^\n|]+)/i);
        const saidaMatch = texto.match(/(?:Saída|Saida)[\s\n:]*([^\n|]+)/i);
        const servicoMatch = texto.match(/(?:Serviço|Desc|Descrição|Item|Obs)[\s\n:]*([^\n]+)/i);

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

    // Auxiliar robusto para transformar "1.250,50" ou "150.00" em float utilizável
    converteValor(stringValor) {
        if (!stringValor) return 0;
        
        // Remove todos os pontos de milhar globais, troca a vírgula decimal por ponto e limpa espaços
        let limpo = stringValor.replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(limpo) || 0;
    },

    retornarVazio() {
        return { os: "-", servico: "-", pronto: "-", saida: "-", totalServico: 0, taxa: 0, subtotal: 0, comissao: 0 };
    }
};